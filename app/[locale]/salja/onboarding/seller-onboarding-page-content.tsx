'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Building2, CheckCircle2, ArrowRight, User, FileText } from 'lucide-react'
import { isSeller } from '@/lib/user-roles'

export default function SellerOnboardingPageContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)

  if (!user || !isSeller(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Du måste logga in som säljare först</p>
          <Link href="/login" className="text-blue-900 font-semibold hover:underline">
            Gå till login →
          </Link>
        </div>
      </div>
    )
  }

  const steps = [
    {
      number: 1,
      title: 'Välkommen till Afterfounder!',
      description: 'Du är nu redo att publicera ditt företag på Afterfounder – en marknadsplats för företagsöverlåtelser.',
      icon: Building2,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            I nästa steg guidar vi dig genom processen att skapa en professionell annons för ditt företag.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="font-medium text-blue-900">Vad behöver du?</p>
            <ul className="space-y-1 text-sm text-blue-900">
              <li>✓ Företagets organisationsnummer</li>
              <li>✓ Grundläggande finansiell data</li>
              <li>✓ En kort beskrivning av verksamheten</li>
              <li>✓ Förväntad försäljningspris (vi beräknar detta)</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      number: 2,
      title: 'Hur processen fungerar',
      description: 'Förstå hur vi hjälper dig att sälja ditt företag',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Du skapar en annons</p>
                <p className="text-sm text-gray-600">Fyll i företagsdata och publicera anonymt</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Köpare hittar dig</p>
                <p className="text-sm text-gray-600">Genom matchning och sökning på marknaden</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">NDA & avtalkskick</p>
                <p className="text-sm text-gray-600">Säker kommunikation tills affären är klar</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      number: 3,
      title: 'Anonymitet & Säkerhet',
      description: 'Din data är alltid skyddad',
      icon: User,
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <p className="font-medium text-green-900">Vi skyddar ditt företag:</p>
            <ul className="space-y-1 text-sm text-green-900">
              <li>✓ Företagsnamn är dolt för alla tills NDA är godkänd</li>
              <li>✓ Kontaktdetaljer delas inte utan ditt godkännande</li>
              <li>✓ Du kan pausa eller radera annonsen när som helst</li>
              <li>✓ All kommunikation är krypterad</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            När en köpare är intresserad och godkänner NDA, avslöjas företagsnamn och detaljer gradvis.
          </p>
        </div>
      )
    }
  ]

  const currentStep = steps[step - 1]
  const Icon = currentStep.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Progress Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kom igång som säljare</h1>
            <span className="text-sm font-medium text-gray-600">{step} av {steps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-900 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-12">
        <div className="flex items-start gap-3 sm:gap-4 md:gap-6 mb-8">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-blue-100">
              <Icon className="h-8 w-8 text-blue-900" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{currentStep.title}</h2>
            <p className="text-lg text-gray-600 mt-2">{currentStep.description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          {currentStep.content}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Tillbaka
            </button>
          )}

          {step < steps.length ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 px-6 py-3 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
            >
              Nästa
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/salja/start"
              className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              Skapa första annonsen
              <CheckCircle2 className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Skip Link */}
        {step === 1 && (
          <div className="text-center mt-6">
            <Link href="/salja/start" className="text-sm text-gray-600 hover:text-gray-900">
              Hoppa över introduktionen →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
