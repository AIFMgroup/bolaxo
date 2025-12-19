import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Download, Mail } from 'lucide-react'

export default function GDPRPage() {
  return (
    <main className="min-h-screen bg-white py-6 sm:py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center text-primary-blue hover:text-blue-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till startsidan
        </Link>

        <div className="card-static">
          <div className="flex items-center mb-6">
            <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary-blue mr-3" />
            <h1 className="text-4xl font-bold text-text-dark">GDPR & Dataskydd</h1>
          </div>
          
          <p className="text-text-gray mb-8">
            Information om hur BOLAXO hanterar dina personuppgifter enligt GDPR
          </p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Vårt åtagande</h2>
              <p className="text-text-gray leading-relaxed">
                BOLAXO följer EU:s dataskyddsförordning (GDPR) och svensk dataskyddslag. Vi behandlar dina 
                personuppgifter med största försiktighet och transparens.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Rättslig grund för behandling</h2>
              <div className="space-y-4">
                <div className="bg-light-blue/20 p-4 rounded-card">
                  <h3 className="font-semibold text-text-dark mb-2">Avtalsuppfyllelse</h3>
                  <p className="text-text-gray text-sm">
                    För att tillhandahålla våra tjänster enligt användaravtalet
                  </p>
                </div>
                <div className="bg-light-blue/20 p-4 rounded-card">
                  <h3 className="font-semibold text-text-dark mb-2">Berättigat intresse</h3>
                  <p className="text-text-gray text-sm">
                    För att förbättra tjänsten, förhindra missbruk och marknadsföring
                  </p>
                </div>
                <div className="bg-light-blue/20 p-4 rounded-card">
                  <h3 className="font-semibold text-text-dark mb-2">Samtycke</h3>
                  <p className="text-text-gray text-sm">
                    För marknadsföring, analytics och icke-nödvändiga cookies
                  </p>
                </div>
                <div className="bg-light-blue/20 p-4 rounded-card">
                  <h3 className="font-semibold text-text-dark mb-2">Rättslig förpliktelse</h3>
                  <p className="text-text-gray text-sm">
                    För bokföring, skatter och andra lagkrav
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Dina rättigheter enligt GDPR</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-white">
                  <h3 className="font-semibold text-text-dark mb-2">Rätt till tillgång (Art. 15)</h3>
                  <p className="text-text-gray text-sm">
                    Begär en kopia av alla personuppgifter vi har om dig
                  </p>
                </div>
                <div className="card bg-white">
                  <h3 className="font-semibold text-text-dark mb-2">Rätt till rättelse (Art. 16)</h3>
                  <p className="text-text-gray text-sm">
                    Korrigera felaktiga eller ofullständiga uppgifter
                  </p>
                </div>
                <div className="card bg-white">
                  <h3 className="font-semibold text-text-dark mb-2">Rätt till radering (Art. 17)</h3>
                  <p className="text-text-gray text-sm">
                    Begär att vi raderar dina personuppgifter
                  </p>
                </div>
                <div className="card bg-white">
                  <h3 className="font-semibold text-text-dark mb-2">Rätt till begränsning (Art. 18)</h3>
                  <p className="text-text-gray text-sm">
                    Begränsa hur vi behandlar dina uppgifter
                  </p>
                </div>
                <div className="card bg-white">
                  <h3 className="font-semibold text-text-dark mb-2">Rätt till dataportabilitet (Art. 20)</h3>
                  <p className="text-text-gray text-sm">
                    Få dina uppgifter i maskinläsbart format
                  </p>
                </div>
                <div className="card bg-white">
                  <h3 className="font-semibold text-text-dark mb-2">Rätt att göra invändningar (Art. 21)</h3>
                  <p className="text-text-gray text-sm">
                    Invända mot viss behandling av dina uppgifter
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Så utövar du dina rättigheter</h2>
              <p className="text-text-gray leading-relaxed mb-4">
                För att utöva någon av dina rättigheter, kontakta oss via:
              </p>
              <div className="flex gap-4">
                <button className="btn-primary flex items-center">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Skicka förfrågan via e-post
                </button>
                <button className="btn-secondary flex items-center">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Ladda ner dina data
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Dataöverföringar utanför EU</h2>
              <p className="text-text-gray leading-relaxed">
                Vi använder tjänsteleverantörer som kan lagra data utanför EU/EES (t.ex. USA). 
                I sådana fall säkerställer vi adekvat skyddsnivå genom:
              </p>
              <ul className="list-disc ml-6 text-text-gray space-y-2 mt-3">
                <li>EU:s standardavtalsklausuler (SCC)</li>
                <li>EU-US Data Privacy Framework</li>
                <li>Certifieringar som Privacy Shield-efterföljare</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Klagomål till tillsynsmyndighet</h2>
              <p className="text-text-gray leading-relaxed mb-4">
                Du har alltid rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY) om du anser 
                att vi behandlar dina personuppgifter felaktigt.
              </p>
              <div className="bg-light-blue/20 p-6 rounded-card">
                <p className="text-text-dark font-medium mb-2">Integritetsskyddsmyndigheten (IMY)</p>
                <p className="text-text-gray text-sm">Webbplats: www.imy.se</p>
                <p className="text-text-gray text-sm">E-post: imy@imy.se</p>
                <p className="text-text-gray text-sm">Telefon: 08-657 61 00</p>
              </div>
            </section>

            <section className="pt-8 border-t border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Kontakta oss</h2>
              <div className="bg-primary-blue/5 p-6 rounded-card">
                <p className="text-text-dark font-medium mb-4">För alla GDPR-relaterade frågor:</p>
                <p className="text-text-gray">E-post: privacy@bolaxo.com</p>
                <p className="text-text-gray">Telefon: 08-123 456 78</p>
                <p className="text-text-gray">Post: BOLAXO AB, Regeringsgatan 38, 111 56 Stockholm</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

