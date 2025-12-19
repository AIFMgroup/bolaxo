import Link from 'next/link'
import { getCityBySlug, SWEDISH_CITIES } from '@/lib/cities'
import { ArrowRight, CheckCircle } from 'lucide-react'

interface PageProps {
  params: Promise<{ stad: string }>
}

export default async function SellerCityLandingPage({ params }: PageProps) {
  const { stad } = await params
  const city = getCityBySlug(stad)

  if (!city) return <div className="text-center py-20">Staden hittades inte</div>

  const benefits = [
    { title: 'Fri värdering', description: 'Få ett objektivt värde på ditt företag utan kostnad' },
    { title: 'Verifierade köpare', description: 'Endast seriösa köpare med ekonomisk styrka' },
    { title: 'NDA innan detaljer', description: 'Dina känsliga uppgifter skyddas' },
    { title: 'Professionell process', description: 'Från LOI till stängning med tydliga milstolpar' },
    { title: 'Expert support', description: 'Guidance genom hela försäljningsprocessen' },
    { title: 'Snabb process', description: 'Från annons till stängning på få månader' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-primary-navy mb-6 leading-tight">
            Sälj ditt företag i {city.name}
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Med BOLAXO får du tillgång till hundratals verifierade köpare. Sätt ditt företag på marknaden 
            och få ett professionellt stöd genom hela processen.
          </p>
          <Link
            href="/vardering"
            className="inline-block bg-primary-navy text-white px-8 py-4 rounded-lg font-semibold hover:bg-opacity-90 transition flex items-center gap-2 justify-center mb-4"
          >
            Starta gratis värdering <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-gray-500">Tar 5 minuter. Helt gratis och utan bindning.</p>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-primary-navy mb-12 text-center">Varför BOLAXO?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <CheckCircle className="w-8 h-8 text-primary-navy mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-primary-navy">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Process */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-primary-navy mb-12 text-center">Så fungerar det</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Gratis värdering', desc: 'Börja med vår kostnadsfria värderingstool' },
              { step: '2', title: 'Skapa annons', desc: 'Vi hjälper dig annonsera ditt företag' },
              { step: '3', title: 'Motta anbud', desc: 'Få kontakt från verifierade köpare' },
              { step: '4', title: 'NDA & presentationen', desc: 'Skydda din data med NDA innan detaljerna' },
              { step: '5', title: 'LOI & transaktion', desc: 'Gå vidare med de allvarliga köparna' },
              { step: '6', title: 'Stängning', desc: 'Genomför försäljningen med professionell hjälp' },
            ].map((item, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-navy text-white font-bold">
                    {item.step}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-primary-navy mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-primary-navy mb-6">Redo att sälja ditt företag?</h2>
        <p className="text-lg text-gray-600 mb-8">
          Start med en gratis värdering och se vad ditt företag är värt på marknaden.
        </p>
        <Link
          href="/vardering"
          className="inline-block bg-primary-navy text-white px-10 py-4 rounded-lg font-semibold hover:bg-opacity-90 transition"
        >
          Starta värdering gratis
        </Link>
      </div>

      {/* Footer Links */}
      <div className="max-w-6xl mx-auto px-6 py-8 border-t">
        <div className="flex justify-between items-center flex-wrap gap-4 text-sm text-gray-600">
          <Link href="/saljare" className="hover:text-primary-navy">← Se alla städer</Link>
          <div className="flex gap-6">
            {SWEDISH_CITIES.slice(0, 5).map(c => (
              <Link key={c.slug} href={`/saljare/${c.slug}`} className="hover:text-primary-navy">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
