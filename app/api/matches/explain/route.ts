import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { callLLM, parseJSONResponse } from '@/lib/llm-client'

// POST /api/matches/explain
// Generate AI explanation for why a listing matches a buyer's profile
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const body = await request.json()
    const { listingId } = body

    if (!listingId) {
      return NextResponse.json(
        { error: 'listingId krävs' },
        { status: 400 }
      )
    }

    // Get buyer's profile
    const buyerProfile = await prisma.buyerProfile.findFirst({
      where: { userId },
    })

    // Get listing details
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        companyName: true,
        anonymousTitle: true,
        industry: true,
        region: true,
        revenue: true,
        ebitda: true,
        askingPrice: true,
        priceMin: true,
        priceMax: true,
        employees: true,
        foundedYear: true,
        revenueGrowthRate: true,
        description: true,
        type: true,
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Objekt hittades inte' },
        { status: 404 }
      )
    }

    // Get existing match log if any
    const existingMatch = await prisma.buyerMatchLog.findFirst({
      where: {
        buyerId: userId,
        listingId,
      },
      orderBy: { createdAt: 'desc' }
    })

    // Generate match explanation using AI
    const explanation = await generateMatchExplanation(
      listing,
      buyerProfile,
      existingMatch?.score
    )

    // Log this explanation request
    await prisma.buyerMatchLog.create({
      data: {
        buyerId: userId,
        listingId,
        score: explanation.calculatedScore,
        action: 'explanation_generated',
        details: {
          summary: explanation.summary,
          reasons: explanation.reasons,
          highlights: explanation.highlights,
          concerns: explanation.concerns,
        }
      }
    })

    return NextResponse.json({
      listingId,
      matchScore: existingMatch?.score || explanation.calculatedScore,
      explanation: explanation.summary,
      reasons: explanation.reasons,
      highlights: explanation.highlights,
      concerns: explanation.concerns,
      recommendation: explanation.recommendation,
    })
  } catch (error) {
    console.error('Error generating match explanation:', error)
    return NextResponse.json(
      { error: 'Kunde inte generera matchningsförklaring' },
      { status: 500 }
    )
  }
}

async function generateMatchExplanation(
  listing: any,
  buyerProfile: any,
  existingScore?: number
) {
  // Build profile context
  const profileContext = buyerProfile ? `
Köparens profil:
- Önskade branscher: ${buyerProfile.preferredIndustries?.join(', ') || 'Ej specificerat'}
- Önskade regioner: ${buyerProfile.preferredRegions?.join(', ') || 'Ej specificerat'}
- Prisintervall: ${buyerProfile.priceMin ? formatPrice(buyerProfile.priceMin) : 'Ej min'} - ${buyerProfile.priceMax ? formatPrice(buyerProfile.priceMax) : 'Ej max'}
- Omsättningsintervall: ${buyerProfile.revenueMin ? formatPrice(buyerProfile.revenueMin) : 'Ej min'} - ${buyerProfile.revenueMax ? formatPrice(buyerProfile.revenueMax) : 'Ej max'}
- Antal anställda: ${buyerProfile.employeeCountMin || 'Ej min'} - ${buyerProfile.employeeCountMax || 'Ej max'}
- Lönsamhetskrav: ${buyerProfile.profitabilityLevels?.join(', ') || 'Ej specificerat'}
- Köpartyp: ${buyerProfile.buyerType || 'Ej specificerat'}
- Ägarengagemang: ${buyerProfile.ownerInvolvement || 'Ej specificerat'}
` : 'Ingen köparprofil sparad - generell matchning används.'

  const listingContext = `
Objektinformation:
- Titel: ${listing.anonymousTitle || listing.companyName}
- Bransch: ${listing.industry || 'Ej specificerat'}
- Region: ${listing.region || 'Ej specificerat'}
- Omsättning: ${listing.revenue ? formatPrice(listing.revenue) : 'Ej specificerat'}
- EBITDA: ${listing.ebitda ? formatPrice(listing.ebitda) : 'Ej specificerat'}
- Pris: ${listing.askingPrice ? formatPrice(listing.askingPrice) : 
         listing.priceMin && listing.priceMax ? 
         `${formatPrice(listing.priceMin)} - ${formatPrice(listing.priceMax)}` : 'Ej specificerat'}
- Anställda: ${listing.employees || 'Ej specificerat'}
- Grundat: ${listing.foundedYear || 'Ej specificerat'}
- Typ: ${listing.type || 'Ej specificerat'}
- Tillväxt: ${listing.revenueGrowthRate ? `${listing.revenueGrowthRate}%` : 'Ej specificerat'}
- Beskrivning: ${listing.description || 'Ingen beskrivning'}
`

  const systemPrompt = `Du är en erfaren M&A-rådgivare som hjälper köpare att förstå varför ett företag kan passa deras investeringsprofil.

Din uppgift är att analysera matchningen mellan köparens profil och ett företag som är till salu.

Svara på svenska och var konkret. Förklara tydligt VARFÖR objektet matchar (eller inte matchar) köparens kriterier.

Svara i följande JSON-format:
{
  "summary": "En kort sammanfattning (2-3 meningar) av varför detta objekt matchar köparens profil",
  "calculatedScore": <0-100 poäng baserat på hur väl objektet matchar profilen>,
  "reasons": [
    {
      "type": "match",
      "category": "bransch/region/pris/storlek/tillväxt/lönsamhet",
      "title": "Kort rubrik",
      "description": "Förklaring av varför detta är positivt"
    }
  ],
  "highlights": [
    "Särskilt stark punkt 1",
    "Särskilt stark punkt 2"
  ],
  "concerns": [
    "Eventuell oro eller avvikelse från profil"
  ],
  "recommendation": "En avslutande rekommendation - bör köparen gå vidare?"
}

Inkludera 3-6 reasons. Minst 1-2 highlights. Concerns kan vara tom array om inga finns.
Var ärlig - om objektet inte matchar bra, säg det tydligt.`

  const userPrompt = `Analysera matchningen mellan denna köpare och detta objekt:

${profileContext}

${listingContext}

${existingScore ? `Systemets automatiska matchpoäng: ${existingScore}%` : ''}

Förklara varför detta objekt matchar (eller inte matchar) köparens profil. Var specifik och ge konkreta exempel.`

  try {
    const response = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 1500 }
    )

    const analysis = parseJSONResponse(response.content)

    // Normalize and validate response
    const normalizedReasons = Array.isArray(analysis.reasons)
      ? analysis.reasons.map((r: any) => ({
          type: r.type || 'match',
          category: r.category || 'övrigt',
          title: String(r.title || ''),
          description: String(r.description || ''),
        }))
      : []

    return {
      summary: String(analysis.summary || 'Matchning analyserad'),
      calculatedScore: Math.min(100, Math.max(0, Number(analysis.calculatedScore) || 50)),
      reasons: normalizedReasons,
      highlights: Array.isArray(analysis.highlights) ? analysis.highlights.map(String) : [],
      concerns: Array.isArray(analysis.concerns) ? analysis.concerns.map(String) : [],
      recommendation: String(analysis.recommendation || 'Se över objektet noggrant'),
    }
  } catch (error) {
    console.error('LLM error in match explanation:', error)
    // Return a basic explanation if AI fails
    return generateFallbackExplanation(listing, buyerProfile)
  }
}

