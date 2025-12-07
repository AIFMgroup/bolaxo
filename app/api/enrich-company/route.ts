import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { PrismaClient } from '@prisma/client'
import { scrapeRatsit } from '@/lib/scrapers/ratsit'
import { scrapeProff } from '@/lib/scrapers/proff'
import { scrapeLinkedIn, estimateEmployeeGrowth } from '@/lib/scrapers/linkedin'
import { scrapeGoogleMyBusiness, calculateBrandStrength } from '@/lib/scrapers/google-mybusiness'
import { scrapeTrustpilot, calculateEcommerceTrust } from '@/lib/scrapers/trustpilot'
import { searchGoogle } from '@/lib/scrapers/google-search'
import { createTimeoutSignal } from '@/lib/scrapers/abort-helper'
import { callOpenAIResponses, OpenAIResponseError } from '@/lib/openai-response-utils'
import { fetchWebInsights } from '@/lib/webInsights'
import { fetchBolagsverketCompanyData } from '@/lib/bolagsverket-api'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { website, orgNumber, companyName, industry } = await request.json()

    // 1. CHECK CACHE FIRST
    const cacheKey = orgNumber || website
    if (cacheKey) {
      const cached = await prisma.companyCache.findFirst({
        where: {
          OR: [
            { orgNumber: orgNumber || undefined },
            { websiteUrl: website || undefined }
          ],
          expiresAt: { gte: new Date() } // Endast giltiga cache-poster
        }
      })

      if (cached) {
        console.log('Cache hit for:', cacheKey)
        return NextResponse.json(cached.enrichedData)
      }
    }

    console.log('Cache miss, fetching fresh data for:', cacheKey)

    const enrichedData: any = {
      autoFill: {},
      rawData: {
        websiteContent: '',
        bolagsverketData: null,
        scbData: null,
        ratsitData: null,
        proffData: null,
        linkedinData: null,
        googleMyBusinessData: null,
        trustpilotData: null,
        googleSearchData: null,
      },
    }

    // 2. PARALLEL DATA FETCHING - Använder endast Bolagsverkets officiella API
    const startTime = Date.now()
    
    const [
      bolagsverketResult,
      scrapingResult,
      scbResult,
      ratsitResult,
      proffResult,
      linkedinResult,
      googleResult,
      trustpilotResult,
      googleSearchResult
    ] = await Promise.allSettled([
      orgNumber ? fetchBolagsverketCompanyData(orgNumber) : Promise.resolve(null),
      website ? scrapeWebsite(website, companyName) : Promise.resolve(''),
      fetchSCBIndustryData(industry),
      orgNumber ? scrapeRatsit(orgNumber) : Promise.resolve(null),
      orgNumber ? scrapeProff(orgNumber) : Promise.resolve(null),
      companyName ? scrapeLinkedIn(companyName, website) : Promise.resolve(null),
      companyName ? scrapeGoogleMyBusiness(companyName, enrichedData.rawData.bolagsverketData?.address) : Promise.resolve(null),
      companyName && website ? scrapeTrustpilot(companyName, website) : Promise.resolve(null),
      companyName ? searchGoogle(companyName, orgNumber) : Promise.resolve(null),
    ])

    console.log(`Parallel fetch completed in ${Date.now() - startTime}ms`)

    // 3. PROCESS RESULTS - Bolagsverket API har högsta prioritet (officiell källa)
    if (bolagsverketResult.status === 'fulfilled' && bolagsverketResult.value) {
      const bolagsverketData = bolagsverketResult.value
      enrichedData.rawData.bolagsverketData = bolagsverketData
      
      // Auto-fill från officiell källa (högsta prioritet)
      // Always fill company name from Bolagsverket (official source)
      console.log('[Enrich API] Bolagsverket data:', {
        name: bolagsverketData.name,
        hasName: !!bolagsverketData.name,
        nameLength: bolagsverketData.name?.length || 0,
        allKeys: Object.keys(bolagsverketData),
        currentAutoFillCompanyName: enrichedData.autoFill.companyName
      })
      
      // Always set company name if available (even if empty string, check for truthy)
      if (bolagsverketData.name && bolagsverketData.name.trim().length > 0) {
        enrichedData.autoFill.companyName = bolagsverketData.name.trim()
        console.log('[Enrich API] Set company name from Bolagsverket:', bolagsverketData.name)
      } else {
        console.warn('[Enrich API] No company name in Bolagsverket data!', {
          name: bolagsverketData.name,
          rawData: bolagsverketData
        })
      }
      if (bolagsverketData.registrationDate) {
        enrichedData.autoFill.registrationDate = bolagsverketData.registrationDate
        enrichedData.autoFill.companyAge = calculateCompanyAge(bolagsverketData.registrationDate)
      }
      if (bolagsverketData.address) {
        enrichedData.autoFill.address = bolagsverketData.address
      }
      if (bolagsverketData.employees) {
        enrichedData.autoFill.employees = mapEmployeeCount(bolagsverketData.employees)
      }
      if (bolagsverketData.legalForm) {
        enrichedData.autoFill.legalForm = bolagsverketData.legalForm
      }
      if (bolagsverketData.industryCode) {
        enrichedData.autoFill.industry = mapSNICodeToIndustry(bolagsverketData.industryCode)
      }
      
      // Processera årsredovisningar från Bolagsverket
      if (bolagsverketData.annualReports && bolagsverketData.annualReports.length > 0) {
        const sortedReports = bolagsverketData.annualReports
          .sort((a, b) => parseInt(b.year) - parseInt(a.year))
        
        const latestReport = sortedReports[0]
        
        // Omsättning och resultat
        if (latestReport?.revenue) {
          enrichedData.autoFill.revenue2024 = latestReport.revenue.toString()
          enrichedData.autoFill.exactRevenue = latestReport.revenue.toString()
          enrichedData.autoFill.revenue = latestReport.revenue.toString()
        }
        if (sortedReports[1]?.revenue) {
          enrichedData.autoFill.revenue2023 = sortedReports[1].revenue.toString()
        }
        if (sortedReports[2]?.revenue) {
          enrichedData.autoFill.revenue2022 = sortedReports[2].revenue.toString()
        }
        if (latestReport?.profit !== undefined) {
          enrichedData.autoFill.profit = latestReport.profit.toString()
          // Beräkna operating costs om vi har revenue och profit
          if (latestReport.revenue && latestReport.profit !== undefined) {
            const operatingCosts = latestReport.revenue - latestReport.profit
            enrichedData.autoFill.operatingCosts = operatingCosts.toString()
          }
        }
        
        // Balansräkningsdata (auto-fyll från senaste årsredovisningen)
        if (latestReport?.equity) {
          enrichedData.autoFill.equity = latestReport.equity.toString()
        }
        if (latestReport?.totalAssets) {
          enrichedData.autoFill.totalAssets = latestReport.totalAssets.toString()
        }
        if (latestReport?.totalLiabilities) {
          enrichedData.autoFill.totalLiabilities = latestReport.totalLiabilities.toString()
        }
        if (latestReport?.cash) {
          enrichedData.autoFill.cash = latestReport.cash.toString()
        }
        if (latestReport?.accountsReceivable) {
          enrichedData.autoFill.accountsReceivable = latestReport.accountsReceivable.toString()
        }
        if (latestReport?.inventory) {
          enrichedData.autoFill.inventory = latestReport.inventory.toString()
        }
        if (latestReport?.accountsPayable) {
          enrichedData.autoFill.accountsPayable = latestReport.accountsPayable.toString()
        }
        
        // Beräkna total skuld från kort- och långfristiga skulder
        const shortTermDebt = latestReport?.shortTermDebt || 0
        const longTermDebt = latestReport?.longTermDebt || 0
        if (shortTermDebt > 0 || longTermDebt > 0) {
          const totalDebt = shortTermDebt + longTermDebt
          enrichedData.autoFill.totalDebt = totalDebt.toString()
          enrichedData.autoFill.shortTermDebt = shortTermDebt.toString()
          enrichedData.autoFill.longTermDebt = longTermDebt.toString()
        } else if (latestReport?.totalLiabilities) {
          // Om vi bara har totala skulder, uppskatta räntebärande skulder (30% av totala skulder)
          const estimatedDebt = latestReport.totalLiabilities * 0.3
          enrichedData.autoFill.totalDebt = estimatedDebt.toString()
        }
      }
      
      console.log('✓ Bolagsverket API data:', {
        name: bolagsverketData.name,
        registrationDate: bolagsverketData.registrationDate,
        reports: bolagsverketData.annualReports?.length || 0,
        source: bolagsverketData.source,
        autoFillCompanyName: enrichedData.autoFill.companyName
      })
    }

    // 4. PROCESS RESULTS - All data från Bolagsverket API (redan processad ovan)

    if (scrapingResult.status === 'fulfilled' && scrapingResult.value) {
      enrichedData.rawData.websiteContent = scrapingResult.value
      
      // AI-driven extraction om OpenAI-nyckel finns
      if (process.env.OPENAI_API_KEY && scrapingResult.value.length > 100) {
        try {
          const aiExtracted = await extractWithAI(scrapingResult.value, companyName)
          Object.assign(enrichedData.autoFill, aiExtracted)
        } catch (error) {
          console.log('AI extraction failed, using regex fallback')
          const regexExtracted = extractKeyInfoFromContent(scrapingResult.value)
          Object.assign(enrichedData.autoFill, regexExtracted)
        }
      } else {
        const regexExtracted = extractKeyInfoFromContent(scrapingResult.value)
        Object.assign(enrichedData.autoFill, regexExtracted)
      }
    }

    if (scbResult.status === 'fulfilled' && scbResult.value) {
      enrichedData.rawData.scbData = scbResult.value
    }

    // Avancerade fält - bransch-baserade defaults
    if (industry) {
      // Payment Terms (bransch-baserat default)
      if (!enrichedData.autoFill.paymentTerms) {
        enrichedData.autoFill.paymentTerms = getDefaultPaymentTerms(industry)
      }
      
      // Regulatory Licenses (bransch-baserat)
      if (!enrichedData.autoFill.regulatoryLicenses) {
        enrichedData.autoFill.regulatoryLicenses = getDefaultRegulatoryStatus(industry)
      }
    }
    
    // Customer Concentration (conservative default)
    if (!enrichedData.autoFill.customerConcentrationRisk) {
      enrichedData.autoFill.customerConcentrationRisk = 'low'
    }

    // RATSIT DATA - Kreditbetyg och riskbedömning (SILENT BEST-EFFORT)
    // Note: Ratsit often blocks (403), so this is best-effort only
    // Success rate ~20-30% but valuable when it works
    // Cache gives us 30 days of data when successful
    if (ratsitResult.status === 'fulfilled' && ratsitResult.value) {
      enrichedData.rawData.ratsitData = ratsitResult.value
      
      console.log('✓ Ratsit data:', {
        creditRating: ratsitResult.value.creditRating?.rating,
        riskLevel: ratsitResult.value.creditRating?.riskLevel,
        paymentRemarks: ratsitResult.value.paymentRemarks?.count || 0,
      })
    } else if (ratsitResult.status === 'rejected') {
      console.log('⚠ Ratsit scraping failed (likely 403) - continuing without credit data')
    }

    // PROFF DATA - Kompletterande finansiell data + ledning
    if (proffResult.status === 'fulfilled' && proffResult.value) {
      const proffData = proffResult.value
      enrichedData.rawData.proffData = proffData
      
      // Use Proff data to fill gaps if Bolagsverket didn't provide everything
      if (proffData.financials.revenue && !enrichedData.autoFill.exactRevenue) {
        enrichedData.autoFill.exactRevenue = proffData.financials.revenue.toString()
      }
      
      if (proffData.financials.profit && proffData.financials.revenue && !enrichedData.autoFill.operatingCosts) {
        const operatingCosts = proffData.financials.revenue - proffData.financials.profit
        enrichedData.autoFill.operatingCosts = operatingCosts.toString()
      }
      
      if (proffData.financials.employees && !enrichedData.autoFill.employees) {
        enrichedData.autoFill.employees = mapEmployeeCount(proffData.financials.employees)
      }
      
      console.log('✓ Proff.se data:', {
        revenue: proffData.financials.revenue,
        ceo: proffData.management?.ceo,
        boardMembers: proffData.management?.boardMembers?.length || 0,
      })
    }

    // LINKEDIN DATA - Aktuellt antal anställda & tillväxt
    if (linkedinResult.status === 'fulfilled' && linkedinResult.value) {
      const linkedinData = linkedinResult.value
      enrichedData.rawData.linkedinData = linkedinData
      
      // LinkedIn often has MORE current employee count than official registers
      if (linkedinData.employees) {
        // Prefer LinkedIn for current employee count if it's higher (means they're growing)
        const currentAutoFillEmployees = enrichedData.autoFill.employees
        const linkedinCount = linkedinData.employees.current
        
        // Only override if LinkedIn shows significantly more employees (growth signal)
        const shouldUseLinkedIn = !currentAutoFillEmployees || 
                                  linkedinCount > (parseInt(currentAutoFillEmployees.split('-')[1] || '0') || 0)
        
        if (shouldUseLinkedIn) {
          enrichedData.autoFill.employees = mapEmployeeCount(linkedinCount)
        }
        
        // Calculate employee growth if we have historical data from Bolagsverket
        const bolagsverketEmployees = enrichedData.rawData.bolagsverketData?.employees
        if (bolagsverketEmployees && linkedinCount > bolagsverketEmployees) {
          linkedinData.employeeGrowth = estimateEmployeeGrowth(
            linkedinCount,
            bolagsverketEmployees,
            12 // Assume annual reports are ~12 months old
          )
        }
      }
      
      console.log('✓ LinkedIn data:', {
        employees: linkedinData.employees?.current,
        growth: linkedinData.employeeGrowth?.trend,
        industry: linkedinData.industry,
      })
    }

    // GOOGLE MY BUSINESS DATA - Recensioner & varumärkesstyrka
    if (googleResult.status === 'fulfilled' && googleResult.value) {
      const googleData = googleResult.value
      enrichedData.rawData.googleMyBusinessData = googleData
      
      // Calculate brand strength score
      if (googleData.rating) {
        const brandStrength = calculateBrandStrength(googleData)
        googleData.brandStrength = brandStrength
      }
      
      console.log('✓ Google My Business data:', {
        rating: googleData.rating?.average,
        reviews: googleData.rating?.totalReviews,
        brandScore: googleData.brandStrength?.score,
        claimed: googleData.claimed,
      })
    }

    // TRUSTPILOT DATA - E-handelsrecensioner
    if (trustpilotResult.status === 'fulfilled' && trustpilotResult.value) {
      const trustpilotData = trustpilotResult.value
      enrichedData.rawData.trustpilotData = trustpilotData
      
      // Calculate combined e-commerce trust score
      const googleRating = enrichedData.rawData.googleMyBusinessData?.rating?.average
      const googleReviews = enrichedData.rawData.googleMyBusinessData?.rating?.totalReviews
      
      if (trustpilotData.trustScore || googleRating) {
        const ecommerceTrust = calculateEcommerceTrust(
          trustpilotData,
          googleRating,
          googleReviews
        )
        trustpilotData.ecommerceTrust = ecommerceTrust
      }
      
      console.log('✓ Trustpilot data:', {
        score: trustpilotData.trustScore?.score,
        reviews: trustpilotData.trustScore?.totalReviews,
        trend: trustpilotData.trend?.direction,
        ecommerceTrust: trustpilotData.ecommerceTrust?.score,
      })
    }
    
    // 10. Google Search (news, mentions, sentiment)
    if (googleSearchResult.status === 'fulfilled' && googleSearchResult.value) {
      const googleSearchData = googleSearchResult.value
      enrichedData.rawData.googleSearchData = googleSearchData
      
      console.log('✓ Google Search:', {
        results: googleSearchData.results.length,
        totalResults: googleSearchData.totalResults,
        newsCount: googleSearchData.insights.newsCount,
        recentNews: googleSearchData.insights.hasRecentNews,
        positive: googleSearchData.insights.sentimentIndicators.positive.length,
        negative: googleSearchData.insights.sentimentIndicators.negative.length,
      })
    }
    
    // SMART AUTO-FILL FOR QUALITATIVA FRÅGOR
    // Kombinera data från alla källor för att hjälpa användaren
    
    // Competitive Advantage (från hemsida + brand metrics)
    if (!enrichedData.autoFill.competitiveAdvantage) {
      const advantages: string[] = []
      
      if (enrichedData.rawData.trustpilotData?.trustScore?.score >= 4.5) {
        advantages.push('Starkt varumärke med excellent kundrecensioner')
      }
      
      if (enrichedData.rawData.linkedinData?.employeeGrowth?.trend === 'growing') {
        advantages.push('Växande organisation - rekryterar aktivt')
      }
      
      // Kolla om vi har revenue growth från Bolagsverket årsredovisningar
      if (enrichedData.rawData.bolagsverketData?.annualReports && 
          enrichedData.rawData.bolagsverketData.annualReports.length >= 2) {
        const reports = [...enrichedData.rawData.bolagsverketData.annualReports].sort((a: any, b: any) => 
          parseInt(b.year) - parseInt(a.year)
        )
        const latestRevenue = reports[0]?.revenue
        const previousRevenue = reports[1]?.revenue
        if (latestRevenue && previousRevenue) {
          const growth = ((latestRevenue - previousRevenue) / previousRevenue) * 100
          if (growth > 20) {
            advantages.push('Stark historisk tillväxt (>20% årligen)')
          }
        }
      }
      
      if (advantages.length > 0) {
        enrichedData.autoFill.competitiveAdvantage = advantages.join('. ') + '.'
      }
    }

    // 11. WEBB-SÖKNING VIA OPENAI RESPONSES API (web_search-tool)
    if (companyName) {
      try {
        const webSearchEnrichment = await fetchWebInsights({
          companyName,
          orgNumber,
          website,
          industry,
          focus: 'enrichment'
        })

        if (webSearchEnrichment) {
          if (!enrichedData.rawData.webSearchData && webSearchEnrichment.rawWebData) {
            enrichedData.rawData.webSearchData = webSearchEnrichment.rawWebData
          }

          const webAutoFill = webSearchEnrichment.autoFill || {}
          Object.entries(webAutoFill).forEach(([key, value]) => {
            if (
              value !== undefined &&
              value !== null &&
              value !== '' &&
              (enrichedData.autoFill[key] === undefined ||
                enrichedData.autoFill[key] === null ||
                enrichedData.autoFill[key] === '')
            ) {
              enrichedData.autoFill[key] = value
            }
          })
        }
      } catch (error) {
        console.error('OpenAI web_search enrichment failed:', error)
      }
    }

    // 12. SAVE TO CACHE (30 dagars TTL)
    if (cacheKey) {
      try {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        await prisma.companyCache.create({
          data: {
            orgNumber: orgNumber || null,
            websiteUrl: website || null,
            enrichedData: enrichedData,
            scrapedPages: enrichedData.rawData.websiteContent ? 
              (enrichedData.rawData.websiteContent.match(/--- /g) || []).length : 0,
            expiresAt
          }
        })
        console.log('Saved to cache:', cacheKey)
      } catch (error) {
        console.log('Cache save failed (may already exist):', error)
      }
    }

    return NextResponse.json(enrichedData)
  } catch (error) {
    console.error('Enrichment API error:', error)
    return NextResponse.json(
      { error: 'Failed to enrich company data' },
      { status: 500 }
    )
  }
}

