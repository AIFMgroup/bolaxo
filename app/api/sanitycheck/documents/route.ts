import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'trestor-dataroom-prod'

// GET /api/sanitycheck/documents
// Fetch all Sanitycheck documents for the current user
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    // Demo users don't have persisted documents
    if (userId.startsWith('demo')) {
      return NextResponse.json({ documents: [] })
    }

    const documents = await prisma.sanitycheckDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to frontend format
    const formattedDocs = documents.map(doc => ({
      id: doc.id,
      fieldKey: doc.fieldKey,
      name: doc.fileName,
      size: doc.fileSize,
      type: doc.mimeType,
      uploadedAt: doc.createdAt.toISOString(),
      s3Key: doc.s3Key,
    }))

    return NextResponse.json({ documents: formattedDocs })
  } catch (error) {
    console.error('Error fetching sanitycheck documents:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta dokument' },
      { status: 500 }
    )
  }
}

// POST /api/sanitycheck/documents
// Upload a new document to S3 and save to database
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    // Demo mode - return mock response
    if (userId.startsWith('demo')) {
      const formData = await request.formData()
      const file = formData.get('file') as File
      const fieldKey = formData.get('fieldKey') as string

      return NextResponse.json({
        document: {
          id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          fieldKey,
          name: file?.name || 'demo-file.pdf',
          size: file?.size || 0,
          type: file?.type || 'application/pdf',
          uploadedAt: new Date().toISOString(),
          demo: true,
        },
      })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const fieldKey = formData.get('fieldKey') as string

    if (!file || !fieldKey) {
      return NextResponse.json(
        { error: 'Fil och fieldKey krävs' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'text/csv',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ogiltig filtyp. Tillåtna: PDF, Excel, Word, PowerPoint, bilder, CSV' },
        { status: 400 }
      )
    }

    // Max 50MB
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Filen är för stor. Max 50 MB.' },
        { status: 400 }
      )
    }

    // Generate secure file path
    const fileId = crypto.randomUUID()
    const extension = file.name.split('.').pop() || 'bin'
    const safeFileName = `${fileId}.${extension}`
    const s3Key = `sanitycheck/${userId}/${fieldKey}/${safeFileName}`

    // Upload to S3 with encryption
    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type,
          ServerSideEncryption: 'AES256',
          Metadata: {
            originalName: encodeURIComponent(file.name),
            fieldKey,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          },
        })
      )
    } catch (s3Error) {
      console.error('S3 upload error:', s3Error)
      return NextResponse.json(
        { error: 'Kunde inte ladda upp till säker lagring. Försök igen.' },
        { status: 500 }
      )
    }

    // Save to database
    const document = await prisma.sanitycheckDocument.create({
      data: {
        userId,
        fieldKey,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        s3Key,
        s3Bucket: BUCKET_NAME,
      },
    })

    return NextResponse.json({
      document: {
        id: document.id,
        fieldKey: document.fieldKey,
        name: document.fileName,
        size: document.fileSize,
        type: document.mimeType,
        uploadedAt: document.createdAt.toISOString(),
        s3Key: document.s3Key,
      },
    })
  } catch (error) {
    console.error('Error uploading sanitycheck document:', error)
    return NextResponse.json(
      { error: 'Kunde inte ladda upp dokument' },
      { status: 500 }
    )
  }
}

// DELETE /api/sanitycheck/documents?id=xxx
// Delete a document from S3 and database
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Dokument-ID krävs' },
        { status: 400 }
      )
    }

    // Demo mode
    if (userId.startsWith('demo')) {
      return NextResponse.json({ success: true })
    }

    // Find document and verify ownership
    const document = await prisma.sanitycheckDocument.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Dokument hittades inte' },
        { status: 404 }
      )
    }

    if (document.userId !== userId) {
      return NextResponse.json(
        { error: 'Du har inte behörighet att ta bort detta dokument' },
        { status: 403 }
      )
    }

    // Delete from S3
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: document.s3Bucket,
          Key: document.s3Key,
        })
      )
    } catch (s3Error) {
      console.error('S3 delete error:', s3Error)
      // Continue to delete from DB even if S3 fails
    }

    // Delete from database
    await prisma.sanitycheckDocument.delete({
      where: { id: documentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting sanitycheck document:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort dokument' },
      { status: 500 }
    )
  }
}

