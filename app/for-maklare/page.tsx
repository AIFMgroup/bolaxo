'use client'

import Link from 'next/link'
import { usePaymentStore } from '@/store/paymentStore'
import { CheckCircle, Star, TrendingUp, Shield, BarChart3 } from 'lucide-react'

export default function ForMaklarePage() {
  const { user, selectPlan } = usePaymentStore()

  const handleSelectPlan = (plan: 'broker-pro' | 'broker-premium') => {
    selectPlan(plan, 'monthly')
    // Redirect to checkout
    window.location.href = '/kassa'
  }

  return (
    <main className="bg-gradient-to-b from-white to-light-blue/20 py-6 sm:py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-text-dark mb-4">
            För företagsmäklare
          </h1>
          <p className="text-lg text-text-gray max-w-2xl mx-auto">
            Pipeline-översikt, automatisk deal tracking och fullständig statistik – allt du behöver för att driva dina affärer framåt, snabbare.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-3 sm:gap-4 md:gap-6 mb-16">
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-blue rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2">Pipeline & Deal Tracking</h3>
            <p className="text-sm text-text-gray">
              Se alla dina affärer i pipeline med AI-driven konverteringsanalys och riskbedömning
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-success rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2">BankID-verifierad</h3>
            <p className="text-sm text-text-gray">
              Din legitimitet som mäklare verifieras. Ger förtroende hos köpare och säljare
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2">Realtids Analytics</h3>
            <p className="text-sm text-text-gray">
              Volym, genomförandegrad, pipeline-värde och konvertering – allt i din egen dashboard
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-dark mb-3">
            Mäklarlicenser
          </h2>
          <p className="text-text-gray">
            Personliga licenser. Behöver fler mäklare? Köp en licens per person.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto mb-16">
          {/* Pro */}
          <div className="relative bg-white rounded-card shadow-card hover:shadow-card-hover transition-all duration-300 p-8 flex flex-col h-full">
            <div className="text-center mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-text-dark mb-4">Pro</h3>
              <div className="mb-4">
                <span className="text-5xl font-bold text-text-dark">9,995</span>
                <span className="text-xl sm:text-2xl text-text-gray ml-2">kr</span>
              </div>
              <div className="text-text-gray mb-2">per månad / licens</div>
              <div className="inline-block bg-success/10 text-success px-3 py-1 rounded-full text-sm font-medium">
                eller 99,995 kr/år (spara 20%)
              </div>
            </div>

            <div className="flex-grow">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-text-dark">10 aktiva annonser samtidigt</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-text-dark">Pipeline-dashboard med konverteringsmetrik</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-text-dark">Deal tracking från LOI till closing</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-text-dark">Realtids statistik & analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-text-dark">Prioriterad support</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => handleSelectPlan('broker-pro')}
              className="btn-secondary w-full py-4 text-lg font-semibold"
            >
              Köp Pro-licens
            </button>
          </div>

          {/* Premium */}
          <div className="relative bg-white rounded-card shadow-card hover:shadow-card-hover transition-all duration-300 p-8 flex flex-col h-full border-2 border-primary-blue">
            {/* Recommended Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-primary-blue text-white px-6 py-2 rounded-full font-semibold text-sm flex items-center">
                <Star className="w-4 h-4 mr-2 fill-current" />
                Rekommenderas
              </div>
            </div>

            <div className="text-center mb-8 pt-4">
              <h3 className="text-2xl sm:text-3xl font-bold text-text-dark mb-4">Premium</h3>
              <div className="mb-4">
                <span className="text-5xl font-bold text-primary-blue">24,995</span>
                <span className="text-xl sm:text-2xl text-text-gray ml-2">kr</span>
              </div>
              <div className="text-text-gray mb-2">per månad / licens</div>
              <div className="inline-block bg-success/10 text-success px-3 py-1 rounded-full text-sm font-medium">
                eller 249,995 kr/år (spara 20%)
              </div>
            </div>

            <div className="flex-grow">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-blue mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-text-dark font-semibold">Allt i Pro +</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-blue mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-text-dark">Obegränsat antal annonser</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-blue mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-text-dark">White-label optioner</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-blue mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-text-dark">API-access för integration</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-blue mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-text-dark">Dedikerad account manager</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-blue mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-text-dark">Advanced analytics med custom rapporter</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-blue mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-text-dark">Team collaboration för större transaktioner</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => handleSelectPlan('broker-premium')}
              className="btn-primary w-full py-4 text-lg font-semibold shadow-md"
            >
              Köp Premium-licens
            </button>
          </div>
        </div>

        {/* How it Works */}
        <div className="card mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-8 text-center">
            Så fungerar det
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[
              { step: 1, title: 'Registrera', desc: 'Skapa konto och verifiera med BankID' },
              { step: 2, title: 'Köp licens', desc: 'Välj Pro eller Premium. Personbunden licens.' },
              { step: 3, title: 'Bjud in kunder', desc: 'Lägg till dina kunder i portalen' },
              { step: 4, title: 'Hantera annonser', desc: 'Skapa, redigera och följ upp alla objekt' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary-blue text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-text-gray">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BankID Requirement */}
        <div className="card bg-yellow-50 border-2 border-yellow-200 mb-16">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">
                BankID-verifiering krävs
              </h3>
              <p className="text-sm text-yellow-700">
                Alla mäklarlicenser är personbundna och kräver BankID-verifiering för att säkerställa legitimitet. 
                Detta ger dig badge "Verifierad mäklare" som ökar förtroende hos användare.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="card">
          <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-6">
            Vanliga frågor för mäklare
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Kan flera mäklare dela en licens?</h3>
              <p className="text-sm text-text-gray">
                Nej, licenser är personbundna och kräver BankID-verifiering. Varje mäklare behöver sin egen licens.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Hur många annonser kan jag ha aktiva?</h3>
              <p className="text-sm text-text-gray">
                Pro: 10 samtidigt. Premium: obegränsat. Du kan uppgradera när som helst.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Kan jag fakturera mina kunder via plattformen?</h3>
              <p className="text-sm text-text-gray">
                Ja, i Premium-licensen kan du lägga på din marginal och fakturera kunder direkt via systemet.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Hur funkar API-access?</h3>
              <p className="text-sm text-text-gray">
                Premium-licensen inkluderar REST API för att integrera Afterfounder med ditt CRM eller hemsida.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          {user?.role === 'broker' && user.bankIdVerified ? (
            <div className="space-y-4">
              <p className="text-success font-semibold mb-4">
                • Du är verifierad och kan köpa licens
              </p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => handleSelectPlan('broker-pro')} className="btn-primary px-8 py-4">
                  Köp Pro-licens
                </button>
                <button onClick={() => handleSelectPlan('broker-premium')} className="btn-secondary px-8 py-4">
                  Köp Premium-licens
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-text-gray mb-6">
                Skapa konto och verifiera dig för att komma igång
              </p>
              <Link href="/registrera" className="btn-primary inline-block px-10 py-4">
                Skapa mäklarkonto →
              </Link>
            </div>
          )}

          <p className="text-xs text-text-gray mt-6">
            Frågor? Kontakta maklare@afterfounder.se eller ring 08-123 456 78
          </p>
        </div>
      </div>
    </main>
  )
}

