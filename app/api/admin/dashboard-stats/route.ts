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

    // Get time periods
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    // Batch all count queries together for better performance
    const [
      totalUsers,
      sellers,
      buyers,
      verifiedUsers,
      bankIdVerified,
      totalListings,
      activeListings,
      draftListings,
      soldListings,
      verifiedListings,
      totalNDARequests,
      pendingNDAs,
      approvedNDAs,
      rejectedNDAs,
      signedNDAs,
      totalMessages,
      unreadMessages,
      todayMessages,
      totalTransactions,
      completedTransactions,
      inProgressTransactions,
      transactionStats,
      totalPayments,
      pendingPayments,
      releasedPayments,
      paymentStats,
      reviews
    ] = await Promise.all([
      // User stats
      prisma.user.count(),
      prisma.user.count({ where: { role: 'seller' } }),
      prisma.user.count({ where: { role: 'buyer' } }),
      prisma.user.count({ where: { verified: true } }),
      prisma.user.count({ where: { bankIdVerified: true } }),
      
      // Listing stats
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'active' } }),
      prisma.listing.count({ where: { status: 'draft' } }),
      prisma.listing.count({ where: { status: 'sold' } }),
      prisma.listing.count({ where: { verified: true } }),
      
      // NDA stats
      prisma.nDARequest.count(),
      prisma.nDARequest.count({ where: { status: 'pending' } }),
      prisma.nDARequest.count({ where: { status: 'approved' } }),
      prisma.nDARequest.count({ where: { status: 'rejected' } }),
      prisma.nDARequest.count({ where: { status: 'signed' } }),
      
      // Message stats
      prisma.message.count(),
      prisma.message.count({ where: { read: false } }),
      prisma.message.count({ where: { createdAt: { gte: today } } }),
      
      // Transaction stats
      prisma.transaction.count(),
      prisma.transaction.count({ where: { stage: 'COMPLETED' } }),
      prisma.transaction.count({ where: { stage: { in: ['LOI_SIGNED', 'DD_IN_PROGRESS', 'SPA_NEGOTIATION'] } } }),
      prisma.transaction.aggregate({
        _sum: { agreedPrice: true },
        _avg: { agreedPrice: true },
        _count: true
      }),
      
      // Payment stats
      prisma.payment.count(),
      prisma.payment.count({ where: { status: { in: ['PENDING', 'ESCROWED'] } } }),
      prisma.payment.count({ where: { status: 'RELEASED' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        _avg: { amount: true }
      }),
      
      // Reviews
      prisma.review.findMany({
        select: { rating: true },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ])

    // Activity statistics (last 7 days)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentActivities = await prisma.activity.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        actorName: true,
        createdAt: true,
        transaction: {
          select: {
            id: true,
            buyer: { select: { name: true } },
            seller: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Conversion rates calculation
    const ndaToTransactionRate = totalNDARequests > 0 
      ? Math.round((totalTransactions / totalNDARequests) * 100)
      : 0

    const listingToNDARate = totalListings > 0
      ? Math.round((totalNDARequests / totalListings) * 100)
      : 0

    // Top statistics by type/industry - batch these queries
    const [industryStats, regionStats] = await Promise.all([
      prisma.listing.groupBy({
        by: ['industry'],
        _count: true,
        where: { status: 'active' }
      }),
      prisma.listing.groupBy({
        by: ['region'],
        _count: true,
        where: { status: 'active' }
      })
    ])

    // Sort by count descending and take top 5
    const topIndustriesSorted = industryStats
      .sort((a, b) => b._count - a._count)
      .slice(0, 5)

    const topRegionsSorted = regionStats
      .sort((a, b) => b._count - a._count)
      .slice(0, 5)

    return NextResponse.json({
      timestamp: now.toISOString(),
      users: {
        total: totalUsers,
        sellers,
        buyers,
        verified: verifiedUsers,
        bankIdVerified
      },
      listings: {
        total: totalListings,
        active: activeListings,
        draft: draftListings,
        sold: soldListings,
        verified: verifiedListings
      },
      nda: {
        total: totalNDARequests,
        pending: pendingNDAs,
        approved: approvedNDAs,
        rejected: rejectedNDAs,
        signed: signedNDAs
      },
      messages: {
        total: totalMessages,
        unread: unreadMessages,
        today: todayMessages
      },
      transactions: {
        total: totalTransactions,
        completed: completedTransactions,
        inProgress: inProgressTransactions,
        totalValue: transactionStats._sum.agreedPrice || 0,
        averageValue: Math.round(transactionStats._avg.agreedPrice || 0)
      },
      payments: {
        total: totalPayments,
        pending: pendingPayments,
        released: releasedPayments,
        totalAmount: paymentStats._sum.amount || 0,
        averageAmount: Math.round(paymentStats._avg.amount || 0)
      },
      conversionRates: {
        listingToNDA: listingToNDARate,
        ndaToTransaction: ndaToTransactionRate
      },
      topIndustries: topIndustriesSorted.map(i => ({
        name: i.industry,
        count: i._count
      })),
      topRegions: topRegionsSorted.map(r => ({
        name: r.region,
        count: r._count
      })),
      recentActivities: recentActivities.map(a => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        actor: a.actorName,
        timestamp: a.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
