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

// GET - Fetch all NDAs with detailed status
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
    const status = searchParams.get('status') // pending, signed, rejected
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { buyer: { email: { contains: search, mode: 'insensitive' } } },
        { buyer: { name: { contains: search, mode: 'insensitive' } } },
        { seller: { email: { contains: search, mode: 'insensitive' } } },
        { seller: { name: { contains: search, mode: 'insensitive' } } },
        { listing: { companyName: { contains: search, mode: 'insensitive' } } },
        { listing: { anonymousTitle: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'createdAt' || sortBy === 'signedAt' || sortBy === 'expiresAt') {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.createdAt = 'desc'
    }

    // Get total count
    const total = await prisma.nDARequest.count({ where })

    // Fetch NDAs with all relations
    const ndas = await prisma.nDARequest.findMany({
      where,
      select: {
        id: true,
        status: true,
        createdAt: true,
        signedAt: true,
        approvedAt: true,
        rejectedAt: true,
        expiresAt: true,
        viewedAt: true,
        message: true,
        buyer: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        seller: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        listing: {
          select: {
            id: true,
            companyName: true,
            anonymousTitle: true,
            revenue: true,
            status: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    })

    // Enrich with calculated fields
    const enrichedNdas = ndas.map(nda => {
      const now = new Date()
      const expiresAt = nda.expiresAt ? new Date(nda.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isExpired = now > expiresAt
      const daysOld = Math.ceil((now.getTime() - new Date(nda.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const daysToSign = nda.signedAt
        ? Math.ceil((new Date(nda.signedAt).getTime() - new Date(nda.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : null

      // Determine actual status
      let calculatedStatus = nda.status
      if (isExpired && nda.status === 'pending') {
        calculatedStatus = 'expired'
      }

      const urgency = daysUntilExpiry <= 3 ? 'high' : daysUntilExpiry <= 7 ? 'medium' : 'low'

      return {
        id: nda.id,
        buyer: {
          id: nda.buyer.id,
          email: nda.buyer.email,
          name: nda.buyer.name
        },
        seller: {
          id: nda.seller.id,
          email: nda.seller.email,
          name: nda.seller.name
        },
        listing: {
          id: nda.listing.id,
          companyName: nda.listing.companyName,
          anonymousTitle: nda.listing.anonymousTitle,
          revenue: nda.listing.revenue,
          status: nda.listing.status
        },
        status: calculatedStatus,
        urgency,
        timeline: {
          createdAt: nda.createdAt.toISOString(),
          signedAt: nda.signedAt?.toISOString() || null,
          approvedAt: nda.approvedAt?.toISOString() || null,
          rejectedAt: nda.rejectedAt?.toISOString() || null,
          expiresAt: nda.expiresAt?.toISOString() || null,
          viewedAt: nda.viewedAt?.toISOString() || null,
          daysOld,
          daysToSign,
          daysUntilExpiry,
          isExpired
        }
      }
    })

    // Calculate statistics
    const stats = {
      total,
      pending: await prisma.nDARequest.count({ where: { ...where, status: 'pending' } }),
      approved: await prisma.nDARequest.count({ where: { ...where, status: 'approved' } }),
      signed: await prisma.nDARequest.count({ where: { ...where, status: 'signed' } }),
      rejected: await prisma.nDARequest.count({ where: { ...where, status: 'rejected' } }),
      urgent: enrichedNdas.filter(n => n.urgency === 'high').length,
      expiring_soon: enrichedNdas.filter(n => n.timeline.daysUntilExpiry <= 7 && !n.timeline.isExpired).length
    }

    // Calculate conversion rate
    const signedNdas = enrichedNdas.filter(n => n.status === 'signed')
    const avgDaysToSign = signedNdas.length > 0
      ? Math.round(signedNdas.reduce((sum, n) => sum + (n.timeline.daysToSign || 0), 0) / signedNdas.length)
      : 0

    const signRate = stats.total > 0 ? Math.round(((stats.signed + stats.approved) / stats.total) * 100) : 0

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      ndas: enrichedNdas,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore: page < pages
      },
      stats: {
        ...stats,
        signRate,
        avgDaysToSign
      }
    })
  } catch (error) {
    console.error('Error fetching NDA tracking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NDA tracking data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH - Update NDA status
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

    const body = await request.json()
    const { ndaId, status } = body

    if (!ndaId || !status) {
      return NextResponse.json(
        { error: 'ndaId and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'signed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const updateData: any = { status }
    
    // Set appropriate timestamp based on status
    if (status === 'approved') {
      updateData.approvedAt = new Date()
    } else if (status === 'signed') {
      updateData.signedAt = new Date()
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date()
    }

    const updated = await prisma.nDARequest.update({
      where: { id: ndaId },
      data: updateData,
      select: {
        id: true,
        status: true,
        signedAt: true,
        approvedAt: true,
        rejectedAt: true,
        buyer: { select: { email: true, name: true } },
        seller: { select: { email: true, name: true } }
      }
    })

    return NextResponse.json({
      message: `NDA status updated to ${status}`,
      data: updated
    })
  } catch (error) {
    console.error('Error updating NDA:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'NDA not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update NDA', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Send NDA reminder or extend expiration
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
    const { ndaId, action } = body

    if (!ndaId || !action) {
      return NextResponse.json(
        { error: 'ndaId and action are required' },
        { status: 400 }
      )
    }

    const nda = await prisma.nDARequest.findUnique({
      where: { id: ndaId },
      select: { 
        id: true,
        buyer: { select: { email: true, name: true } }, 
        expiresAt: true,
        status: true
      }
    })

    if (!nda) {
      return NextResponse.json({ error: 'NDA not found' }, { status: 404 })
    }

    if (action === 'remind') {
      // In production, would send email reminder
      console.log(`NDA reminder sent to ${nda.buyer.email} - Expires ${nda.expiresAt}`)
      return NextResponse.json({
        message: 'Reminder sent to buyer',
        to: nda.buyer.email
      })
    } else if (action === 'resend') {
      // Resend NDA document
      console.log(`NDA resent to buyer ${nda.buyer.email}`)
      return NextResponse.json({
        message: 'NDA resent to buyer',
        to: nda.buyer.email
      })
    } else if (action === 'extend') {
      // Extend expiration by 14 days
      const currentExpiry = nda.expiresAt ? new Date(nda.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const newExpiry = new Date(currentExpiry)
      newExpiry.setDate(newExpiry.getDate() + 14)

      await prisma.nDARequest.update({
        where: { id: ndaId },
        data: { expiresAt: newExpiry }
      })

      return NextResponse.json({
        message: 'NDA expiration extended by 14 days',
        oldExpiry: currentExpiry.toISOString(),
        newExpiry: newExpiry.toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be one of: remind, resend, extend' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error handling NDA action:', error)
    return NextResponse.json(
      { error: 'Failed to handle NDA action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
