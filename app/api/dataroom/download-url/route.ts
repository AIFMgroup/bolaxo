import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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

async function hasNda(dataRoomId: string, userId?: string, email?: string) {
  if (!userId && !email) return false
  const exists = await prisma.dataRoomNDAAcceptance.findFirst({
    where: {
      dataRoomId,
      OR: [
        userId ? { userId } : undefined,
        email ? { email } : undefined,
      ].filter(Boolean) as any,
    },
  })
  return !!exists
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const versionId = searchParams.get('versionId')
    const documentId = searchParams.get('documentId')

    if (!versionId && !documentId) {
      return NextResponse.json({ error: 'versionId eller documentId krävs' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value
    const userEmail = cookieStore.get('bolaxo_user_email')?.value
    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    // Fetch version
    const version = versionId
      ? await prisma.dataRoomDocumentVersion.findUnique({
          where: { id: versionId },
          include: {
            document: { include: { dataRoom: { include: { listing: true } } } },
          },
        })
      : await prisma.dataRoomDocument.findUnique({
          where: { id: documentId as string },
          include: {
            currentVersion: true,
            dataRoom: { include: { listing: true } },
          },
        }).then(doc => doc?.currentVersionId
          ? prisma.dataRoomDocumentVersion.findUnique({
              where: { id: doc.currentVersionId },
              include: { document: { include: { dataRoom: { include: { listing: true } } } } },
            })
          : null)

    if (!version?.document) {
      return NextResponse.json({ error: 'Dokument hittades inte' }, { status: 404 })
    }

    const dataRoomId = version.document.dataRoomId
    const listingOwnerId = (version.document.dataRoom as any).listing.userId

    const role = (await getUserRole(dataRoomId, userId)) || (listingOwnerId === userId ? 'OWNER' : null)
    if (!role) {
      return NextResponse.json({ error: 'Ingen behörighet' }, { status: 403 })
    }

    // Require NDA for non-owners/editors? At minimum require for non-owner.
    if (role !== 'OWNER') {
      const ndaOk = await hasNda(dataRoomId, userId, userEmail || undefined)
      if (!ndaOk) {
        return NextResponse.json({ error: 'NDA krävs innan nedladdning' }, { status: 403 })
      }
    }

    const presignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: version.storageKey,
      }),
      { expiresIn: URL_TTL }
    )

    // Audit
    await prisma.dataRoomAudit.create({
      data: {
        dataRoomId,
        actorId: userId || undefined,
        actorEmail: userEmail || undefined,
        action: 'download',
        targetType: 'documentVersion',
        targetId: version.id,
      },
    })

    return NextResponse.json({
      downloadUrl: presignedUrl,
      expiresIn: URL_TTL,
      fileName: version.fileName,
    })
  } catch (error) {
    console.error('dataroom download-url error', error)
    return NextResponse.json({ error: 'Kunde inte skapa download-URL' }, { status: 500 })
  }
}

