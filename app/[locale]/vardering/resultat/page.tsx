'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { TrendingUp, Download, Mail, CheckCircle, AlertCircle, Lightbulb, BarChart3, FileText, ArrowRight, Award, Sparkles } from 'lucide-react'
import Link from 'next/link'
import WhatIfScenarios from '@/components/WhatIfScenarios'
import ImprovedValuationResults from '@/components/ImprovedValuationResults'
import PurchasePremiumValuationModal from '@/components/PurchasePremiumValuationModal'
import MockStripeCheckout from '@/components/MockStripeCheckout'
import type { PaymentData } from '@/components/MockStripeCheckout'
import dynamic from 'next/dynamic'
import { mapFreeValuationToPremium } from '@/lib/premiumPrefill'

// Dynamisk import av PDF-komponenten för att undvika SSR-problem
const ValuationPDF = dynamic(() => import('@/components/ValuationPDF'), { ssr: false })

interface ValuationResult {
  valuationRange: {
    min: number
    max: number
    mostLikely: number
  }
  method: string
  methodology: {
    multipel?: string
    avkastningskrav?: string
    substans?: string
  }
  analysis: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    risks: string[]
  }
  recommendations: Array<{
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
  }>
  marketComparison?: string
  keyMetrics: {
    label: string
    value: string
  }[]
}

// Mockup data för demo
const mockResult: ValuationResult = {
  valuationRange: {
    min: 8500000,
    max: 12500000,
    mostLikely: 10500000
  },
  method: 'DCF & Multiples',
  methodology: {
    multipel: 'EBITDA-multipel baserad på branschgenomsnitt',
    avkastningskrav: '12-15% baserat på riskprofil',
    substans: 'Tillgångsvärde med justeringar'
  },
  analysis: {
    strengths: [
      'Stark marknadsposition med växande kundbas',
      'Återkommande intäkter från långsiktiga kundavtal',
      'Kompetent team med djup branschkunskap',
      'Diversifierad produktportfölj som minskar risk'
    ],
    weaknesses: [
      'Beroende av några stora kunder',
      'Begränsad geografisk spridning',
      'Behov av teknisk modernisering'
    ],
    opportunities: [
      'Expansion till nya marknader',
      'Digital transformation kan öka effektiviteten',
      'Nya produktlinjer inom befintlig kompetens'
    ],
    risks: [
      'Konkurrens från större aktörer',
      'Regulatoriska förändringar i branschen',
      'Nyckelpersoners avgång'
    ]
  },
  recommendations: [
    {
      title: 'Förbättra kunddiversifiering',
      description: 'Minska beroendet av stora kunder genom att aktivt söka nya kunder',
      impact: 'high'
    },
    {
      title: 'Investera i digitalisering',
      description: 'Modernisera IT-infrastruktur för att öka effektivitet',
      impact: 'medium'
    },
    {
      title: 'Utveckla nyckelpersoner',
      description: 'Säkerställa kunskapsöverföring och succession planning',
      impact: 'high'
    }
  ],
  keyMetrics: [
    { label: 'Omsättning', value: '12.5 MSEK' },
    { label: 'EBITDA', value: '2.1 MSEK' },
    { label: 'Rörelsemarginal', value: '16.8%' },
    { label: 'Tillväxt', value: '15.2%' },
    { label: 'Kundretention', value: '92%' },
    { label: 'Marknadsandel', value: '8.5%' }
  ]
}

const mockValuationData = {
  companyName: 'Tech Solutions AB',
  industry: 'webbtjanster',
  revenue: '12500000',
  employees: '11-25',
  email: 'demo@bolaxo.com'
}

