import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  sendWeeklyDigestEmail,
  sendNDAPendingReminderEmail
} from '@/lib/email'

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) {
    console.warn('CRON_SECRET not configured')
    return false
  }
  
  return authHeader === `Bearer ${cronSecret}`
}

/**
 * GET /api/cron/email-digest
 * Send weekly digest emails and NDA pending reminders
 * Should be called by a cron job (e.g., every Sunday at 10:00)
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/email-digest",
 *     "schedule": "0 10 * * 0"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'
    const results = {
      digestsSent: 0,
      remindersSent: 0,
      errors: [] as string[]
    }
    
    // Get all active users who want notifications
    const users = await prisma.user.findMany({
      where: {
        verified: true,
        // Add email preferences check when implemented
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    
    // Calculate date range for stats (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    for (const user of users) {
      try {
        // Get user-specific stats
        const stats = await getUserWeeklyStats(user.id, user.role, weekAgo)
        
        // Get top matches for this user
        const topMatches = await getTopMatchesForUser(user.id, user.role)
        
        // Only send digest if there's something to report
        if (
          stats.newMatches > 0 ||
          stats.newListings > 0 ||
          stats.pendingNDAs > 0 ||
          stats.unreadMessages > 0 ||
          stats.profileViews > 0 ||
          topMatches.length > 0
        ) {
          await sendWeeklyDigestEmail(
            user.email,
            user.name || 'där',
            user.role,
            stats,
            topMatches,
            baseUrl
          )
          results.digestsSent++
        }
      } catch (error) {
        console.error(`Failed to send digest to ${user.email}:`, error)
        results.errors.push(`Digest failed for ${user.email}`)
      }
    }
    
    // Send NDA pending reminders to sellers
    const sellersWithPendingNDAs = await prisma.user.findMany({
      where: {
        role: { contains: 'seller' },
        verified: true,
        sellerNDARequests: {
          some: {
            status: 'pending',
            createdAt: { lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } // Pending for > 2 days
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        sellerNDARequests: {
          where: { status: 'pending' },
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    })
    
    for (const seller of sellersWithPendingNDAs) {
      try {
        const pendingCount = seller.sellerNDARequests.length
        const oldestPending = seller.sellerNDARequests[0]?.createdAt
        const oldestPendingDays = oldestPending 
          ? Math.floor((Date.now() - oldestPending.getTime()) / (1000 * 60 * 60 * 24))
          : 0
        
        await sendNDAPendingReminderEmail(
          seller.email,
          seller.name || 'Säljare',
          pendingCount,
          oldestPendingDays,
          `${baseUrl}/dashboard/ndas`
        )
        results.remindersSent++
      } catch (error) {
        console.error(`Failed to send NDA reminder to ${seller.email}:`, error)
        results.errors.push(`NDA reminder failed for ${seller.email}`)
      }
    }
    
    console.log('Email digest cron completed:', results)
    
    return NextResponse.json({
      success: true,
      ...results
    })
    
  } catch (error) {
    console.error('Email digest cron error:', error)
    return NextResponse.json(
      { error: 'Failed to run email digest cron' },
      { status: 500 }
    )
  }
}

async function getUserWeeklyStats(userId: string, role: string, since: Date) {
  const isBuyer = role.includes('buyer')
  const isSeller = role.includes('seller')
  
  const stats = {
    newMatches: 0,
    newListings: 0,
    pendingNDAs: 0,
    unreadMessages: 0,
    profileViews: 0
  }
  
  // New listings (for buyers)
  if (isBuyer) {
    stats.newListings = await prisma.listing.count({
      where: {
        status: 'active',
        publishedAt: { gte: since }
      }
    })
    
    // Match log for this buyer
    stats.newMatches = await prisma.buyerMatchLog.count({
      where: {
        buyerId: userId,
        createdAt: { gte: since }
      }
    })
  }
  
  // Pending NDAs
  if (isSeller) {
    stats.pendingNDAs = await prisma.nDARequest.count({
      where: {
        sellerId: userId,
        status: 'pending'
      }
    })
    
    // Profile views (listing views)
    stats.profileViews = await prisma.listing.aggregate({
      where: {
        userId,
        status: 'active'
      },
      _sum: { views: true }
    }).then(r => r._sum.views || 0)
  }
  
  // Unread messages
  stats.unreadMessages = await prisma.message.count({
    where: {
      recipientId: userId,
      read: false
    }
  })
  
  return stats
}

async function getTopMatchesForUser(userId: string, role: string) {
  const isBuyer = role.includes('buyer')
  
  if (isBuyer) {
    // Get recent match logs for buyer
    const matchLogs = await prisma.buyerMatchLog.findMany({
      where: { buyerId: userId },
      orderBy: { score: 'desc' },
      take: 3
    })
    
    if (matchLogs.length === 0) {
      return []
    }
    
    // Get listing details separately
    const listingIds = matchLogs.map(log => log.listingId)
    const listings = await prisma.listing.findMany({
      where: { id: { in: listingIds } },
      select: {
        id: true,
        anonymousTitle: true,
        industry: true
      }
    })
    
    const listingMap = new Map(listings.map(l => [l.id, l]))
    
    return matchLogs.map(log => {
      const listing = listingMap.get(log.listingId)
      return {
        title: listing?.anonymousTitle || 'Företag',
        matchScore: log.score,
        industry: listing?.industry || 'Okänd bransch',
        listingId: log.listingId
      }
    })
  }
  
  // For sellers, return empty array (they see interested buyers differently)
  return []
}