// WEB SCRAPING
async function scrapeWebsite(url: string, companyName: string): Promise<string> {
  const visited = new Set<string>()
  const toVisit: string[] = [url]
  let allContent = ''
  const maxPages = 10 // Minska till 10 för snabbare respons

  try {
    // Normalisera URL
    if (!url.startsWith('http')) {
      url = 'https://' + url
    }
    const baseUrl = new URL(url)
    
    // Prioriterade sidor att skrapa
    const priorityPaths = ['', '/om-oss', '/about', '/tjanster', '/services', '/kontakt']
    priorityPaths.forEach(path => {
      const fullUrl = `${baseUrl.protocol}//${baseUrl.hostname}${path}`
      if (!visited.has(fullUrl)) {
        toVisit.unshift(fullUrl) // Lägg till i början
      }
    })
    
    while (toVisit.length > 0 && visited.size < maxPages) {
      let currentUrl = toVisit.shift()!
      
      if (visited.has(currentUrl)) continue
      visited.add(currentUrl)

      try {
        // Retry logic för SSL-problem
        let response
        let urlToFetch = currentUrl
        
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            response = await fetch(urlToFetch, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
                'Connection': 'keep-alive',
              },
              signal: createTimeoutSignal(10000), // 10s timeout
            })
            break // Success, exit retry loop
          } catch (err) {
            if (attempt === 0) {
              // Retry med http istället om https failar
              if (urlToFetch.startsWith('https://')) {
                urlToFetch = urlToFetch.replace('https://', 'http://')
                continue
              }
            }
          }
        }
        
        if (!response) {
          // Både https och http failade, hoppa över
          continue
        }

        if (!response.ok) {
          console.log(`Failed to fetch ${currentUrl}: ${response.status}`)
          continue
        }

        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('text/html')) {
          continue // Hoppa över PDF, bilder, etc
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        // Ta bort script, style, nav, footer, etc
        $('script, style, nav, footer, header, iframe, noscript').remove()

        // Extrahera titel och meta-beskrivning
        const title = $('title').text().trim()
        const metaDesc = $('meta[name="description"]').attr('content') || ''

        // Extrahera huvudinnehåll
        const mainContent = $('main, article, .content, #content, .main').text() || $('body').text()
        const pageText = mainContent
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 2000) // Max 2k tecken per sida

        allContent += `\n--- ${title} (${currentUrl}) ---\n${metaDesc}\n${pageText}\n`

        // Hitta relevanta interna länkar (begränsa)
        if (visited.size < maxPages) {
          $('a[href]').each((_, element) => {
            if (toVisit.length > maxPages * 2) return false // Stoppa om vi har för många i kön
            
            const href = $(element).attr('href')
            if (href) {
              try {
                const linkUrl = new URL(href, currentUrl)
                // Endast scrapa samma domän, undvik admin/login/etc
                const path = linkUrl.pathname.toLowerCase()
                const skipPaths = ['/admin', '/login', '/cart', '/checkout', '/kassa', '/404']
                const shouldSkip = skipPaths.some(skip => path.includes(skip))
                
                if (linkUrl.hostname === baseUrl.hostname && 
                    !visited.has(linkUrl.href) && 
                    !shouldSkip) {
                  toVisit.push(linkUrl.href)
                }
              } catch {
                // Ignorera ogiltiga URLs
              }
            }
          })
        }
      } catch (error) {
        console.error(`Error scraping ${currentUrl}:`, error)
      }
    }

    console.log(`Scraped ${visited.size} pages, content length: ${allContent.length}`)
    return allContent.slice(0, 30000) // Max 30k tecken totalt
  } catch (error) {
    console.error('Scraping error:', error)
    return `Kunde inte skrapa ${url}. Webbplatsen kan ha CORS-skydd eller blockera bots.`
  }
}

