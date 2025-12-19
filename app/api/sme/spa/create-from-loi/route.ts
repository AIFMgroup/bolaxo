import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { loiId, transactionId } = await req.json()

    if (!loiId) {
      return NextResponse.json(
        { error: 'loiId is required' },
        { status: 400 }
      )
    }

    // Fetch LOI with related data
    const loi = await prisma.lOI.findUnique({
      where: { id: loiId },
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
        }
      }
    })

    if (!loi) {
      return NextResponse.json(
        { error: 'LOI not found' },
        { status: 404 }
      )
    }

    // Verify user is buyer or seller
    const isBuyer = loi.buyerId === userId
    const isSeller = loi.listing.userId === userId

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'Unauthorized - Only buyer or seller can create SPA from LOI' },
        { status: 403 }
      )
    }

    // If transactionId provided, verify it matches LOI
    let transaction = null
    if (transactionId) {
      transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      })

      if (!transaction) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        )
      }

      if (transaction.loiId !== loiId) {
        return NextResponse.json(
          { error: 'Transaction does not match LOI' },
          { status: 400 }
        )
      }
    } else {
      // Find transaction linked to this LOI
      transaction = await prisma.transaction.findFirst({
        where: {
          loiId: loiId
        }
      })
    }

    // Extract data from LOI
    const purchasePrice = loi.proposedPrice
    const cashAtClosing = loi.cashAtClosing || Math.round(purchasePrice * 0.9)
    const escrowHoldback = loi.escrowHoldback || Math.round(purchasePrice * 0.1)
    const closingDate = loi.proposedClosingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const earnOutStructure = loi.earnOutAmount ? {
      totalEarnout: loi.earnOutAmount,
      period: loi.earnOutPeriod || 36,
      kpi: 'revenue' // Default, can be customized
    } : null

    // Default representations & warranties
    const defaultRepresentations = {
      organization: [
        'Säljaren är juridiskt befogad att sälja bolaget',
        'Alla styrelseprotokoll för försäljning är godkända',
        'Ingen tredjepartsgodkännande krävs'
      ],
      capitalization: [
        'Aktiestrukturen är korrekt dokumenterad',
        'Inga optioner eller konvertibler utestående',
        'Säljaren äger 100% av aktierna'
      ],
      financial: [
        'Årsredovisningar är korrekta och godkända',
        'Inga dolda skulder',
        'Alla skatter är betalda'
      ]
    }

    // Create SPA
    const spa = await prisma.sPA.create({
      data: {
        listingId: loi.listingId,
        loiId: loiId,
        transactionId: transaction?.id,
        buyerId: loi.buyerId,
        template: 'standard',
        purchasePrice,
        closingDate,
        cashAtClosing,
        escrowHoldback,
        earnOutStructure: earnOutStructure ? JSON.stringify(earnOutStructure) : undefined,
        sellerFinancing: loi.sellerFinancing || undefined,
        representations: JSON.stringify(defaultRepresentations),
        warranties: JSON.stringify({}),
        indemnification: JSON.stringify({}),
        closingConditions: JSON.stringify({
          dueDiligence: 'Standard DD-krav',
          financing: 'Finansiering bekräftad',
          boardApproval: 'Styrelsebeslut krävs'
        }),
        status: 'draft',
        version: 1
      }
    })

    // Update transaction stage if transaction exists
    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          stage: 'SPA_NEGOTIATION'
        }
      })

      // Log activity
      await prisma.activity.create({
        data: {
          transactionId: transaction.id,
          type: 'STAGE_CHANGE',
          title: 'SPA skapad från LOI',
          description: `SPA skapad från LOI av ${isBuyer ? 'köpare' : 'säljare'}`,
          actorId: userId,
          actorName: isBuyer ? loi.buyer.name || loi.buyer.email : 'Säljare',
          actorRole: isBuyer ? 'buyer' : 'seller'
        }
      })
    }

    return NextResponse.json({
      success: true,
      spa,
      transactionId: transaction?.id
    })
  } catch (error) {
    console.error('Create SPA from LOI error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create SPA from LOI',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

