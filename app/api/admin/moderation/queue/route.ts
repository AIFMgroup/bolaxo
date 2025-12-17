import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Moderation flags (kan lagras i future migrations)
interface ModerationFlag {
  id: string
  itemType: 'listing' | 'user' | 'message'
  itemId: string
  reason: string
  severity: 'low' | 'medium' | 'high'
  reportedBy?: string
  reportCount: number
  status: 'pending' | 'resolved' | 'dismissed'
  createdAt: Date
  resolvedAt?: Date
  notes?: string
}

// GET - Lista moderations-queue
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const itemType = searchParams.get('itemType') // listing, user, message
    const severity = searchParams.get('severity') // low, medium, high
    const status = searchParams.get('status') || 'pending' // pending, resolved, dismissed
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // For now, use mock data (in production, this would be a separate ModerationFlag model)
    // Check flagged listings (new listings that need review)
    const flaggedListings = await prisma.listing.findMany({
      where: {
        verified: false,
        status: 'active'
      },
      select: {
        id: true,
        companyName: true,
        anonymousTitle: true,
        description: true,
        industry: true,
        revenue: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          }
        }
      },
      take: 10
    })

    // Check for potentially suspicious listings (high revenue claims with no verification)
    const suspiciousListings = await prisma.listing.findMany({
      where: {
        verified: false,
        revenue: { gt: 50000000 }, // > 50M SEK without verification
        status: 'active'
      },
      select: {
        id: true,
        companyName: true,
        anonymousTitle: true,
        revenue: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
          }
        }
      },
      take: 5
    })

    // Check for spam-like patterns (new users with multiple listings)
    const potentialSpammers = await prisma.user.findMany({
      where: {
        role: 'seller',
        listings: {
          some: {
            status: 'active'
          }
        }
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            listings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Filter for suspicious activity (new users with many listings)
    const suspiciousUsers = potentialSpammers.filter(
      u => u._count.listings > 5 && new Date().getTime() - new Date(u.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
    )

    // Combine all flagged items
    const allFlags = [
      ...flaggedListings.map(l => ({
        id: `listing-${l.id}`,
        itemType: 'listing' as const,
        itemId: l.id,
        severity: 'low' as const,
        reason: 'Unverified listing',
        reportCount: 0,
        status: 'pending' as const,
        data: l
      })),
      ...suspiciousListings.map(l => ({
        id: `suspicious-${l.id}`,
        itemType: 'listing' as const,
        itemId: l.id,
        severity: 'high' as const,
        reason: 'High revenue claim without verification',
        reportCount: 0,
        status: 'pending' as const,
        data: l
      })),
      ...suspiciousUsers.map(u => ({
        id: `spam-${u.id}`,
        itemType: 'user' as const,
        itemId: u.id,
        severity: 'high' as const,
        reason: `New user with ${u._count.listings} listings in less than 7 days`,
        reportCount: 0,
        status: 'pending' as const,
        data: u
      }))
    ]

    // Filter by type, severity, status
    let filtered = allFlags
    if (itemType) filtered = filtered.filter(f => f.itemType === itemType)
    if (severity) filtered = filtered.filter(f => f.severity === severity)
    if (status) filtered = filtered.filter(f => f.status === status)

    // Sort
    filtered.sort((a, b) => {
      const aVal = a.severity === 'high' ? 3 : (a.severity as string) === 'medium' ? 2 : 1
      const bVal = b.severity === 'high' ? 3 : (b.severity as string) === 'medium' ? 2 : 1
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
    })

    const total = filtered.length
    const paginated = filtered.slice(skip, skip + limit)

    return NextResponse.json({
      success: true,
      data: paginated,
      stats: {
        total,
        pending: allFlags.filter(f => f.status === 'pending').length,
        resolved: allFlags.filter(f => (f.status as string) === 'resolved').length,
        dismissed: allFlags.filter(f => (f.status as string) === 'dismissed').length,
        high_severity: allFlags.filter(f => f.severity === 'high').length,
        medium_severity: allFlags.filter(f => (f.severity as string) === 'medium').length,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching moderation queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    )
  }
}

// POST - Moderate item (approve/reject/dismiss)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemType, itemId, action, reason } = body

    if (!itemType || !itemId || !action) {
      return NextResponse.json(
        { error: 'itemType, itemId, and action are required' },
        { status: 400 }
      )
    }

    const validActions = ['approve', 'reject', 'dismiss', 'flag']

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    let result: any = {}

    if (itemType === 'listing') {
      if (action === 'approve') {
        await prisma.listing.update({
          where: { id: itemId },
          data: { verified: true }
        })
        result = { message: 'Listing approved and verified' }
      } else if (action === 'reject') {
        await prisma.listing.update({
          where: { id: itemId },
          data: { status: 'paused' }
        })
        result = { message: 'Listing paused' }
      } else if (action === 'dismiss') {
        result = { message: 'Flag dismissed' }
      }
    } else if (itemType === 'user') {
      if (action === 'approve') {
        // Mark user as trusted
        result = { message: 'User marked as trusted' }
      } else if (action === 'reject') {
        // Disable user account
        await prisma.user.update({
          where: { id: itemId },
          data: {
            email: `suspended-${itemId}@afterfounder.se`,
            name: 'Suspended User'
          }
        })
        result = { message: 'User suspended' }
      } else if (action === 'dismiss') {
        result = { message: 'Flag dismissed' }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        itemType,
        itemId,
        action,
        result
      }
    })
  } catch (error) {
    console.error('Error moderating item:', error)
    return NextResponse.json(
      { error: 'Failed to moderate item' },
      { status: 500 }
    )
  }
}

// PUT - Bulk moderate items
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, action } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items array is required' },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      )
    }

    let count = 0

    for (const item of items) {
      const { itemType, itemId } = item

      if (itemType === 'listing' && action === 'reject') {
        await prisma.listing.update({
          where: { id: itemId },
          data: { status: 'paused' }
        })
        count++
      } else if (itemType === 'user' && action === 'reject') {
        await prisma.user.update({
          where: { id: itemId },
          data: {
            email: `suspended-${itemId}@afterfounder.se`,
            name: 'Suspended User'
          }
        })
        count++
      } else if (action === 'approve' || action === 'dismiss') {
        count++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk action completed for ${count} items`,
      data: { count }
    })
  } catch (error) {
    console.error('Error in bulk moderation:', error)
    return NextResponse.json(
      { error: 'Failed to complete bulk moderation' },
      { status: 500 }
    )
  }
}
