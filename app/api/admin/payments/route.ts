import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, checkRateLimit, RATE_LIMIT_CONFIGS } from '@/app/lib/rate-limiter'
import { prisma } from '@/lib/prisma'

// Helper function to verify admin authentication
async function verifyAdminAuth(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('adminToken')?.value
    if (!adminToken) {
      return { isValid: false, error: 'Unauthorized - No admin token' }
    }
    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: 'Authentication failed' }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimitCheck = checkRateLimit(ip, RATE_LIMIT_CONFIGS.admin)
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS.admin.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
            'X-RateLimit-Reset': rateLimitCheck.resetTime.toString()
          }
        }
      )
    }
    
    // Verify admin auth
    const auth = await verifyAdminAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const skip = (page - 1) * limit

    // Build filter
    const where: any = {}
    if (status && status !== 'all') where.status = status
    if (type && type !== 'all') where.type = type
    
    if (minAmount || maxAmount) {
      where.amount = {}
      if (minAmount) where.amount.gte = parseInt(minAmount)
      if (maxAmount) where.amount.lte = parseInt(maxAmount)
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { transaction: {
          OR: [
            { buyer: { email: { contains: search, mode: 'insensitive' } } },
            { seller: { email: { contains: search, mode: 'insensitive' } } }
          ]
        }}
      ]
    }

    const totalCount = await prisma.payment.count({ where })

    const payments = await prisma.payment.findMany({
      where,
      select: {
        id: true,
        transactionId: true,
        amount: true,
        type: true,
        description: true,
        status: true,
        dueDate: true,
        paidAt: true,
        releasedAt: true,
        createdAt: true,
        transaction: {
          select: {
            id: true,
            stage: true,
            agreedPrice: true,
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
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy === 'amount' ? 'amount' : 'createdAt']: sortOrder
      }
    })

    // Calculate statistics
    const stats = await prisma.payment.aggregate({
      _sum: {
        amount: true
      },
      _avg: {
        amount: true
      },
      _count: true,
      where
    })

    // Get status breakdown
    const statusBreakdown = await prisma.payment.groupBy({
      by: ['status'],
      _sum: {
        amount: true
      },
      _count: true,
      where
    })

    const statusMap = statusBreakdown.reduce((acc, item) => {
      acc[item.status] = {
        count: item._count,
        totalAmount: item._sum.amount || 0
      }
      return acc
    }, {} as Record<string, { count: number; totalAmount: number }>)

    // Get type breakdown
    const typeBreakdown = await prisma.payment.groupBy({
      by: ['type'],
      _sum: {
        amount: true
      },
      _count: true,
      where
    })

    const typeMap = typeBreakdown.reduce((acc, item) => {
      acc[item.type] = {
        count: item._count,
        totalAmount: item._sum.amount || 0
      }
      return acc
    }, {} as Record<string, { count: number; totalAmount: number }>)

    const pages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: payments,
      stats: {
        totalAmount: stats._sum.amount || 0,
        averageAmount: Math.round(stats._avg.amount || 0),
        count: stats._count,
      },
      breakdowns: {
        byStatus: statusMap,
        byType: typeMap
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        pages,
        hasMore: page < pages
      }
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH - Uppdatera betalning (status, dueDate, etc)
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin auth
    const auth = await verifyAdminAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const { paymentId, status, dueDate, paidAt } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (paidAt !== undefined) updateData.paidAt = paidAt ? new Date(paidAt) : null
    
    // Auto-set releasedAt when status is RELEASED
    if (status === 'RELEASED') {
      updateData.releasedAt = new Date()
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      select: {
        id: true,
        status: true,
        amount: true,
        type: true,
        dueDate: true,
        paidAt: true,
        releasedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    })
  } catch (error) {
    console.error('Error updating payment:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update payment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Bulk status update
export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    const auth = await verifyAdminAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const { paymentIds, status } = body

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'paymentIds array is required' },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    const updateData: any = { status }
    if (status === 'RELEASED') {
      updateData.releasedAt = new Date()
    } else if (status === 'ESCROWED') {
      updateData.releasedAt = null
    }

    const result = await prisma.payment.updateMany({
      where: {
        id: {
          in: paymentIds
        }
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: `Updated ${result.count} payments`,
      data: { count: result.count, updated: result.count }
    })
  } catch (error) {
    console.error('Error in bulk update:', error)
    return NextResponse.json(
      { error: 'Failed to update payments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