// EXTRAHERA NYCKELINFORMATION
function extractKeyInfoFromContent(content: string): any {
  const extracted: any = {}

  // Försök hitta antal anställda
  const employeePatterns = [
    /(\d+)\s+medarbetare/i,
    /(\d+)\s+anställda/i,
    /vi\s+är\s+(\d+)\s+personer/i,
    /team\s+på\s+(\d+)/i,
    /(\d+)\s+employees/i,
  ]

  for (const pattern of employeePatterns) {
    const match = content.match(pattern)
    if (match) {
      const num = parseInt(match[1])
      if (num > 0 && num < 1000) { // Sanity check
        extracted.employees = mapEmployeeCount(num)
        break
      }
    }
  }

  // Omsättning/revenue mentions
  const revenuePatterns = [
    /omsättning[:\s]+(\d+(?:\.\d+)?)\s*(?:miljoner?|msek|mkr)/i,
    /revenue[:\s]+(\d+(?:\.\d+)?)\s*(?:million|msek)/i,
    /turnover[:\s]+(\d+(?:\.\d+)?)\s*(?:miljoner?|msek)/i,
  ]

  for (const pattern of revenuePatterns) {
    const match = content.match(pattern)
    if (match) {
      const revenue = parseFloat(match[1])
      if (revenue > 0 && revenue < 1000) {
        extracted.revenue = `${revenue} MSEK`
        break
      }
    }
  }

  // Grundat år
  const foundedPatterns = [
    /grundat\s+(\d{4})/i,
    /startade\s+(\d{4})/i,
    /sedan\s+(\d{4})/i,
    /founded\s+(\d{4})/i,
    /established\s+(\d{4})/i,
  ]

  for (const pattern of foundedPatterns) {
    const match = content.match(pattern)
    if (match) {
      const year = parseInt(match[1])
      const currentYear = new Date().getFullYear()
      if (year > 1900 && year <= currentYear) {
        extracted.foundedYear = year
        extracted.companyAge = currentYear - year
        break
      }
    }
  }

  // Försök identifiera konkurrensfördel/USP
  const uspPatterns = [
    /(?:vi är|unika? med|konkurrensfördelar?|specialist på|expertis inom|känd för)[\s\S]{0,250}/gi,
    /(?:våra styrkor|what makes us|why choose us)[\s\S]{0,250}/gi,
  ]

  const usps: string[] = []
  for (const pattern of uspPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      usps.push(...matches.slice(0, 3))
    }
  }

  if (usps.length > 0) {
    extracted.competitiveAdvantage = usps.join('. ').slice(0, 500)
  }

  // Kunder/partners
  const customerPatterns = [
    /(?:våra kunder|our clients|kunder inkluderar)[\s\S]{0,300}/gi,
    /(?:partners?|samarbeten?|samarbetar med)[\s\S]{0,200}/gi,
  ]

  const customers: string[] = []
  for (const pattern of customerPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      customers.push(...matches.slice(0, 2))
    }
  }

  if (customers.length > 0) {
    extracted.customerInfo = customers.join('. ').slice(0, 400)
  }

  // Produkter/tjänster
  const serviceMentions = (content.match(/tjänster?|produkter?|erbjuder|services|products/gi) || []).length
  if (serviceMentions > 8) {
    extracted.hasServiceInfo = true
  }

  return extracted
}

