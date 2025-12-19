import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// GET /api/buyer/statistics
// Get detailed statistics for buyer activity
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d

    // Calculate date range
    const now = new Date()
    const periodDays = period === '90d' ? 90 : period === '30d' ? 30 : 7
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
    const previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000)

    // Get buyer profile
    const buyer = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
      }
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Användare hittades inte' }, { status: 404 })
    }

    // Get NDA requests made by this buyer
    const ndaRequests = await prisma.nDARequest.findMany({
      where: {
        buyerId: userId,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        listing: {
          select: {
            id: true,
            anonymousTitle: true,
            industry: true,
          }
        }
      }
    })

    // NDA requests in current period
    const currentPeriodNdas = ndaRequests.filter(n => new Date(n.createdAt) >= startDate)
    const previousPeriodNdas = ndaRequests.filter(n => 
      new Date(n.createdAt) >= previousStartDate && new Date(n.createdAt) < startDate
    )

    // Calculate NDA stats
    const totalNdas = ndaRequests.length
    const approvedNdas = ndaRequests.filter(n => n.status === 'approved').length
    const pendingNdas = ndaRequests.filter(n => n.status === 'pending').length
    const rejectedNdas = ndaRequests.filter(n => n.status === 'rejected').length
    const approvalRate = totalNdas > 0 ? Math.round((approvedNdas / totalNdas) * 100) : 0

    // Get saved/bookmarked listings
    const savedListings = await prisma.savedListing.count({
      where: { userId }
    })

    // Get messages sent
    const messagesSent = await prisma.message.count({
      where: {
        senderId: userId,
        createdAt: { gte: startDate }
      }
    })

    const previousMessagesSent = await prisma.message.count({
      where: {
        senderId: userId,
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        }
      }
    })

    // Get data room accesses (if buyer has accessed any data rooms)
    const dataRoomAccesses = await prisma.dataRoomPermission.count({
      where: {
        userId,
        role: 'VIEWER'
      }
    })

    // Get matches for this buyer (using BuyerMatchLog)
    const matches = await prisma.buyerMatchLog.findMany({
      where: { buyerId: userId },
      select: {
        id: true,
        score: true,
        createdAt: true,
      }
    })

    const newMatches = matches.filter(m => new Date(m.createdAt) >= startDate).length
    const avgMatchScore = matches.length > 0 
      ? Math.round(matches.reduce((sum, m) => sum + (m.score || 0), 0) / matches.length)
      : 0

    // Calculate comparison with average buyer
    // Get aggregate stats from all buyers (anonymized)
    const allBuyers = await prisma.user.findMany({
      where: {
        role: 'buyer',
        id: { not: userId }
      },
      select: { id: true }
    })

    let comparison = null
    if (allBuyers.length > 0) {
      const buyerIds = allBuyers.map(b => b.id)

      // Average NDA requests per buyer
      const totalOtherNdas = await prisma.nDARequest.count({
        where: { buyerId: { in: buyerIds } }
      })
      const avgNdasPerBuyer = totalOtherNdas / allBuyers.length

      // Average approval rate
      const otherApprovedNdas = await prisma.nDARequest.count({
        where: { 
          buyerId: { in: buyerIds },
          status: 'approved'
        }
      })
      const avgApprovalRate = totalOtherNdas > 0 
        ? Math.round((otherApprovedNdas / totalOtherNdas) * 100)
        : 0

      // Average saved listings
      const totalOtherSaved = await prisma.savedListing.count({
        where: { userId: { in: buyerIds } }
      })
      const avgSavedPerBuyer = totalOtherSaved / allBuyers.length

      // Average messages
      const totalOtherMessages = await prisma.message.count({
        where: { senderId: { in: buyerIds } }
      })
      const avgMessagesPerBuyer = totalOtherMessages / allBuyers.length

      comparison = {
        sampleSize: allBuyers.length,
        yourNdaRequests: totalNdas,
        avgNdaRequests: Math.round(avgNdasPerBuyer * 10) / 10,
        yourApprovalRate: approvalRate,
        avgApprovalRate,
        yourSavedListings: savedListings,
        avgSavedListings: Math.round(avgSavedPerBuyer * 10) / 10,
        yourMessages: messagesSent,
        avgMessages: Math.round(avgMessagesPerBuyer * 10) / 10,
        activityLevel: calculateActivityLevel(totalNdas, savedListings, messagesSent, avgNdasPerBuyer, avgSavedPerBuyer, avgMessagesPerBuyer),
      }
    }

    // Calculate changes
    const ndaChange = previousPeriodNdas.length > 0 
      ? Math.round(((currentPeriodNdas.length - previousPeriodNdas.length) / previousPeriodNdas.length) * 100)
      : currentPeriodNdas.length > 0 ? 100 : 0

    const messagesChange = previousMessagesSent > 0 
      ? Math.round(((messagesSent - previousMessagesSent) / previousMessagesSent) * 100)
      : messagesSent > 0 ? 100 : 0

    // Activity timeline (NDA requests over time)
    const activityTimeline = generateActivityTimeline(ndaRequests, periodDays)

    // Industries of interest (based on NDA requests)
    const industryBreakdown = ndaRequests.reduce((acc, nda) => {
      const industry = nda.listing?.industry || 'Övrigt'
      acc[industry] = (acc[industry] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topIndustries = Object.entries(industryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([industry, count]) => ({ industry, count }))

    return NextResponse.json({
      overview: {
        totalNdaRequests: totalNdas,
        ndaRequestsChange: ndaChange,
        approvedNdas,
        pendingNdas,
        rejectedNdas,
        approvalRate,
        savedListings,
        messagesSent,
        messagesChange,
        dataRoomAccesses,
        newMatches,
        avgMatchScore,
      },
      comparison,
      activityTimeline,
      topIndustries,
      ndaBreakdown: {
        approved: approvedNdas,
        pending: pendingNdas,
        rejected: rejectedNdas,
      },
      period,
      periodLabel: period === '7d' ? 'Senaste 7 dagarna' : period === '30d' ? 'Senaste 30 dagarna' : 'Senaste 90 dagarna',
    })
  } catch (error) {
    console.error('Error fetching buyer statistics:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta statistik' },
      { status: 500 }
    )
  }
}

// Calculate activity level compared to average
function calculateActivityLevel(
  ndas: number, 
  saved: number, 
  messages: number,
  avgNdas: number,
  avgSaved: number,
  avgMessages: number
): 'low' | 'average' | 'high' | 'very_high' {
  const ndaRatio = avgNdas > 0 ? ndas / avgNdas : 1
  const savedRatio = avgSaved > 0 ? saved / avgSaved : 1
  const msgRatio = avgMessages > 0 ? messages / avgMessages : 1
  
  const avgRatio = (ndaRatio + savedRatio + msgRatio) / 3
  
  if (avgRatio >= 2) return 'very_high'
  if (avgRatio >= 1.2) return 'high'
  if (avgRatio >= 0.8) return 'average'
  return 'low'
}

// Generate activity timeline
function generateActivityTimeline(ndaRequests: any[], days: number) {
  const timeline: { date: string; ndas: number }[] = []
  const now = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    
    const ndasOnDay = ndaRequests.filter(n => {
      const ndaDate = new Date(n.createdAt).toISOString().split('T')[0]
      return ndaDate === dateStr
    }).length
    
    timeline.push({ date: dateStr, ndas: ndasOnDay })
  }
  
  return timeline
}

