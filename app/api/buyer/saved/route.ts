import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, checkRateLimit, RATE_LIMIT_CONFIGS } from '@/app/lib/rate-limiter'
import { isBuyer } from '@/lib/user-roles'
import { getAuthenticatedUserId } from '@/lib/request-auth'
import { prisma } from '@/lib/prisma'

// Helper to verify user is a buyer
async function verifyBuyerAuth(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request)
    if (!userId) {
      return { isValid: false, error: 'Unauthorized - No user ID', userId: null }
    }
    
    // Verify user is actually a buyer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    })
    
    if (!user || !isBuyer(user.role)) {
      return { isValid: false, error: 'Unauthorized - Not a buyer', userId: null }
    }
    
    return { isValid: true, userId }
  } catch (error) {
    return { isValid: false, error: 'Authentication failed', userId: null }
  }
}

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
    
    // Verify auth
    const auth = await verifyBuyerAuth(request)
    if (!auth.isValid || !auth.userId) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    // Get saved listings with NDA status
    const savedListings = await prisma.savedListing.findMany({
      where: { userId: auth.userId },
      select: {
        id: true,
        createdAt: true,
        notes: true,
        listing: {
          select: {
            id: true,
            companyName: true,
            anonymousTitle: true,
            industry: true,
            location: true,
            region: true,
            revenue: true,
            revenueRange: true,
            priceMin: true,
            priceMax: true,
            employees: true,
            status: true,
            views: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get NDA requests for this buyer
    const ndaRequests = await prisma.nDARequest.findMany({
      where: { buyerId: auth.userId },
      select: {
        id: true,
        listingId: true,
        status: true,
        createdAt: true,
        signedAt: true,
        approvedAt: true,
        expiresAt: true
      }
    })

    // Create a map of listing -> NDA status
    const ndaMap = new Map()
    ndaRequests.forEach(nda => {
      ndaMap.set(nda.listingId, nda)
    })

    // Enrich listings with NDA status
    const enrichedListings = savedListings.map(sl => {
      const nda = ndaMap.get(sl.listing.id)
      
      return {
        id: sl.id,
        listing: sl.listing,
        savedAt: sl.createdAt,
        notes: sl.notes,
        ndaStatus: nda ? nda.status : null,
        ndaId: nda ? nda.id : null,
        canContact: nda && (nda.status === 'approved' || nda.status === 'signed')
      }
    })

    // Calculate stats
    const stats = {
      totalSaved: savedListings.length,
      activeNDAs: ndaRequests.filter(n => n.status === 'approved' || n.status === 'signed').length,
      pendingNDAs: ndaRequests.filter(n => n.status === 'pending').length,
      rejectedNDAs: ndaRequests.filter(n => n.status === 'rejected').length
    }

    return NextResponse.json({
      savedListings: enrichedListings,
      stats
    })
  } catch (error) {
    console.error('Error fetching buyer saved listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved listings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