function mapEmployeeCount(num: number): string {
  if (num === 0) return '0'
  if (num <= 5) return '1-5'
  if (num <= 10) return '6-10'
  if (num <= 25) return '11-25'
  return '25+'
}

function calculateCompanyAge(registrationDate: string): string {
  const regDate = new Date(registrationDate)
  const now = new Date()
  const years = now.getFullYear() - regDate.getFullYear()
  
  if (years <= 2) return '0-2'
  if (years <= 5) return '3-5'
  if (years <= 10) return '6-10'
  if (years <= 20) return '11-20'
  return '20+'
}

/**
 * Mappar SNI-kod (Standard för svensk näringsgrensklassificering) till bransch
 */
function mapSNICodeToIndustry(sniCode: string): string {
  if (!sniCode) return ''
  
  const code = sniCode.replace(/\D/g, '') // Ta bort alla icke-siffror
  const firstTwo = code.slice(0, 2)
  const firstThree = code.slice(0, 3)
  
  // Mappning baserad på SNI-koder
  const industryMap: Record<string, string> = {
    // 56 - Restaurang och barverksamhet
    '56': 'restaurang',
    // 47 - Detaljhandel
    '47': 'handel',
    // 62 - Dataprogrammering, konsultverksamhet
    '62': 'webbtjanster',
    // 63 - Informationsservice
    '63': 'it',
    // 70 - Verksamhet för fastighetsförvaltning
    '70': 'other',
    // 71 - Arkitektur- och ingenjörsverksamhet
    '71': 'konsult',
    // 72 - Forskning och utveckling
    '72': 'it',
    // 73 - Marknadsföring och opinionsundersökningar
    '73': 'konsult',
    // 74 - Företagstjänster
    '74': 'konsult',
    // 25 - Tillverkning av metallprodukter
    '25': 'tillverkning',
    // 26 - Tillverkning av datormaskiner, elektronik och optiska produkter
    '26': 'tillverkning',
    // 27 - Tillverkning av elektrisk utrustning
    '27': 'tillverkning',
    // 28 - Tillverkning av maskiner och utrustning
    '28': 'tillverkning',
    // 41 - Byggnadskonstruktion
    '41': 'bygg',
    // 42 - Anläggningsbyggnad
    '42': 'bygg',
    // 43 - Specialiserad byggverksamhet
    '43': 'bygg',
    // 49 - Landtransport
    '49': 'transport',
    // 50 - Sjötransport
    '50': 'transport',
    // 51 - Lufttransport
    '51': 'transport',
    // 52 - Lagring och stödtjänster till transport
    '52': 'transport',
    // 86 - Vård och omsorg
    '86': 'halsa',
    // 87 - Vård och omsorg med boende
    '87': 'halsa',
    // 88 - Social omsorg utan boende
    '88': 'halsa',
    // 85 - Utbildning
    '85': 'utbildning',
    // 46 - Partihandel
    '46': 'handel',
    // 45 - Handel med motorfordon
    '45': 'handel',
    // 77 - Uthyrning och leasing
    '77': 'other',
    // 78 - Verksamhet via bemanningsföretag
    '78': 'konsult',
    // 79 - Researrangemang och resebyråer
    '79': 'other',
    // 80 - Säkerhets- och bevakningsverksamhet
    '80': 'other',
    // 81 - Fastighetsservice
    '81': 'other',
    // 82 - Företagsadministration och stödtjänster
    '82': 'konsult',
    // 90 - Kreativ verksamhet, nöje och underhållning
    '90': 'other',
    // 91 - Bibliotek, arkiv, museer och annan kulturverksamhet
    '91': 'other',
    // 92 - Spelverksamhet och lotterier
    '92': 'other',
    // 93 - Idrottsverksamhet och nöjes- och tidsfördriv
    '93': 'other',
  }
  
  // Försök matcha på första två siffrorna först
  if (industryMap[firstTwo]) {
    return industryMap[firstTwo]
  }
  
  // Försök matcha på första tre siffrorna
  if (industryMap[firstThree]) {
    return industryMap[firstThree]
  }
  
  // Fallback: baserat på första siffran
  const firstDigit = code[0]
  const broadCategory: Record<string, string> = {
    '1': 'tillverkning', // Jordbruk, skogsbruk och fiske
    '2': 'tillverkning', // Tillverkning
    '3': 'tillverkning', // Tillverkning
    '4': 'bygg', // Byggverksamhet
    '5': 'transport', // Transport och lagring
    '6': 'it', // Informations- och kommunikationsteknik
    '7': 'konsult', // Företagstjänster
    '8': 'halsa', // Utbildning, vård och omsorg
    '9': 'other', // Övriga tjänster
  }
  
  return broadCategory[firstDigit] || 'other'
}

