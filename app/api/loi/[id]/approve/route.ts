import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { sendTransactionMilestoneEmail, sendLOIApprovalEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

const prisma = new PrismaClient()

// POST /api/loi/[id]/reject - Seller rejects LOI
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, reason } = body // action: 'approve' or 'reject'

    // Get LOI
    const loi = await prisma.lOI.findUnique({
      where: { id: params.id },
      include: {
        listing: {
          include: {
            user: true
          }
        },
        buyer: true
      }
    })

    if (!loi) {
      return NextResponse.json(
        { error: 'LOI not found' },
        { status: 404 }
      )
    }

    // Verify user is the seller
    if (loi.listing.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Only seller can approve/reject LOI' },
        { status: 403 }
      )
    }

    if (action === 'reject') {
      // Update LOI status to 'rejected'
      const updatedLoi = await prisma.lOI.update({
        where: { id: params.id },
        data: {
          status: 'rejected',
          rejectedReason: reason || 'Rejected by seller'
        }
      })

      return NextResponse.json({
        success: true,
        loi: updatedLoi
      })
    }

    // Approve action (same as approve route)
    if (action === 'approve' || !action) {
      // Verify LOI status
      if (loi.status !== 'proposed') {
        return NextResponse.json(
          { error: `LOI is already ${loi.status}` },
          { status: 400 }
        )
      }

      // Update LOI status to 'signed'
      const updatedLoi = await prisma.lOI.update({
        where: { id: params.id },
        data: {
          status: 'signed',
          signedAt: new Date()
        }
      })

      // Auto-create Transaction from LOI
      const { listingId, buyerId, proposedPrice } = updatedLoi
      const sellerId = loi.listing.userId
      const buyerName = loi.buyer.name || loi.buyer.email
      const sellerName = loi.listing.user.name || loi.listing.user.email

      // Check if transaction already exists
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          listingId,
          buyerId,
          sellerId
        }
      })

      if (!existingTransaction) {
        // Create transaction with default milestones
        const DEFAULT_MILESTONES = [
          {
            title: 'LOI signerad',
            description: 'Letter of Intent godkänd av båda parter',
            daysFromStart: 0,
            assignedToRole: 'both',
            order: 1
          },
          {
            title: 'Konfidentialitetsavtal (NDA) i kraft',
            description: 'NDA signerat, buyer får access till datarum',
            daysFromStart: 2,
            assignedToRole: 'buyer',
            order: 2
          },
          {
            title: 'Due Diligence påbörjad',
            description: 'Köpare startar granskning av finansiella dokument, avtal, juridik',
            daysFromStart: 7,
            assignedToRole: 'buyer',
            order: 3
          },
          {
            title: 'DD-rapport klar',
            description: 'Due diligence-rapport färdigställd och delad med säljare',
            daysFromStart: 35,
            assignedToRole: 'buyer',
            order: 4
          },
          {
            title: 'SPA-förhandling påbörjad',
            description: 'Förhandling av slutligt köpeavtal (Share Purchase Agreement)',
            daysFromStart: 40,
            assignedToRole: 'both',
            order: 5
          },
          {
            title: 'SPA signerad',
            description: 'Köpeavtal undertecknat av båda parter',
            daysFromStart: 60,
            assignedToRole: 'both',
            order: 6
          },
          {
            title: 'Betalning mottagen',
            description: 'Köpeskilling överförd till escrow eller säljare',
            daysFromStart: 65,
            assignedToRole: 'buyer',
            order: 7
          },
          {
            title: 'Överlåtelse registrerad',
            description: 'Bolagsverket bekräftar ägarbyte',
            daysFromStart: 75,
            assignedToRole: 'seller',
            order: 8
          },
          {
            title: 'Affär avslutad',
            description: 'Alla dokument klara, betalning frigiven, handover genomförd',
            daysFromStart: 90,
            assignedToRole: 'both',
            order: 9
          },
        ]

        function addDays(date: Date, days: number): Date {
          const result = new Date(date)
          result.setDate(result.getDate() + days)
          return result
        }

        const transaction = await prisma.transaction.create({
          data: {
            listingId,
            buyerId,
            sellerId,
            agreedPrice: proposedPrice,
            stage: 'LOI_SIGNED',
            loiId: updatedLoi.id,
            milestones: {
              create: DEFAULT_MILESTONES.map((m) => ({
                title: m.title,
                description: m.description,
                dueDate: addDays(new Date(), m.daysFromStart),
                order: m.order,
                assignedTo: m.assignedToRole === 'buyer' ? buyerId : m.assignedToRole === 'seller' ? sellerId : null,
                assignedToName: m.assignedToRole === 'buyer' ? buyerName : m.assignedToRole === 'seller' ? sellerName : 'Båda parter',
                completed: m.daysFromStart === 0,
                completedAt: m.daysFromStart === 0 ? new Date() : null,
              }))
            },
            payments: {
              create: [
                {
                  type: 'DEPOSIT',
                  amount: Math.round(proposedPrice * 0.1),
                  description: 'Handpenning (10% av köpeskilling)',
                  dueDate: addDays(new Date(), 5),
                  status: 'PENDING'
                },
                {
                  type: 'MAIN_PAYMENT',
                  amount: Math.round(proposedPrice * 0.9),
                  description: 'Huvudbetalning (90% av köpeskilling)',
                  dueDate: addDays(new Date(), 65),
                  status: 'PENDING'
                }
              ]
            },
            activities: {
              create: {
                type: 'STAGE_CHANGE',
                title: 'LOI godkänd - Transaktion skapad',
                description: `LOI godkänd av säljare. Affär påbörjad för ${(proposedPrice / 1000000).toFixed(1)} MSEK.`,
                actorId: userId,
                actorName: sellerName || 'Säljare',
                actorRole: 'seller'
              }
            }
          },
          include: {
            milestones: true,
            payments: true
          }
        })

        // Send email notifications to buyer
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'
        const listingTitle = loi.listing.companyName || loi.listing.anonymousTitle || 'Objektet'
        
        try {
          // Send LOI approval email
          await sendLOIApprovalEmail(
            loi.buyer.email,
            loi.buyer.name || 'Köpare',
            listingTitle,
            transaction.id,
            baseUrl
          )
          
          // Send transaction milestone email
          await sendTransactionMilestoneEmail(
            loi.buyer.email,
            loi.buyer.name || 'Köpare',
            listingTitle,
            'loi_accepted',
            transaction.id,
            baseUrl
          )
        } catch (emailError) {
          console.error('Failed to send LOI approval emails:', emailError)
          // Don't fail the request if email fails
        }

        // Create in-app notification for buyer
        await createNotification({
          userId: buyerId,
          type: 'system',
          title: 'LOI Godkänd!',
          message: `Din LOI för ${listingTitle} har godkänts. Transaktionen har skapats!`,
          listingId
        })

        return NextResponse.json({
          success: true,
          loi: updatedLoi,
          transaction: {
            id: transaction.id,
            stage: transaction.stage,
            agreedPrice: transaction.agreedPrice
          }
        })
      } else {
        // Transaction already exists, just update LOI
        return NextResponse.json({
          success: true,
          loi: updatedLoi,
          transaction: {
            id: existingTransaction.id,
            message: 'Transaction already exists'
          }
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('LOI action error:', error)
    return NextResponse.json(
      { error: 'Failed to process LOI action' },
      { status: 500 }
    )
  }
}
