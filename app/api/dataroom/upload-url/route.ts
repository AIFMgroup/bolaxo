import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET = process.env.AWS_S3_BUCKET_NAME || 'trestor-dataroom-prod'
const URL_TTL = 60 * 5 // 5 minutes

async function getUserRole(dataRoomId: string, userId?: string) {
  if (!userId) return null
  const perm = await prisma.dataRoomPermission.findFirst({
    where: { dataRoomId, userId },
  })
  return perm?.role || null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { listingId, folderId, fileName, mimeType, size } = body || {}

    if (!listingId || !fileName || !mimeType || !size) {
      return NextResponse.json({ error: 'listingId, fileName, mimeType, size krävs' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value
    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const dataroom = await prisma.dataRoom.findUnique({
      where: { listingId },
      select: { id: true, listing: { select: { userId: true } } },
    })
    if (!dataroom) {
      return NextResponse.json({ error: 'Inget datarum skapat' }, { status: 404 })
    }

    const role = (await getUserRole(dataroom.id, userId)) || (dataroom.listing.userId === userId ? 'OWNER' : null)
    if (!role || (role !== 'OWNER' && role !== 'EDITOR')) {
      return NextResponse.json({ error: 'Ingen behörighet' }, { status: 403 })
    }

    // Ensure folder exists or use root
    let targetFolderId = folderId as string | null
    if (targetFolderId) {
      const folder = await prisma.dataRoomFolder.findFirst({
        where: { id: targetFolderId, dataRoomId: dataroom.id },
        select: { id: true },
      })
      if (!folder) {
        return NextResponse.json({ error: 'Ogiltig mapp' }, { status: 400 })
      }
    } else {
      const root = await prisma.dataRoomFolder.findFirst({
        where: { dataRoomId: dataroom.id, parentId: null },
        select: { id: true },
      })
      targetFolderId = root?.id || null
    }

    // Create document + version
    const extension = fileName.includes('.') ? fileName.split('.').pop() : 'bin'
    const objectKey = `dataroom/${dataroom.id}/${crypto.randomUUID()}.${extension}`

    // Find next version
    const doc = await prisma.dataRoomDocument.create({
      data: {
        dataRoomId: dataroom.id,
        folderId: targetFolderId || undefined,
        title: fileName,
        status: 'pending_scan',
      },
    })

    const latestVersion = await prisma.dataRoomDocumentVersion.count({
      where: { documentId: doc.id },
    })
    const versionNumber = latestVersion + 1

    const version = await prisma.dataRoomDocumentVersion.create({
      data: {
        documentId: doc.id,
        version: versionNumber,
        fileName,
        mimeType,
        size,
        storageKey: objectKey,
        uploadedBy: userId,
      },
    })

    await prisma.dataRoomDocument.update({
      where: { id: doc.id },
      data: { currentVersionId: version.id },
    })

    const presignedUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: objectKey,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
      }),
      { expiresIn: URL_TTL }
    )

    return NextResponse.json({
      uploadUrl: presignedUrl,
      documentId: doc.id,
      versionId: version.id,
      expiresIn: URL_TTL,
    })
  } catch (error) {
    console.error('dataroom upload-url error', error)
    return NextResponse.json({ error: 'Kunde inte skapa upload-URL' }, { status: 500 })
  }
}

