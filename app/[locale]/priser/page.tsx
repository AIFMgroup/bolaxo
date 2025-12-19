'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { 
  Check, 
  ArrowRight, 
  Users, 
  Crown,
  ChevronDown,
  Shield,
  MessageSquare,
  FileText,
  Target,
  Building2,
  Briefcase,
  Eye,
  Lock
} from 'lucide-react'

type TabId = 'overview' | 'gratis' | 'standard' | 'premium' | 'faq'

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Översikt' },
  { id: 'gratis', label: 'Gratis (Köpare)' },
  { id: 'standard', label: 'Standard' },
  { id: 'premium', label: 'Premium' },
  { id: 'faq', label: 'FAQ' }
]

const faqs = [
  {
    question: 'Kostar det något för köpare?',
    answer: 'Nej, det är helt gratis för köpare att söka, skapa investerarprofil och begära NDA för annonser.'
  },
  {
    question: 'Vad kostar det att annonsera som säljare?',
    answer: 'Standard-paketet kostar 2 495 kr/mån. Premium med rådgivarstöd kostar 4 995 kr/mån. Inga success fees.'
  },
  {
    question: 'Tar ni procent på köpeskillingen?',
    answer: 'Nej, vi tar aldrig procent på affären. Bara fasta månadsavgifter för säljare. Köpare betalar ingenting.'
  },
  {
    question: 'Vem ser informationen jag laddar upp?',
    answer: 'Din annons är anonym tills köparen signerat NDA. Först då får de tillgång till företagsnamn och detaljerad information i datarummet.'
  },
  {
    question: 'Hur fungerar matchningen?',
    answer: 'Vår matchningsmotor analyserar köpares investerarprofiler mot dina annonsparametrar. Du får notifikationer när det finns intresserade köpare.'
  },
  {
    question: 'Kan jag avbryta när som helst?',
    answer: 'Ja, du kan när som helst pausa eller ta bort din annons. Ingen bindningstid.'
  }
]