// AI-DRIVEN EXTRACTION
async function extractWithAI(websiteContent: string, companyName: string): Promise<any> {
  try {
    const prompt = `Analysera denna företagshemsida och extrahera strukturerad information.

Företagsnamn: ${companyName}

Hemsideinnehåll (första 8000 tecken):
${websiteContent.slice(0, 8000)}

Extrahera och returnera JSON med följande fält (lämna tomt om inte hittas):
{
  "employees": "intervall som 1-5, 6-10, 11-25, 25+ eller null",
  "services": "lista huvudsakliga tjänster/produkter (max 3 punkter)",
  "competitiveAdvantage": "unika konkurrensfördelar (1-2 meningar)",
  "customerBase": "beskriv målgrupp/kunder (1 mening)",
  "locations": "geografisk närvaro (städer/regioner)",
  "certifications": "certifieringar, awards eller utmärkelser om nämnt",
  "yearsInBusiness": "antal år i verksamhet om nämnt"
}

Returnera ENDAST giltig JSON, ingen annan text.`

        const { text } = await callOpenAIResponses({
          model: 'gpt-5.1-mini',
      messages: [
        {
          role: 'system',
          content: 'Du är en företagsanalytiker. Returnera alltid giltig JSON.'
        },
        { role: 'user', content: prompt }
      ],
      maxOutputTokens: 800,
      metadata: {
        feature: 'enrich-company',
        companyName
      },
      timeoutMs: 30000
    })
    const cleaned = (text || '{}').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const extracted = JSON.parse(cleaned)
    
    console.log('AI extraction successful:', Object.keys(extracted))
    return extracted
  } catch (error) {
    if (error instanceof OpenAIResponseError) {
      console.error('AI extraction OpenAI error:', error.status, error.body)
    } else {
      console.error('AI extraction error:', error)
    }
    throw error // Let caller handle fallback
  }
}

