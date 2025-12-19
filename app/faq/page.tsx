'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, HelpCircle, Users, Shield, CreditCard, FileText } from 'lucide-react'
import { generateFAQStructuredData } from '@/lib/structured-data'

interface FAQItem {
  question: string
  answer: string
  category: 'general' | 'sellers' | 'buyers' | 'pricing' | 'security'
}

const faqData: FAQItem[] = [
  {
    category: 'general',
    question: 'Vad är BOLAXO?',
    answer: 'BOLAXO är en automatiserad marknadsplats för företagsköp och försäljning. Vi kopplar samman säljare och köpare av SME-företag på ett säkert och effektivt sätt, med automatisk värdering, smart matchning och fullständig anonymitet fram till NDA-signering.'
  },
  {
    category: 'general',
    question: 'Hur fungerar processen?',
    answer: 'Säljare börjar med gratis värdering (5 min), skapar sedan annons och publicerar. Systemet matchar automatiskt med relevanta köpare. Köpare söker, signerar NDA digitalt för fullständig information, och kan sedan skicka LOI. Hela processen från NDA till closing hanteras i vår deal management-plattform.'
  },
  {
    category: 'general',
    question: 'Vad kostar det att använda BOLAXO?',
    answer: 'Värdering är alltid gratis! För säljare: Free (0 kr - utkast), Basic (495 kr/mån), Pro (895 kr/mån), Pro+ Featured (1,495 kr/mån). För köpare är det helt gratis att söka och titta.'
  },
  {
    category: 'sellers',
    question: 'Hur får jag en gratis värdering?',
    answer: 'Klicka på "Gratis värdering" och fyll i vårt formulär. Systemet analyserar ditt företag med 10 datakällor och ger dig en professionell värdering på 5 minuter. Du får en PDF-rapport helt gratis!'
  },
  {
    category: 'sellers',
    question: 'Hur lång tid tar det att sälja?',
    answer: 'Det varierar beroende på företag och bransch, men i genomsnitt 3-9 månader från publicering till avslut. Med vår smarta matchning kan processen gå snabbare.'
  },
  {
    category: 'sellers',
    question: 'Kan jag vara helt anonym?',
    answer: 'Ja! Du väljer själv anonymitetsnivå. Köpare ser bara denna information efter NDA-signering. All kommunikation går via vår NDA-skyddade plattform.'
  },
  {
    category: 'buyers',
    question: 'Är det gratis att söka efter företag?',
    answer: 'Ja, helt gratis! Att skapa konto, söka, bevaka och få matchningar är helt kostnadsfritt för köpare. Du betalar bara när du vill avsluta en deal och köper Deal Management-tjänsten.'
  },
  {
    category: 'buyers',
    question: 'Hur hittar jag rätt företag?',
    answer: 'Vår AI-drivna matchningsalgoritm analyserar dina kriterier och rekommenderar relevanta företag. Du kan också söka manuellt med filter på bransch, region, omsättning och EBITDA. Vi hjälper dig hitta rätt match!'
  },
  {
    category: 'pricing',
    question: 'Finns det rabatt för långtidskontrakt?',
    answer: 'Ja, kontakta vår säljteam för skräddarsydd offert. Rabatt för årskontrakt är möjligt, speciellt för Pro och Pro+ Featured-paket.'
  },
  {
    category: 'security',
    question: 'Hur skydds min data?',
    answer: 'Vi använder BankID för all verifiering, HTTPS + AES-256 kryptering för all data, och digitala NDA-avtal signerade av båda parter. Din säkerhet är vår högsta prioritet.'
  }
]

const categories = [
  { id: 'general', label: 'Allmänt', icon: HelpCircle },
  { id: 'sellers', label: 'Säljare', icon: FileText },
  { id: 'buyers', label: 'Köpare', icon: Users },
  { id: 'pricing', label: 'Priser', icon: CreditCard },
  { id: 'security', label: 'Säkerhet', icon: Shield }
]

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [expandedItem, setExpandedItem] = useState<number | null>(0)

  const filteredFAQ = faqData.filter(item => item.category === selectedCategory)

  // Add FAQ structured data for SEO and LLM optimization
  useEffect(() => {
    const faqStructuredData = generateFAQStructuredData(
      faqData.map(item => ({
        question: item.question,
        answer: item.answer,
      }))
    )

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(faqStructuredData)
    script.id = 'structured-data-faq'

    // Remove existing script if present
    const existing = document.getElementById('structured-data-faq')
    if (existing) {
      existing.remove()
    }

    document.head.appendChild(script)

    return () => {
      const scriptToRemove = document.getElementById('structured-data-faq')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [])

  return (
    <main className="min-h-screen bg-neutral-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-navy/10 to-accent-pink/10 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-primary-navy mb-6">VANLIGA FRÅGOR</h1>
          <p className="text-2xl text-primary-navy leading-relaxed">
            Hitta svar på de vanligaste frågorna om BOLAXO
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mb-12 justify-center">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  isActive
                    ? 'bg-accent-pink text-primary-navy'
                    : 'bg-neutral-off-white text-primary-navy border border-gray-200 hover:border-accent-pink'
                }`}
              >
                <Icon className="w-5 h-5" />
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {filteredFAQ.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                className="w-full px-6 py-5 sm:py-6 flex items-start justify-between gap-4 bg-white hover:bg-neutral-off-white transition-colors text-left"
              >
                <h3 className="text-base sm:text-lg font-bold text-primary-navy leading-relaxed pr-4">
                  {item.question}
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-accent-pink flex-shrink-0 transition-transform ${
                    expandedItem === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedItem === index && (
                <div className="px-6 py-6 sm:py-8 bg-neutral-off-white border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-accent-pink rounded-lg p-12 text-center">
          <h2 className="text-2xl font-bold text-primary-navy mb-4">Hittar du inte svaret?</h2>
          <p className="text-lg text-primary-navy mb-8">
            Kontakta oss direkt och vi hjälper dig gärna
          </p>
          <a
            href="/kontakt"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-navy text-white font-bold rounded-lg hover:shadow-lg transition-all"
          >
            Kontakta oss
            <ChevronDown className="w-5 h-5 rotate-90" />
          </a>
        </div>
      </div>
    </main>
  )
}
