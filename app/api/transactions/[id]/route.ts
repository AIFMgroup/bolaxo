import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
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

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
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
            status: true,
            createdAt: true
          }
        },
        spas: {
          select: {
            id: true,
            status: true,
            version: true,
            purchasePrice: true,
            signedAt: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        ddProjects: {
          select: {
            id: true,
            status: true,
            completionPercent: true,
            overallRiskLevel: true,
            goNogo: true,
            actualCompleteDate: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        milestones: {
          orderBy: { order: 'asc' }
        },
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'asc' }
        },
        activities: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Verifiera att användaren har access (köpare, säljare eller advisor)
    if (transaction.buyerId !== userId && 
        transaction.sellerId !== userId && 
        transaction.advisorId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({ transaction })

  } catch (error) {
    console.error('Fetch transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}