// SCB BRANSCHSTATISTIK
async function fetchSCBIndustryData(industry?: string) {
  // SCB API är komplex och kräver specifika tabellkoder
  // För MVP: använd vettig mock-data baserad på bransch
  
  const industryStats: Record<string, any> = {
    tech: {
      averageRevenue: '8-15 MSEK',
      averageEmployees: '5-12 personer',
      industryGrowth: '+12% årligen (2020-2023)',
      profitMargin: '15-25% EBITDA-marginal är typiskt',
      valutationMultiple: '3-6x omsättning för SaaS, 1-2x för konsult'
    },
    retail: {
      averageRevenue: '3-8 MSEK',
      averageEmployees: '3-8 personer',
      industryGrowth: '+2% årligen (fysisk butik)',
      profitMargin: '5-15% EBITDA-marginal',
      valutationMultiple: '0.3-0.8x omsättning'
    },
    services: {
      averageRevenue: '5-12 MSEK',
      averageEmployees: '4-10 personer',
      industryGrowth: '+5% årligen',
      profitMargin: '10-20% EBITDA-marginal',
      valutationMultiple: '0.5-2x omsättning beroende på kontrakt'
    },
    restaurant: {
      averageRevenue: '4-10 MSEK',
      averageEmployees: '8-15 personer',
      industryGrowth: '+3% årligen (post-COVID)',
      profitMargin: '8-15% EBITDA-marginal',
      valutationMultiple: '0.4-1x omsättning'
    },
    ecommerce: {
      averageRevenue: '6-20 MSEK',
      averageEmployees: '3-8 personer',
      industryGrowth: '+18% årligen',
      profitMargin: '8-18% EBITDA-marginal',
      valutationMultiple: '1-3x omsättning beroende på tillväxt'
    },
    consulting: {
      averageRevenue: '8-18 MSEK',
      averageEmployees: '5-15 personer',
      industryGrowth: '+6% årligen',
      profitMargin: '15-30% EBITDA-marginal',
      valutationMultiple: '0.8-2.5x omsättning'
    }
  }
  
  const defaultStats = {
    averageRevenue: '5-10 MSEK',
    averageEmployees: '5-10 personer',
    industryGrowth: '+5% årligen (genomsnitt)',
    profitMargin: '10-20% EBITDA-marginal',
    valutationMultiple: '0.8-2x omsättning'
  }
  
  return industry && industryStats[industry] 
    ? { ...industryStats[industry], source: 'industry_benchmark' }
    : { ...defaultStats, source: 'generic_benchmark' }
}

