'use client'

import { Suspense } from 'react'
import ValuationResultModal from '@/components/ValuationResultModal'
import { useRouter } from 'next/navigation'

// Mockup data för att visa resultatsidan
const mockResult = {
  valuationRange: {
    min: 8500000,
    max: 12500000,
    mostLikely: 10500000
  },
  analysis: {
    summary: 'Baserat på den information som lämnats uppskattar vi företagets värde till mellan 8,5 och 12,5 miljoner kronor. Företaget visar stark tillväxtpotential med en solid kundbas och god lönsamhet.',
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
    ],
    confidenceScore: 0.75
  },
  keyMetrics: {
    revenue: '12.5 MSEK',
    ebitda: '2.1 MSEK',
    profitMargin: '16.8%',
    revenueGrowth: '15.2%',
    customerRetention: '92%',
    marketShare: '8.5%'
  },
  recommendations: {
    nextSteps: [
      'Förbättra kunddiversifiering för att minska koncentrationsrisk',
      'Investera i digitalisering för att öka effektivitet',
      'Utveckla nyckelpersoners kompetens för att säkerställa kontinuitet',
      'Överväg strategiska partnerskap för snabbare tillväxt'
    ]
  }
}

const mockInputData = {
  companyName: 'Tech Solutions AB',
  industry: 'webbtjanster',
  revenue: '12500000',
  employees: '11-25',
  email: 'demo@bolaxo.com'
}

function MockupContent() {
  const router = useRouter()

  return (
    <>
      {/* Mockup banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <p className="text-yellow-800 font-medium">
              🎨 MOCKUP-LÄGE: Detta är en förhandsvisning av resultatsidan med exempeldata
            </p>
            <button
              onClick={() => router.push('/sv/vardering')}
              className="text-yellow-800 hover:text-yellow-900 underline text-sm"
            >
              Tillbaka till värdering
            </button>
          </div>
        </div>
      </div>

      <ValuationResultModal
        result={mockResult}
        inputData={mockInputData}
        onClose={() => {
          router.push('/sv/vardering')
        }}
      />
    </>
  )
}

export default function ValuationResultMockupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-navy"></div>
      </div>
    }>
      <MockupContent />
    </Suspense>
  )
}
