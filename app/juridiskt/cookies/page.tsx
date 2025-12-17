import Link from 'next/link'
import { Cookie, ArrowLeft, CheckCircle, X } from 'lucide-react'

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-white py-6 sm:py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center text-primary-blue hover:text-blue-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till startsidan
        </Link>

        <div className="card-static">
          <div className="flex items-center mb-6">
            <Cookie className="w-6 h-6 sm:w-8 sm:h-8 text-primary-blue mr-3" />
            <h1 className="text-4xl font-bold text-text-dark">Cookiepolicy</h1>
          </div>
          
          <p className="text-text-gray mb-8">
            Senast uppdaterad: 20 oktober 2025
          </p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Vad är cookies?</h2>
              <p className="text-text-gray leading-relaxed">
                Cookies är små textfiler som lagras på din enhet när du besöker en webbplats. De används för 
                att webbplatsen ska fungera korrekt och för att förbättra din användarupplevelse.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Hur använder Afterfounder cookies?</h2>
              
              <div className="space-y-6">
                {/* Necessary Cookies */}
                <div className="border-l-4 border-primary-blue pl-6">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success mr-2" />
                    <h3 className="text-lg font-semibold text-text-dark">Nödvändiga cookies (kan ej avstås)</h3>
                  </div>
                  <p className="text-text-gray mb-3">
                    Dessa cookies är nödvändiga för att plattformen ska fungera:
                  </p>
                  <ul className="list-disc ml-6 text-text-gray space-y-2">
                    <li><strong>Sessionscookies:</strong> Håller dig inloggad under besöket</li>
                    <li><strong>Säkerhetscookies:</strong> Skyddar mot CSRF-attacker</li>
                    <li><strong>Språkinställningar:</strong> Kommer ihåg dina preferenser</li>
                  </ul>
                </div>

                {/* Functional Cookies */}
                <div className="border-l-4 border-blue-400 pl-6">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-blue mr-2" />
                    <h3 className="text-lg font-semibold text-text-dark">Funktionella cookies</h3>
                  </div>
                  <p className="text-text-gray mb-3">
                    Förbättrar funktionalitet och användarupplevelse:
                  </p>
                  <ul className="list-disc ml-6 text-text-gray space-y-2">
                    <li><strong>Autosave:</strong> Sparar dina utkast lokalt</li>
                    <li><strong>Filterpreferenser:</strong> Kommer ihåg dina sökfilter</li>
                    <li><strong>Visningsinställningar:</strong> Layout-preferenser</li>
                  </ul>
                </div>

                {/* Analytics Cookies */}
                <div className="border-l-4 border-yellow-400 pl-6">
                  <div className="flex items-center mb-3">
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-text-gray mr-2" />
                    <h3 className="text-lg font-semibold text-text-dark">Analysinformation (valfritt)</h3>
                  </div>
                  <p className="text-text-gray mb-3">
                    Hjälper oss förstå hur plattformen används (kräver ditt samtycke):
                  </p>
                  <ul className="list-disc ml-6 text-text-gray space-y-2">
                    <li><strong>Google Analytics:</strong> Besöksstatistik och användarmönster</li>
                    <li><strong>Plausible Analytics:</strong> Privacy-friendly alternativ</li>
                    <li><strong>Heatmaps:</strong> Förstå användarinteraktion</li>
                  </ul>
                </div>

                {/* Marketing Cookies */}
                <div className="border-l-4 border-red-400 pl-6">
                  <div className="flex items-center mb-3">
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-text-gray mr-2" />
                    <h3 className="text-lg font-semibold text-text-dark">Marknadsföringscookies (valfritt)</h3>
                  </div>
                  <p className="text-text-gray mb-3">
                    Används för riktad marknadsföring (kräver ditt samtycke):
                  </p>
                  <ul className="list-disc ml-6 text-text-gray space-y-2">
                    <li><strong>Facebook Pixel:</strong> Remarketing och konverteringsspårning</li>
                    <li><strong>LinkedIn Insight:</strong> B2B-marknadsföring</li>
                    <li><strong>Google Ads:</strong> Annonsering och konvertering</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Hantera dina cookie-inställningar</h2>
              <p className="text-text-gray leading-relaxed mb-4">
                Du kan när som helst ändra dina cookie-inställningar i din webbläsare eller via vår cookie-banner 
                längst ner på sidan.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-card">
                <p className="text-sm text-yellow-800">
                  Observera: Om du blockerar nödvändiga cookies kan vissa delar av plattformen sluta fungera.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Lagringstid</h2>
              <ul className="list-disc ml-6 text-text-gray space-y-2">
                <li><strong>Sessionscookies:</strong> Raderas när du stänger webbläsaren</li>
                <li><strong>Funktionella cookies:</strong> 30 dagar</li>
                <li><strong>Analyticscookies:</strong> 12 månader</li>
                <li><strong>Marknadsföringscookies:</strong> 90 dagar</li>
              </ul>
            </section>

            <section className="pt-8 border-t border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Kontakt</h2>
              <p className="text-text-gray leading-relaxed">
                Frågor om cookies? Kontakta privacy@afterfounder.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