// HELPER: Estimate gross margin from EBITDA margin by industry
function estimateGrossMarginFromIndustry(industry: string, ebitdaMargin: number): number | null {
  // Gross margin = EBITDA margin + operating expenses (excluding COGS)
  // Typical add-backs by industry:
  const addBacks: Record<string, number> = {
    ecommerce: 20, // EBITDA 15% → Gross 35%
    saas: 10,      // EBITDA 20% → Gross 30% (but usually much higher ~80%)
    tech: 15,
    retail: 15,
    services: 20,
    consulting: 25,
    restaurant: 50, // EBITDA 10% → Gross 60% (high food costs)
    manufacturing: 20,
    construction: 15,
  }
  
  const addBack = addBacks[industry] || 20
  const estimated = ebitdaMargin + addBack
  
  // Sanity check
  if (estimated < 10 || estimated > 95) return null
  
  return Math.round(estimated)
}

// HELPER: Default payment terms by industry
function getDefaultPaymentTerms(industry: string): string {
  const defaults: Record<string, string> = {
    ecommerce: '0',        // Paid immediately
    retail: '0',           // Cash/card
    restaurant: '0',       // Immediate
    saas: '0',            // Monthly billing
    tech: '30',           // B2B typical
    services: '30',
    consulting: '30',
    manufacturing: '45',   // Longer terms
    construction: '60',    // Net 60 common in construction
    healthcare: '45',
  }
  
  return defaults[industry] || '30'
}

// HELPER: Default regulatory status by industry
function getDefaultRegulatoryStatus(industry: string): string {
  const defaults: Record<string, string> = {
    ecommerce: 'none',
    retail: 'none',
    tech: 'none',
    saas: 'none',
    services: 'none',
    consulting: 'none',
    restaurant: 'standard',      // Livsmedelsverket + serveringstillstånd
    healthcare: 'complex',       // Vårdlicens
    construction: 'standard',    // Arbetsmiljöverket
    manufacturing: 'standard',   // Miljötillstånd ofta
  }
  
  return defaults[industry] || 'none'
}
