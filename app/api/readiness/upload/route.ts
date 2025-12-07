import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'
import { REQUIREMENTS } from '@/lib/readiness/requirements'

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'trestor-dataroom-prod'

// POST /api/readiness/upload
// Upload a document with readiness metadata
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const listingId = formData.get('listingId') as string
    const requirementId = formData.get('requirementId') as string
    const category = formData.get('category') as string
    const periodYear = formData.get('periodYear') as string | null
    const signed = formData.get('signed') as string | null

    if (!file || !listingId || !requirementId) {
      return NextResponse.json(
        { error: 'Fil, listingId och requirementId krävs' },
        { status: 400 }
      )
    }

    // Validate user owns listing
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, userId },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Ingen behörighet' }, { status: 403 })
    }

    // Validate requirement exists
    const requirement = REQUIREMENTS.find(r => r.id === requirementId)
    if (!requirement) {
      return NextResponse.json({ error: 'Ogiltigt krav-ID' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ogiltig filtyp. Tillåtna: PDF, Excel, CSV, Word, PNG, JPEG' },
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
    const s3Key = `readiness/${listingId}/${requirementId}/${safeFileName}`

    // Upload to S3
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
            originalName: file.name,
            requirementId,
            category,
            uploadedBy: userId,
          },
        })
      )
    } catch (s3Error) {
      console.error('S3 upload error:', s3Error)
      // Fallback: store locally or return error
      return NextResponse.json(
        { error: 'Kunde inte ladda upp till lagring. Kontrollera S3-konfiguration.' },
        { status: 500 }
      )
    }

    const fileUrl = `s3://${BUCKET_NAME}/${s3Key}`

    // Build metadata JSON to store in uploadedByName (hacky but works without migration)
    const metadataJson = JSON.stringify({
      requirementId,
      category,
      periodYear: periodYear ? parseInt(periodYear) : undefined,
      signed: signed === 'true',
      originalName: file.name,
      uploadedByUserId: userId,
    })

    // Save to database
    // Store requirementId in type field as "READINESS:requirementId"
    // Store metadata JSON in uploadedByName field (hacky but avoids migration)
    const document = await prisma.document.create({
      data: {
        transactionId: listingId,
        type: `READINESS:${requirementId}`,
        title: requirement.title,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl,
        status: 'UPLOADED',
        uploadedBy: userId,
        uploadedByName: metadataJson,
      },
    })

    // Trigger async AI analysis (fire and forget)
    // In a real production app, this would be a background job
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/readiness/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        documentId: document.id,
      }),
    }).catch(err => console.error('AI analysis trigger failed:', err))

    // Return document in expected format
    return NextResponse.json({
      document: {
        id: document.id,
        requirementId,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: document.createdAt.toISOString(),
        status: 'uploaded',
        fileUrl,
        periodYear: periodYear ? parseInt(periodYear) : undefined,
        signed: signed === 'true',
        aiAnalysisPending: true,
      },
    })
  } catch (error) {
    console.error('Error uploading readiness document:', error)
    return NextResponse.json(
      { error: 'Kunde inte ladda upp dokument' },
      { status: 500 }
    )
  }
}

