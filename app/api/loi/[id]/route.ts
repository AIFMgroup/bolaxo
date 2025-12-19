import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

// GET /api/loi/[id] - Get single LOI
export async function GET(
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

    const loi = await prisma.lOI.findUnique({
      where: { id: params.id },
      include: {
        listing: {
          select: {
            id: true,
            anonymousTitle: true,
            companyName: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
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
          orderBy: { version: 'desc' }
        }
      }
    })

    if (!loi) {
      return NextResponse.json(
        { error: 'LOI not found' },
        { status: 404 }
      )
    }

    // Verify user has access (buyer or seller)
    const listing = await prisma.listing.findUnique({
      where: { id: loi.listingId }
    })

    if (loi.buyerId !== userId && listing?.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ loi })
  } catch (error) {
    console.error('Get LOI error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch LOI' },
      { status: 500 }
    )
  }
}

