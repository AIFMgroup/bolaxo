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
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    const status = searchParams.get('status') // 'active', 'new', 'inactive'
    const search = searchParams.get('search') || ''

    // Whitelist valid sort fields
    const validSortFields = ['createdAt', 'name', 'email']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'

    // Build where clause
    const where: any = {
      role: 'seller'
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit

    // Get sellers with listings
    const sellers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        phone: true,
        region: true,
        createdAt: true,
        lastLoginAt: true,
        verified: true,
        bankIdVerified: true,
        listings: {
          select: {
            id: true,
            status: true,
            revenue: true,
            employees: true,
            views: true,
            createdAt: true
          }
        },
        sellerTransactions: {
          select: {
            id: true,
            stage: true,
            agreedPrice: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            listings: true,
            sellerTransactions: true,
            givenReviews: true
          }
        }
      },
      orderBy: {
        [sortField]: sortOrder
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where })

    // Get NDA stats for all sellers
    const ndaStats = await prisma.nDARequest.groupBy({
      by: ['sellerId'],
      _count: true
    })

    const ndaMap = ndaStats.reduce((acc, stat) => {
      acc[stat.sellerId] = stat._count
      return acc
    }, {} as Record<string, number>)

    // Enrich sellers with calculated metrics
    let enrichedSellers = sellers.map(seller => {
      const listings = seller.listings
      const transactions = seller.sellerTransactions

      // Listing metrics
      const activeListings = listings.filter(l => l.status === 'active').length
      const totalListingViews = listings.reduce((sum, l) => sum + (l.views || 0), 0)
      const avgListingValue = listings.length > 0
        ? listings.reduce((sum, l) => sum + (l.revenue || 0), 0) / listings.length
        : 0

      // Transaction metrics
      const completedTransactions = transactions.filter(t => t.stage === 'COMPLETED').length
      const totalTransactionValue = transactions.reduce((sum, t) => sum + (t.agreedPrice || 0), 0)
      const avgDealValue = transactions.length > 0 ? totalTransactionValue / transactions.length : 0

      // Days since creation
      const daysSinceCreation = Math.floor((Date.now() - new Date(seller.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const daysLastActive = seller.lastLoginAt 
        ? Math.floor((Date.now() - new Date(seller.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceCreation

      // Status determination
      let sellerStatus = 'active'
      if (daysSinceCreation < 30) sellerStatus = 'new'
      else if (seller.listings.length === 0) sellerStatus = 'inactive'
      else if (daysLastActive > 90) sellerStatus = 'inactive'

      // Performance score (0-100)
      let performanceScore = 0
      performanceScore += Math.min(40, activeListings * 5) // Up to 40 for listings
      performanceScore += seller.verified ? 15 : 0
      performanceScore += seller.bankIdVerified ? 15 : 0
      performanceScore += Math.min(10, completedTransactions * 2) // Up to 10 for transactions
      performanceScore += totalListingViews > 0 ? Math.min(10, Math.log(totalListingViews) * 2) : 0
      performanceScore += seller._count.givenReviews > 0 ? Math.min(10, seller._count.givenReviews) : 0

      return {
        id: seller.id,
        email: seller.email,
        name: seller.name || 'N/A',
        companyName: seller.companyName,
        phone: seller.phone,
        region: seller.region,
        createdAt: seller.createdAt.toISOString(),
        lastLoginAt: seller.lastLoginAt?.toISOString() || null,
        verified: seller.verified,
        bankIdVerified: seller.bankIdVerified,
        status: sellerStatus,
        listings: {
          total: seller.listings.length,
          active: activeListings,
          totalViews: totalListingViews,
          avgValue: Math.round(avgListingValue)
        },
        transactions: {
          total: transactions.length,
          completed: completedTransactions,
          totalValue: totalTransactionValue,
          avgValue: Math.round(avgDealValue)
        },
        nda: {
          requests: ndaMap[seller.id] || 0
        },
        engagement: {
          reviews: seller._count.givenReviews,
          daysSinceCreation,
          daysLastActive
        },
        performanceScore: Math.min(100, Math.round(performanceScore))
      }
    })

    // Filter by status if provided
    if (status && status !== 'all') {
      enrichedSellers = enrichedSellers.filter(s => s.status === status)
    }

    // Calculate aggregate stats
    const avgPerformanceScore = enrichedSellers.length > 0
      ? Math.round(enrichedSellers.reduce((sum, s) => sum + s.performanceScore, 0) / enrichedSellers.length)
      : 0

    const activeSellers = enrichedSellers.filter(s => s.status === 'active').length
    const newSellers = enrichedSellers.filter(s => s.status === 'new').length
    const inactiveSellers = enrichedSellers.filter(s => s.status === 'inactive').length

    const totalListingsCount = enrichedSellers.reduce((sum, s) => sum + s.listings.total, 0)
    const totalTransactionsCount = enrichedSellers.reduce((sum, s) => sum + s.transactions.total, 0)

    const pages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      sellers: enrichedSellers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages,
        hasMore: page < pages
      },
      stats: {
        total: totalCount,
        active: activeSellers,
        new: newSellers,
        inactive: inactiveSellers,
        avgPerformanceScore,
        totalListings: totalListingsCount,
        totalTransactions: totalTransactionsCount
      }
    })
  } catch (error) {
    console.error('Seller analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seller analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
