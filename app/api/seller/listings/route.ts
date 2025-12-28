import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getClientIp, checkRateLimit, RATE_LIMIT_CONFIGS } from '@/app/lib/rate-limiter'
import { isSeller } from '@/lib/user-roles'
import { getAuthenticatedUserId } from '@/lib/request-auth'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimitCheck = checkRateLimit(ip, RATE_LIMIT_CONFIGS.general)
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }
    
    const userId = getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Demo bypass: if demo cookie, return mock listings without DB lookups
    if (userId.startsWith('demo')) {
      const demoListings = [
        {
          id: 'demo-listing-1',
          title: 'Demo Företag AB',
          anonymousTitle: 'Tillväxtbolag inom tjänster',
          status: 'active',
          package: 'pro',
          publishedAt: new Date().toISOString().split('T')[0],
          expiresAt: null,
          views: 128,
          viewsToday: 4,
          ndaRequests: 2,
          messages: 3,
          saves: 6,
          priceRange: '15-25 MSEK',
          revenue: 18_000_000,
          lastActivity: '1 timme sedan',
          createdAt: new Date(),
        },
      ]

      return NextResponse.json({
        listings: demoListings,
        ndaRequests: [],
        stats: {
          totalListings: demoListings.length,
          activeListings: demoListings.length,
          draftListings: 0,
          pausedListings: 0,
          totalViews: demoListings.reduce((s, l) => s + (l.views || 0), 0),
          totalNDARequests: demoListings.reduce((s, l) => s + (l.ndaRequests || 0), 0),
          totalSaves: demoListings.reduce((s, l) => s + (l.saves || 0), 0),
          totalMessages: demoListings.reduce((s, l) => s + (l.messages || 0), 0),
        },
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })
    if (!user || !isSeller(user.role)) {
      return NextResponse.json({ error: 'Unauthorized - Not a seller' }, { status: 401 })
    }

    // Get all seller's listings with stats
    const listings = await prisma.listing.findMany({
      where: { userId },
      select: {
        id: true,
        companyName: true,
        anonymousTitle: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        expiresAt: true,
        revenue: true,
        priceMin: true,
        priceMax: true,
        views: true,
        _count: {
          select: {
            savedBy: true,
            messages: true,
            ndaRequests: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get NDA requests for all listings
    const ndaRequests = await prisma.nDARequest.findMany({
      where: {
        sellerId: userId,
        status: 'pending'
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        listing: {
          select: {
            id: true,
            anonymousTitle: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get messages count by listing
    const messageStats = await prisma.message.groupBy({
      by: ['listingId'],
      where: { listingId: { in: listings.map(l => l.id) } },
      _count: true
    })

    // Format listings with calculated stats
    const formattedListings = listings.map(listing => {
      const messageCount = messageStats.find(m => m.listingId === listing.id)?._count || 0
      
      return {
        id: listing.id,
        title: listing.companyName || listing.anonymousTitle,
        anonymousTitle: listing.anonymousTitle,
        status: listing.status,
        package: 'pro', // TODO: Get from actual package data
        publishedAt: listing.publishedAt?.toISOString().split('T')[0] || null,
        expiresAt: listing.expiresAt?.toISOString().split('T')[0] || null,
        views: listing.views || 0,
        viewsToday: 0, // TODO: Get from view tracking
        ndaRequests: listing._count.ndaRequests,
        messages: messageCount,
        saves: listing._count.savedBy,
        priceRange: listing.priceMin && listing.priceMax 
          ? `${(listing.priceMin / 1_000_000).toFixed(1)}-${(listing.priceMax / 1_000_000).toFixed(1)} MSEK`
          : 'Ej angiven',
        revenue: listing.revenue,
        lastActivity: listing.publishedAt ? `${Math.floor((Date.now() - listing.publishedAt.getTime()) / (1000 * 60 * 60))} timmar sedan` : 'Ej publicerad',
        createdAt: listing.createdAt
      }
    })

    // Calculate stats
    const stats = {
      totalListings: listings.length,
      activeListings: listings.filter(l => l.status === 'active').length,
      draftListings: listings.filter(l => l.status === 'draft').length,
      pausedListings: listings.filter(l => l.status === 'paused').length,
      totalViews: listings.reduce((sum, l) => sum + (l.views || 0), 0),
      totalNDARequests: ndaRequests.length,
      totalSaves: listings.reduce((sum, l) => sum + l._count.savedBy, 0),
      totalMessages: messageStats.reduce((sum, m) => sum + m._count, 0)
    }

    return NextResponse.json({
      listings: formattedListings,
      ndaRequests: ndaRequests.map(nda => ({
        id: nda.id,
        buyer: nda.buyer,
        listing: nda.listing,
        createdAt: nda.createdAt,
        status: nda.status
      })),
      stats
    })
  } catch (error) {
    console.error('Error fetching seller listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
