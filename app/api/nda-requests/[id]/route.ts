import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNDAApprovalEmail, sendNDARejectionEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

/**
 * GET /api/nda-requests/[id] - Get specific NDA request
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const ndaId = params.id

    const ndaRequest = await prisma.nDARequest.findUnique({
      where: { id: ndaId },
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
    })

    if (!ndaRequest) {
      return NextResponse.json(
        { error: 'NDA request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ request: ndaRequest })
  } catch (error) {
    console.error('Error fetching NDA request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NDA request' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/nda-requests/[id] - Update NDA request status
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const ndaId = params.id
    const body = await request.json()
    const { status, rejectionReason } = body

    if (!status || !['pending', 'approved', 'rejected', 'signed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get current NDA request to verify seller
    const currentRequest = await prisma.nDARequest.findUnique({
      where: { id: ndaId },
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

    // Build update data
    const updateData: any = { status }
    
    if (status === 'approved') {
      updateData.approvedAt = new Date()
      updateData.viewedAt = new Date()
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date()
      updateData.viewedAt = new Date()
    } else if (status === 'signed') {
      updateData.signedAt = new Date()
    }

    // Update NDA request
    const updated = await prisma.nDARequest.update({
      where: { id: ndaId },
      data: updateData,
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
    })

    // If approved, create initial message from seller to buyer
    if (status === 'approved') {
      try {
        await prisma.message.create({
          data: {
            listingId: currentRequest.listingId,
            senderId: currentRequest.sellerId,
            recipientId: currentRequest.buyerId,
            subject: 'Din NDA-förfrågan har godkänts',
            content: `Hej! Din NDA-förfrågan har godkänts. Du kan nu se all information om företaget och vi kan börja diskutera möjligheterna. Tveka inte att kontakta mig om du har några frågor.`,
          },
        })
      } catch (msgError) {
        console.error('Error creating initial message:', msgError)
        // Don't fail the request if message creation fails
      }

      // Send email notification to buyer
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'
        const listingTitle = updated.listing.anonymousTitle || updated.listing.companyName || 'Objektet'
        await sendNDAApprovalEmail(
          updated.buyer.email,
          updated.buyer.name || 'Köpare',
          listingTitle,
          ndaId,
          baseUrl
        )
      } catch (emailError) {
        console.error('Error sending NDA approval email:', emailError)
        // Don't fail the request if email fails
      }

      await createNotification({
        userId: updated.buyer.id,
        type: 'nda',
        title: 'NDA godkänd',
        message: `Du kan nu se all information om ${updated.listing.anonymousTitle || updated.listing.companyName || 'objektet'}.`,
        listingId: updated.listing.id
      })
    } else if (status === 'rejected') {
      // Send email notification to buyer
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'
        const listingTitle = updated.listing.anonymousTitle || updated.listing.companyName || 'Objektet'
        await sendNDARejectionEmail(
          updated.buyer.email,
          updated.buyer.name || 'Köpare',
          listingTitle,
          rejectionReason || null,
          baseUrl
        )
      } catch (emailError) {
        console.error('Error sending NDA rejection email:', emailError)
        // Don't fail the request if email fails
      }

      await createNotification({
        userId: updated.buyer.id,
        type: 'nda',
        title: 'NDA avslogs',
        message: `Säljaren av ${updated.listing.anonymousTitle || updated.listing.companyName || 'objektet'} avslog din NDA-förfrågan.`,
        listingId: updated.listing.id
      })
    } else if (status === 'signed') {
      await createNotification({
        userId: updated.seller.id,
        type: 'nda',
        title: 'NDA signerad',
        message: `${updated.buyer.name || 'Köparen'} har signerat NDA för ${updated.listing.anonymousTitle || updated.listing.companyName || 'objektet'}.`,
        listingId: updated.listing.id
      })
    }

    return NextResponse.json({ request: updated })
  } catch (error) {
    console.error('Error updating NDA request:', error)
    return NextResponse.json(
      { error: 'Failed to update NDA request' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/nda-requests/[id] - Delete NDA request
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const ndaId = params.id

    await prisma.nDARequest.delete({
      where: { id: ndaId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting NDA request:', error)
    return NextResponse.json(
      { error: 'Failed to delete NDA request' },
      { status: 500 }
    )
  }
}

