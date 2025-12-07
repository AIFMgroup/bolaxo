import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'trestor-dataroom-prod'

// DELETE /api/readiness/documents/[docId]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ docId: string }> }
) {
  try {
    const { docId } = await context.params
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    // Fetch document
    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        transaction: {
          include: {
            listing: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Dokument hittades inte' }, { status: 404 })
    }

    // Check ownership - document.uploadedBy should match userId
    // or user should own the listing
    const listing = await prisma.listing.findFirst({
      where: {
        id: document.transactionId,
        userId,
      },
    })

    if (document.uploadedBy !== userId && !listing) {
      return NextResponse.json({ error: 'Ingen behörighet' }, { status: 403 })
    }

    // Delete from S3 if stored there
    if (document.fileUrl?.startsWith('s3://')) {
      const s3Key = document.fileUrl.replace(`s3://${BUCKET_NAME}/`, '')
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
          })
        )
      } catch (s3Error) {
        console.error('S3 delete error:', s3Error)
        // Continue with DB deletion even if S3 fails
      }
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: docId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting readiness document:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort dokument' },
      { status: 500 }
    )
  }
}

