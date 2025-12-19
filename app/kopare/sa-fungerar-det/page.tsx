'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Lock, User, Search, Shield, ChartBar, Building2, Key, Eye, FileText, MessagesSquare, BarChart3, Target } from 'lucide-react'

export default function BuyerInfoPage() {
  const [activeStep, setActiveStep] = useState(1)

  const steps = [
    {
      step: 1,
      title: 'Profil & bevakningar',
      shortTitle: 'Profil & bevakningar',
      description: 'Logga in med BankID och fyll i din profil. Sätt bevakningar och få mail/push när nya matchningar dyker upp.',
      icon: <User className="w-6 h-6" />,
      detailedTitle: 'Skapa en trovärdig köparprofil',
      detailedDescription: 'Logga in med BankID och fyll i din profil med branscher, storlek och finansiering. Lägg gärna till LinkedIn, kort investeringspitch och vad du söker. Mer profilinfo ger högre trovärdighet och fler säljare släpper in dig.',
    },
    {
      step: 2,
      title: 'Sök & intresseanmäl',
      shortTitle: 'Sök & intresseanmäl',
      description: 'Filtrera på bransch, region, omsättning, pris. Skicka intresseanmälan på relevanta objekt.',
      icon: <Search className="w-6 h-6" />,
      detailedTitle: 'Hitta rätt objekt',
      detailedDescription: 'Filtrera på bransch, region, omsättning, pris, antal anställda, verifiering och anledning till försäljning. Skicka intresseanmälan på relevanta objekt och få svar direkt i plattformen.',
    },
    {
      step: 3,
      title: 'NDA',
      shortTitle: 'NDA',
      description: 'Begär access och signera NDA med BankID. Säljaren är anonym tills NDA är godkänd.',
      icon: <Shield className="w-6 h-6" />,
      detailedTitle: 'Signera NDA och få full access',
      detailedDescription: 'Begär access och signera NDA med BankID. Säljaren är anonym tills NDA är godkänd. Efter godkännande ser du utökad info och kan ställa frågor direkt till säljaren.',
    },
    {
      step: 4,
      title: 'Q&A, shortlist & datarum',
      shortTitle: 'Datarum & DD',
      description: 'Ställ frågor i säker chat. Jämför nyckeltal sida-vid-sida. Få access till datarum.',
      icon: <ChartBar className="w-6 h-6" />,
      detailedTitle: 'Granska och analysera',
      detailedDescription: 'Ställ frågor i säker chat. Lägg objekt i shortlist och jämför nyckeltal sida-vid-sida. Få behörighetsstyrd access till datarum med versionshistorik, vattenmärkning och aktivitetslogg.',
    },
    {
      step: 5,
      title: 'LOI & tillträde',
      shortTitle: 'LOI & tillträde',
      description: 'Skicka indikativt bud (LOI) via vår mall. Följ milstolpsplan: DD → avtal → tillträde.',
      icon: <Building2 className="w-6 h-6" />,
      detailedTitle: 'Från bud till tillträde',
      detailedDescription: 'Skicka indikativt bud (LOI) via vår mall med pris, villkor och tidslinje. Följ milstolpsplan: DD → avtal → tillträde. Behöver du stöd? Vi matchar dig med jurist/revisor i slutskedet.',
    },
  ]

  return (
    <main className="bg-neutral-white">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center bg-cover bg-center">
        {/* Background Image - Only in hero */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/1.png" 
            alt="Köparprocess" 
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16 sm:py-24 md:py-32">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-navy mb-4 sm:mb-6">
              BOLAXO – Hitta, granska och förvärva tryggt och effektivt
            </h1>
            <p className="text-lg sm:text-xl text-primary-navy/80 max-w-3xl mx-auto">
              Skapa en trovärdig köparprofil med BankID. Filtrera annonser, signera NDA och få tillgång till datarum – allt i samma flöde.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/registrera" className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-primary-navy text-white font-bold rounded-lg hover:bg-primary-navy/90 transition-all text-base sm:text-lg shadow-lg hover:shadow-xl">
                Skapa köparprofil
              </Link>
              <Link href="/sok" className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-primary-navy font-bold rounded-lg hover:bg-gray-50 transition-all text-base sm:text-lg border-2 border-primary-navy">
                Sätt bevakning
              </Link>
            </div>
          </div>
        </div>
      </section>

        {/* Interactive Steps Section */}
        <section className="bg-gray-50 py-12 sm:py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-navy mb-4 text-center uppercase">
              Köparresan i 5 steg
            </h2>
            <p className="text-center text-primary-navy mb-12 sm:mb-16 text-lg sm:text-xl font-semibold uppercase">KÖPARE</p>

            {/* Modern Tab Navigation */}
            <div className="mb-12 sm:mb-16">
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-primary-navy/10">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {steps.map((item) => (
                    <button
                      key={item.step}
                      onClick={() => setActiveStep(item.step)}
                      className={`relative group transition-all duration-300 ${
                        activeStep === item.step ? 'transform scale-105' : ''
                      }`}
                    >
                      {/* Card Background */}
                      <div className={`
                        p-4 rounded-xl border-2 transition-all duration-300
                        ${activeStep === item.step 
                          ? 'bg-primary-navy text-white border-primary-navy shadow-2xl' 
                          : 'bg-white hover:bg-primary-navy/5 text-primary-navy border-primary-navy/20 hover:border-primary-navy/50 shadow-md hover:shadow-lg'
                        }
                      `}>
                        {/* Pulsing effect for active */}
                        {activeStep === item.step && (
                          <div className="absolute -inset-1 rounded-xl bg-primary-navy opacity-25 blur-md animate-pulse"></div>
                        )}
                        
                        {/* Step Number */}
                        <div className={`
                          w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300
                          ${activeStep === item.step 
                            ? 'bg-white text-primary-navy' 
                            : 'bg-primary-navy/10 text-primary-navy group-hover:bg-primary-navy/20'
                          }
                        `}>
                          {item.step}
                        </div>
                        
                        {/* Title */}
                        <div className="text-center">
                          <div className="font-bold text-sm">{item.shortTitle}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Step Detail */}
            <div className="max-w-4xl mx-auto animate-fadeIn">
              <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-2xl border-2 border-primary-navy/20">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-primary-navy text-white rounded-2xl flex items-center justify-center shadow-lg">
                      {steps[activeStep - 1].icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl sm:text-3xl font-bold text-primary-navy mb-4">{steps[activeStep - 1].detailedTitle}</h3>
                    <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                      {steps[activeStep - 1].detailedDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Fill Profile */}
        <section className="bg-white py-12 sm:py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-12 shadow-xl border-2 border-primary-navy/10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-navy mb-6 sm:mb-8 text-center">
            Varför fylla i profilen ordentligt?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-navy text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-primary-navy mb-2">Förtroende</h3>
              <p className="text-sm text-gray-700">BankID + LinkedIn + tydliga kriterier ökar chansen till snabb NDA-access</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-navy text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-primary-navy mb-2">Fart</h3>
              <p className="text-sm text-gray-700">Säljare prioriterar köpare med visad finansieringsförmåga och tydligt mandat</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-navy text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-primary-navy mb-2">Bättre matchningar</h3>
              <p className="text-sm text-gray-700">Bevakningar träffar rätt när din profil är komplett</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <h3 className="font-bold text-primary-navy mb-4">Profilcheck (snabb):</h3>
            <ul className="space-y-3">
              {[
                'BankID verifierat',
                'LinkedIn-länk',
                'Investeringspitch (2–3 meningar)',
                'Sökmandat/budget',
                'Bransch & region'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          </div>
        </div>
        </section>

        {/* What's Included */}
        <section className="bg-gray-50 py-12 sm:py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-navy mb-8 sm:mb-12 text-center">
            Vad ingår för köpare?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Verifierade annonser',
                description: 'BankID/NDA-flöde säkerställer seriösa säljare'
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: 'Shortlist & jämförelse',
                description: 'Export till PDF/Excel för enkel analys'
              },
              {
                icon: <Eye className="w-8 h-8" />,
                title: 'Bevakningar & varningar',
                description: 'Nya objekt, prisändring, nya dokument, Q&A-svar'
              },
              {
                icon: <FileText className="w-8 h-8" />,
                title: 'Datarum',
                description: 'Versionshistorik, vattenmärkta dokument, aktivitetslogg'
              },
              {
                icon: <MessagesSquare className="w-8 h-8" />,
                title: 'Mallbibliotek',
                description: 'NDA, LOI, Q&A-guide för professionell kommunikation'
              },
              {
                icon: <Building2 className="w-8 h-8" />,
                title: 'Rådgivarnätverk',
                description: 'För closing support (valfritt)'
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border border-primary-navy/10">
                <div className="w-14 h-14 bg-primary-navy/10 text-primary-navy rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-primary-navy mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        </section>

        {/* Pricing */}
        <section className="bg-white py-12 sm:py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-12 shadow-xl border-2 border-primary-navy/10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-navy mb-6 sm:mb-8 text-center">
            Pris & krav
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white rounded-lg p-6 flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-primary-navy mb-1">Konto & bevakningar</h3>
                <p className="text-gray-700">Gratis</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-primary-navy mb-1">NDA & datarum</h3>
                <p className="text-gray-700">Kräver BankID</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-primary-navy mb-1">Tillval</h3>
                <p className="text-gray-700">LOI-granskning/closing-stöd enligt prislista</p>
              </div>
            </div>
          </div>
          </div>
        </div>
        </section>

        {/* Security */}
        <section className="bg-gray-50 py-12 sm:py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-navy mb-8 sm:mb-12 text-center">
            Trygghet & sekretess
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-md border border-primary-navy/10">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-primary-navy" />
                <h3 className="text-xl font-bold text-primary-navy">Köparidentitet</h3>
              </div>
              <p className="text-gray-700">Synlig (minimikrav) – du styr hur mycket du skriver i profilen</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-md border border-primary-navy/10">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-primary-navy" />
                <h3 className="text-xl font-bold text-primary-navy">Säljaridentitet</h3>
              </div>
              <p className="text-gray-700">Anonym tills NDA är signerad och säljaren ger access</p>
            </div>
          </div>
          
          <div className="mt-8 bg-primary-navy/5 rounded-xl p-8 text-center">
            <Shield className="w-12 h-12 text-primary-navy mx-auto mb-4" />
            <h3 className="text-xl font-bold text-primary-navy mb-4">Säkerhet</h3>
            <p className="text-gray-700 max-w-2xl mx-auto">
              BankID, krypterad filhantering, loggar och vattenmärkning säkerställer maximal trygghet i alla transaktioner
            </p>
          </div>
        </div>
        </section>

        {/* CTA Row */}
        <section className="bg-white py-24 sm:py-32 md:py-48">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary-navy to-primary-navy/90 rounded-2xl p-8 sm:p-12 text-center text-white shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Redo att hitta ditt nästa företag?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/registrera" className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-navy font-bold rounded-lg hover:bg-gray-100 transition-all shadow-lg">
                Skapa köparprofil
              </Link>
              <Link href="/sok" className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all border-2 border-white">
                Sätt bevakning
              </Link>
              <Link href="/loi-mall" className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all border-2 border-white">
                Importera LOI-mall
              </Link>
            </div>
          </div>
        </div>
        </section>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </main>
  )
}