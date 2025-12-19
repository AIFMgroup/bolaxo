import Link from 'next/link'
import { getCityBySlug, SWEDISH_CITIES } from '@/lib/cities'
import { ArrowRight, Target } from 'lucide-react'

interface PageProps {
  params: Promise<{ stad: string }>
}

export default async function BuyerCityLandingPage({ params }: PageProps) {
  const { stad } = await params
  const city = getCityBySlug(stad)

  if (!city) return <div className="text-center py-20">Staden hittades inte</div>

  const benefits = [
    { title: 'Verifierad data', description: 'Alla företag är verifierade innan annonsering' },
    { title: 'Transparenta priser', description: 'Klara värderingar och prisnivåer' },
    { title: 'NDA-skydd', description: 'Skydda dina analyser med konfidentialitetsavtal' },
    { title: 'Professionell process', description: 'Strukturerad process från intresse till stängning' },
    { title: 'Expertstöd', description: 'Guidance från M&A-professionella' },
    { title: 'Nationell räckvidd', description: 'Tillgång till 100+ städer i Sverige' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-primary-navy mb-6 leading-tight">
            Köp ditt nästa företag i {city.name}
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Utforska verifierade akquisitionsmöjligheter i {city.name}. Med BOLAXO får du tillgång till 
            en kurerad lista över företag till salu, tillsammans med professionell stöd genom hela köpprocessen.
          </p>
          <Link
            href={`/sok?stad=${city.slug}`}
            className="inline-block bg-primary-navy text-white px-8 py-4 rounded-lg font-semibold hover:bg-opacity-90 transition flex items-center gap-2 justify-center mb-4"
          >
            Se lediga företag i {city.name} <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-gray-500">Ingen prenumeration krävs. Gratis att söka.</p>
        </div>
      </div>

      {/* Why Buy */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-primary-navy mb-12 text-center">Varför köpa via BOLAXO?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <Target className="w-8 h-8 text-primary-navy mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-primary-navy">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Process */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-primary-navy mb-12 text-center">Köpprocessen</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Sök & utforska', desc: 'Bläddra bland lediga företag i {city.name}' },
              { step: '2', title: 'Registrera dig', desc: 'Skapa en köparprofil helt gratis' },
              { step: '3', title: 'NDA & detaljer', desc: 'Få tillgång till känslig data efter NDA' },
              { step: '4', title: 'Presentera intresse', desc: 'Skicka ett indikativt anbud (LOI)' },
              { step: '5', title: 'Due Diligence', desc: 'Analysera företaget i detalj' },
              { step: '6', title: 'Transaktion & stängning', desc: 'Genomför köpet med professionell hjälp' },
            ].map((item, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-navy text-white font-bold">
                    {item.step}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-primary-navy mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.desc.replace('{city.name}', city.name)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Available in Region */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-primary-navy mb-6">Lediga företag i {city.region} länet</h2>
        <p className="text-gray-600 mb-8">
          BOLAXO har ett omfattande urval av företag till salu i {city.name} och omkringliggande områden. 
          Alla företag är verifierade och företagarna är seriösa säljare.
        </p>
        <Link
          href={`/sok?stad=${city.slug}`}
          className="inline-block bg-primary-navy text-white px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition"
        >
          Bläddra bland lediga företag
        </Link>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-navy text-white py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Redo att hitta ditt nästa företag?</h2>
        <p className="text-lg mb-8 opacity-90">
          Registrera dig idag och få tillgång till alla lediga företag i {city.name}.
        </p>
        <Link
          href="/registrera"
          className="inline-block bg-white text-primary-navy px-10 py-4 rounded-lg font-semibold hover:bg-opacity-90 transition"
        >
          Registrera dig gratis
        </Link>
      </div>

      {/* Footer Links */}
      <div className="max-w-6xl mx-auto px-6 py-8 border-t">
        <div className="flex justify-between items-center flex-wrap gap-4 text-sm text-gray-600">
          <Link href="/kopare" className="hover:text-primary-navy">← Se alla städer</Link>
          <div className="flex gap-6">
            {SWEDISH_CITIES.slice(0, 5).map(c => (
              <Link key={c.slug} href={`/kopare/${c.slug}`} className="hover:text-primary-navy">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
