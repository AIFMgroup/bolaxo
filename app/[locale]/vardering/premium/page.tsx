'use client'

import { useState, useEffect, useMemo, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PremiumValuationWizard from '@/components/PremiumValuationWizard'
import { CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { mapWebInsightsToPremium } from '@/lib/premiumPrefill'

function PremiumValuationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [purchaseData, setPurchaseData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [webPrefill, setWebPrefill] = useState<Record<string, string>>({})
  const [prefillStatus, setPrefillStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle')
  const hasFetchedPrefill = useRef(false)

  const sendPrefillMetric = async (source: string, fields: Record<string, string>) => {
    const filled = Object.keys(fields || {}).length
    if (!filled) return
    try {
      await fetch('/api/metrics/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          fieldsFilled: filled,
          metadata: { keys: Object.keys(fields || {}) },
        }),
      })
    } catch (error) {
      console.warn('prefill metric failed', error)
    }
  }

  useEffect(() => {
    // Kolla om det är demo-läge via query parameter
    const demoMode = searchParams?.get('demo') === 'true' || searchParams?.get('preview') === 'true'
    
    if (demoMode) {
      setIsDemo(true)
      setPurchaseData({
        email: 'demo@afterfounder.com',
        paymentId: 'demo-preview-' + Date.now(),
        inputData: {}
      })
      setLoading(false)
      return
    }

    // Hämta betalningsdata från localStorage
    const purchaseStr = localStorage.getItem('premiumPurchase')
    if (!purchaseStr) {
      // Om ingen betalning gjorts, redirect tillbaka
      router.push('/sv/vardering')
      return
    }

    const purchase = JSON.parse(purchaseStr)
    setPurchaseData(purchase)
    setLoading(false)
  }, [router, searchParams])

  useEffect(() => {
    if (!purchaseData || isDemo || hasFetchedPrefill.current) return

    const originalInput = purchaseData.originalInput || {}
    const baseInput = purchaseData.inputData || {}

    const companyName = originalInput.companyName || baseInput.companyName
    const orgNumber = originalInput.orgNumber || baseInput.registrationNumber
    const website = originalInput.website || baseInput.website
    const industry = originalInput.industry || baseInput.industry

    if (!companyName && !orgNumber && !website) return

    let cancelled = false
    hasFetchedPrefill.current = true
    setPrefillStatus('loading')

    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/web-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName,
            orgNumber,
            website,
            industry,
            purpose: 'analysis'
          })
        })

        if (!response.ok) {
          throw new Error('Kunde inte hämta web search-data')
        }

        const data = await response.json()
        if (!cancelled && data?.insights) {
          const mapped = mapWebInsightsToPremium(data.insights)
          setWebPrefill(mapped)
          sendPrefillMetric('web_search', mapped)
          setPrefillStatus('done')
        }
      } catch (error) {
        console.error('Web search prefill error:', error)
        if (!cancelled) {
          setPrefillStatus('error')
        }
      }
    }

    fetchInsights()

    return () => {
      cancelled = true
    }
  }, [purchaseData, isDemo])

  const initialData = useMemo(() => {
    return {
      ...webPrefill,
      ...(purchaseData?.inputData || {})
    }
  }, [webPrefill, purchaseData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-navy"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Demo-banner eller betalningsbekräftelse */}
      {isDemo ? (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">
                🎓 DEMO-LÄGE: Du testar den avancerade analysen utan betalning
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border-b border-green-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">
                Betalning genomförd! Kvitto har skickats till {purchaseData?.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Huvudinnehåll */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-navy mb-4">
              Professionell Företagsvärdering
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fyll i detaljerad information för att få en marknadsmässig värdering baserad på 42 områden för due diligence
            </p>
            {isDemo && (
              <p className="text-sm text-gray-500 mt-2">
                Detta är en demo-version. Data sparas lokalt men genererar ingen faktisk analys.
              </p>
            )}
            {!isDemo && (
              <div className="flex items-center justify-center gap-2 mt-3 text-sm">
                <Sparkles className="h-4 w-4 text-blue-600" />
                {prefillStatus === 'loading' && (
                  <span className="text-blue-700">Hämtar företagsinformation från webben…</span>
                )}
                {prefillStatus === 'done' && (
                  <span className="text-green-700">Fält är förifyllda baserat på tidigare uppgifter och web search.</span>
                )}
                {prefillStatus === 'error' && (
                  <span className="text-red-600">Kunde inte hämta extra data från webben just nu.</span>
                )}
              </div>
            )}
          </div>

          <PremiumValuationWizard 
            initialData={initialData}
            purchaseId={purchaseData?.paymentId}
            isDemo={isDemo}
          />
        </div>
      </div>
    </div>
  )
}

export default function PremiumValuationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-navy"></div>
      </div>
    }>
      <PremiumValuationContent />
    </Suspense>
  )
}
