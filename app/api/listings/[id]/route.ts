import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/request-auth'

const SENSITIVE_FIELDS = [
  'companyName',
  'orgNumber',
  'address',
  'website',
  'revenue',
  'revenueRange',
  'revenueYear1',
  'revenueYear2',
  'revenueYear3',
  'revenue3Years',
  'revenueGrowthRate',
  'profitMargin',
  'grossMargin',
  'ebitda',
  'priceMin',
  'priceMax',
  'askingPrice',
  'cash',
  'accountsReceivable',
  'inventory',
  'totalAssets',
  'totalLiabilities',
  'shortTermDebt',
  'longTermDebt',
  'operatingCosts',
  'salaries',
  'rentCosts',
  'marketingCosts',
  'otherOperatingCosts',
  'description',
  'strengths',
  'risks',
  'whySelling',
  'whatIncluded',
  'competitiveAdvantages',
  'customerConcentrationRisk'
]

const PRIVILEGED_ROLES = new Set(['admin', 'broker'])

function maskListing(listing: any, canViewSensitive: boolean) {
  if (canViewSensitive) return listing
  const masked = { ...listing }
  SENSITIVE_FIELDS.forEach((field) => {
    if (Array.isArray(masked[field])) {
      masked[field] = []
    } else if (typeof masked[field] === 'number') {
      masked[field] = null
    } else {
      masked[field] = undefined
    }
  })
  masked.masked = true
  masked.description =
    'Detaljerad information visas efter att NDA har signerats och godkänts.'
  return masked
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const currentUserId = getAuthenticatedUserId(request)

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { id: true, name: true, verified: true }
        }
      }
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Check if current user has NDA approved
    let hasNDA = false
    let matchScore: number | null = null
    let matchReasons: string[] = []
    
    const viewer = currentUserId
      ? await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { id: true, role: true }
        })
      : null
    const viewerRole = viewer?.role || 'guest'

    if (currentUserId) {
      const ndaRequest = await prisma.nDARequest.findFirst({
        where: {
          listingId: params.id,
          buyerId: currentUserId,
          status: { in: ['approved', 'signed'] }
        }
      })
      hasNDA = !!ndaRequest
    
      // Calculate match score if user is a buyer
      const buyerProfile = await prisma.buyerProfile.findUnique({
        where: { userId: currentUserId }
      })
      
      if (buyerProfile) {
        matchScore = calculateMatchScore(listing, buyerProfile)
        matchReasons = getMatchReasons(listing, buyerProfile)
      }
    }

    // Check if current user is owner
    const isOwner = listing.userId === currentUserId

    // Anonymize if not owner and no NDA
    const canViewSensitive =
      isOwner ||
      hasNDA ||
      PRIVILEGED_ROLES.has(viewerRole)
    const anonymizedListing = maskListing(listing, canViewSensitive)

    // Increment views asynchronously (non-blocking)
    prisma.listing.update({
      where: { id: params.id },
      data: { views: { increment: 1 } }
    }).catch(() => {})

    return NextResponse.json({
      ...anonymizedListing,
      userId: listing.userId, // Always include userId for LOI creation
      hasNDA,
      isOwner,
      matchScore: matchScore !== null ? matchScore : undefined,
      matchReasons: matchReasons.length > 0 ? matchReasons : undefined
    })
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const data = await request.json()

    const viewerId = getAuthenticatedUserId(request)
    if (!viewerId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true }
    })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const viewer = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { role: true }
    })
    const privileged = viewer?.role === 'admin'
    if (!privileged && listing.userId !== viewerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

