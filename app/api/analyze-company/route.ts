import { NextResponse } from 'next/server'
import { searchCompanyWithWebSearch } from '@/lib/webInsights'
import { callOpenAIResponses, OpenAIResponseError } from '@/lib/openai-response-utils'
import { prisma } from '@/lib/prisma'
import { fetchBolagsverketCompanyData } from '@/lib/bolagsverket-api'
import { fetchWebsiteSnapshot } from '@/lib/website-snapshot'
import { scrapeAllabolag } from '@/lib/scrapers/allabolag'

const ANALYSIS_TTL_MS = 1000 * 60 * 60 * 24 // 24 hours

interface OfficialDataSummary {
  orgNumber?: string
  companyName?: string
  registrationDate?: string
  legalForm?: string
  status?: string
  address?: string
  employees?: number
  industryCode?: string
  ceo?: string
  creditRating?: string
  latestRevenue?: number
  latestGrossProfit?: number
  latestProfit?: number
  operatingProfit?: number
  equity?: number
  assets?: number
  liabilities?: number
  revenueGrowth?: number
  profitMargin?: number
  grossMargin?: number
  annualReports?: Array<{
    year: string
    filingDate?: string
    revenue?: number
    profit?: number
    equity?: number
  }>
  source: 'bolagsverket' | 'allabolag' | 'combined' | 'none'
}

interface DataSourceStatus {
  bolagsverket: 'success' | 'failed' | 'no_api_key' | 'no_data'
  allabolag: 'success' | 'failed' | 'no_data'
  webSearch: 'success' | 'failed' | 'no_data'
  website: 'success' | 'failed' | 'no_data' | 'no_url'
}

