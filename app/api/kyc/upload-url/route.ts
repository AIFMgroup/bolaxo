import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/request-auth'
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

const MAX_SIZE_BYTES = 15 * 1024 * 1024 // 15MB
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

// POST /api/kyc/upload-url
// Creates a KYC document record and returns a presigned URL to upload to S3.
export async function POST(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const kind = (body?.kind as string) || 'other'
    const fileName = body?.fileName as string
    const mimeType = body?.mimeType as string
    const fileSize = Number(body?.fileSize ?? body?.size)

    if (!fileName || !mimeType || !Number.isFinite(fileSize)) {
      return NextResponse.json({ error: 'fileName, mimeType, fileSize krävs' }, { status: 400 })
    }
    if (fileSize <= 0 || fileSize > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: `Filen är för stor (max ${MAX_SIZE_BYTES} bytes)` }, { status: 400 })
    }
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json({ error: 'Otillåten filtyp' }, { status: 400 })
    }

    // Ensure verification row exists
    const verification = await prisma.buyerKycVerification.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    })

    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin'
    const objectKey = `kyc/${userId}/${crypto.randomUUID()}.${ext}`

    const doc = await prisma.buyerKycDocument.create({
      data: {
        verificationId: verification.id,
        kind,
        fileName,
        fileSize,
        mimeType,
        s3Key: objectKey,
        s3Bucket: BUCKET,
      },
      select: { id: true },
    })

    const uploadUrl = await getSignedUrl(
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
      uploadUrl,
      expiresIn: URL_TTL,
      documentId: doc.id,
    })
  } catch (error) {
    console.error('kyc upload-url error', error)
    return NextResponse.json({ error: 'Kunde inte skapa upload-URL' }, { status: 500 })
  }
}


