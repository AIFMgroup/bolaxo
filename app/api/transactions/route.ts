import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

// GET /api/transactions?listingId=&buyerId=&sellerId=&loiId=
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
    const loiId = searchParams.get('loiId')

    const where: any = {}
    if (listingId) where.listingId = listingId
    if (buyerId) where.buyerId = buyerId
    if (sellerId) where.sellerId = sellerId
    if (loiId) where.loiId = loiId

    // Ensure user has access (buyer or seller)
    where.OR = [
      { buyerId: userId },
      { sellerId: userId }
    ]

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            anonymousTitle: true,
            companyName: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        loi: {
          select: {
            id: true,
            proposedPrice: true,
            status: true
          }
        },
        milestones: {
          orderBy: { order: 'asc' }
        },
        payments: {
          orderBy: { dueDate: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

