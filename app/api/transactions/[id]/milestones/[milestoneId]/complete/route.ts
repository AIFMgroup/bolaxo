import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const params = await context.params
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
    const { userName } = body

    // Get milestone with transaction info
    const milestone = await prisma.milestone.findUnique({
      where: { id: params.milestoneId },
      include: {
        transaction: {
          select: {
            buyerId: true,
            sellerId: true
          }
        }
      }
    })

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    if (milestone.transactionId !== params.id) {
      return NextResponse.json({ error: 'Milestone does not belong to this transaction' }, { status: 400 })
    }

    // Verify user has access (buyer or seller)
    if (milestone.transaction.buyerId !== userId && milestone.transaction.sellerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Determine user role
    const actorRole = milestone.transaction.buyerId === userId ? 'buyer' : 'seller'

    const updated = await prisma.milestone.update({
      where: { id: params.milestoneId },
      data: {
        completed: true,
        completedAt: new Date(),
        completedBy: userId
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        transactionId: params.id,
        type: 'MILESTONE_COMPLETED',
        title: `Milstolpe slutförd: ${milestone.title}`,
        description: `${userName || 'Användare'} markerade "${milestone.title}" som slutförd`,
        actorId: userId,
        actorName: userName || 'Användare',
        actorRole
      }
    })

    return NextResponse.json({ milestone: updated })
  } catch (error) {
    console.error('Error completing milestone:', error)
    return NextResponse.json({ error: 'Failed to complete milestone' }, { status: 500 })
  }
}

