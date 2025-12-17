import { Lightbulb, Eye, Target } from 'lucide-react'

export default function AboutPage() {
  return (
    <main className="bg-neutral-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-navy/10 to-accent-pink/10 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-primary-navy mb-6">
            VI FÖRENKLAR FÖRETAGSFÖRSÄLJNING
          </h1>
          <p className="text-2xl text-primary-navy leading-relaxed">
            Afterfounder skapades för att göra M&A transparent, trygg och tillgänglig för alla.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-neutral-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-neutral-off-white p-10 rounded-lg border border-gray-200">
              <div className="w-16 h-16 bg-accent-pink/10 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-accent-pink" />
              </div>
              <h2 className="text-2xl font-bold text-primary-navy mb-4">Vår mission</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Att demokratisera företagsförsäljning genom att göra processen transparent, säker och tillgänglig för alla svenska företagare.
              </p>
            </div>

            <div className="bg-neutral-off-white p-10 rounded-lg border border-gray-200">
              <div className="w-16 h-16 bg-accent-pink/10 rounded-lg flex items-center justify-center mb-6">
                <Eye className="w-8 h-8 text-accent-pink" />
              </div>
              <h2 className="text-2xl font-bold text-primary-navy mb-4">Vår vision</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Att bli Nordens ledande plattform för företagstransaktioner där varje företagare kan sälja och köpa företag digitalt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Started */}
      <section className="py-24 bg-neutral-off-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-12 rounded-lg border border-gray-200">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <Lightbulb className="w-12 h-12 text-primary-navy" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-primary-navy mb-4">Varför vi startade</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Vi såg hur många små och medelstora företagare som ville sälja sitt livsverk, men saknade en modern, digital plattform för det. De flesta tvingades att engagera dyra traditionella mäklare eller leta långt och brett utan struktur.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Vi tror att teknologi kan göra denna process enklare, snabbare och mer tillgänglig. Därför skapade vi Afterfounder - en plattform som automatiserar det omständiga och låter säljare och köpare fokusera på det som räknas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-neutral-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary-navy mb-6">Teamet bakom Afterfounder</h2>
            <p className="text-xl text-primary-navy">
              Erfarna entreprenörer och tech-builders med passion för M&A
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Erik Andersson',
                title: 'Grundare & VD',
                desc: '15+ år inom M&A och PE. Tidigare Investment Manager på Investor AB.',
                initials: 'EA'
              },
              {
                name: 'Sara Bergström',
                title: 'CTO',
                desc: 'Tech entrepreneur med 12 år erfarenhet. Tidigare Senior Tech Lead på iZettle.',
                initials: 'SB'
              },
              {
                name: 'David Lundström',
                title: 'CFO',
                desc: 'Finansanalytiker. 10 år på Goldman Sachs. Expert på värderingsmodeller.',
                initials: 'DL'
              }
            ].map((member, idx) => (
              <div key={idx} className="bg-neutral-off-white p-10 rounded-lg border border-gray-200 text-center">
                <div className="w-20 h-20 bg-accent-pink/10 rounded-lg flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-accent-pink">
                  {member.initials}
                </div>
                <h3 className="text-xl font-bold text-primary-navy mb-1">{member.name}</h3>
                <div className="text-sm font-semibold text-primary-navy mb-4">{member.title}</div>
                <p className="text-gray-700">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-accent-pink">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-primary-navy mb-16 uppercase">VÅRA VÄRDEN</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'Transparens', desc: 'Vi är öppna och ärliga om hur allt fungerar' },
              { title: 'Trygghet', desc: 'Din data och transaktioner är alltid säkra hos oss' },
              { title: 'Innovation', desc: 'Vi använder teknologi för att lösa verkliga problem' }
            ].map((val, idx) => (
              <div key={idx} className="text-primary-navy">
                <h3 className="text-2xl font-bold mb-3">{val.title}</h3>
                <p className="text-lg">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