export async function POST(request: Request) {
  try {
    const { email, companyName, domain, locale, revenue, grossProfit, orgNumber, hasConsented } = await request.json()

    if (!companyName) {
      return NextResponse.json(
        { error: 'Företagsnamn krävs' },
        { status: 400 }
      )
    }

    const normalizedDomain = domain?.trim() || undefined
    const normalizedOrgNumber = normalizeOrgNumber(orgNumber)

    console.log('[ANALYZE] Starting company analysis for:', companyName, normalizedDomain, normalizedOrgNumber)

    // Track data source status - only using GPT web search and website now
    const dataSourceStatus: DataSourceStatus = {
      bolagsverket: 'no_data',
      allabolag: 'no_data',
      webSearch: 'no_data',
      website: normalizedDomain ? 'no_data' : 'no_url'
    }

    // Fetch data from GPT web search and website only
    const [webSearchResult, websiteResult] = await Promise.allSettled([
      searchCompanyWithWebSearch({
        companyName,
        orgNumber: normalizedOrgNumber,
        website: normalizedDomain
      }),
      normalizedDomain ? fetchWebsiteSnapshot(normalizedDomain, companyName) : Promise.resolve(null)
    ])

    // Process web search data
    const webSearchData = webSearchResult.status === 'fulfilled' ? webSearchResult.value : null
    if (webSearchData) {
      dataSourceStatus.webSearch = 'success'
      console.log('[ANALYZE] Web search data retrieved')
    } else if (webSearchResult.status === 'rejected') {
      dataSourceStatus.webSearch = 'failed'
      console.error('[ANALYZE] Web search failed:', webSearchResult.reason)
    }

    // Process website snapshot
    const websiteSnapshot = websiteResult.status === 'fulfilled' ? websiteResult.value : null
    if (websiteSnapshot) {
      dataSourceStatus.website = 'success'
      console.log('[ANALYZE] Website snapshot retrieved')
    } else if (websiteResult.status === 'rejected') {
      dataSourceStatus.website = 'failed'
      console.error('[ANALYZE] Website snapshot failed:', websiteResult.reason)
    }

    // Use user-provided values
    const revenueValue = parseSekValue(revenue)
    const grossProfitValue = parseSekValue(grossProfit)

    // Determine if we have meaningful data
    const hasAnyExternalData = dataSourceStatus.webSearch === 'success' || dataSourceStatus.website === 'success'

    const analysisPrompt = buildAnalysisPrompt({
      companyName,
      domain: normalizedDomain,
      orgNumber: normalizedOrgNumber,
      revenueValue,
      grossProfitValue,
      webSearchData,
      websiteSnapshot,
      dataSourceStatus
      })

    let finalAnalysis: any
    let usedFallback = false

    try {
      console.log('[ANALYZE] Starting AI analysis for:', companyName, {
        hasWebSearch: dataSourceStatus.webSearch === 'success',
        hasWebsite: dataSourceStatus.website === 'success'
      })
      
      const { text } = await callOpenAIResponses({
        model: 'gpt-5.1',
        messages: [
          {
            role: 'system',
            content: `Du är en erfaren svensk M&A-rådgivare och företagsanalytiker som specialiserar dig på att hjälpa företagsägare förstå sina företag ur en köpares perspektiv.

Din uppgift är att leverera värdefulla, konkreta insikter baserade på tillgänglig data. Du är ärlig, konstruktiv och undviker generiska råd. Skriv alltid på flytande svenska.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        reasoning: {
          effort: 'high'
        },
        textVerbosity: 'high',
        metadata: {
          feature: 'company-analysis'
        },
        responseFormat: { type: 'json_object' }
      })

      finalAnalysis = JSON.parse(text || '{}')
      console.log('[ANALYZE] AI analysis completed successfully')
    } catch (error) {
      if (error instanceof OpenAIResponseError) {
        console.error('[ANALYZE] OpenAI Responses API error:', error.status, error.body)
      } else {
        console.error('[ANALYZE] AI analysis failed:', error)
      }
      usedFallback = true
      finalAnalysis = createFallbackAnalysis({
        companyName,
        dataSourceStatus,
        revenue: revenueValue?.toString() || revenue,
        grossProfit: grossProfitValue?.toString() || grossProfit
      })
    }

    const sources = buildSources({
      usedFallback,
      webSearchData,
      websiteSnapshot,
      dataSourceStatus
    })

    const resultPayload = {
      companyName,
      domain: normalizedDomain,
      orgNumber: normalizedOrgNumber,
      revenue: revenueValue ? revenueValue.toString() : revenue,
      grossProfit: grossProfitValue ? grossProfitValue.toString() : grossProfit,
      ...finalAnalysis,
      websiteInsights: websiteSnapshot || undefined,
      sources,
      dataSourceStatus,
      meta: {
        source: usedFallback ? 'fallback' : 'ai',
        hasWebSearch: dataSourceStatus.webSearch === 'success',
        hasWebsite: dataSourceStatus.website === 'success',
        dataQuality: hasAnyExternalData ? 'partial' : 'limited'
      }
    }

    const record = await (prisma as any).instantAnalysis.create({
      data: {
        companyName: companyName.trim(),
        domain: normalizedDomain,
        orgNumber: normalizedOrgNumber,
        revenue: revenue?.trim(),
        grossProfit: grossProfit?.trim(),
        locale,
        result: resultPayload,
        expiresAt: new Date(Date.now() + ANALYSIS_TTL_MS),
        email: email?.trim(),
        hasConsented: hasConsented || false
      }
    })

    return NextResponse.json({
      analysisId: record.id,
      results: resultPayload
    })
  } catch (error) {
    console.error('Company analysis error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod vid analysen' },
      { status: 500 }
    )
  }
}

function buildCombinedOfficialData(
  bolagsverketData: any,
  allabolagData: any,
  dataSourceStatus: DataSourceStatus
): OfficialDataSummary | null {
  const hasBolagsverket = dataSourceStatus.bolagsverket === 'success' && bolagsverketData
  const hasAllabolag = dataSourceStatus.allabolag === 'success' && allabolagData

  if (!hasBolagsverket && !hasAllabolag) {
    return null
  }

  // Build annual reports from Bolagsverket
  let annualReports: Array<{
    year: string
    filingDate?: string
    revenue?: number
    profit?: number
    equity?: number
  }> = []
  
  if (hasBolagsverket && bolagsverketData.annualReports) {
    annualReports = bolagsverketData.annualReports
      .filter((report: any) => report && report.year)
      .map((report: any) => ({
        year: report.year?.toString(),
        filingDate: report.filingDate,
        revenue: toNumber(report.revenue),
        profit: toNumber(report.profit),
        equity: toNumber(report.equity)
      }))
      .sort((a: any, b: any) => parseInt(b.year) - parseInt(a.year))
  }

  // If we have Allabolag history, use it if Bolagsverket doesn't have data
  if (hasAllabolag && allabolagData.history && annualReports.length === 0) {
    annualReports = allabolagData.history
      .filter((h: any) => h.year)
      .map((h: any) => ({
        year: h.year.toString(),
        revenue: h.revenue,
        profit: h.profit
      }))
      .sort((a: any, b: any) => parseInt(b.year) - parseInt(a.year))
  }

  const latestReport = annualReports.length > 0 ? annualReports[0] : undefined

  // Combine data prioritizing different sources for different fields
  const combined: OfficialDataSummary = {
    source: hasBolagsverket && hasAllabolag ? 'combined' : hasBolagsverket ? 'bolagsverket' : 'allabolag',
    orgNumber: bolagsverketData?.orgNumber || allabolagData?.orgNumber,
    companyName: allabolagData?.companyName || bolagsverketData?.name,
    registrationDate: bolagsverketData?.registrationDate || allabolagData?.registrationDate,
    legalForm: bolagsverketData?.legalForm,
    status: bolagsverketData?.status || allabolagData?.status,
    address: bolagsverketData?.address || allabolagData?.address,
    ceo: allabolagData?.ceo,
    creditRating: allabolagData?.creditRating,
    
    // Financial data - prefer Allabolag as it's often more detailed
    employees: allabolagData?.financials?.employees ?? bolagsverketData?.employees,
    industryCode: bolagsverketData?.industryCode,
    latestRevenue: allabolagData?.financials?.revenue ?? latestReport?.revenue,
    latestGrossProfit: allabolagData?.financials?.grossProfit ?? (typeof latestReport?.profit === 'number' ? latestReport.profit : undefined),
    latestProfit: allabolagData?.financials?.profit ?? latestReport?.profit,
    operatingProfit: allabolagData?.financials?.operatingProfit,
    equity: allabolagData?.financials?.equity ?? latestReport?.equity,
    assets: allabolagData?.financials?.assets,
    liabilities: allabolagData?.financials?.liabilities,
    revenueGrowth: allabolagData?.financials?.revenueGrowth,
    profitMargin: allabolagData?.financials?.profitMargin,
    grossMargin: allabolagData?.financials?.grossMargin,
    
    annualReports
  }

  return combined
}

function buildAnalysisPrompt({
  companyName,
  domain,
  orgNumber,
  revenueValue,
  grossProfitValue,
  webSearchData,
  websiteSnapshot,
  dataSourceStatus
}: {
  companyName: string
  domain?: string
  orgNumber?: string
  revenueValue?: number | null
  grossProfitValue?: number | null
  webSearchData: any
  websiteSnapshot: Awaited<ReturnType<typeof fetchWebsiteSnapshot>> | null
  dataSourceStatus: DataSourceStatus
}) {
  // Extract meaningful content from website snapshot
  let websiteAnalysis = ''
  if (websiteSnapshot) {
    const highlights = websiteSnapshot.keyHighlights?.slice(0, 10).join(', ') || ''
    const contacts = []
    if (websiteSnapshot.contact?.emails?.length) contacts.push(`E-post: ${websiteSnapshot.contact.emails[0]}`)
    if (websiteSnapshot.contact?.phones?.length) contacts.push(`Telefon: ${websiteSnapshot.contact.phones[0]}`)
    
    websiteAnalysis = `
=== HEMSIDEDATA (${websiteSnapshot.rootDomain}) ===
Titel: ${websiteSnapshot.title || 'Ej tillgänglig'}
Meta-beskrivning: ${websiteSnapshot.metaDescription || 'Ej tillgänglig'}
Huvudteman: ${highlights || 'Inga identifierade'}
Kontakt: ${contacts.join(', ') || 'Ej tillgängliga'}
Sidor analyserade: ${websiteSnapshot.pagesAnalyzed}

RÅINNEHÅLL FRÅN HEMSIDAN:
${websiteSnapshot.summary?.slice(0, 3000) || 'Inget innehåll kunde hämtas'}
`
  }

  // Format web search data
  let webSearchAnalysis = ''
  if (webSearchData) {
    const profile = webSearchData.companyProfile || {}
    const signals = webSearchData.marketSignals || []
    const growth = webSearchData.growthNotes || []
    const risks = webSearchData.riskNotes || []
    const sources = webSearchData.sources || []
    
    webSearchAnalysis = `
=== WEBBSÖKNINGSRESULTAT ===
Verksamhet: ${profile.description || 'Ej tillgänglig'}
Bransch: ${profile.industry || 'Okänd'}
Målgrupp/Kunder: ${profile.customers || 'Ej specificerade'}
Värdeerbjudande: ${profile.valueProp || 'Ej specificerat'}
Platser: ${profile.locations?.join(', ') || 'Ej specificerade'}
Anställda (uppskattning): ${profile.estimatedEmployees || 'Okänt'}

Marknadssignaler: ${signals.join('; ') || 'Inga'}
Tillväxtsignaler: ${growth.join('; ') || 'Inga'}
Risksignaler: ${risks.join('; ') || 'Inga'}
Aktiviteter: ${webSearchData.notableActivities?.join('; ') || 'Inga noterade'}

Källor: ${sources.map((s: any) => s.title || s.domain).slice(0, 5).join(', ') || 'Inga'}
`
  }

  return `Du är en erfaren svensk M&A-rådgivare och företagsanalytiker. Du ska analysera följande företag och ge ägaren en GRATIS analys som ger verkligt värde.

=== FÖRETAG ATT ANALYSERA ===
Namn: ${companyName}
Webbplats: ${domain || 'Ej angiven'}
${orgNumber ? `Organisationsnummer: ${orgNumber}` : ''}

${websiteAnalysis}

${webSearchAnalysis}

=== DITT UPPDRAG ===
Skapa en djupgående analys med TRE huvuddelar som ger ägaren konkret värde:

1. KÖPARENS ÖGON ("buyerView")
   Analysera företaget som om du vore en potentiell köpare som gör due diligence.
   - Vad ser du först? Vad sticker ut (positivt och negativt)?
   - Vilka frågor skulle en seriös köpare ställa?
   - Vad saknas i företagets presentation?
   - Vilka varningssignaler finns?
   - Vad är attraktivt för en köpare?

2. DIGITAL NÄRVARO ("digitalScore")
   Bedöm företagets digitala närvaro på en skala 0-100.
   Basera poängen på:
   - Webbplatsens kvalitet och professionalism (design, struktur, innehåll)
   - Tydlighet i erbjudande och värdeproposition
   - Kontaktinformation och tillgänglighet
   - Kundcase/testimonials/socialt bevis
   - SEO-grunderna (meta-beskrivning, struktur)
   Var ärlig och kritisk. 50 är genomsnitt, 70+ är bra, 85+ är utmärkt.

3. TRE QUICK WINS ("quickWins")
   Ge EXAKT tre konkreta åtgärder ägaren kan göra INOM EN MÅNAD för att öka företagets attraktivitet.
   Varje quick win ska vara:
   - Specifik (inte generisk)
   - Baserad på vad du faktiskt ser i datan
   - Inkludera uppskattad tidsåtgång
   - Förklara VARFÖR det ökar värdet

=== INSTRUKTIONER ===
- Ta dig tid att tänka igenom varje del noggrant
- Skriv på flytande svenska
- Var ärlig och konstruktiv - sockra inte sanningen
- Basera ALLT på faktisk data du har fått - hitta INTE på
- Om data saknas, säg det ärligt istället för att gissa
- Skriv utförligt - detta är huvudvärdet för användaren

=== JSON-FORMAT ATT RETURNERA ===
{
  "companyType": "kort beskrivning av vad företaget gör (1 mening)",
  "buyerView": {
    "firstImpression": "Vad en köpare ser först och tänker (2-3 meningar)",
    "positives": [
      "Positivt 1 med förklaring varför det är attraktivt för köpare",
      "Positivt 2 med förklaring",
      "Positivt 3 med förklaring"
    ],
    "concerns": [
      "Orosmoment 1 som en köpare skulle reagera på",
      "Orosmoment 2",
      "Orosmoment 3"
    ],
    "questions": [
      "Fråga 1 som en seriös köpare skulle ställa",
      "Fråga 2",
      "Fråga 3",
      "Fråga 4",
      "Fråga 5"
    ],
    "missingInfo": [
      "Information som saknas 1",
      "Information som saknas 2"
    ],
    "overallAssessment": "Sammanfattande bedömning ur köparens perspektiv (3-4 meningar)"
  },
  "digitalScore": {
    "score": 65,
    "breakdown": {
      "websiteQuality": { "score": 70, "comment": "Kort motivering" },
      "clarity": { "score": 60, "comment": "Kort motivering" },
      "trustSignals": { "score": 50, "comment": "Kort motivering" },
      "accessibility": { "score": 75, "comment": "Kort motivering" }
    },
    "summary": "Övergripande bedömning av digital närvaro (2-3 meningar)",
    "benchmark": "Hur detta står sig mot typiska svenska SMB i branschen"
  },
  "quickWins": [
    {
      "title": "Kort titel på åtgärd 1",
      "description": "Detaljerad beskrivning av vad som ska göras (2-3 meningar)",
      "timeEstimate": "ca X timmar/dagar",
      "impact": "Förklaring av varför detta ökar företagets värde (1-2 meningar)",
      "priority": "HÖG/MEDEL/LÅG"
    },
    {
      "title": "Kort titel på åtgärd 2",
      "description": "Detaljerad beskrivning",
      "timeEstimate": "ca X timmar/dagar",
      "impact": "Varför det ökar värdet",
      "priority": "HÖG/MEDEL/LÅG"
    },
    {
      "title": "Kort titel på åtgärd 3",
      "description": "Detaljerad beskrivning",
      "timeEstimate": "ca X timmar/dagar",
      "impact": "Varför det ökar värdet",
      "priority": "HÖG/MEDEL/LÅG"
    }
  ],
  "keyMetrics": {
    "industry": "Bransch baserad på data",
    "location": "Plats om känd",
    "estimatedEmployees": "Antal om känt"
  }
}`
}

function formatSekValueDisplay(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} MSEK`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)} TSEK`
  }
  return `${value.toLocaleString('sv-SE')} kr`
}

function buildSources({
  usedFallback,
  webSearchData,
  websiteSnapshot,
  dataSourceStatus
}: {
  usedFallback: boolean
  webSearchData: any
  websiteSnapshot: Awaited<ReturnType<typeof fetchWebsiteSnapshot>> | null
  dataSourceStatus: DataSourceStatus
}) {
  const sources: Array<{ title: string; url: string; type: string }> = []

  const addSource = (title: string, url?: string | null, type: string = 'other') => {
    if (!url) return
    if (sources.some((source) => source.url === url)) return
    sources.push({ title, url, type })
  }

  // Add web search sources
  if (Array.isArray(webSearchData?.sources)) {
    webSearchData.sources.forEach((source: any) => {
      if (source?.title && source?.url) {
        addSource(source.title, source.url, source.sourceType || 'web')
      }
    })
  } else if (Array.isArray(webSearchData?.rawWebData?.notableSources)) {
    webSearchData.rawWebData.notableSources.forEach((source: any) => {
      if (source?.label && source?.url) {
        addSource(source.label, source.url, source.sourceType || 'web')
      }
    })
  }

  // Add website source
  if (websiteSnapshot) {
    addSource('Företagets webbplats', websiteSnapshot.canonicalUrl, 'company')
  }

  // If using fallback and no other sources
  if (usedFallback && sources.length === 0) {
    sources.push({
      title: 'BOLAXO analys',
      url: 'https://bolaxo.com/sv/analysera',
      type: 'internal'
    })
  }

  return sources.slice(0, 8)
}

function normalizeOrgNumber(value?: string | null) {
  if (!value) return undefined
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) return digits
  if (digits.length === 12) return digits.slice(-10)
  return digits || undefined
}

function parseSekValue(value?: string) {
  if (!value) return null
  const cleaned = value.toString().replace(/[^\d.-]/g, '')
  if (!cleaned) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function formatManualFigure(value?: number | null) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatSekValueDisplay(value)
  }
  return 'Saknas'
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/\s+/g, '').replace(',', '.')
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function createFallbackAnalysis({
  companyName,
  dataSourceStatus,
  revenue,
  grossProfit
}: {
  companyName: string
  dataSourceStatus: DataSourceStatus
  revenue?: string
  grossProfit?: string
}) {
  const safeName = companyName?.trim() || 'Bolaget'
  const hasWebsite = dataSourceStatus.website === 'success'
  const hasWebSearch = dataSourceStatus.webSearch === 'success'

  return {
    companyType: `${safeName} är ett svenskt företag.`,
    buyerView: {
      firstImpression: hasWebsite 
        ? 'Begränsad data tillgänglig. En köpare skulle behöva mer information för att bilda sig en uppfattning.'
        : 'Ingen hemsida hittades, vilket gör det svårt för en köpare att bilda sig en första uppfattning online.',
      positives: [
        'Företaget finns registrerat och har en verksamhet.',
        hasWebsite ? 'Digital närvaro finns via webbplats.' : 'Potential att etablera digital närvaro.',
        'Möjlighet att bygga starkare varumärke.'
      ],
      concerns: [
        'Begränsad information tillgänglig för analys.',
        !hasWebsite ? 'Avsaknad av webbplats kan ge intryck av bristande professionalism.' : 'Webbplatsen kan behöva förstärkas.',
        'En köpare skulle behöva djupare due diligence.'
      ],
      questions: [
        'Vilken är den primära affärsmodellen och kundbasen?',
        'Hur ser omsättning och lönsamhet ut de senaste 3 åren?',
        'Finns det nyckelpersonberoende i verksamheten?',
        'Vilka är de största kunderna och hur lojala är de?',
        'Vilka tillväxtmöjligheter ser ägaren?'
      ],
      missingInfo: [
        'Detaljerad information om verksamheten',
        'Finansiella nyckeltal och historik'
      ],
      overallAssessment: 'Med begränsad tillgänglig data är det svårt att ge en komplett bedömning. En potentiell köpare skulle behöva mer underlag för att kunna utvärdera företaget ordentligt.'
    },
    digitalScore: {
      score: hasWebsite ? 40 : 20,
      breakdown: {
        websiteQuality: { 
          score: hasWebsite ? 40 : 0, 
          comment: hasWebsite ? 'Webbplats finns men kunde inte analyseras i detalj.' : 'Ingen webbplats hittades.' 
        },
        clarity: { 
          score: hasWebsite ? 35 : 0, 
          comment: 'Otillräcklig data för bedömning.' 
        },
        trustSignals: { 
          score: 30, 
          comment: 'Inga tydliga förtroendeskapande element identifierade.' 
        },
        accessibility: { 
          score: hasWebsite ? 50 : 20, 
          comment: hasWebsite ? 'Kontaktuppgifter behöver verifieras.' : 'Svårt att nå företaget online.' 
        }
      },
      summary: hasWebsite 
        ? 'Den digitala närvaron finns men behöver stärkas för att skapa förtroende hos potentiella köpare.'
        : 'Företaget saknar tydlig digital närvaro, vilket är en betydande nackdel i dagens marknad.',
      benchmark: 'Under genomsnittet för svenska SMB. De flesta företag i denna storlek har en fungerande webbplats med grundläggande information.'
    },
    quickWins: [
      {
        title: hasWebsite ? 'Förtydliga erbjudandet på hemsidan' : 'Skapa en enkel webbplats',
        description: hasWebsite 
          ? 'Se till att det inom 5 sekunder framgår vad företaget gör, för vem, och varför kunden ska välja er.'
          : 'Skapa en enkel men professionell webbplats med företagsinfo, erbjudande och kontaktuppgifter. Använd t.ex. Squarespace eller WordPress.',
        timeEstimate: hasWebsite ? 'ca 2-4 timmar' : 'ca 1-2 dagar',
        impact: 'En tydlig digital närvaro är grundläggande för att en köpare ska ta företaget på allvar.',
        priority: 'HÖG'
      },
      {
        title: 'Sammanställ finansiell översikt',
        description: 'Skapa ett enkelt dokument med omsättning, resultat och nyckeltal för de senaste 3 åren. Detta är det första en köpare frågar efter.',
        timeEstimate: 'ca 2-3 timmar',
        impact: 'Transparens kring finanserna bygger förtroende och snabbar på en eventuell försäljningsprocess.',
        priority: 'HÖG'
      },
      {
        title: 'Dokumentera kundbasen',
        description: 'Lista dina 10 största kunder med ungefärlig andel av omsättningen. Identifiera eventuell kundkoncentration.',
        timeEstimate: 'ca 1-2 timmar',
        impact: 'Kundkoncentration är en av de vanligaste riskerna köpare tittar på. Att visa medvetenhet om detta är positivt.',
        priority: 'MEDEL'
      }
    ],
    keyMetrics: {
      industry: 'Okänd bransch',
      location: 'Sverige',
      estimatedEmployees: 'Okänt'
    }
  }
}

function extractCity(address?: string): string {
  if (!address) return 'Sverige'
  // Try to extract city from Swedish address format
  const parts = address.split(/[,\s]+/)
  // Look for common Swedish cities or postal code pattern
  const cities = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping', 'Västerås', 'Örebro', 'Norrköping', 'Helsingborg', 'Jönköping']
  for (const city of cities) {
    if (address.toLowerCase().includes(city.toLowerCase())) {
      return city
    }
  }
  // Try to find word after postal code (5 digits)
  const postalMatch = address.match(/\d{3}\s?\d{2}\s+(\w+)/)
  if (postalMatch && postalMatch[1]) {
    return postalMatch[1]
  }
  return 'Sverige'
}

function extractYear(dateStr?: string): string | null {
  if (!dateStr) return null
  const match = dateStr.match(/(\d{4})/)
  return match ? match[1] : null
}
