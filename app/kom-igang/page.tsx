'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowRight, 
  Building2, 
  Search, 
  Users, 
  CheckCircle, 
  Shield,
  TrendingUp,
  Clock,
  DollarSign,
  FileText,
  Target,
  Zap
} from 'lucide-react'

type UserType = 'seller' | 'buyer' | 'broker' | null

export default function KomIgangPage() {
  const [selectedType, setSelectedType] = useState<UserType>(null)
  const [step, setStep] = useState(1)

  const userTypes = [
    {
      id: 'seller' as UserType,
      title: 'Jag vill sälja mitt företag',
      icon: Building2,
      description: 'Skapa en annons och hitta seriösa köpare',
      color: 'from-primary-navy to-primary-navy/90',
      features: [
        'Skapa professionell annons på 15 minuter',
        '95% billigare än traditionell mäklare',
        'Full kontroll över processen',
        'Anonym tills du godkänner köpare',
        'Dashboard med statistik och visningar'
      ],
      steps: [
        'Skapa annons med vår guide',
        'Köpare hittar dig via matchning',
        'NDA & verifiering',
        'Datarum & frågor',
        'Avslut & överlämning'
      ],
      cta: {
        text: 'Börja sälja',
        href: '/salja/start'
      },
      stats: {
        main: '127',
        label: 'aktiva säljare just nu',
        secondary: '74 dagar',
        secondaryLabel: 'genomsnitt till avslut'
      }
    },
    {
      id: 'buyer' as UserType,
      title: 'Jag vill köpa ett företag',
      icon: Search,
      description: 'Hitta och förvärva rätt företag',
      color: 'from-accent-pink to-accent-pink/90',
      features: [
        'Sök bland verifierade företag',
        'Smart matchning baserat på dina kriterier',
        'Säker NDA-process med BankID',
        'Datarum med alla dokument',
        'Jämför objekt sida-vid-sida'
      ],
      steps: [
        'Skapa köparprofil',
        'Sätt bevakningar',
        'Sök och filtrera objekt',
        'Signera NDA för full access',
        'Granska & förvärva'
      ],
      cta: {
        text: 'Skapa köparprofil',
        href: '/kopare/start'
      },
      stats: {
        main: '2,847',
        label: 'registrerade köpare',
        secondary: '580M SEK',
        secondaryLabel: 'i genomförda affärer'
      }
    },
    {
      id: 'broker' as UserType,
      title: 'Jag är mäklare/rådgivare',
      icon: Users,
      description: 'Hantera flera klienters försäljningar',
      color: 'from-purple-600 to-purple-700',
      features: [
        'Hantera flera klienters annonser',
        'White-label lösning',
        'API-integration',
        'Dedikerad support',
        'Revenue sharing-modell'
      ],
      steps: [
        'Registrera dig som mäklare',
        'Verifiera din licens',
        'Hantera klienters annonser',
        'Följ upp affärer',
        'Automatiserad dokumenthantering'
      ],
      cta: {
        text: 'Kontakta oss',
        href: '/kontakt?type=broker'
      },
      stats: {
        main: '15+',
        label: 'partnerande mäklare',
        secondary: '250K SEK',
        secondaryLabel: 'årsprenumeration'
      }
    }
  ]

  const selectedUserType = userTypes.find(t => t.id === selectedType)

  return (
    <main className="bg-neutral-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-navy/10 to-accent-pink/10 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary-navy mb-4">
            Välkommen till BOLAXO
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Sveriges moderna marknadsplats för företagsöverlåtelser. Vi guidar dig genom hela processen.
          </p>
        </div>
      </section>

      {/* Step 1: Choose User Type */}
      {step === 1 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-navy mb-4">
              Vad vill du göra?
            </h2>
            <p className="text-lg text-gray-600">
              Välj det alternativ som passar dig bäst
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id)
                    setStep(2)
                  }}
                  className={`relative group p-8 rounded-2xl border-2 transition-all duration-300 text-left ${
                    selectedType === type.id
                      ? 'border-primary-navy shadow-2xl scale-105'
                      : 'border-gray-200 hover:border-primary-navy/50 hover:shadow-lg'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-6 text-white`}>
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-primary-navy mb-3">
                    {type.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {type.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <div className="font-bold text-primary-navy">{type.stats.main}</div>
                      <div className="text-gray-600">{type.stats.label}</div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-6 h-6 text-primary-navy" />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Help Text */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Inte säker på vilket alternativ som passar dig?
            </p>
            <Link href="/kontakt" className="text-primary-navy font-semibold hover:underline inline-flex items-center gap-2">
              Kontakta oss för hjälp
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Step 2: Show Details */}
      {step === 2 && selectedUserType && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Back Button */}
          <button
            onClick={() => {
              setStep(1)
              setSelectedType(null)
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-navy mb-8 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Tillbaka
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div className={`bg-gradient-to-br ${selectedUserType.color} rounded-2xl p-8 text-white`}>
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    {selectedUserType.icon && (
                      <selectedUserType.icon className="w-8 h-8" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-3">{selectedUserType.title}</h2>
                    <p className="text-white/90 text-lg">{selectedUserType.description}</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-primary-navy mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6" />
                  Vad ingår?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedUserType.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Process Steps */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-primary-navy mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  Så funkar det
                </h3>
                <div className="space-y-4">
                  {selectedUserType.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedUserType.color} text-white flex items-center justify-center font-bold flex-shrink-0`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 pt-2">
                        <p className="text-gray-900 font-medium">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-primary-navy mb-6">I siffror</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-4xl font-bold text-primary-navy mb-2">
                      {selectedUserType.stats.main}
                    </div>
                    <div className="text-gray-600">{selectedUserType.stats.label}</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-primary-navy mb-2">
                      {selectedUserType.stats.secondary}
                    </div>
                    <div className="text-gray-600">{selectedUserType.stats.secondaryLabel}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* CTA Card */}
              <div className={`bg-gradient-to-br ${selectedUserType.color} rounded-xl p-8 text-white sticky top-8`}>
                <h3 className="text-2xl font-bold mb-4">Redo att komma igång?</h3>
                <p className="text-white/90 mb-6">
                  Börja din resa på BOLAXO idag. Det tar bara några minuter att komma igång.
                </p>
                <Link
                  href={selectedUserType.cta.href}
                  className="block w-full text-center px-6 py-4 bg-white text-primary-navy font-bold rounded-lg hover:bg-gray-100 transition-colors mb-4"
                >
                  {selectedUserType.cta.text}
                </Link>
                <p className="text-xs text-white/80 text-center">
                  Gratis att börja • Inga bindningstider
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Varför välja BOLAXO?</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">BankID-verifiering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-700">Snabb process (74 dagar)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">95% billigare än mäklare</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-700">Komplett dokumenthantering</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Lär dig mer</h4>
                <div className="space-y-2 text-sm">
                  <Link href="/salja" className="block text-primary-navy hover:underline">
                    → Så funkar det för säljare
                  </Link>
                  <Link href="/kopare/sa-fungerar-det" className="block text-primary-navy hover:underline">
                    → Så funkar det för köpare
                  </Link>
                  <Link href="/faq" className="block text-primary-navy hover:underline">
                    → Vanliga frågor
                  </Link>
                  <Link href="/success-stories" className="block text-primary-navy hover:underline">
                    → Success stories
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

