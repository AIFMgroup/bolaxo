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
const WEBHOOK_URL = process.env.DATAROOM_WEBHOOK_URL // optional event webhook

// Simple in-memory rate limiter per IP per 60s window
const RATE_LIMIT = 60
const rateStore = new Map<string, { count: number; reset: number }>()

function rateLimit(ip: string | null | undefined) {
  const key = ip || 'unknown'
  const now = Date.now()
  const windowMs = 60_000
  const entry = rateStore.get(key)
  if (!entry || entry.reset < now) {
    rateStore.set(key, { count: 1, reset: now + windowMs })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count += 1
  return false
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

async function notifyEvent(payload: any) {
  if (!WEBHOOK_URL) return
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('dataroom webhook failed', err)
  }
}

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

export async function GET(req: NextRequest) {
  try {
    if (rateLimit(req.headers.get('x-forwarded-for'))) {
      return NextResponse.json({ error: 'Rate limit' }, { status: 429 })
    }

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

    // Block if virus scan not clean
    if (version.virusScan === 'blocked') {
      return NextResponse.json({ error: 'Filen är blockerad (virus)' }, { status: 403 })
    }
    if (version.virusScan === 'pending') {
      return NextResponse.json({ error: 'Filen skannas. Försök igen om en stund.' }, { status: 403 })
    }

    const presignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: version.storageKey,
      }),
      { expiresIn: URL_TTL }
    )

    const watermarkedUrl = buildWatermarkUrl(version.storageKey, userEmail || userId)

    // Audit
    await prisma.dataRoomAudit.create({
      data: {
        dataRoomId,
        actorId: userId || undefined,
        actorEmail: userEmail || undefined,
        action: 'download',
        targetType: 'documentVersion',
        targetId: version.id,
        meta: { watermarked: !!watermarkedUrl },
      },
    })

    // Fire webhook (non-blocking)
    notifyEvent({
      type: 'dataroom.download',
      dataRoomId,
      documentVersionId: version.id,
      actorId: userId,
      actorEmail: userEmail,
      watermarked: !!watermarkedUrl,
      at: new Date().toISOString(),
    })

    return NextResponse.json({
      downloadUrl: watermarkedUrl || presignedUrl,
      expiresIn: URL_TTL,
      fileName: version.fileName,
    })
  } catch (error) {
    console.error('dataroom download-url error', error)
    return NextResponse.json({ error: 'Kunde inte skapa download-URL' }, { status: 500 })
  }
}

