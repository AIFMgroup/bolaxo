'use client'

import Link from 'next/link'
import { SWEDISH_CITIES } from '@/lib/cities'
import { ArrowRight, Search } from 'lucide-react'

export default function BuyerAllCitiesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-primary-navy mb-6">
            Köp företag i Sverige
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Utforska verifierade akquisitionsmöjligheter i hundratals svenska städer. Från Stockholm till Hemse - 
            hitta ditt nästa företag med BOLAXO.
          </p>
          <Link
            href="/sok"
            className="inline-block bg-primary-navy text-white px-8 py-4 rounded-lg font-semibold hover:bg-opacity-90 transition flex items-center gap-2 justify-center mb-4"
          >
            Bläddra bland alla företag <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Cities Grid */}
        <div>
          <h2 className="text-2xl font-bold text-primary-navy mb-8">Städer i Sverige</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {SWEDISH_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/kopare/${city.slug}`}
                className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg hover:border-primary-navy transition group"
              >
                <h3 className="font-semibold text-primary-navy group-hover:text-opacity-80">{city.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{city.region}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Why Buy */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-primary-navy mb-12 text-center">Köp företag med BOLAXO</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: 'Nationell räckvidd', desc: '100+ städer med verifierade företag' },
              { title: 'Transparenta data', desc: 'Detaljerade företagsprofiler och värderingar' },
              { title: 'NDA-säkerhet', desc: 'Skydda dina analyser med konfidentialitetsavtal' },
              { title: 'Strukturerad process', desc: 'Från intresse till stängning med milstolpar' },
              { title: 'Expert support', desc: 'M&A-professionaler guidar genom processen' },
              { title: 'Gratis att börja', desc: 'Registrera dig gratis och börja söka idag' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-primary-navy mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Cities */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-primary-navy mb-8">Populära städer för akquisitioner</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {SWEDISH_CITIES.slice(0, 9).map((city) => (
            <Link
              key={city.slug}
              href={`/kopare/${city.slug}`}
              className="bg-gradient-to-br from-primary-navy/5 to-transparent border border-primary-navy/20 rounded-lg p-6 hover:shadow-lg transition"
            >
              <h3 className="font-semibold text-lg text-primary-navy mb-2">{city.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{city.region} länet</p>
              <span className="inline-block text-primary-navy text-sm font-semibold hover:gap-2">
                Se lediga företag →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary-navy text-white py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Redo att hitta ditt nästa företag?</h2>
        <p className="text-lg mb-8 opacity-90">
          Registrera dig gratis och få tillgång till alla lediga företag i Sverige.
        </p>
        <Link
          href="/registrera"
          className="inline-block bg-white text-primary-navy px-10 py-4 rounded-lg font-semibold hover:bg-opacity-90 transition"
        >
          Registrera dig gratis
        </Link>
      </div>
    </div>
  )
}