function ValuationResultContent() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('valuationResult')
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<ValuationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [valuationData, setValuationData] = useState<any>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [useImprovedResults, setUseImprovedResults] = useState(false) // Use detailed results page by default
  const [isMockup, setIsMockup] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [webInsights, setWebInsights] = useState<any>(null)
  const [webInsightsStatus, setWebInsightsStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')

  useEffect(() => {
    // Kolla om det är mockup-läge
    const mockupMode = searchParams?.get('mockup') === 'true' || searchParams?.get('demo') === 'true'
    
    if (mockupMode) {
      setIsMockup(true)
      setResult(mockResult)
      setValuationData(mockValuationData)
      setLoading(false)
      return
    }

    const fetchValuation = async () => {
      try {
        // Hämta data från localStorage
        const storedData = localStorage.getItem('valuationData')
        if (!storedData) {
          router.push(`/${locale}/vardering`)
          return
        }

        const valuationData = JSON.parse(storedData)
        setValuationData(valuationData) // Spara för WhatIfScenarios
        
        // Hämta även berikad data om den finns
        const enrichedData = localStorage.getItem('enrichedCompanyData')

        // Anropa API för att få AI-värdering
        const response = await fetch('/api/valuation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...valuationData,
            enrichedCompanyData: enrichedData
          }),
        })

        if (!response.ok) {
          throw new Error('Kunde inte generera värdering')
        }

        const data = await response.json()
        
        // Vänta tills result faktiskt finns innan vi döljer loading
        if (data.result) {
          setResult(data.result)
          setLoading(false)
        } else {
          throw new Error('Inget resultat mottaget från API')
        }
      } catch (err) {
        setError('Ett fel uppstod vid genereringen av värderingen')
        console.error(err)
        setLoading(false)
      }
    }

    fetchValuation()
  }, [router, locale, searchParams])

  useEffect(() => {
    const companyName = valuationData?.companyName?.trim()
    if (!companyName || companyName.length < 2) {
      return
    }

    let cancelled = false

    const fetchInsights = async () => {
      setWebInsightsStatus('loading')
      try {
        const response = await fetch('/api/web-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            companyName,
            orgNumber: valuationData?.orgNumber,
            industry: valuationData?.industry,
            purpose: 'valuation-result'
          })
        })

        if (!response.ok) {
          throw new Error('Failed to fetch web insights')
        }

        const data = await response.json()
        if (!cancelled) {
          setWebInsights(data.insights || null)
          setWebInsightsStatus('loaded')
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Web insights error:', error)
          setWebInsightsStatus('error')
        }
      }
    }

    fetchInsights()

    return () => {
      cancelled = true
    }
  }, [valuationData?.companyName, valuationData?.orgNumber, valuationData?.industry])

  // Use improved results component if enabled
  if (useImprovedResults && result) {
    return (
      <>
        {isMockup && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-4">
            <div className="container mx-auto">
              <p className="text-yellow-800 font-medium text-center">
                🎨 MOCKUP-LÄGE: Detta är en förhandsvisning med exempeldata
              </p>
            </div>
          </div>
        )}
        <ImprovedValuationResults 
          result={result}
          valuationData={valuationData}
          loading={loading}
          error={error}
        />
      </>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-off-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="heading-3 mb-2">Analyserar ditt företag...</h2>
          <p className="text-primary-navy">Vår AI gör en djupgående värdering</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background-off-white flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-card max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="heading-3 mb-2">{t('error')}</h2>
          <p className="text-primary-navy mb-6">{error}</p>
          <Link href={`/${locale}/vardering`} className="btn-primary">
            {t('tryAgain')}
          </Link>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('sv-SE')} kr`
  }

  const handlePurchase = () => {
    setShowPurchaseModal(false)
    setShowCheckout(true)
  }

  const sendPrefillMetric = async (source: string, fields: Record<string, any>) => {
    const filled = Object.keys(fields || {}).length
    if (!filled) return
    try {
      await fetch('/api/metrics/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          fieldsFilled: filled,
          totalFields: Object.keys(valuationData || {}).length,
          metadata: { keys: Object.keys(fields || {}) },
        }),
      })
    } catch (err) {
      console.warn('Prefill metric failed', err)
    }
  }

  const handlePaymentSuccess = async (paymentData: PaymentData) => {
    const prefilledData = mapFreeValuationToPremium(valuationData)

    // Spara betalningsinformation och navigera till djupgående analys
    localStorage.setItem('premiumPurchase', JSON.stringify({
      ...paymentData,
      inputData: prefilledData,
      originalInput: valuationData,
      purchaseDate: new Date().toISOString()
    }))

    sendPrefillMetric('free_valuation', prefilledData)

    // Navigera till djupgående analysformulär
    router.push(`/${locale}/vardering/premium`)
  }

  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return
    
    try {
      setIsGeneratingPDF(true)
      
      if (!result) {
        alert(t('noValuationYet'))
        return
      }

      // Hämta berikad data om den finns
      const enrichedDataStr = localStorage.getItem('enrichedCompanyData')
      const enrichedData = enrichedDataStr ? JSON.parse(enrichedDataStr) : null
      
      // Kolla om vi har exakta finansiella siffror
      const hasExactFinancials = !!(valuationData?.exactRevenue && (valuationData?.salaries || valuationData?.operatingCosts))
      
      // Importera dynamiskt för att undvika SSR-problem
      const ReactPDF = await import('@react-pdf/renderer')
      
      if (!ReactPDF) {
        throw new Error('PDF library not loaded correctly')
      }
      
      // Använd JSX direkt för korrekt typning
      const pdfDocument = (
        <ValuationPDF 
          companyName={valuationData?.companyName || 'Ditt företag'}
          result={result}
          generatedAt={new Date().toLocaleDateString('sv-SE', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
          companyInfo={enrichedData ? {
            orgNumber: valuationData?.orgNumber,
            website: enrichedData.website,
            email: enrichedData.email,
            phone: enrichedData.phone,
            address: enrichedData.address,
            industry: enrichedData.industry,
            employees: enrichedData.employees
          } : valuationData ? {
            orgNumber: valuationData?.orgNumber,
            industry: valuationData?.industry,
            employees: valuationData?.employees
          } : undefined}
          hasExactFinancials={hasExactFinancials}
        />
      )
      
      // Använd renderToBuffer för att få en buffer, sedan konvertera till blob
      const pdfBuffer = await ReactPDF.renderToBuffer(pdfDocument)
      // Konvertera Buffer till Uint8Array för Blob-konstruktorn
      const uint8Array = new Uint8Array(pdfBuffer)
      const blob = new Blob([uint8Array], { type: 'application/pdf' })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Foretagsvardering_${(valuationData?.companyName || 'foretag').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF generation error:', error)
        alert(t('pdfError'))
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handlePremiumPurchase = () => {
    // Spara valuationData i localStorage så att det kan förifyllas i premium-versionen
    if (valuationData) {
      localStorage.setItem('valuationData', JSON.stringify(valuationData))
    }
    // Navigera till premium-sidan (som sedan visar betalningsflödet)
    router.push(`/${locale}/vardering/premium`)
  }

  return (
    <main className="min-h-screen bg-background-off-white py-12">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 sm:px-3 sm:px-4 py-2 min-h-10 sm:min-h-auto bg-green-100 text-green-800 rounded-full text-sm mb-4">
            <CheckCircle className="w-4 h-4 mr-2" />
            Värdering klar!
          </div>
          <h1 className="heading-1 mb-4">Din Företagsvärdering</h1>
          <p className="text-lg text-primary-navy">
            Baserad på AI-analys med professionella värderingsmetoder
          </p>
        </div>

        {/* Premium CTA Banner */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 sm:p-8 border-2 border-orange-200 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Vill du ha en djupgående företagsvärdering?
                </h3>
                <p className="text-gray-700 mb-2">
                  Få en professionell värdering med 42 områden för due diligence
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Komplett DD-checklista för SME i Sverige
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Professionell PDF-rapport
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Mycket mer precist företagsvärde
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Användbar i förhandlingar med köpare
                  </li>
                </ul>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-orange-600">4 995 kr</span>
                  <span className="text-sm text-gray-500">Engångsbetalning</span>
                </div>
              </div>
            </div>
            <button
              onClick={handlePremiumPurchase}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-3 whitespace-nowrap"
            >
              <Sparkles className="w-6 h-6" />
              Köp djupgående värdering
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        

        {/* Main Valuation */}
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-card mb-8 border-2" style={{ borderColor: '#1F3C58' }}>
          <div className="text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-6" style={{ color: '#1F3C58' }} />
            <h2 className="text-xl sm:text-2xl font-semibold mb-2" style={{ color: '#1F3C58' }}>Uppskattat företagsvärde</h2>
            <div className="text-5xl md:text-6xl font-bold mb-4" style={{ color: '#1F3C58' }}>
              {formatCurrency(result.valuationRange.mostLikely)}
            </div>
            <div className="text-lg mb-4" style={{ color: '#1F3C58' }}>
              Intervall: {formatCurrency(result.valuationRange.min)} - {formatCurrency(result.valuationRange.max)}
            </div>
            <div className="mt-6 p-4 rounded-xl inline-block" style={{ backgroundColor: '#F5F0E8' }}>
              <p className="text-sm mb-1" style={{ color: '#666666' }}>Metod använd</p>
              <p className="font-semibold" style={{ color: '#1F3C58' }}>{result.method}</p>
            </div>
            
            {/* PDF Download Button */}
            <div className="mt-8">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="bg-[#1F3C58] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#1a3147] transition-all shadow-md inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1F3C58', color: '#FFFFFF' }}
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Genererar PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Ladda hem PDF
                  </>
                )}
              </button>
            </div>
            
            {/* CTA to Create Listing */}
            <div className="mt-6">
              <Link href={`/${locale}/salja/start`} className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-button font-semibold bg-accent-pink text-white hover:bg-opacity-90 transition-all shadow-md">
                {t('createListingNow')}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-8">
          {result.keyMetrics.map((metric, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-card">
              <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
              <div className="text-xl sm:text-2xl font-bold text-primary-navy">{metric.value}</div>
            </div>
          ))}
        </div>

        {/* Methodology Explanation */}
        <div className="bg-white p-8 rounded-2xl shadow-card mb-8">
          <div className="flex items-start mb-6">
            <FileText className="w-6 h-6 text-primary-blue mr-3 flex-shrink-0 mt-1" />
            <div>
              <h2 className="heading-3 mb-2 text-primary-navy">Beräkningsunderlag</h2>
              <p className="text-gray-600">Så har vi kommit fram till värderingen</p>
            </div>
          </div>

          <div className="space-y-4">
            {result.methodology.multipel && (
              <div className="bg-light-blue p-4 rounded-xl">
                <h3 className="font-semibold text-primary-navy mb-2">Multipelvärdering</h3>
                <p className="text-sm text-primary-navy">{result.methodology.multipel}</p>
              </div>
            )}
            {result.methodology.avkastningskrav && (
              <div className="bg-light-blue p-4 rounded-xl">
                <h3 className="font-semibold text-primary-navy mb-2">Avkastningsvärdering</h3>
                <p className="text-sm text-primary-navy">{result.methodology.avkastningskrav}</p>
              </div>
            )}
            {result.methodology.substans && (
              <div className="bg-light-blue p-4 rounded-xl">
                <h3 className="font-semibold text-primary-navy mb-2">Substansvärde</h3>
                <p className="text-sm text-primary-navy">{result.methodology.substans}</p>
              </div>
            )}
          </div>

          {result.marketComparison && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-primary-navy mb-2">Jämförelse med marknaden</h3>
              <p className="text-sm text-primary-navy">{result.marketComparison}</p>
            </div>
          )}
        </div>

        {webInsightsStatus !== 'idle' && (
          <div className="bg-white p-8 rounded-2xl shadow-card mb-8 border border-blue-100">
            <div className="flex items-start mb-6">
              <Lightbulb className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h2 className="heading-3 mb-2 text-primary-navy">Extern marknadsinsikt</h2>
                <p className="text-gray-600">Automatisk webbsökning (OpenAI web_search)</p>
              </div>
            </div>

            {webInsightsStatus === 'loading' && (
              <div className="flex items-center text-gray-600">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3" />
                Hämtar senaste nyheter och signaler...
              </div>
            )}

            {webInsightsStatus === 'error' && (
              <p className="text-red-600 text-sm">
                Kunde inte hämta webbinsikter just nu. Försök gärna igen senare.
              </p>
            )}

            {webInsightsStatus === 'loaded' && webInsights && (
              <div className="space-y-6">
                {webInsights.summary && (
                  <p className="text-primary-navy">{webInsights.summary}</p>
                )}

                {webInsights.marketSignals && webInsights.marketSignals.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-primary-navy mb-2">Marknadssignaler</h3>
                    <ul className="list-disc list-inside text-sm text-primary-navy space-y-1">
                      {webInsights.marketSignals.map((signal: string, index: number) => (
                        <li key={index}>{signal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {webInsights.newsHighlights && webInsights.newsHighlights.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-primary-navy mb-2">Nyheter</h3>
                    <div className="space-y-3">
                      {webInsights.newsHighlights.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border border-gray-100"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                            <span className="font-medium text-primary-navy">{item.headline}</span>
                            {item.tone && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  item.tone === 'positive'
                                    ? 'bg-green-100 text-green-800'
                                    : item.tone === 'negative'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {item.tone === 'positive'
                                  ? 'Positiv'
                                  : item.tone === 'negative'
                                  ? 'Negativ'
                                  : 'Neutral'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mb-1">
                            {item.source}
                          </div>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 text-sm hover:underline"
                            >
                              Läs mer
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {webInsights.competitorSnapshot && webInsights.competitorSnapshot.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-primary-navy mb-2">Konkurrenter</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {webInsights.competitorSnapshot.map((comp: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <p className="font-semibold text-primary-navy">{comp.name}</p>
                          <p className="text-gray-700">{comp.insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {webInsights.actionCue && (
                  <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-900">
                    {webInsights.actionCue}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SWOT Analysis */}
        <div className="bg-white p-8 rounded-2xl shadow-card mb-8">
          <div className="flex items-start mb-6">
            <BarChart3 className="w-6 h-6 text-primary-blue mr-3 flex-shrink-0 mt-1" />
            <div>
              <h2 className="heading-3 mb-2 text-primary-navy">Analys av företaget</h2>
              <p className="text-gray-600">Styrkor, svagheter, möjligheter och risker</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Strengths */}
            <div>
              <h3 className="font-semibold text-green-700 mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Styrkor
              </h3>
              <ul className="space-y-2">
                {result.analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <span className="text-green-500 mr-2">•</span>
                    <span className="text-primary-navy">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div>
              <h3 className="font-semibold text-orange-700 mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Svagheter
              </h3>
              <ul className="space-y-2">
                {result.analysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <span className="text-orange-500 mr-2">•</span>
                    <span className="text-primary-navy">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div>
              <h3 className="font-semibold text-blue-700 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Möjligheter
              </h3>
              <ul className="space-y-2">
                {result.analysis.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <span className="text-blue-500 mr-2">•</span>
                    <span className="text-primary-navy">{opportunity}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks */}
            <div>
              <h3 className="font-semibold text-red-700 mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Risker
              </h3>
              <ul className="space-y-2">
                {result.analysis.risks.map((risk, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <span className="text-red-500 mr-2">•</span>
                    <span className="text-primary-navy">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white p-8 rounded-2xl shadow-card mb-8">
          <div className="flex items-start mb-6">
            <Lightbulb className="w-6 h-6 text-primary-blue mr-3 flex-shrink-0 mt-1" />
            <div>
              <h2 className="heading-3 mb-2">Så ökar du företagsvärdet</h2>
              <p className="text-primary-navy">Konkreta rekommendationer baserat på analysen</p>
            </div>
          </div>

          <div className="space-y-4">
            {result.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-l-4 ${
                  rec.impact === 'high'
                    ? 'bg-green-50 border-green-500'
                    : rec.impact === 'medium'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-primary-navy">{rec.title}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      rec.impact === 'high'
                        ? 'bg-green-200 text-green-800'
                        : rec.impact === 'medium'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}
                  >
                    {rec.impact === 'high' ? 'Hög påverkan' : rec.impact === 'medium' ? 'Medel påverkan' : 'Låg påverkan'}
                  </span>
                </div>
                <p className="text-sm text-primary-navy">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What-If Scenarios */}
        <WhatIfScenarios 
          baseValuation={result.valuationRange.mostLikely}
          currentData={{
            revenue: valuationData?.revenue,
            profitMargin: valuationData?.profitMargin,
            industry: valuationData?.industry
          }}
        />

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-8 mt-8">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="bg-[#1F3C58] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1a3147] transition-all shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1F3C58', color: '#FFFFFF' }}
          >
            {isGeneratingPDF ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Genererar...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Ladda hem PDF
              </>
            )}
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-white border-2 border-[#1F3C58] text-[#1F3C58] px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-md flex items-center justify-center"
            style={{ borderColor: '#1F3C58', color: '#1F3C58' }}
          >
            <Mail className="w-4 h-4 mr-2" />
            Skicka till min e-post
          </button>
        </div>

        {/* Next Steps */}
        <div className="bg-primary-blue text-white p-8 rounded-2xl">
          <h2 className="heading-3 text-white mb-4">Nästa steg</h2>
          <p className="mb-6 opacity-90">
            Vill du sälja ditt företag? Vi hjälper dig att hitta rätt köpare och få bästa möjliga pris.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={`/${locale}/salja/start`} className="btn-primary bg-accent-pink text-white hover:bg-opacity-90 inline-flex items-center justify-center order-first">
              {t('createListingAndStart')}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </Link>
            <Link href={`/${locale}/kontakt`} className="btn-secondary bg-white/20 text-white hover:bg-white/30 inline-flex items-center justify-center">
              {t('talkToAdvisor')}
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center text-sm text-primary-navy">
          <p>
            Denna värdering är en indikation baserad på AI-analys och bör inte ses som en formell värdering.
            För en fullständig Due Diligence och professionell värdering, kontakta en auktoriserad värderare.
          </p>
        </div>
      </div>

      {/* Modals */}
      {showPurchaseModal && (
        <PurchasePremiumValuationModal
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={handlePurchase}
          companyName={valuationData?.companyName}
        />
      )}

      {showCheckout && (
        <MockStripeCheckout
          amount={9995}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowCheckout(false)}
        />
      )}
    </main>
  )
}

export default function ValuationResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background-off-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-navy"></div>
      </div>
    }>
      <ValuationResultContent />
    </Suspense>
  )
}
