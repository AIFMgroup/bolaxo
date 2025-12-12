import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// We store readiness metadata in the type field as "READINESS:requirementId"
// and additional metadata as JSON in uploadedByName field (hacky but works without migration)

interface ReadinessMetadata {
  requirementId: string
  category: string
  periodYear?: number
  signed?: boolean
}

function parseReadinessType(type: string): string | null {
  if (type.startsWith('READINESS:')) {
    return type.replace('READINESS:', '')
  }
  return null
}

function parseMetadata(metaStr: string): Partial<ReadinessMetadata> {
  try {
    // Check if it's JSON (starts with {)
    if (metaStr.startsWith('{')) {
      return JSON.parse(metaStr)
    }
    return {}
  } catch {
    return {}
  }
}

// GET /api/readiness/documents?listingId=xxx
// Fetch all readiness documents for a listing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json({ error: 'listingId krävs' }, { status: 400 })
    }

    // Verify user has access to this listing
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    // Demo mode: return mock documents
    if (userId.startsWith('demo') || listingId.startsWith('demo')) {
      return NextResponse.json({
        documents: [
          {
            id: 'demo-readiness-doc-1',
            requirementId: 'annual-report',
            fileName: 'arsredovisning-2023.pdf',
            fileSize: 1_200_000,
            uploadedAt: new Date().toISOString(),
            status: 'uploaded',
            periodYear: 2023,
          },
          {
            id: 'demo-readiness-doc-2',
            requirementId: 'balance-sheet',
            fileName: 'balansrapport-q3-2024.xlsx',
            fileSize: 450_000,
            uploadedAt: new Date().toISOString(),
            status: 'verified',
            periodYear: 2024,
          },
        ],
      })
    }

    // Check if user owns the listing
    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        userId,
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Ingen behörighet' }, { status: 403 })
    }

    // Fetch documents with readiness type prefix
    const documents = await prisma.document.findMany({
      where: {
        transactionId: listingId,
        type: { startsWith: 'READINESS:' },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to expected format
    const transformed = documents.map(doc => {
      const requirementId = parseReadinessType(doc.type) || ''
      const meta = parseMetadata(doc.uploadedByName || '')
      
      return {
        id: doc.id,
        requirementId,
        fileName: doc.fileName || 'Okänt dokument',
        fileSize: doc.fileSize || 0,
        uploadedAt: doc.createdAt.toISOString(),
        status: doc.status === 'APPROVED' ? 'verified' : doc.status === 'UPLOADED' ? 'uploaded' : 'incomplete',
        fileUrl: doc.fileUrl,
        periodYear: meta.periodYear,
        signed: meta.signed,
      }
    })

    return NextResponse.json({ documents: transformed })
  } catch (error) {
    console.error('Error fetching readiness documents:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta dokument' },
      { status: 500 }
    )
  }
}

