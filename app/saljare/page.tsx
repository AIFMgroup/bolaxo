'use client'

import Link from 'next/link'
import { SWEDISH_CITIES } from '@/lib/cities'
import { ArrowRight } from 'lucide-react'

export default function SellarAllCitiesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-primary-navy mb-6">
            Sälj ditt företag i Sverige
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Välj din stad och starta en gratis värdering av ditt företag. BOLAXO tillhandahåller en professionell 
            försäljningsprocess med verifierade köpare i hela Sverige.
          </p>
          <Link
            href="/vardering"
            className="inline-block bg-primary-navy text-white px-8 py-4 rounded-lg font-semibold hover:bg-opacity-90 transition flex items-center gap-2 justify-center mb-4"
          >
            Starta värdering <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Cities Grid */}
        <div>
          <h2 className="text-2xl font-bold text-primary-navy mb-8">Tillgängliga städer i Sverige</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {SWEDISH_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/saljare/${city.slug}`}
                className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg hover:border-primary-navy transition"
              >
                <h3 className="font-semibold text-primary-navy hover:text-opacity-80">{city.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{city.region}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-primary-navy mb-12 text-center">Varför välja BOLAXO?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: '100+ städer', desc: 'Tillgång till köpare i hela Sverige' },
              { title: 'Fri värdering', desc: 'Få värde på ditt företag utan kostnad' },
              { title: 'Verifierade köpare', desc: 'Endast seriösa köpare med ekonomisk styrka' },
              { title: 'NDA-skydd', desc: 'Din känsliga data är säkrad' },
              { title: 'Expert support', desc: 'Guidance från M&A-professionella' },
              { title: 'Snabb process', desc: 'Från annons till stängning på få månader' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-primary-navy mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-primary-navy mb-6">Redo att börja?</h2>
        <Link
          href="/vardering"
          className="inline-block bg-primary-navy text-white px-10 py-4 rounded-lg font-semibold hover:bg-opacity-90 transition"
        >
          Starta gratis värdering
        </Link>
      </div>
    </div>
  )
}
