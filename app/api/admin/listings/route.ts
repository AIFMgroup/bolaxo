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
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const industry = searchParams.get('industry') || ''
    const location = searchParams.get('location') || ''
    const verified = searchParams.get('verified')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { anonymousTitle: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (industry && industry !== 'all') {
      where.industry = industry
    }

    if (location && location !== 'all') {
      where.location = { contains: location, mode: 'insensitive' }
    }

    if (verified !== null && verified !== undefined) {
      where.verified = verified === 'true'
    }

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'createdAt' || sortBy === 'publishedAt' || sortBy === 'views') {
      orderBy[sortBy] = sortOrder
    } else if (sortBy === 'companyName' || sortBy === 'anonymousTitle') {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.createdAt = 'desc'
    }

    // Get total count
    const total = await prisma.listing.count({ where })

    // Fetch listings with user info
    const listings = await prisma.listing.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        anonymousTitle: true,
        type: true,
        industry: true,
        location: true,
        region: true,
        revenue: true,
        revenueRange: true,
        priceMin: true,
        priceMax: true,
        employees: true,
        status: true,
        packageType: true,
        verified: true,
        views: true,
        broker: true,
        createdAt: true,
        publishedAt: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        _count: {
          select: {
            ndaRequests: true,
            messages: true,
            savedBy: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    })

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      data: listings,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore: page < pages
      }
    })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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

    const { listingId, ...updates } = await request.json()

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    // Validate allowed updates
    const allowedFields = ['status', 'verified', 'packageType', 'expiresAt']
    const sanitizedUpdates: any = {}

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = value
      }
    }

    // Update publishedAt if status changed to active
    if (sanitizedUpdates.status === 'active' && updates.status === 'active') {
      sanitizedUpdates.publishedAt = new Date()
    }

    // Update listing in database
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: sanitizedUpdates,
      select: {
        id: true,
        companyName: true,
        anonymousTitle: true,
        type: true,
        industry: true,
        location: true,
        region: true,
        revenue: true,
        revenueRange: true,
        priceMin: true,
        priceMax: true,
        employees: true,
        status: true,
        packageType: true,
        verified: true,
        views: true,
        broker: true,
        createdAt: true,
        publishedAt: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(updatedListing)
  } catch (error) {
    console.error('Error updating listing:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update listing', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { listingId } = await request.json()

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    // Delete listing and all related data (cascade delete via Prisma)
    const deletedListing = await prisma.listing.delete({
      where: { id: listingId },
      select: {
        id: true,
        companyName: true,
        anonymousTitle: true,
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Listing deleted successfully',
      listing: deletedListing
    })
  } catch (error) {
    console.error('Error deleting listing:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to delete listing', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
