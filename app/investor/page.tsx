export default function InvestorPage() {
  return (
    <main className="bg-neutral-white">
      {/* Hero */}
      <section className="py-32 bg-primary-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 uppercase text-white">
            INVESTERA I FRAMTIDENS FÖRETAGSMARKNADSPLATS
          </h1>
          <p className="text-2xl leading-relaxed mb-10 max-w-2xl mx-auto opacity-90">
            Vi digitaliserar en 50 miljarder SEK stor marknad där 10,000+ svenska företag byter ägare varje år.
          </p>
          <button className="px-10 py-4 bg-accent-pink text-primary-navy font-bold rounded-lg hover:shadow-lg transition-all text-lg">
            Ladda ner pitch deck (PDF)
          </button>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-24 bg-neutral-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary-navy mb-6 uppercase">PROBLEMET</h2>
            <p className="text-xl text-primary-navy leading-relaxed max-w-2xl mx-auto">
              Företagsförsäljning är idag dyrt, långsamt och otillgängligt
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-10 border border-gray-200 text-center hover:shadow-lg transition-all">
              <div className="text-6xl font-bold text-primary-navy mb-4">5-10%</div>
              <h3 className="text-2xl font-bold text-primary-navy mb-4">Provision</h3>
              <p className="text-gray-700 leading-relaxed">
                Traditionella mäklare tar 5-10% av försäljningspriset – ofta 500k-2M kr
              </p>
            </div>

            <div className="bg-white rounded-lg p-10 border border-gray-200 text-center hover:shadow-lg transition-all">
              <div className="text-6xl font-bold text-primary-navy mb-4">12-24</div>
              <h3 className="text-2xl font-bold text-primary-navy mb-4">Månader</h3>
              <p className="text-gray-700 leading-relaxed">
                Genomsnittlig tid från första kontakt till avslut. Ineffektiv process.
              </p>
            </div>

            <div className="bg-white rounded-lg p-10 border border-gray-200 text-center hover:shadow-lg transition-all">
              <div className="text-6xl font-bold text-primary-navy mb-4">85%</div>
              <h3 className="text-2xl font-bold text-primary-navy mb-4">Saknar Access</h3>
              <p className="text-gray-700 leading-relaxed">
                Mindre företag (under 10M) har svårt att hitta köpare och betala mäklare
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-24 bg-neutral-off-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary-navy mb-6 uppercase">VÅR LÖSNING</h2>
            <p className="text-xl text-primary-navy leading-relaxed max-w-2xl mx-auto">
              Digital marknadsplats som gör företagsförsäljning transparent och tillgänglig
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-10 border border-gray-200">
              <div className="w-16 h-16 bg-accent-pink/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-primary-navy mb-4">95% lägre kostnad</h3>
              <p className="text-gray-700 leading-relaxed">
                Fast pris 5-20k kr istället för 5-10% provision. Spara miljoner för större affärer.
              </p>
            </div>

            <div className="bg-white rounded-lg p-10 border border-gray-200">
              <div className="w-16 h-16 bg-accent-pink/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-primary-navy mb-4">10x snabbare</h3>
              <p className="text-gray-700 leading-relaxed">
                Genomsnittlig försäljningstid: 2-4 månader istället för 12-24. Digital effektivitet.
              </p>
            </div>

            <div className="bg-white rounded-lg p-10 border border-gray-200">
              <div className="w-16 h-16 bg-accent-pink/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-3xl">🌐</span>
              </div>
              <h3 className="text-2xl font-bold text-primary-navy mb-4">Större räckvidd</h3>
              <p className="text-gray-700 leading-relaxed">
                2,847 registrerade köpare vs en mäklares nätverk på 50-100 kontakter.
              </p>
            </div>

            <div className="bg-white rounded-lg p-10 border border-gray-200">
              <div className="w-16 h-16 bg-accent-pink/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-2xl font-bold text-primary-navy mb-4">NDA-skydd inbyggt</h3>
              <p className="text-gray-700 leading-relaxed">
                Automatiserad hantering av sekretess. Säljare behåller full kontroll.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="py-24 bg-neutral-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary-navy mb-6 uppercase">MARKNADSMÖJLIGHET</h2>
            <p className="text-xl text-primary-navy leading-relaxed">En enorm och växande marknad</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gradient-to-br from-accent-pink/10 to-primary-navy/10 rounded-lg p-10">
              <div className="text-sm font-bold text-accent-pink mb-2">TAM</div>
              <div className="text-5xl font-bold text-primary-navy mb-4">50</div>
              <div className="text-lg font-semibold text-primary-navy mb-2">Mdr kr</div>
              <p className="text-gray-700">
                Årligt transaktionsvärde för svenska företag under 100M kr omsättning
              </p>
            </div>

            <div className="bg-gradient-to-br from-accent-pink/10 to-primary-navy/10 rounded-lg p-10">
              <div className="text-sm font-bold text-accent-pink mb-2">SAM</div>
              <div className="text-5xl font-bold text-primary-navy mb-4">15</div>
              <div className="text-lg font-semibold text-primary-navy mb-2">Mdr kr</div>
              <p className="text-gray-700">
                Företag 1-50M kr som kan använda digital marknadsplats
              </p>
            </div>

            <div className="bg-gradient-to-br from-accent-pink/10 to-primary-navy/10 rounded-lg p-10">
              <div className="text-sm font-bold text-accent-pink mb-2">SOM</div>
              <div className="text-5xl font-bold text-primary-navy mb-4">3</div>
              <div className="text-lg font-semibold text-primary-navy mb-2">Mdr kr</div>
              <p className="text-gray-700">
                Realistisk målmarknad inom 3 år med 20% marknadsandel
              </p>
            </div>
          </div>

          {/* Why Now */}
          <div className="bg-white rounded-lg p-12 border border-gray-200">
            <h3 className="text-3xl font-bold text-primary-navy mb-8 uppercase">Varför nu?</h3>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <span className="text-2xl text-accent-pink">✓</span>
                <div>
                  <div className="font-bold text-primary-navy">Generationsskifte</div>
                  <p className="text-gray-700">40,000+ företagare över 55 år planerar exit inom 5 år</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl text-accent-pink">✓</span>
                <div>
                  <div className="font-bold text-primary-navy">Digital mognad</div>
                  <p className="text-gray-700">BankID och digitala signaturer är nu standard</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl text-accent-pink">✓</span>
                <div>
                  <div className="font-bold text-primary-navy">Kapital tillgängligt</div>
                  <p className="text-gray-700">Rekordmånga private equity-fonder söker svenska SME</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl text-accent-pink">✓</span>
                <div>
                  <div className="font-bold text-primary-navy">Proven model</div>
                  <p className="text-gray-700">Marketplaces fungerar (Hemnet, Blocket) - ingen för företag ännu</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section className="py-24 bg-neutral-off-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary-navy mb-6 uppercase">AFFÄRSMODELL</h2>
            <p className="text-xl text-primary-navy">Transparent och skalbar revenue model</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            <div className="bg-white rounded-lg p-10 border border-gray-200">
              <h3 className="text-2xl font-bold text-primary-navy mb-8 uppercase">Intäktsströmmar</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-primary-navy">Annonspaket</span>
                    <span className="text-primary-navy font-bold">70%</span>
                  </div>
                  <p className="text-gray-700">4,995 - 19,995 kr per annons</p>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-primary-navy">Premium services</span>
                    <span className="text-primary-navy font-bold">20%</span>
                  </div>
                  <p className="text-gray-700">Värdering, rådgivning, extra support</p>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-primary-navy">Partner-intäkter</span>
                    <span className="text-primary-navy font-bold">10%</span>
                  </div>
                  <p className="text-gray-700">Referrals till jurister, värderare, banker</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-10 border border-gray-200">
              <h3 className="text-2xl font-bold text-primary-navy mb-8 uppercase">Unit Economics</h3>
              <div className="space-y-6">
                <div className="flex justify-between">
                  <span className="text-gray-700">Genomsnittlig annonsintäkt</span>
                  <span className="font-bold text-primary-navy text-lg">12,000 kr</span>
                </div>
                <div className="flex justify-between pb-6 border-b border-gray-200">
                  <span className="text-gray-700">CAC (per säljare)</span>
                  <span className="font-bold text-primary-navy text-lg">2,400 kr</span>
                </div>
                <div className="flex justify-between pb-6 border-b border-gray-200">
                  <span className="text-gray-700">LTV (Lifetime Value)</span>
                  <span className="font-bold text-primary-navy text-lg">18,000 kr</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-bold text-primary-navy">LTV/CAC Ratio</span>
                  <span className="font-bold text-accent-pink text-2xl">7.5x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Traction */}
      <section className="py-24 bg-neutral-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary-navy mb-6 uppercase">TRACTION</h2>
            <p className="text-xl text-primary-navy">Stark tillväxt sedan lansering för 8 månader sedan</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary-navy mb-2">127</div>
              <p className="text-gray-700">Aktiva annonser</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary-navy mb-2">2,847</div>
              <p className="text-gray-700">Registrerade köpare</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary-navy mb-2">1,234</div>
              <p className="text-gray-700">NDA-signeringar</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary-navy mb-2">47</div>
              <p className="text-gray-700">Genomförda affärer</p>
            </div>
          </div>

          {/* MRR Chart - simplified */}
          <div className="bg-white rounded-lg p-10 border border-gray-200">
            <h3 className="text-2xl font-bold text-primary-navy mb-6 uppercase">Månatlig tillväxt (MRR)</h3>
            <p className="text-center text-accent-pink font-bold text-xl mb-6">+35% MoM</p>
            <div className="grid grid-cols-8 gap-1">
              {[50, 75, 110, 165, 240, 350, 480, 620].map((val, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-full bg-accent-pink/20 rounded" style={{height: `${(val / 620) * 150}px`}}></div>
                  <span className="text-xs mt-2 text-gray-600">M{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Ask */}
      <section className="py-24 bg-primary-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold mb-12 uppercase">THE ASK</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="text-6xl font-bold text-accent-pink mb-4">12</div>
              <p className="text-xl text-gray-300">MSEK Seed-runda</p>
            </div>
            <div>
              <div className="text-6xl font-bold text-accent-pink mb-4">15%</div>
              <p className="text-xl text-gray-300">Equity</p>
            </div>
            <div>
              <div className="text-6xl font-bold text-accent-pink mb-4">18</div>
              <p className="text-xl text-gray-300">Mån till break-even</p>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-10 mb-10">
            <h3 className="text-2xl font-bold mb-6 uppercase">Kapital används till:</h3>
            <ul className="text-left space-y-4 max-w-2xl mx-auto">
              <li className="flex gap-3">
                <span className="text-accent-pink">•</span>
                <div>
                  <span className="font-bold">40%</span> Marketing & buyer acquisition
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-accent-pink">•</span>
                <div>
                  <span className="font-bold">30%</span> Product development (AI, mobile)
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-accent-pink">•</span>
                <div>
                  <span className="font-bold">20%</span> Team expansion (5 → 15 personer)
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-accent-pink">•</span>
                <div>
                  <span className="font-bold">10%</span> Internationell expansion
                </div>
              </li>
            </ul>
          </div>

          <p className="text-gray-300 mb-6">Kontakta oss: <span className="text-accent-pink font-bold">investors@bolaxo.se</span></p>
        </div>
      </section>
    </main>
  )
}
