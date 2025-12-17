import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { sendMatchNotificationEmail } from '@/lib/email'

// GET /api/matches?sellerId= OR /api/matches?buyerId=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')
    const buyerId = searchParams.get('buyerId')

    // Handle buyer matches (new functionality)
    if (buyerId) {
      return await getBuyerMatches(buyerId)
    }

    // Handle seller matches (existing functionality)
    if (sellerId) {
      return await getSellerMatches(sellerId)
    }

    return NextResponse.json({ error: 'sellerId eller buyerId krävs' }, { status: 400 })
  } catch (error) {
    console.error('Fetch matches error:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}

// Get matches for a buyer (listings that match buyer's preferences)
async function getBuyerMatches(buyerId: string) {
  // Get buyer profile
  const buyerProfile = await prisma.buyerProfile.findUnique({
    where: { userId: buyerId },
    include: { user: true }
  })

  if (!buyerProfile) {
    return NextResponse.json({ matches: [] })
  }

  // Get all active listings
  const listings = await prisma.listing.findMany({
    where: { status: 'active' },
    include: {
      user: {
        select: { id: true, name: true }
      }
    }
  })

  // Calculate matches for each listing against buyer profile
  const matches: any[] = []

  for (const listing of listings) {
    const matchScore = calculateMatchScore(listing, buyerProfile)

    // Only include matches > 50%
    if (matchScore > 50) {
      // Check if buyer already has NDA for this listing
      const existingNDA = await prisma.nDARequest.findFirst({
        where: {
          listingId: listing.id,
          buyerId: buyerId,
          status: { in: ['pending', 'approved', 'signed'] }
        }
      })

      matches.push({
        id: `${buyerId}-${listing.id}`,
        listingId: listing.id,
        sellerId: listing.userId,
        listing: {
          id: listing.id,
          anonymousTitle: listing.anonymousTitle,
          companyName: listing.companyName,
          region: listing.region,
          industry: listing.industry,
          revenue: listing.revenue,
          priceMin: listing.priceMin,
          priceMax: listing.priceMax,
          isNew: listing.isNew,
          createdAt: listing.createdAt
        },
        matchScore,
        matchReasons: getMatchReasons(listing, buyerProfile),
        hasNDA: !!existingNDA,
        ndaStatus: existingNDA?.status || null,
        createdAt: new Date().toISOString()
      })
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.matchScore - a.matchScore)

  if (matches.length > 0) {
    await notifyNewBuyerMatches(buyerId, matches)
  }

  return NextResponse.json({ matches })
}

// Get matches for a seller (buyers that match seller's listings)
async function getSellerMatches(sellerId: string) {
  // Fetch all listings for this seller
  const listings = await prisma.listing.findMany({
    where: { userId: sellerId, status: 'active' }
  })

  if (listings.length === 0) {
    return NextResponse.json({ matches: [] })
  }

  // Get all buyer profiles
  const buyerProfiles = await prisma.buyerProfile.findMany({
    include: { user: true }
  })

  // Calculate matches for each buyer against each listing
  const matches: any[] = []

  for (const listing of listings) {
    for (const profile of buyerProfiles) {
      const matchScore = calculateMatchScore(listing, profile)

      // Only include matches > 50%
      if (matchScore > 50) {
        matches.push({
          id: `${profile.userId}-${listing.id}`,
          listingId: listing.id,
          buyerId: profile.userId,
          buyerName: profile.user?.name || 'Anonym köpare',
          buyerEmail: profile.user?.email || '',
          matchScore,
          regions: profile.preferredRegions || [],
          industries: profile.preferredIndustries || [],
          priceRange: {
            min: profile.priceMin || 0,
            max: profile.priceMax || 0
          },
          revenueRange: {
            min: profile.revenueMin || 0,
            max: profile.revenueMax || 0
          },
          createdAt: new Date().toISOString()
        })
      }
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.matchScore - a.matchScore)

  return NextResponse.json({ matches })
}

// Helper: Calculate match score between listing and buyer profile
function calculateMatchScore(listing: any, buyerProfile: any): number {
  let score = 0

  // Region match (30 poäng)
  if (buyerProfile.preferredRegions && buyerProfile.preferredRegions.length > 0) {
    if (
      buyerProfile.preferredRegions.includes(listing.region) ||
      buyerProfile.preferredRegions.includes('Hela Sverige')
    ) {
      score += 30
    }
  }

  // Industry match (30 poäng)
  if (buyerProfile.preferredIndustries && buyerProfile.preferredIndustries.length > 0) {
    if (buyerProfile.preferredIndustries.includes(listing.industry)) {
      score += 30
    }
  }

  // Price range match (20 poäng)
  const listingPrice = (listing.priceMin + listing.priceMax) / 2
  if (buyerProfile.priceMin && buyerProfile.priceMax) {
    if (listingPrice >= buyerProfile.priceMin && listingPrice <= buyerProfile.priceMax) {
      score += 20
    } else if (
      listingPrice >= buyerProfile.priceMin * 0.9 &&
      listingPrice <= buyerProfile.priceMax * 1.1
    ) {
      score += 10
    }
  }

  // Revenue range match (20 poäng)
  if (buyerProfile.revenueMin && buyerProfile.revenueMax) {
    if (
      listing.revenue >= buyerProfile.revenueMin &&
      listing.revenue <= buyerProfile.revenueMax
    ) {
      score += 20
    } else if (
      listing.revenue >= buyerProfile.revenueMin * 0.8 &&
      listing.revenue <= buyerProfile.revenueMax * 1.2
    ) {
      score += 10
    }
  }

  return Math.min(score, 100) // Max 100 poäng
}

// Helper: Get match reasons for buyer matches
function getMatchReasons(listing: any, buyerProfile: any): string[] {
  const reasons: string[] = []

  // Region match
  if (buyerProfile.preferredRegions && buyerProfile.preferredRegions.length > 0) {
    if (
      buyerProfile.preferredRegions.includes(listing.region) ||
      buyerProfile.preferredRegions.includes('Hela Sverige')
    ) {
      reasons.push(`Matchar din regionspreferens (${listing.region})`)
    }
  }

  // Industry match
  if (buyerProfile.preferredIndustries && buyerProfile.preferredIndustries.length > 0) {
    if (buyerProfile.preferredIndustries.includes(listing.industry)) {
      reasons.push(`Matchar din branschpreferens (${listing.industry})`)
    }
  }

  // Price range match
  const listingPrice = (listing.priceMin + listing.priceMax) / 2
  if (buyerProfile.priceMin && buyerProfile.priceMax) {
    if (listingPrice >= buyerProfile.priceMin && listingPrice <= buyerProfile.priceMax) {
      reasons.push('Pris matchar ditt önskade intervall')
    }
  }

  // Revenue range match
  if (buyerProfile.revenueMin && buyerProfile.revenueMax) {
    if (
      listing.revenue >= buyerProfile.revenueMin &&
      listing.revenue <= buyerProfile.revenueMax
    ) {
      reasons.push('Omsättning matchar ditt önskade intervall')
    }
  }

  return reasons
}

async function notifyNewBuyerMatches(buyerId: string, matches: any[]) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://afterfounder.com'
  
  // Get buyer info for email
  const buyer = await prisma.user.findUnique({
    where: { id: buyerId },
    select: { name: true, email: true }
  })
  
  for (const match of matches) {
    try {
      const alreadyNotifiedBuyer = await prisma.message.findFirst({
        where: {
          senderId: 'system',
          recipientId: buyerId,
          listingId: match.listingId,
          subject: { startsWith: '[MATCH]' }
        },
        select: { id: true }
      })

      if (!alreadyNotifiedBuyer) {
        // Create in-app notification
        await createNotification({
          userId: buyerId,
          type: 'match',
          title: `Ny matchning: ${match.listing.anonymousTitle || 'Objekt'}`,
          message: `Vi hittade en ny matchning (${Math.round(match.matchScore)}%). Signera NDA för att se detaljer. [listing:${match.listingId}]`,
          listingId: match.listingId
        })
        
        // Send email notification to buyer (only for high-score matches >= 70%)
        if (buyer?.email && match.matchScore >= 70) {
          try {
            await sendMatchNotificationEmail(
              buyer.email,
              buyer.name || 'Köpare',
              'buyer',
              match.listing.anonymousTitle || 'Företag till salu',
              Math.round(match.matchScore),
              match.listingId,
              baseUrl
            )
          } catch (emailError) {
            console.error('Failed to send buyer match email:', emailError)
          }
        }
      }

      if (match.sellerId) {
        const alreadyNotifiedSeller = await prisma.message.findFirst({
          where: {
            senderId: 'system',
            recipientId: match.sellerId,
            listingId: match.listingId,
            content: { contains: `[buyer:${buyerId}]` }
          },
          select: { id: true }
        })

        if (!alreadyNotifiedSeller) {
          // Get seller info for email
          const seller = await prisma.user.findUnique({
            where: { id: match.sellerId },
            select: { name: true, email: true }
          })
          
          // Create in-app notification
          await createNotification({
            userId: match.sellerId,
            type: 'match',
            title: 'Ny intresserad köpare',
            message: `En verifierad köpare matchar ${match.listing.anonymousTitle || 'ditt objekt'} (${Math.round(match.matchScore)}%). [buyer:${buyerId}]`,
            listingId: match.listingId
          })
          
          // Send email notification to seller (only for high-score matches >= 70%)
          if (seller?.email && match.matchScore >= 70) {
            try {
              await sendMatchNotificationEmail(
                seller.email,
                seller.name || 'Säljare',
                'seller',
                match.listing.anonymousTitle || 'Ditt objekt',
                Math.round(match.matchScore),
                match.listingId,
                baseUrl
              )
            } catch (emailError) {
              console.error('Failed to send seller match email:', emailError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send match notification', error)
    }
  }
}
