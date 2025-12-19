import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// GET /api/seller/statistics
// Get detailed statistics for seller's listings
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d

    // Calculate date range
    const now = new Date()
    const periodDays = period === '90d' ? 90 : period === '30d' ? 30 : 7
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
    const previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000)

    // Get seller's listings
    const listingsWhere = listingId 
      ? { id: listingId, userId }
      : { userId }

    const listings = await prisma.listing.findMany({
      where: listingsWhere,
      select: {
        id: true,
        companyName: true,
        anonymousTitle: true,
        industry: true,
        askingPrice: true,
        status: true,
        createdAt: true,
        views: true,
      }
    })

    if (listings.length === 0) {
      return NextResponse.json({
        listings: [],
        totals: {
          views: 0,
          viewsChange: 0,
          ndaRequests: 0,
          ndaRequestsChange: 0,
          conversionRate: 0,
          conversionRateChange: 0,
          messages: 0,
          messagesChange: 0,
        },
        comparison: null,
      })
    }

    const listingIds = listings.map(l => l.id)

    // Get view statistics (using listing views or view tracking if available)
    // For now, use the views field on listings
    const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0)

    // Get NDA requests for this period
    const ndaRequests = await prisma.nDARequest.findMany({
      where: {
        listingId: { in: listingIds },
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        listingId: true,
        status: true,
        createdAt: true,
      }
    })

    // Get NDA requests for previous period (for comparison)
    const previousNdaRequests = await prisma.nDARequest.count({
      where: {
        listingId: { in: listingIds },
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      }
    })

    // Get messages for this period
    const messages = await prisma.message.count({
      where: {
        listingId: { in: listingIds },
        createdAt: { gte: startDate },
      }
    })

    // Get messages for previous period
    const previousMessages = await prisma.message.count({
      where: {
        listingId: { in: listingIds },
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      }
    })

    // Calculate conversion rate (views to NDA requests)
    const conversionRate = totalViews > 0 
      ? (ndaRequests.length / totalViews) * 100 
      : 0

    // Get industry comparison data
    let comparison = null
    if (listings[0]?.industry) {
      const industryListings = await prisma.listing.findMany({
        where: {
          industry: listings[0].industry,
          status: 'active',
          id: { notIn: listingIds },
        },
        select: {
          id: true,
          views: true,
        },
        take: 50,
      })

      if (industryListings.length > 0) {
        const avgIndustryViews = industryListings.reduce((sum, l) => sum + (l.views || 0), 0) / industryListings.length

        // Get NDA requests for industry listings
        const industryNdaCount = await prisma.nDARequest.count({
          where: {
            listingId: { in: industryListings.map(l => l.id) },
            createdAt: { gte: startDate },
          }
        })

        const avgIndustryNdas = industryNdaCount / industryListings.length
        const industryConversionRate = avgIndustryViews > 0 
          ? (avgIndustryNdas / avgIndustryViews) * 100 
          : 0

        comparison = {
          industry: listings[0].industry,
          yourViews: totalViews,
          avgViews: Math.round(avgIndustryViews),
          viewsVsAvg: avgIndustryViews > 0 
            ? Math.round(((totalViews - avgIndustryViews) / avgIndustryViews) * 100)
            : 0,
          yourNdaRequests: ndaRequests.length,
          avgNdaRequests: Math.round(avgIndustryNdas * 10) / 10,
          yourConversionRate: Math.round(conversionRate * 10) / 10,
          avgConversionRate: Math.round(industryConversionRate * 10) / 10,
          sampleSize: industryListings.length,
        }
      }
    }

    // Calculate changes
    const ndaChange = previousNdaRequests > 0 
      ? Math.round(((ndaRequests.length - previousNdaRequests) / previousNdaRequests) * 100)
      : ndaRequests.length > 0 ? 100 : 0

    const messagesChange = previousMessages > 0 
      ? Math.round(((messages - previousMessages) / previousMessages) * 100)
      : messages > 0 ? 100 : 0

    // Per-listing breakdown
    const listingStats = await Promise.all(listings.map(async (listing) => {
      const listingNdas = ndaRequests.filter(n => n.listingId === listing.id)
      const pendingNdas = listingNdas.filter(n => n.status === 'pending').length
      const approvedNdas = listingNdas.filter(n => n.status === 'approved').length

      // Daily views breakdown (mock for now - would need view tracking table)
      const dailyViews = generateDailyData(periodDays, listing.views || 0)

      return {
        id: listing.id,
        title: listing.anonymousTitle || listing.companyName || 'Objekt',
        status: listing.status,
        views: listing.views || 0,
        ndaRequests: listingNdas.length,
        pendingNdas,
        approvedNdas,
        conversionRate: (listing.views || 0) > 0 
          ? Math.round((listingNdas.length / (listing.views || 1)) * 1000) / 10
          : 0,
        dailyViews,
        createdAt: listing.createdAt,
      }
    }))

    // Generate daily totals
    const dailyTotals = generateDailyData(periodDays, totalViews)

    return NextResponse.json({
      listings: listingStats,
      totals: {
        views: totalViews,
        viewsChange: 0, // Would need view tracking to calculate
        ndaRequests: ndaRequests.length,
        ndaRequestsChange: ndaChange,
        conversionRate: Math.round(conversionRate * 10) / 10,
        conversionRateChange: 0,
        messages,
        messagesChange,
        pendingNdas: ndaRequests.filter(n => n.status === 'pending').length,
        approvedNdas: ndaRequests.filter(n => n.status === 'approved').length,
      },
      dailyViews: dailyTotals,
      comparison,
      period,
      periodLabel: period === '7d' ? 'Senaste 7 dagarna' : period === '30d' ? 'Senaste 30 dagarna' : 'Senaste 90 dagarna',
    })
  } catch (error) {
    console.error('Error fetching seller statistics:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta statistik' },
      { status: 500 }
    )
  }
}

// Helper to generate daily data distribution
function generateDailyData(days: number, total: number): { date: string; views: number }[] {
  const data: { date: string; views: number }[] = []
  const now = new Date()
  
  // Distribute views somewhat randomly across days
  let remaining = total
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    
    let dayViews = 0
    if (remaining > 0) {
      if (i === 0) {
        dayViews = remaining
      } else {
        // Random distribution with slight recent bias
        const avgPerDay = remaining / (i + 1)
        const variance = avgPerDay * 0.5
        dayViews = Math.max(0, Math.round(avgPerDay + (Math.random() - 0.5) * variance * 2))
        dayViews = Math.min(dayViews, remaining)
      }
      remaining -= dayViews
    }
    
    data.push({ date: dateStr, views: dayViews })
  }
  
  return data
}

