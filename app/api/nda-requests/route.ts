import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewNDARequestEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

// GET /api/nda-requests?listingId=&buyerId=&sellerId=&status=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId') || undefined
    const buyerId = searchParams.get('buyerId') || undefined
    const sellerId = searchParams.get('sellerId') || undefined
    const status = searchParams.get('status') || undefined
    const userId = searchParams.get('userId') || undefined
    const role = searchParams.get('role') || undefined

    const where: any = {}
    if (listingId) where.listingId = listingId
    if (buyerId) where.buyerId = buyerId
    if (sellerId) where.sellerId = sellerId
    if (status) where.status = status

    try {
      const requests = await prisma.nDARequest.findMany({
        where,
        include: {
          listing: {
            select: {
              id: true,
              anonymousTitle: true,
              companyName: true,
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              companyName: true,
              phone: true,
              region: true,
              bankIdVerified: true,
              verified: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Enrich requests with listing title and buyer info
      const enrichedRequests = requests.map((req) => ({
        id: req.id,
        listingId: req.listingId,
        listingTitle: req.listing.anonymousTitle || req.listing.companyName || 'Okänt objekt',
        buyerId: req.buyerId,
        buyerName: req.buyer.name || req.buyer.email || 'Okänd köpare',
        buyerEmail: req.buyer.email,
        buyerCompany: req.buyer.companyName,
        buyerPhone: req.buyer.phone,
        buyerRegion: req.buyer.region,
        buyerVerified: req.buyer.verified,
        buyerBankIdVerified: req.buyer.bankIdVerified,
        sellerId: req.sellerId,
        sellerName: req.seller.name || req.seller.email || 'Okänd säljare',
        status: req.status,
        message: req.message,
        buyerProfile: req.buyerProfile,
        documentUrl: req.documentUrl,
        approvedAt: req.approvedAt,
        rejectedAt: req.rejectedAt,
        viewedAt: req.viewedAt,
        signedAt: req.signedAt,
        expiresAt: req.expiresAt,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      }))

      return NextResponse.json({ requests: enrichedRequests })
    } catch (dbError) {
      console.error('Database error fetching NDA requests:', dbError)
      return NextResponse.json({ requests: [] })
    }
  } catch (error) {
    console.error('Fetch NDA requests error:', error)
    return NextResponse.json({ requests: [] })
  }
}

// POST /api/nda-requests -> create NDA request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, buyerId, sellerId, message, buyerProfile } = body

    if (!listingId || !buyerId || !sellerId) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId, buyerId, sellerId' },
        { status: 400 }
      )
    }

    try {
      // Check for existing NDA request (pending or approved)
      const existing = await prisma.nDARequest.findFirst({
        where: {
          listingId,
          buyerId,
          status: { in: ['pending', 'approved'] }
        }
      })

      if (existing) {
        return NextResponse.json(
          { 
            error: 'Du har redan begärt NDA för denna annons',
            existing: true
          },
          { status: 400 }
        )
      }

      // Get buyer profile if not provided
      let profileData = buyerProfile
      if (!profileData) {
        const buyer = await prisma.user.findUnique({
          where: { id: buyerId },
          include: {
            buyerProfile: true,
          },
        })
        if (buyer) {
          profileData = {
            name: buyer.name,
            email: buyer.email,
            companyName: buyer.companyName,
            region: buyer.region,
            bankIdVerified: buyer.bankIdVerified,
            verified: buyer.verified,
            buyerProfile: buyer.buyerProfile,
          }
        }
      }

      const created = await prisma.nDARequest.create({
        data: {
          listingId,
          buyerId,
          sellerId,
          message: message || null,
          buyerProfile: profileData ? JSON.parse(JSON.stringify(profileData)) : null,
          status: 'pending',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        include: {
          listing: {
            select: {
              id: true,
              anonymousTitle: true,
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Send email notification to seller
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'
        const listingTitle = created.listing.anonymousTitle || 'Objektet'
        await sendNewNDARequestEmail(
          created.seller.email,
          created.seller.name || 'Säljare',
          created.buyer.name || 'Köpare',
          listingTitle,
          created.id,
          baseUrl
        )
      } catch (emailError) {
        console.error('Error sending new NDA request email:', emailError)
        // Don't fail the request if email fails
      }

      await createNotification({
        userId: created.seller.id,
        type: 'nda',
        title: 'Ny NDA-förfrågan',
        message: `${created.buyer.name || created.buyer.email || 'En köpare'} vill signera NDA för ${created.listing.anonymousTitle || 'ditt objekt'}.`,
        listingId: listingId
      })

      return NextResponse.json({ request: created }, { status: 201 })
    } catch (dbError) {
      console.error('Database error creating NDA request:', dbError)
      return NextResponse.json(
        { error: 'Failed to create NDA request' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Create NDA request error:', error)
    return NextResponse.json(
      { error: 'Failed to create NDA request' },
      { status: 500 }
    )
  }
}

// PATCH /api/nda-requests -> update status (legacy - use /api/nda-requests/[id] instead)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: id, status' },
        { status: 400 }
      )
    }

    try {
      // Get current NDA request to verify and get buyer/seller info
      const currentRequest = await prisma.nDARequest.findUnique({
        where: { id },
        select: {
          sellerId: true,
          buyerId: true,
          listingId: true,
        },
      })

      if (!currentRequest) {
        return NextResponse.json(
          { error: 'NDA request not found' },
          { status: 404 }
        )
      }

      const data: any = { status }
      if (status === 'approved') {
        data.approvedAt = new Date()
        data.viewedAt = new Date()
      } else if (status === 'rejected') {
        data.rejectedAt = new Date()
        data.viewedAt = new Date()
      } else if (status === 'signed') {
        data.signedAt = new Date()
      }

      const updated = await prisma.nDARequest.update({
        where: { id },
        data,
      })

      // NOTE: Message creation and email notifications are handled by /api/nda-requests/[id]
      // This legacy endpoint only updates the status to maintain backward compatibility
      // If you need message creation, use the new endpoint: PATCH /api/nda-requests/[id]

      return NextResponse.json({ request: updated })
    } catch (dbError) {
      console.error('Database error updating NDA request:', dbError)
      return NextResponse.json(
        { error: 'Failed to update NDA request' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Update NDA request error:', error)
    return NextResponse.json(
      { error: 'Failed to update NDA request' },
      { status: 500 }
    )
  }
}

