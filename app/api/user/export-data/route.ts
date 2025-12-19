import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

// GDPR Article 15 & 20: Right to data portability (JSON export)
export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        companyName: true,
        orgNumber: true,
        region: true,
        createdAt: true,
        lastLoginAt: true,
        verified: true,
        bankIdVerified: true,
        buyerProfile: {
          select: {
            id: true,
            buyerType: true,
            investmentExperience: true,
            financingReady: true,
            preferredRegions: true,
            preferredIndustries: true,
            revenueMin: true,
            revenueMax: true,
            ebitdaMin: true,
            ebitdaMax: true,
            priceMin: true,
            priceMax: true,
          },
        },
        sellerProfile: {
          select: {
            id: true,
            sellerType: true,
            regions: true,
            branches: true,
            profileComplete: true,
            verifiedAt: true,
          },
        },
        listings: {
          select: {
            id: true,
            anonymousTitle: true,
            companyName: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        valuations: {
          select: {
            id: true,
            createdAt: true,
            companyName: true,
            industry: true,
            mostLikely: true,
            minValue: true,
            maxValue: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        premiumValuations: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            completedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        savedListings: {
          select: {
            listingId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      select: {
        id: true,
        listingId: true,
        senderId: true,
        recipientId: true,
        subject: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const ndaRequests = await prisma.nDARequest.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      select: {
        id: true,
        listingId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      messages,
      ndaRequests,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="bolaxo_data_export_${user.id}_${new Date()
          .toISOString()
          .split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Export data error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}

