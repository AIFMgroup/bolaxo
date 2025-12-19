import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { sendLOINotificationEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

const prisma = new PrismaClient()

// POST /api/loi/create - Create LOI from form data
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      listingId,
      buyerId,
      sellerId,
      priceMin,
      priceMax,
      transferMethod,
      closingDate,
      financing,
      conditions,
      ddScope,
      timeline
    } = body

    if (!listingId || !buyerId || !sellerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify buyer is the authenticated user
    if (buyerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if listing exists and get seller
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Verify sellerId matches listing owner
    if (listing.userId !== sellerId) {
      return NextResponse.json(
        { error: 'Seller ID mismatch' },
        { status: 400 }
      )
    }

    // Calculate proposed price (use max if provided, otherwise use listing priceMax)
    const proposedPrice = priceMax 
      ? Math.round(parseFloat(priceMax) * 1000000) 
      : (listing.priceMax || listing.priceMin || 0)

    // Set expiry (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Parse closing date
    const proposedClosingDate = closingDate ? new Date(closingDate) : null
    if (proposedClosingDate) {
      proposedClosingDate.setDate(proposedClosingDate.getDate() + (ddScope === 'extended' ? 60 : 30))
    }

    // Get buyer info for email
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      select: { name: true, email: true }
    })

    // Create LOI
    const loi = await prisma.lOI.create({
      data: {
        listingId,
        buyerId,
        proposedPrice,
        priceBasis: 'fixed',
        cashAtClosing: 100, // Default 100% cash at closing
        escrowHoldback: 0,
        earnOutAmount: null,
        proposedClosingDate,
        status: 'proposed', // Buyer has proposed, waiting for seller approval
        expiresAt,
      }
    })

    // Send email notification to seller
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'
    const listingTitle = listing.companyName || listing.anonymousTitle || 'Objektet'
    
    try {
      await sendLOINotificationEmail(
        listing.user.email,
        listing.user.name || 'Säljare',
        buyer?.name || 'Intresserad köpare',
        listingTitle,
        loi.id,
        baseUrl
      )
    } catch (emailError) {
      console.error('Failed to send LOI notification email:', emailError)
      // Don't fail the request if email fails
    }

    // Create in-app notification for seller
    await createNotification({
      userId: sellerId,
      type: 'system',
      title: 'Ny LOI mottagen',
      message: `${buyer?.name || 'En köpare'} har skickat en LOI för ${listingTitle}.`,
      listingId
    })

    return NextResponse.json({ loi }, { status: 201 })
  } catch (error) {
    console.error('Create LOI error:', error)
    return NextResponse.json(
      { error: 'Failed to create LOI' },
      { status: 500 }
    )
  }
}

// GET /api/loi?listingId=&buyerId=&sellerId=&status=
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')
    const buyerId = searchParams.get('buyerId')
    const sellerId = searchParams.get('sellerId')
    const status = searchParams.get('status')

    const where: any = {}
    if (listingId) where.listingId = listingId
    if (buyerId) where.buyerId = buyerId
    if (status) where.status = status

    // If sellerId is provided, find via listing
    if (sellerId) {
      const listings = await prisma.listing.findMany({
        where: { userId: sellerId },
        select: { id: true }
      })
      where.listingId = { in: listings.map(l => l.id) }
    }

    const lois = await prisma.lOI.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            anonymousTitle: true,
            companyName: true,
            userId: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        revisions: {
          orderBy: { version: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ lois })
  } catch (error) {
    console.error('Get LOIs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch LOIs' },
      { status: 500 }
    )
  }
}

