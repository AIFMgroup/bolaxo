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
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // 'new', 'active', 'inactive'

    // Whitelist valid sort fields
    const validSortFields = ['createdAt', 'email', 'name']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      role: 'buyer'
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get all buyers with their profiles and activities
    const buyers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true,
        verified: true,
        bankIdVerified: true,
        buyerProfile: {
          select: {
            preferredRegions: true,
            preferredIndustries: true,
            revenueMin: true,
            revenueMax: true,
            investmentType: true,
            buyerType: true,
            investmentExperience: true,
            timeframe: true
          }
        },
        savedListings: {
          select: { id: true }
        },
        buyerNDARequests: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        },
        sentMessages: {
          select: { id: true, createdAt: true }
        },
        buyerTransactions: {
          select: {
            id: true,
            stage: true,
            agreedPrice: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            savedListings: true,
            buyerNDARequests: true,
            sentMessages: true,
            buyerTransactions: true
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

    // Enrich with calculated metrics
    const enrichedBuyers = buyers.map(buyer => {
      const savedListings = buyer._count.savedListings
      const ndaRequests = buyer._count.buyerNDARequests
      const messages = buyer._count.sentMessages
      const transactions = buyer.buyerTransactions

      const completedTransactions = transactions.filter(t => t.stage === 'COMPLETED').length
      const inProgressTransactions = transactions.filter(
        t => ['LOI_SIGNED', 'DD_IN_PROGRESS', 'SPA_NEGOTIATION'].includes(t.stage)
      ).length
      const totalSpent = transactions.reduce((sum, t) => sum + (t.agreedPrice || 0), 0)
      const avgDealValue = transactions.length > 0 ? totalSpent / transactions.length : 0

      const daysSinceCreation = Math.floor((Date.now() - new Date(buyer.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const daysLastActive = buyer.lastLoginAt
        ? Math.floor((Date.now() - new Date(buyer.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceCreation

      // Status determination
      let buyerStatus = 'active'
      if (daysSinceCreation < 30) buyerStatus = 'new'
      else if (daysLastActive > 180) buyerStatus = 'inactive'

      // Calculate buyer quality score (0-100)
      let qualityScore = 0
      qualityScore += Math.min(30, completedTransactions * 10) // Up to 30 for completed deals
      qualityScore += Math.min(20, inProgressTransactions * 5) // Up to 20 for active deals
      qualityScore += Math.min(15, savedListings * 2) // Up to 15 for engagement
      qualityScore += buyer.verified ? 10 : 0
      qualityScore += buyer.bankIdVerified ? 15 : 0
      qualityScore += ndaRequests > 0 ? 10 : 0

      // Average NDA to transaction conversion
      const ndaToTransactionRate = ndaRequests > 0
        ? Math.round((completedTransactions / ndaRequests) * 100)
        : 0

      return {
        id: buyer.id,
        email: buyer.email,
        name: buyer.name || 'N/A',
        createdAt: buyer.createdAt.toISOString(),
        lastLoginAt: buyer.lastLoginAt?.toISOString() || null,
        verified: buyer.verified,
        bankIdVerified: buyer.bankIdVerified,
        status: buyerStatus,
        preferences: {
          industries: buyer.buyerProfile?.preferredIndustries || [],
          regions: buyer.buyerProfile?.preferredRegions || [],
          revenueMin: buyer.buyerProfile?.revenueMin || 0,
          revenueMax: buyer.buyerProfile?.revenueMax || 0,
          investmentType: buyer.buyerProfile?.investmentType,
          buyerType: buyer.buyerProfile?.buyerType,
          investmentExperience: buyer.buyerProfile?.investmentExperience,
          timeframe: buyer.buyerProfile?.timeframe
        },
        activity: {
          savedListings,
          ndaRequests,
          messages,
          transactions: transactions.length
        },
        deals: {
          total: transactions.length,
          completed: completedTransactions,
          inProgress: inProgressTransactions,
          totalSpent: totalSpent,
          avgValue: Math.round(avgDealValue),
          ndaConversionRate: ndaToTransactionRate
        },
        engagement: {
          daysSinceCreation,
          daysLastActive,
          messageCount: messages
        },
        buyerQuality: {
          score: Math.min(100, Math.round(qualityScore)),
          status: completedTransactions > 0 ? 'verified_buyer' : buyer.verified ? 'qualified_buyer' : 'new_buyer'
        }
      }
    })

    // Filter by status if provided
    let filteredBuyers = enrichedBuyers
    if (status && status !== 'all') {
      filteredBuyers = filteredBuyers.filter(b => b.status === status)
    }

    // Calculate summary stats
    const avgQualityScore = filteredBuyers.length > 0
      ? Math.round(filteredBuyers.reduce((sum, b) => sum + b.buyerQuality.score, 0) / filteredBuyers.length)
      : 0

    const activeBuyers = filteredBuyers.filter(b => b.status === 'active').length
    const newBuyers = filteredBuyers.filter(b => b.status === 'new').length
    const inactiveBuyers = filteredBuyers.filter(b => b.status === 'inactive').length

    const totalDeals = filteredBuyers.reduce((sum, b) => sum + b.deals.total, 0)
    const completedDeals = filteredBuyers.reduce((sum, b) => sum + b.deals.completed, 0)
    const totalSpentByBuyers = filteredBuyers.reduce((sum, b) => sum + b.deals.totalSpent, 0)
    const avgSavedListings = filteredBuyers.length > 0
      ? (filteredBuyers.reduce((sum, b) => sum + b.activity.savedListings, 0) / filteredBuyers.length).toFixed(1)
      : '0'

    const pages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      buyers: filteredBuyers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages,
        hasMore: page < pages
      },
      stats: {
        totalBuyers: totalCount,
        activeBuyers,
        newBuyers,
        inactiveBuyers,
        avgQualityScore,
        totalDeals,
        completedDeals,
        totalSpentByBuyers,
        avgSavedListings
      }
    })
  } catch (error) {
    console.error('Error fetching buyer analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buyer analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
