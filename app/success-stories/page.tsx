import Link from 'next/link'
import { BarChart3, CheckCircle, DollarSign } from 'lucide-react'

export default function SuccessStoriesPage() {
  return (
    <main className="bg-neutral-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-navy/10 to-accent-pink/10 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-primary-navy mb-6 uppercase">
            Success Stories
          </h1>
          <p className="text-2xl text-primary-navy leading-relaxed">
            Verkliga berättelser från företagare som sålt sina företag via BOLAXO
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Featured Story */}
        <div className="mb-16 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-card hover:shadow-lg transition-shadow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Content */}
            <div className="p-10 lg:p-12">
              <span className="inline-block bg-accent-pink text-primary-navy text-xs font-bold px-4 py-2 rounded-full mb-6">
                DESTACAT
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-navy mb-6 uppercase">
                "Från annons till avslut på 45 dagar"
              </h2>
              <p className="text-lg text-primary-navy leading-relaxed mb-8">
                Johan Andersson, grundare av Digital Konsult AB (IT-konsultbolag, 7.5M omsättning), delar sin resa från att skapa annons till att sälja företaget för 14 MSEK.
              </p>

              <div className="space-y-4 mb-10 pb-10 border-b border-gray-200">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-accent-pink/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-primary-navy">12</span>
                  </div>
                  <div>
                    <div className="font-bold text-primary-navy">NDA-förfrågningar</div>
                    <div className="text-sm text-gray-600">Inom första veckan</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-accent-pink/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-primary-navy">5</span>
                  </div>
                  <div>
                    <div className="font-bold text-primary-navy">Seriösa budgivare</div>
                    <div className="text-sm text-gray-600">Efter DD-process</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-accent-pink/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-primary-navy">14M</span>
                  </div>
                  <div>
                    <div className="font-bold text-primary-navy">Slutpris</div>
                    <div className="text-sm text-gray-600">Mitt i prisintervallet</div>
                  </div>
                </div>
              </div>

              {/* Quote Box */}
              <div className="bg-neutral-off-white p-8 rounded-lg border-l-4 border-accent-pink">
                <div className="space-y-4 text-primary-navy leading-relaxed">
                  <p className="italic">
                    "Jag var skeptisk till att sälja online. Men processen var otroligt smidig. NDA-funktionen gav mig full kontroll – jag kunde vara helt anonym tills jag kände mig trygg."
                  </p>
                  <p className="italic">
                    "Det som imponerade mest var kvaliteten på köparna. Alla hade verifierat sig med BankID och var genuint intresserade. Ingen tid bortkastad på oseriösa förfrågningar."
                  </p>
                  <p className="italic">
                    "Sparade minst 500,000 kr i mäklarkostnader och fick ett bättre pris än jag vågat hoppas på. Klart värt varje krona av Featured-paketet."
                  </p>
                </div>
              </div>

              {/* Author */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-accent-pink rounded-full flex items-center justify-center text-white font-bold text-xl">
                    JA
                  </div>
                  <div>
                    <div className="font-bold text-primary-navy">Johan Andersson</div>
                    <div className="text-sm text-gray-600">Grundare, Digital Konsult AB</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Sidebar */}
            <div className="bg-gradient-to-br from-primary-navy/5 to-accent-pink/5 p-10 lg:p-12 flex flex-col justify-center">
              <div className="space-y-8">
                <div>
                  <div className="text-5xl font-bold text-primary-navy mb-2">14</div>
                  <div className="text-xl font-semibold text-primary-navy mb-1">MSEK</div>
                  <p className="text-gray-600">Försäljningspris</p>
                </div>
                <div>
                  <div className="text-5xl font-bold text-primary-navy mb-2">45</div>
                  <div className="text-xl font-semibold text-primary-navy mb-1">dagar</div>
                  <p className="text-gray-600">Från annons till avslut</p>
                </div>
                <div>
                  <div className="text-5xl font-bold text-primary-navy mb-2">3</div>
                  <div className="text-xl font-semibold text-primary-navy mb-1">veckor</div>
                  <p className="text-gray-600">Till första erbjudande</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More Stories */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-primary-navy mb-12 uppercase">Fler Success Stories</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Story 1 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-accent-pink/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary-navy">18</span>
              </div>
              <h3 className="text-xl font-bold text-primary-navy mb-3">Hittade mitt drömobjekt</h3>
              <p className="text-gray-700 mb-6">
                "Jag hade sökt efter e-handelsföretag i över ett år utan resultat. På BOLAXO hittade jag perfekt match på första dagen."
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Köpesumma</span><span className="font-bold text-primary-navy">18M</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Objekt jämförda</span><span className="font-bold text-primary-navy">8</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Dagar till deal</span><span className="font-bold text-primary-navy">60</span></div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-primary-navy">Maria Lindström</p>
                <p className="text-xs text-gray-600">E-handelsentreprenör</p>
              </div>
            </div>

            {/* Story 2 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-accent-pink/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary-navy">12</span>
              </div>
              <h3 className="text-xl font-bold text-primary-navy mb-3">NDA-förfrågningar första veckan</h3>
              <p className="text-gray-700 mb-6">
                "Trodde det skulle ta år att sälja min restaurang. Fick 12 NDA-förfrågningar första veckan och sålde efter 8 veckor."
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Köpesumma</span><span className="font-bold text-primary-navy">3.2M</span></div>
                <div className="flex justify-between"><span className="text-gray-600">NDA-förfrågningar</span><span className="font-bold text-primary-navy">12</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Veckor till deal</span><span className="font-bold text-primary-navy">8</span></div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-primary-navy">Per Eriksson</p>
                <p className="text-xs text-gray-600">Restauranglich</p>
              </div>
            </div>

            {/* Story 3 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-accent-pink/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary-navy">5</span>
              </div>
              <h3 className="text-xl font-bold text-primary-navy mb-3">Seriösa budgivare på första veckan</h3>
              <p className="text-gray-700 mb-6">
                "Dataroom-funktionen gjorde det enkelt att dela dokument säkert. Processen var transparent från start."
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Köpesumma</span><span className="font-bold text-primary-navy">8.5M</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Intressenter</span><span className="font-bold text-primary-navy">5</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Veckor till deal</span><span className="font-bold text-primary-navy">6</span></div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-primary-navy">Sofia Chen</p>
                <p className="text-xs text-gray-600">Tech-grundare</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-primary-navy text-white rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-12 uppercase">Samlad statistik</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="text-5xl font-bold text-accent-pink mb-2">580M</div>
              <p className="text-lg text-gray-300">Totalt transaktionsvärde</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent-pink mb-2">74</div>
              <p className="text-lg text-gray-300">Genomsnittlig försäljningstid (dagar)</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent-pink mb-2">8.2</div>
              <p className="text-lg text-gray-300">NDA-förfrågningar per annons</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent-pink mb-2">92%</div>
              <p className="text-lg text-gray-300">Nöjda säljare (4.6/5)</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h2 className="text-4xl font-bold text-primary-navy mb-6 uppercase">Vill du bli nästa success story?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/salja/start" className="inline-block px-8 py-4 bg-accent-pink text-primary-navy font-bold rounded-lg hover:shadow-lg transition-all">
              Börja sälja
            </Link>
            <Link href="/sok" className="inline-block px-8 py-4 bg-primary-navy text-white font-bold rounded-lg hover:shadow-lg transition-all">
              Hitta nästa företag
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

