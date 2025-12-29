import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/listings/[id]/views - Increment view count
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const listingId = params.id

    // Increment view count
    const listing = await prisma.listing.update({
      where: { id: listingId },
      data: { views: { increment: 1 } }
    })

    return NextResponse.json({ success: true, views: listing.views })
  } catch (error) {
    console.error('Error incrementing views:', error)
    return NextResponse.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    )
  }
}
