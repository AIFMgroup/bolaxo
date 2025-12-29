import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/request-auth'
import { prisma } from '@/lib/prisma'

// GET - Hämta köparprofil
export async function GET(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request)

    if (!userId) {
      // Return success with null profile for new users
      return NextResponse.json({ profile: null })
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { buyerProfile: true }
      })

      return NextResponse.json({
        profile: user?.buyerProfile || null,
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        } : null
      })
    } catch (dbError) {
      return NextResponse.json({ profile: null })
    }
  } catch (error) {
    console.error('Error fetching buyer profile:', error)
    return NextResponse.json({ profile: null })
  }
}

// POST - Skapa eller uppdatera köparprofil
export async function POST(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request)
    const body = await request.json()
    const {
      preferredRegions,
      preferredIndustries,
      preferredEmployeeRanges,
      preferredWhySelling,
      priceMin,
      priceMax,
      revenueMin,
      revenueMax,
      investmentExperience,
      financingReady,
      timeframe
    } = body

    if (!userId) {
      return NextResponse.json({ profile: null })
    }

    try {
      // Find or create user
      let user = await prisma.user.findUnique({ where: { id: userId } })
      
      if (!user) {
        return NextResponse.json({ profile: null })
      }

      // Create or update buyer profile with only valid fields
      const buyerProfile = await prisma.buyerProfile.upsert({
        where: { userId: user.id },
        update: {
          preferredRegions: preferredRegions || [],
          preferredIndustries: preferredIndustries || [],
          preferredEmployeeRanges: preferredEmployeeRanges || [],
          preferredWhySelling: preferredWhySelling || [],
          priceMin: priceMin ? Math.round(Number(priceMin)) : null,
          priceMax: priceMax ? Math.round(Number(priceMax)) : null,
          revenueMin: revenueMin ? Math.round(Number(revenueMin)) : null,
          revenueMax: revenueMax ? Math.round(Number(revenueMax)) : null,
          investmentExperience: investmentExperience || null,
          financingReady: financingReady || false,
          timeframe: timeframe || null
        },
        create: {
          userId: user.id,
          preferredRegions: preferredRegions || [],
          preferredIndustries: preferredIndustries || [],
          preferredEmployeeRanges: preferredEmployeeRanges || [],
          preferredWhySelling: preferredWhySelling || [],
          priceMin: priceMin ? Math.round(Number(priceMin)) : null,
          priceMax: priceMax ? Math.round(Number(priceMax)) : null,
          revenueMin: revenueMin ? Math.round(Number(revenueMin)) : null,
          revenueMax: revenueMax ? Math.round(Number(revenueMax)) : null,
          investmentExperience: investmentExperience || null,
          financingReady: financingReady || false,
          timeframe: timeframe || null
        }
      })

      return NextResponse.json({ profile: buyerProfile })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ profile: null })
    }
  } catch (error) {
    console.error('Error updating buyer profile:', error)
    return NextResponse.json({ profile: null })
  }
}

// DELETE - Ta bort köparprofil
export async function DELETE(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Autentisering krävs' },
        { status: 401 }
      )
    }

    await prisma.buyerProfile.delete({
      where: { userId }
    })

    return NextResponse.json({
      success: true,
      message: 'Köparprofil borttagen'
    })
  } catch (error) {
    console.error('Error deleting buyer profile:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort köparprofil' },
      { status: 500 }
    )
  }
}
