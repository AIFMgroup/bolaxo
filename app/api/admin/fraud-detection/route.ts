import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, checkRateLimit, RATE_LIMIT_CONFIGS } from '@/app/lib/rate-limiter'
import { prisma } from '@/lib/prisma'

interface FraudIndicator {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  score: number
}

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

// GET - Fetch fraud alerts and suspicious users
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
    const riskLevel = searchParams.get('riskLevel') // low, medium, high, critical
    const type = searchParams.get('type') // bot, fraud, suspicious

    const skip = (page - 1) * limit

    // Get sellers with all their data for fraud analysis
    const sellers = await prisma.user.findMany({
      where: { role: 'seller' },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        createdAt: true,
        verified: true,
        bankIdVerified: true,
        lastLoginAt: true,
        listings: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            revenue: true,
            description: true
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
        sentMessages: {
          select: { id: true }
        },
        givenReviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            listings: true,
            sellerTransactions: true,
            sentMessages: true,
            givenReviews: true
          }
        }
      },
      take: limit * 3
    })

    // Calculate fraud risk for each seller
    const analyzedSellers = sellers.map(seller => {
      const indicators: FraudIndicator[] = []
      let riskScore = 0

      // 1. CHECK: New account with high activity
      const daysSinceCreation = Math.floor((Date.now() - new Date(seller.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceCreation < 3 && seller._count.listings > 5) {
        indicators.push({
          type: 'bot_pattern',
          severity: 'high',
          description: 'New account with multiple listings created immediately',
          score: 25
        })
        riskScore += 25
      }

      // 2. CHECK: Unrealistic revenue claims
      const highRevenueListings = seller.listings.filter(l => l.revenue && l.revenue > 500000000).length
      if (highRevenueListings > 0 && !seller.bankIdVerified) {
        indicators.push({
          type: 'unrealistic_claims',
          severity: 'high',
          description: `${highRevenueListings} listings with extreme revenue (>500M SEK) without BankID verification`,
          score: 25
        })
        riskScore += 25
      }

      // 3. CHECK: Duplicate listing descriptions
      const listingDescriptions = seller.listings.map(l => l.description).filter(d => d)
      const uniqueDescriptions = new Set(listingDescriptions).size
      const duplicateDescriptions = listingDescriptions.length - uniqueDescriptions
      if (duplicateDescriptions > 1) {
        indicators.push({
          type: 'duplicate_content',
          severity: 'medium',
          description: `${duplicateDescriptions} duplicate listing descriptions detected`,
          score: 15
        })
        riskScore += 15
      }

      // 4. CHECK: No verification but many messages sent
      if ((!seller.verified || !seller.bankIdVerified) && seller._count.sentMessages > 50) {
        indicators.push({
          type: 'unverified_high_activity',
          severity: 'medium',
          description: 'High messaging activity without proper verification',
          score: 15
        })
        riskScore += 15
      }

      // 5. CHECK: Sudden spike in activity
      const recentListings = seller.listings.filter(l => {
        const daysOld = Math.floor((Date.now() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        return daysOld < 1
      }).length
      if (recentListings > 5) {
        indicators.push({
          type: 'activity_spike',
          severity: 'high',
          description: `${recentListings} listings created in last 24 hours`,
          score: 20
        })
        riskScore += 20
      }

      // 6. CHECK: No email/BankID verification
      if (!seller.verified || !seller.bankIdVerified) {
        indicators.push({
          type: 'missing_verification',
          severity: 'low',
          description: seller.verified ? 'Missing BankID verification' : 'Email not verified',
          score: 5
        })
        riskScore += 5
      }

      // 7. CHECK: Extreme number of listings
      if (seller._count.listings > 50) {
        indicators.push({
          type: 'listing_spam',
          severity: 'high',
          description: 'Unusually high number of listings (>50)',
          score: 20
        })
        riskScore += 20
      }

      // 8. CHECK: Failed transaction pattern (many transactions, none completed)
      const totalTransactions = seller._count.sellerTransactions
      const completedTransactions = seller.sellerTransactions.filter(t => t.stage === 'COMPLETED').length
      if (totalTransactions > 5 && completedTransactions === 0) {
        indicators.push({
          type: 'transaction_failure_pattern',
          severity: 'medium',
          description: `${totalTransactions} transactions with no completions`,
          score: 15
        })
        riskScore += 15
      }

      // 9. CHECK: No activity since registration
      const daysLastActive = seller.lastLoginAt
        ? Math.floor((Date.now() - new Date(seller.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceCreation
      if (daysLastActive > 60 && seller._count.listings > 0) {
        indicators.push({
          type: 'abandoned_account_with_listings',
          severity: 'low',
          description: 'No activity for 60+ days but listings still active',
          score: 8
        })
        riskScore += 8
      }

      // Cap score at 100
      riskScore = Math.min(100, riskScore)

      // Determine risk level
      let riskLevelStr = 'low'
      if (riskScore >= 80) riskLevelStr = 'critical'
      else if (riskScore >= 60) riskLevelStr = 'high'
      else if (riskScore >= 40) riskLevelStr = 'medium'

      // Determine type
      let userType = 'suspicious'
      if (indicators.some(i => i.type.includes('bot'))) userType = 'bot'
      if (riskScore >= 70) userType = 'fraud'

      const avgReview = seller._count.givenReviews > 0
        ? seller.givenReviews.reduce((sum, r) => sum + r.rating, 0) / seller._count.givenReviews
        : 0

      return {
        id: seller.id,
        email: seller.email,
        name: seller.name,
        companyName: seller.companyName,
        createdAt: seller.createdAt.toISOString(),
        riskScore,
        riskLevel: riskLevelStr,
        userType,
        indicators,
        stats: {
          listings: seller._count.listings,
          transactions: totalTransactions,
          completedTransactions,
          reviews: seller._count.givenReviews,
          avgRating: avgReview > 0 ? avgReview.toFixed(1) : 'N/A',
          totalValue: seller.sellerTransactions.reduce((sum, t) => sum + (t.agreedPrice || 0), 0),
          messages: seller._count.sentMessages
        },
        verification: {
          emailVerified: seller.verified,
          bankIdVerified: seller.bankIdVerified
        },
        activity: {
          daysSinceCreation,
          daysLastActive
        }
      }
    })

    // Filter by risk level
    let filtered = analyzedSellers.filter(u => u.riskScore >= 30)

    if (riskLevel && riskLevel !== 'all') {
      filtered = filtered.filter(u => u.riskLevel === riskLevel)
    }

    if (type && type !== 'all') {
      filtered = filtered.filter(u => u.userType === type)
    }

    // Sort by risk score (highest first)
    filtered.sort((a, b) => b.riskScore - a.riskScore)

    // Paginate correctly
    const total = filtered.length
    const paginated = filtered.slice(skip, skip + limit)
    const pages = Math.ceil(total / limit)

    // Calculate stats
    const criticalCount = filtered.filter(u => u.riskLevel === 'critical').length
    const highCount = filtered.filter(u => u.riskLevel === 'high').length
    const mediumCount = filtered.filter(u => u.riskLevel === 'medium').length
    const botCount = filtered.filter(u => u.userType === 'bot').length
    const fraudCount = filtered.filter(u => u.userType === 'fraud').length

    const avgRiskScore = filtered.length > 0
      ? Math.round(filtered.reduce((sum, u) => sum + u.riskScore, 0) / filtered.length)
      : 0

    return NextResponse.json({
      users: paginated,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore: page < pages
      },
      stats: {
        totalAnalyzed: sellers.length,
        suspicious: filtered.length,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        botsDetected: botCount,
        fraudDetected: fraudCount,
        avgRiskScore
      }
    })
  } catch (error) {
    console.error('Error fetching fraud detection data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fraud detection data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Take action on suspicious user
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { userId, action, notes } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
        { status: 400 }
      )
    }

    const validActions = ['flag', 'suspend', 'investigate', 'approve']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    if (action === 'suspend') {
      // Suspend user by disabling their account
      await prisma.user.update({
        where: { id: userId },
        data: {
          verified: false,
          bankIdVerified: false
        }
      })
      console.log(`User ${userId} suspended. Reason: ${notes}`)
    } else if (action === 'flag') {
      console.log(`Fraud flag added to user ${userId}: ${notes}`)
    } else if (action === 'investigate') {
      console.log(`User ${userId} marked for manual investigation: ${notes}`)
    } else if (action === 'approve') {
      console.log(`User ${userId} approved as legitimate seller: ${notes}`)
    }

    return NextResponse.json({
      message: `Action '${action}' taken on user ${userId}`,
      details: notes
    })
  } catch (error) {
    console.error('Error taking fraud action:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to take action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
