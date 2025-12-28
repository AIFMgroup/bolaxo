import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/admin-auth'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
  },
})

const URL_TTL = 60 * 5 // 5 minutes

// GET /api/admin/kyc/documents/download-url?documentId=...
export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(request)
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const documentId = searchParams.get('documentId')
  if (!documentId) return NextResponse.json({ error: 'documentId krävs' }, { status: 400 })

  const doc = await prisma.buyerKycDocument.findUnique({ where: { id: documentId } })
  if (!doc) return NextResponse.json({ error: 'Dokument hittades inte' }, { status: 404 })

  const downloadUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: doc.s3Bucket,
      Key: doc.s3Key,
      ResponseContentDisposition: `inline; filename="${doc.fileName}"`,
      ResponseContentType: doc.mimeType,
    }),
    { expiresIn: URL_TTL }
  )

  return NextResponse.json({ downloadUrl, expiresIn: URL_TTL, fileName: doc.fileName })
}