export default function PriserPage() {
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero med bakgrundsbild */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/polaroid/premium_photo-1713539604721-17578c76cfe1.jpg"
            alt="Priser"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/85 to-navy/75" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
            Transparent prissättning
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Gratis för köpare. Fasta månadsavgifter för säljare. Inga dolda avgifter eller success fees.
          </p>
          <div className="flex flex-wrap gap-3 mt-8 justify-center">
            <span className="px-4 py-2 bg-white text-navy font-semibold rounded-full text-sm">
              Gratis för köpare
            </span>
            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm border border-white/20">
              Inga success fees
            </span>
            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm border border-white/20">
              Ingen bindningstid
            </span>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-navy text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              {/* Gratis för köpare */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-shadow flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                    För köpare
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-navy mb-2">Gratis</h3>
                <div className="text-3xl font-bold text-navy mb-4">0 kr</div>
                <p className="text-gray-600 text-sm mb-6">
                  Helt gratis för dig som vill hitta och köpa företag.
                </p>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Obegränsad sökning bland annonser</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Skapa investerarprofil</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Begär NDA för intressanta bolag</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Tillgång till datarum efter NDA</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Direktkontakt med säljare</span>
                  </li>
                </ul>
                <Link
                  href={`/${locale}/investerarprofil`}
                  className="w-full py-3 px-6 bg-navy text-white text-center font-semibold rounded-full hover:bg-navy/90 transition-colors mt-auto block"
                >
                  Kom igång gratis
                </Link>
              </div>

              {/* Standard */}
              <div className="bg-white rounded-2xl p-8 border-2 border-emerald-500 hover:shadow-xl transition-shadow relative flex flex-col h-full">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full uppercase">
                    Populärast
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                    För säljare
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-navy mb-2">Standard</h3>
                <div className="text-3xl font-bold text-navy mb-1">2 495 kr</div>
                <p className="text-gray-500 text-sm mb-4">per månad</p>
                <p className="text-gray-600 text-sm mb-6">
                  För dig som vill annonsera ditt företag professionellt.
                </p>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Anonym annonsering</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Smart matchning med köpare</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Datarum för dokument</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>NDA-hantering</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Dashboard med statistik</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>E-post & chatt-support</span>
                  </li>
                </ul>
                <Link
                  href={`/${locale}/salja/skapa-annons`}
                  className="w-full py-3 px-6 bg-navy text-white text-center font-semibold rounded-full hover:bg-navy/90 transition-colors mt-auto block"
                >
                  Skapa annons
                </Link>
              </div>

              {/* Premium */}
              <div className="bg-navy text-white rounded-2xl p-8 hover:shadow-xl transition-shadow flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-white/20 text-white/90 text-xs font-semibold rounded-full uppercase tracking-wider">
                    För säljare
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Premium</h3>
                <div className="text-3xl font-bold mb-1 text-white">4 995 kr</div>
                <p className="text-white/60 text-sm mb-4">per månad</p>
                <p className="text-white/70 text-sm mb-6">
                  Med personlig rådgivare och extra exponering.
                </p>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start gap-2 text-sm text-white/90">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Allt i Standard</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-white/90">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Personlig rådgivare</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-white/90">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Granskning av annons & material</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-white/90">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Prioriterad exponering</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-white/90">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Stöd vid förhandling</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-white/90">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Telefonsupport</span>
                  </li>
                </ul>
                <Link
                  href={`/${locale}/kontakt`}
                  className="w-full py-3 px-6 bg-white text-navy text-center font-semibold rounded-full hover:bg-white/90 transition-colors mt-auto block"
                >
                  Kontakta oss
                </Link>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-4 px-6 font-semibold text-navy">Funktion</th>
                      <th className="text-center py-4 px-6 font-semibold text-navy">Gratis (Köpare)</th>
                      <th className="text-center py-4 px-6 font-semibold text-navy">Standard</th>
                      <th className="text-center py-4 px-6 font-semibold text-navy">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-4 px-6 text-gray-700">Söka bland annonser</td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                      <td className="py-4 px-6 text-center">–</td>
                      <td className="py-4 px-6 text-center">–</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-gray-700">Skapa annons</td>
                      <td className="py-4 px-6 text-center">–</td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-gray-700">Matchning</td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-gray-700">NDA-hantering</td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-gray-700">Datarum</td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">Tillgång efter NDA</td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-gray-700">Personlig rådgivare</td>
                      <td className="py-4 px-6 text-center">–</td>
                      <td className="py-4 px-6 text-center">–</td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-3 py-1 bg-navy text-white text-xs font-semibold rounded-full">Ingår</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-gray-700">Prioriterad exponering</td>
                      <td className="py-4 px-6 text-center">–</td>
                      <td className="py-4 px-6 text-center">–</td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-gray-700">Support</td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">E-post</td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">E-post/chatt</td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">Prioriterad + telefon</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Gratis (Köpare) Tab */}
        {activeTab === 'gratis' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-navy mt-2 mb-4">Gratis för köpare</h2>
              <p className="text-gray-600 max-w-2xl">
                Det kostar ingenting att hitta och köpa företag via BOLAXO. Skapa en investerarprofil 
                och börja utforska annonser direkt.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-navy mb-6">Det här ingår</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 text-navy" />
                    </div>
                    <div>
                      <span className="font-semibold text-navy">Obegränsad sökning</span>
                      <p className="text-sm text-gray-600">Sök bland alla publicerade annonser med avancerade filter.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-4 h-4 text-navy" />
                    </div>
                    <div>
                      <span className="font-semibold text-navy">Investerarprofil</span>
                      <p className="text-sm text-gray-600">Ange dina kriterier för att få relevanta matchningar.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-navy" />
                    </div>
                    <div>
                      <span className="font-semibold text-navy">NDA-förfrågningar</span>
                      <p className="text-sm text-gray-600">Begär NDA för att få tillgång till detaljerad information.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lock className="w-4 h-4 text-navy" />
                    </div>
                    <div>
                      <span className="font-semibold text-navy">Datarum-åtkomst</span>
                      <p className="text-sm text-gray-600">Full tillgång till säljarens dokument efter signerat NDA.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-navy" />
                    </div>
                    <div>
                      <span className="font-semibold text-navy">Direktkontakt</span>
                      <p className="text-sm text-gray-600">Kommunicera direkt med säljare via plattformen.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-navy mb-6">Så kommer du igång</h3>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-gray-700">
                    <span className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
                    <span className="pt-1">Skapa ett kostnadsfritt konto</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <span className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
                    <span className="pt-1">Fyll i din investerarprofil</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <span className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
                    <span className="pt-1">Börja söka bland annonser</span>
                  </li>
                </ul>
                <Link
                  href={`/${locale}/investerarprofil`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white font-semibold rounded-full hover:bg-navy/90 transition-colors"
                >
                  <Briefcase className="w-5 h-5" />
                  Skapa investerarprofil
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Standard Tab */}
        {activeTab === 'standard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-navy mt-2 mb-4">Standard – för säljare</h2>
              <p className="text-gray-600 max-w-2xl">
                Allt du behöver för att annonsera ditt företag professionellt och nå kvalificerade köpare.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-navy">Det här ingår</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-navy">2 495 kr</div>
                    <div className="text-sm text-gray-500">per månad</div>
                  </div>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-navy">Anonym annonsering</span>
                      <p className="text-sm text-gray-600">Ditt företag förblir anonymt tills köparen signerat NDA.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-navy">Smart matchning</span>
                      <p className="text-sm text-gray-600">Automatisk matchning med relevanta köpare.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-navy">Datarum</span>
                      <p className="text-sm text-gray-600">Ladda upp dokument som delas efter NDA.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-navy">NDA-hantering</span>
                      <p className="text-sm text-gray-600">Digital signering av sekretessavtal.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-navy">Dashboard</span>
                      <p className="text-sm text-gray-600">Statistik, visningar och hantering av intressenter.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-navy">Support</span>
                      <p className="text-sm text-gray-600">E-post och chatt under kontorstid.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-navy mb-6">Standard passar dig som...</h3>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-navy rounded-full mt-2 flex-shrink-0"></div>
                    <span>vill ha full kontroll över försäljningsprocessen.</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-navy rounded-full mt-2 flex-shrink-0"></div>
                    <span>är bekväm med att själv sköta dialogen med köpare.</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-navy rounded-full mt-2 flex-shrink-0"></div>
                    <span>vill slippa success fees och procentuella arvoden.</span>
                  </li>
                </ul>
                <Link
                  href={`/${locale}/salja/skapa-annons`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white font-semibold rounded-full hover:bg-navy/90 transition-colors"
                >
                  <Building2 className="w-5 h-5" />
                  Skapa annons
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Premium Tab */}
        {activeTab === 'premium' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-navy mt-2 mb-4">Premium – med rådgivarstöd</h2>
              <p className="text-gray-600 max-w-2xl">
                För dig som vill ha en erfaren rådgivare vid din sida genom hela processen.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-navy text-white rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Det här ingår</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">4 995 kr</div>
                    <div className="text-sm text-white/60">per månad</div>
                  </div>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Allt i Standard</span>
                      <p className="text-sm text-white/70">Annonsering, matchning, datarum, NDA och dashboard.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Personlig rådgivare</span>
                      <p className="text-sm text-white/70">Dedikerad kontaktperson genom hela processen.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Granskning av material</span>
                      <p className="text-sm text-white/70">Professionell feedback på annons och dokument.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Prioriterad exponering</span>
                      <p className="text-sm text-white/70">Högre synlighet i sökresultat.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Stöd vid förhandling</span>
                      <p className="text-sm text-white/70">Råd kring pris, struktur och villkor.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Telefonsupport</span>
                      <p className="text-sm text-white/70">Prioriterad support med direktnummer.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-navy mb-6">Premium passar dig som...</h3>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-navy rounded-full mt-2 flex-shrink-0"></div>
                    <span>vill ha en kunnig samtalspartner genom hela processen.</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-navy rounded-full mt-2 flex-shrink-0"></div>
                    <span>har begränsat med tid och vill undvika misstag.</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-navy rounded-full mt-2 flex-shrink-0"></div>
                    <span>värdesätter professionell feedback på ditt material.</span>
                  </li>
                </ul>
                <Link
                  href={`/${locale}/kontakt`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white font-semibold rounded-full hover:bg-navy/90 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  Boka ett samtal
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-navy">Vanliga frågor om priser</h2>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <h3 className="font-semibold text-navy pr-4">{faq.question}</h3>
                    <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`} />
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-6 text-gray-600">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA med bakgrundsbild */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/polaroid/premium_photo-1712612245294-e9d28aee57cb.jpg"
            alt="Kom igång"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-navy/90" />
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Redo att komma igång?</h2>
          <p className="text-white/80 mb-8">
            Köpare börjar gratis. Säljare väljer mellan Standard och Premium.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/sok`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-navy font-bold rounded-full hover:bg-white/90 transition-colors"
            >
              <Eye className="w-5 h-5" />
              Sök bolag (gratis)
            </Link>
            <Link
              href={`/${locale}/salja/skapa-annons`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-full hover:bg-white/20 transition-colors border border-white/20"
            >
              <Building2 className="w-5 h-5" />
              Skapa annons
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