function generateFallbackExplanation(listing: any, buyerProfile: any) {
  const reasons: any[] = []
  let score = 50

  // Check industry match
  if (buyerProfile?.preferredIndustries?.length > 0 && listing.industry) {
    const industryMatch = buyerProfile.preferredIndustries.some((i: string) => 
      listing.industry.toLowerCase().includes(i.toLowerCase()) ||
      i.toLowerCase().includes(listing.industry.toLowerCase())
    )
    if (industryMatch) {
      reasons.push({
        type: 'match',
        category: 'bransch',
        title: 'Branschmatchning',
        description: `Objektets bransch (${listing.industry}) matchar din profil.`
      })
      score += 15
    }
  }

  // Check region match
  if (buyerProfile?.preferredRegions?.length > 0 && listing.region) {
    const regionMatch = buyerProfile.preferredRegions.some((r: string) =>
      listing.region.toLowerCase().includes(r.toLowerCase()) ||
      r.toLowerCase().includes(listing.region.toLowerCase()) ||
      r === 'Hela Sverige'
    )
    if (regionMatch) {
      reasons.push({
        type: 'match',
        category: 'region',
        title: 'Geografisk matchning',
        description: `Objektet finns i ${listing.region}, inom ditt sökområde.`
      })
      score += 10
    }
  }

  // Check price match
  const listingPrice = listing.askingPrice || listing.priceMin
  if (listingPrice && buyerProfile?.priceMin && buyerProfile?.priceMax) {
    if (listingPrice >= buyerProfile.priceMin && listingPrice <= buyerProfile.priceMax) {
      reasons.push({
        type: 'match',
        category: 'pris',
        title: 'Pris inom budget',
        description: `Priset (${formatPrice(listingPrice)}) ligger inom ditt prisintervall.`
      })
      score += 15
    }
  }

  // Check revenue match
  if (listing.revenue && buyerProfile?.revenueMin && buyerProfile?.revenueMax) {
    if (listing.revenue >= buyerProfile.revenueMin && listing.revenue <= buyerProfile.revenueMax) {
      reasons.push({
        type: 'match',
        category: 'storlek',
        title: 'Omsättning matchar',
        description: `Omsättningen (${formatPrice(listing.revenue)}) matchar dina kriterier.`
      })
      score += 10
    }
  }

  // Check employee count match
  if (listing.employees && buyerProfile?.employeeCountMin && buyerProfile?.employeeCountMax) {
    if (listing.employees >= buyerProfile.employeeCountMin && listing.employees <= buyerProfile.employeeCountMax) {
      reasons.push({
        type: 'match',
        category: 'storlek',
        title: 'Storlek matchar',
        description: `Antal anställda (${listing.employees}) är inom ditt önskade intervall.`
      })
      score += 10
    }
  }

  return {
    summary: reasons.length > 0 
      ? `Detta objekt matchar ${reasons.length} av dina kriterier.`
      : 'Objektet analyserades men saknar tillräcklig information för detaljerad matchning.',
    calculatedScore: Math.min(100, score),
    reasons,
    highlights: reasons.slice(0, 2).map(r => r.title),
    concerns: [],
    recommendation: reasons.length >= 3 
      ? 'Objektet verkar passa din profil väl. Överväg att begära mer information.'
      : 'Granska objektet noggrant för att se om det passar dina behov.',
  }
}

function formatPrice(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} MSEK`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)} TSEK`
  }
  return `${value} SEK`
}

