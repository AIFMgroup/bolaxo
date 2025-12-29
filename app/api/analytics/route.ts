import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/analytics?sellerId=&listingId=&dateRange=30days
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')
    const listingId = searchParams.get('listingId')
    const dateRange = searchParams.get('dateRange') || '30days'

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId krävs' }, { status: 400 })
    }

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (dateRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7)
        break
      case '30days':
        startDate.setDate(now.getDate() - 30)
        break
      case '90days':
        startDate.setDate(now.getDate() - 90)
        break
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Fetch seller's listings
    const listings = await prisma.listing.findMany({
      where: {
        userId: sellerId,
        ...(listingId ? { id: listingId } : {})
      },
      select: {
        id: true,
        companyName: true,
        anonymousTitle: true,
        views: true,
        createdAt: true
      }
    })

    if (listings.length === 0) {
      return NextResponse.json({
        listings: [],
        summary: {
          totalViews: 0,
          totalNDAs: 0,
          totalMessages: 0,
          avgViewsPerListing: 0
        },
        trend: []
      })
    }

    const listingIds = listings.map(l => l.id)

    // Fetch NDA requests for these listings
    const ndaRequests = await prisma.nDARequest.findMany({
      where: {
        listingId: { in: listingIds },
        sellerId: sellerId,
        createdAt: { gte: startDate }
      }
    })

    // Fetch messages for these listings
    const messages = await prisma.message.findMany({
      where: {
        listingId: { in: listingIds },
        createdAt: { gte: startDate }
      }
    })

    // Group by listing
    const listingStats = listings.map(listing => {
      const listingNDAs = ndaRequests.filter(n => n.listingId === listing.id)
      const listingMessages = messages.filter(m => m.listingId === listing.id)
      
      return {
        id: listing.id,
        title: listing.anonymousTitle,
        views: listing.views,
        ndaRequests: listingNDAs.length,
        ndaApproved: listingNDAs.filter(n => n.status === 'approved').length,
        messages: listingMessages.length,
        createdAt: listing.createdAt
      }
    })

    // Calculate summary
    const summary = {
      totalViews: listings.reduce((sum, l) => sum + l.views, 0),
      totalNDAs: ndaRequests.length,
      totalMessages: messages.length,
      avgViewsPerListing: Math.round(listings.reduce((sum, l) => sum + l.views, 0) / listings.length),
      ndaConversionRate: listings.length > 0 
        ? Math.round((ndaRequests.length / (listings.reduce((sum, l) => sum + l.views, 0) || 1)) * 100)
        : 0
    }

    // Generate trend data (daily)
    const trendData: any = {}
    for (let i = 0; i <= parseInt(dateRange.split('days')[0] || '30'); i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      trendData[dateStr] = { views: 0, ndas: 0, messages: 0 }
    }

    // Populate trend with real data (simplified - all views on creation date)
    listings.forEach(listing => {
      const dateStr = listing.createdAt.toISOString().split('T')[0]
      if (trendData[dateStr]) {
        trendData[dateStr].views += listing.views
      }
    })

    ndaRequests.forEach(nda => {
      const dateStr = nda.createdAt.toISOString().split('T')[0]
      if (trendData[dateStr]) {
        trendData[dateStr].ndas += 1
      }
    })

    messages.forEach(msg => {
      const dateStr = msg.createdAt.toISOString().split('T')[0]
      if (trendData[dateStr]) {
        trendData[dateStr].messages += 1
      }
    })

    // Convert to array
    const trend = Object.entries(trendData).map(([date, data]: any) => ({
      date,
      ...data
    }))

    return NextResponse.json({
      listings: listingStats,
      summary,
      trend
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
