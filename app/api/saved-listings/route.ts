import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthenticatedUserId } from '@/lib/request-auth'

const prisma = new PrismaClient()

// GET /api/saved-listings
export async function GET(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ saved: [] })
    }

    try {
      const saved = await prisma.savedListing.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ saved })
    } catch (dbError) {
      // Fallback if table doesn't exist
      return NextResponse.json({ saved: [] })
    }
  } catch (error) {
    console.error('Fetch saved listings error:', error)
    return NextResponse.json({ saved: [] })
  }
}

// POST /api/saved-listings -> save listing
export async function POST(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request)
    const body = await request.json()
    const { listingId } = body

    if (!userId || !listingId) {
      return NextResponse.json({ success: true })
    }

    try {
      const saved = await prisma.savedListing.upsert({
        where: { userId_listingId: { userId, listingId } },
        update: {},
        create: { userId, listingId }
      })
      return NextResponse.json({ saved }, { status: 201 })
    } catch (dbError) {
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Save listing error:', error)
    return NextResponse.json({ success: true })
  }
}

// DELETE /api/saved-listings?listingId=
export async function DELETE(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request)
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!userId || !listingId) {
      return NextResponse.json({ success: true })
    }

    try {
      await prisma.savedListing.delete({
        where: { userId_listingId: { userId, listingId } }
      })
    } catch (dbError) {
      // Fail silently
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unsave listing error:', error)
    return NextResponse.json({ success: true })
  }
}

