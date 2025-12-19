import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

// Default milestones för en M&A-transaktion
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

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { listingId, buyerId, sellerId, agreedPrice, buyerName, sellerName } = await request.json()

    if (!listingId || !buyerId || !sellerId || !agreedPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Skapa transaktion med default milestones
    const transaction = await prisma.transaction.create({
      data: {
        listingId,
        buyerId,
        sellerId,
        agreedPrice,
        stage: 'LOI_SIGNED',
        milestones: {
          create: DEFAULT_MILESTONES.map((m) => ({
            title: m.title,
            description: m.description,
            dueDate: addDays(new Date(), m.daysFromStart),
            order: m.order,
            assignedTo: m.assignedToRole === 'buyer' ? buyerId : m.assignedToRole === 'seller' ? sellerId : null,
            assignedToName: m.assignedToRole === 'buyer' ? buyerName : m.assignedToRole === 'seller' ? sellerName : 'Båda parter',
            completed: m.daysFromStart === 0, // Första milestone (LOI) är redan klar
            completedAt: m.daysFromStart === 0 ? new Date() : null,
          }))
        },
        payments: {
          create: [
            {
              type: 'DEPOSIT',
              amount: Math.round(agreedPrice * 0.1), // 10% deposition
              description: 'Handpenning (10% av köpeskilling)',
              dueDate: addDays(new Date(), 5),
              status: 'PENDING'
            },
            {
              type: 'MAIN_PAYMENT',
              amount: Math.round(agreedPrice * 0.9), // Resterande 90%
              description: 'Huvudbetalning (90% av köpeskilling)',
              dueDate: addDays(new Date(), 65),
              status: 'PENDING'
            }
          ]
        },
        activities: {
          create: {
            type: 'STAGE_CHANGE',
            title: 'Transaktion skapad',
            description: `LOI godkänd. Affär påbörjad för ${(agreedPrice / 1000000).toFixed(1)} MSEK.`,
            actorId: userId,
            actorName: buyerName || 'Köpare',
            actorRole: userId === buyerId ? 'buyer' : 'seller'
          }
        }
      },
      include: {
        milestones: true,
        payments: true,
        documents: true,
      }
    })

    console.log('Transaction created:', transaction.id)

    return NextResponse.json({ transaction })

  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

