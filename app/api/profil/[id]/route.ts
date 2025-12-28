import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Hämta publik köparprofil
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const buyerId = params.id

    if (!buyerId) {
      return NextResponse.json(
        { error: 'Köpar-ID krävs' },
        { status: 400 }
      )
    }

    // Hämta användare med profil och genomförda affärer
    const user = await prisma.user.findUnique({
      where: { id: buyerId },
      include: {
        buyerProfile: true,
        buyerKycVerification: {
          select: {
            status: true,
            reviewedAt: true,
          }
        },
        buyerTransactions: {
          where: {
            stage: 'COMPLETED'
          },
          include: {
            listing: {
              select: {
                industry: true,
                location: true,
                // Anonymiserat - ingen prisinfo
              }
            }
          },
          take: 5, // Visa max 5 genomförda affärer
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!user || !user.buyerProfile) {
      return NextResponse.json(
        { error: 'Köparprofil hittades inte' },
        { status: 404 }
      )
    }

    // Beräkna trust score baserat på flera faktorer
    let trustScore = 0
    const trustFactors = []

    // Verifiering
    if (user.verified) {
      trustScore += 20
      trustFactors.push({ factor: 'E-post verifierad', points: 20 })
    }

    // BankID verifiering
    if (user.bankIdVerified) {
      trustScore += 30
      trustFactors.push({ factor: 'BankID verifierad', points: 30 })
    }

    // Manuell KYC verifiering (ID/bolagsdokument)
    if (user.buyerKycVerification?.status === 'APPROVED') {
      trustScore += 20
      trustFactors.push({ factor: 'Verifierad köpare (KYC)', points: 20 })
    }

    // Genomförda affärer
    const completedDeals = user.buyerTransactions.length
    trustScore += Math.min(completedDeals * 15, 45) // Max 45 poäng för affärer
    if (completedDeals > 0) {
      trustFactors.push({ 
        factor: `${completedDeals} genomförda affärer`, 
        points: Math.min(completedDeals * 15, 45) 
      })
    }

    // Komplett profil
    const profileCompleteness = calculateProfileCompleteness(user.buyerProfile)
    trustScore += Math.floor(profileCompleteness * 0.3) // Max 30 poäng för komplett profil
    trustFactors.push({ 
      factor: `${Math.floor(profileCompleteness)}% komplett profil`, 
      points: Math.floor(profileCompleteness * 0.3) 
    })

    // Finansiering klar
    if (user.buyerProfile.financingReady) {
      trustScore += 5
      trustFactors.push({ factor: 'Finansiering klar', points: 5 })
    }

    trustScore = Math.min(trustScore, 100) // Max 100 poäng

    // Formatera data för publik visning
    const publicProfile = {
      id: user.id,
      name: user.name || 'Anonym köpare',
      // Email visas inte publikt av säkerhetsskäl
      verified: user.verified || false,
      bankIdVerified: user.bankIdVerified || false,
      buyerKycStatus: user.buyerKycVerification?.status || 'UNVERIFIED',
      buyerKycReviewedAt: user.buyerKycVerification?.reviewedAt || null,
      trustScore: trustScore,
      trustFactors: trustFactors,
      
      // Profil-data
      buyerType: user.buyerProfile.buyerType,
      investmentExperience: user.buyerProfile.investmentExperience,
      financingReady: user.buyerProfile.financingReady,
      preferredRegions: user.buyerProfile.preferredRegions,
      preferredIndustries: user.buyerProfile.preferredIndustries,
      
      // Värderingsområde (anonymiserat)
      priceRange: user.buyerProfile.priceMin && user.buyerProfile.priceMax
        ? {
            min: formatCurrency(user.buyerProfile.priceMin),
            max: formatCurrency(user.buyerProfile.priceMax)
          }
        : null,
      
      revenueRange: user.buyerProfile.revenueMin && user.buyerProfile.revenueMax
        ? {
            min: formatCurrency(user.buyerProfile.revenueMin),
            max: formatCurrency(user.buyerProfile.revenueMax)
          }
        : null,
      
      // Genomförda affärer (anonymiserat)
      completedDeals: user.buyerTransactions.map(t => ({
        industry: t.listing.industry,
        location: t.listing.location,
        completedAt: t.createdAt
        // Ingen prisinfo för integritet
      })),
      
      // Metadata
      memberSince: user.createdAt,
      lastActive: user.buyerProfile.lastSearchAt || user.buyerProfile.updatedAt
    }

    return NextResponse.json({ profile: publicProfile })
  } catch (error) {
    console.error('Error fetching public buyer profile:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta köparprofil' },
      { status: 500 }
    )
  }
}

// Hjälpfunktion för att beräkna profilkompletthet
function calculateProfileCompleteness(profile: any): number {
  let filledFields = 0
  const totalFields = 10

  if (profile.preferredRegions?.length > 0) filledFields++
  if (profile.preferredIndustries?.length > 0) filledFields++
  if (profile.priceMin && profile.priceMax) filledFields++
  if (profile.revenueMin && profile.revenueMax) filledFields++
  if (profile.investmentExperience) filledFields++
  if (profile.buyerType) filledFields++
  if (profile.timeframe) filledFields++
  if (profile.financingReady !== null) filledFields++
  if (profile.preferredEmployeeRanges?.length > 0) filledFields++
  if (profile.investmentType) filledFields++

  return (filledFields / totalFields) * 100
}

// Hjälpfunktion för att formatera valuta
function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} M SEK`
  } else if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)} K SEK`
  }
  return `${amount} SEK`
}

