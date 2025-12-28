import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
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

const WATERMARK_BASE_URL = process.env.WATERMARK_BASE_URL // optional external service
const WATERMARK_SECRET = process.env.WATERMARK_SIGNING_SECRET // optional HMAC for watermark service

function buildWatermarkUrl(key: string, email?: string | null) {
  if (!WATERMARK_BASE_URL) return null
  const ts = Date.now().toString()
  const subject = email || 'viewer'
  const payload = `${key}|${subject}|${ts}`
  const sig = WATERMARK_SECRET
    ? crypto.createHmac('sha256', WATERMARK_SECRET).update(payload).digest('hex')
    : 'unsigned'
  const url = new URL(WATERMARK_BASE_URL)
  url.searchParams.set('bucket', BUCKET)
  url.searchParams.set('key', key)
  url.searchParams.set('subject', subject)
  url.searchParams.set('ts', ts)
  url.searchParams.set('sig', sig)
  return url.toString()
}

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

async function hasTransaction(listingId: string, userId?: string) {
  if (!userId) return false
  const tx = await prisma.transaction.findFirst({
    where: { listingId, OR: [{ buyerId: userId }, { sellerId: userId }] },
    select: { id: true },
  })
  return !!tx
}

async function hasCustomGrant(documentId: string, userId?: string, email?: string) {
  if (!userId && !email) return false
  const g = await prisma.dataRoomDocumentGrant.findFirst({
    where: {
      documentId,
      OR: [
        userId ? { userId } : undefined,
        email ? { email } : undefined,
      ].filter(Boolean) as any,
    },
    select: { id: true },
  })
  return !!g
}

// GET /api/dataroom/view-url?documentId=...&versionId=...
// Returns an *inline* URL suitable for in-app preview. Does NOT require downloadEnabled.
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
            document: {
              include: {
                dataRoom: { include: { listing: true } },
                grants: {
                  where: {
                    OR: [
                      userId ? { userId } : undefined,
                      userEmail ? { email: userEmail } : undefined,
                    ].filter(Boolean) as any,
                  },
                  select: { id: true },
                },
              },
            },
          },
        })
      : await prisma.dataRoomDocument.findUnique({
          where: { id: documentId as string },
          include: {
            currentVersion: true,
            dataRoom: { include: { listing: true } },
            grants: {
              where: {
                OR: [
                  userId ? { userId } : undefined,
                  userEmail ? { email: userEmail } : undefined,
                ].filter(Boolean) as any,
              },
              select: { id: true },
            },
          },
        }).then((doc) =>
          doc?.currentVersionId
            ? prisma.dataRoomDocumentVersion.findUnique({
                where: { id: doc.currentVersionId },
                include: { document: { include: { dataRoom: { include: { listing: true } }, grants: true } } },
              })
            : null
        )

    if (!version?.document) {
      return NextResponse.json({ error: 'Dokument hittades inte' }, { status: 404 })
    }

    const dataRoomId = version.document.dataRoomId
    const listingOwnerId = (version.document.dataRoom as any).listing.userId
    const listingId = (version.document.dataRoom as any).listing.id

    const role = (await getUserRole(dataRoomId, userId)) || (listingOwnerId === userId ? 'OWNER' : null)
    if (!role) return NextResponse.json({ error: 'Ingen behörighet' }, { status: 403 })

    // NDA required for non-owners/editors
    if (role !== 'OWNER' && role !== 'EDITOR') {
      const ndaOk = await hasNda(dataRoomId, userId, userEmail || undefined)
      if (!ndaOk) return NextResponse.json({ error: 'NDA krävs innan visning' }, { status: 403 })
    }

    // Per-document visibility
    const vis = version.document.visibility
    if (role !== 'OWNER' && role !== 'EDITOR') {
      if (vis === 'OWNER_ONLY') return NextResponse.json({ error: 'Dokumentet är endast för ägaren' }, { status: 403 })
      if (vis === 'TRANSACTION_ONLY') {
        const ok = await hasTransaction(listingId, userId || undefined)
        if (!ok) return NextResponse.json({ error: 'Transaktion krävs för detta dokument' }, { status: 403 })
      }
      if (vis === 'CUSTOM') {
        const ok = (version.document.grants?.length ?? 0) > 0 || (await hasCustomGrant(version.documentId, userId || undefined, userEmail || undefined))
        if (!ok) return NextResponse.json({ error: 'Ingen behörighet (CUSTOM)' }, { status: 403 })
      }
    }

    // Block if virus scan not clean
    if (version.virusScan === 'blocked') {
      return NextResponse.json({ error: 'Filen är blockerad (virus)' }, { status: 403 })
    }
    if (version.virusScan === 'pending') {
      return NextResponse.json({ error: 'Filen skannas. Försök igen om en stund.' }, { status: 403 })
    }

    // Inline view
    const presignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: version.storageKey,
        ResponseContentDisposition: `inline; filename="${version.fileName}"`,
        ResponseContentType: version.mimeType,
      }),
      { expiresIn: URL_TTL }
    )

    const useWatermark = !!buildWatermarkUrl(version.storageKey, userEmail || userId) && ((version.document.dataRoom as any).watermarkDownloads || version.document.watermarkRequired)
    const viewUrl = useWatermark ? buildWatermarkUrl(version.storageKey, userEmail || userId) : presignedUrl

    await prisma.dataRoomAudit.create({
      data: {
        dataRoomId,
        actorId: userId || undefined,
        actorEmail: userEmail || undefined,
        action: 'view',
        targetType: 'documentVersion',
        targetId: version.id,
        meta: { watermarked: useWatermark, inline: true },
      },
    })

    return NextResponse.json({
      viewUrl,
      expiresIn: URL_TTL,
      fileName: version.fileName,
      mimeType: version.mimeType,
    })
  } catch (error) {
    console.error('dataroom view-url error', error)
    return NextResponse.json({ error: 'Kunde inte skapa view-URL' }, { status: 500 })
  }
}


