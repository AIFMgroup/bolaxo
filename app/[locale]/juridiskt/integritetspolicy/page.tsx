import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white py-6 sm:py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center text-primary-blue hover:text-blue-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till startsidan
        </Link>

        <div className="card-static">
          <div className="flex items-center mb-6">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary-blue mr-3" />
            <h1 className="text-4xl font-bold text-text-dark">Integritetspolicy</h1>
          </div>
          
          <p className="text-text-gray mb-8">
            Senast uppdaterad: 20 oktober 2025
          </p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">1. Introduktion</h2>
              <p className="text-text-gray leading-relaxed mb-4">
                BOLAXO AB ("BOLAXO", "vi", "oss") värnar om din integritet. Denna policy förklarar hur vi 
                samlar in, använder och skyddar dina personuppgifter i enlighet med GDPR och svensk dataskyddslag.
              </p>
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                <h3 className="font-semibold text-green-800 mb-2">✓ GDPR-kompatibel</h3>
                <p className="text-sm text-green-700 mb-3">
                  Vi följer EU:s dataskyddsförordning (GDPR). Du har rätt att:
                </p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• <Link href="/api/user/export-data" className="underline font-semibold">Exportera din data</Link> (Article 15 & 20)</li>
                  <li>• Radera ditt konto (Article 17) - kontakta privacy@bolaxo.com</li>
                  <li>• Rätta felaktig information</li>
                  <li>• Invända mot behandling</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">2. Personuppgiftsansvarig</h2>
              <div className="bg-light-blue/20 p-4 rounded-card">
                <p className="text-text-dark font-medium">BOLAXO AB</p>
                <p className="text-text-gray">Org.nr: 559123-4567</p>
                <p className="text-text-gray">Regeringsgatan 38, 111 56 Stockholm</p>
                <p className="text-text-gray">E-post: privacy@bolaxo.com</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">3. Vilka uppgifter samlar vi in?</h2>
              <h3 className="text-lg font-semibold text-text-dark mb-3">För alla användare:</h3>
              <ul className="list-disc ml-6 text-text-gray space-y-2 mb-4">
                <li>E-postadress</li>
                <li>Namn och telefonnummer</li>
                <li>IP-adress och teknisk information (cookies)</li>
                <li>Användaraktivitet på plattformen</li>
              </ul>

              <h3 className="text-lg font-semibold text-text-dark mb-3">För säljare:</h3>
              <ul className="list-disc ml-6 text-text-gray space-y-2 mb-4">
                <li>Företagsinformation (org.nr, adress, etc.)</li>
                <li>Finansiell data om företaget som ska säljas</li>
                <li>Dokument uppladdade till datarum</li>
              </ul>

              <h3 className="text-lg font-semibold text-text-dark mb-3">För köpare:</h3>
              <ul className="list-disc ml-6 text-text-gray space-y-2 mb-4">
                <li>Investeringspreferenser</li>
                <li>BankID-uppgifter (om du väljer verifiering)</li>
                <li>Sparade sökningar och bevakningar</li>
              </ul>

              <h3 className="text-lg font-semibold text-text-dark mb-3">För mäklare:</h3>
              <ul className="list-disc ml-6 text-text-gray space-y-2">
                <li>BankID-uppgifter (obligatoriskt)</li>
                <li>Mäklarföretagets org.nr och kontaktuppgifter</li>
                <li>Kundrelationer och annonshantering</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">4. Hur använder vi dina uppgifter?</h2>
              <p className="text-text-gray leading-relaxed mb-3">Vi använder dina personuppgifter för att:</p>
              <ul className="list-disc ml-6 text-text-gray space-y-2">
                <li>Tillhandahålla och förbättra våra tjänster</li>
                <li>Matcha köpare med relevanta annonser</li>
                <li>Hantera NDA-processer och dokumentdelning</li>
                <li>Skicka notifikationer om aktivitet på plattformen</li>
                <li>Förhindra bedrägeri och säkerställa plattformens säkerhet</li>
                <li>Uppfylla rättsliga krav</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">5. Delning med tredje part</h2>
              <p className="text-text-gray leading-relaxed mb-3">
                Vi delar dina personuppgifter endast med:
              </p>
              <ul className="list-disc ml-6 text-text-gray space-y-2">
                <li><strong>Motparter i affärer:</strong> Efter att NDA signerats delar vi information enligt dina inställningar</li>
                <li><strong>Betalpartners:</strong> För att behandla betalningar (Stripe, Klarna)</li>
                <li><strong>BankID:</strong> För verifiering</li>
                <li><strong>Juridiska krav:</strong> Om vi är skyldiga enligt lag</li>
              </ul>
              <p className="text-text-gray leading-relaxed mt-3">
                Vi säljer aldrig dina personuppgifter till tredje part.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">6. Dina rättigheter</h2>
              <p className="text-text-gray leading-relaxed mb-3">
                Enligt GDPR har du rätt att:
              </p>
              <ul className="list-disc ml-6 text-text-gray space-y-2">
                <li><strong>Tillgång:</strong> Begära en kopia av dina personuppgifter</li>
                <li><strong>Rättelse:</strong> Korrigera felaktiga uppgifter</li>
                <li><strong>Radering:</strong> Begära att vi raderar dina uppgifter</li>
                <li><strong>Begränsning:</strong> Begränsa behandlingen av dina uppgifter</li>
                <li><strong>Dataportabilitet:</strong> Få dina uppgifter i maskinläsbart format</li>
                <li><strong>Invändning:</strong> Invända mot viss behandling</li>
              </ul>
              <p className="text-text-gray leading-relaxed mt-3">
                För att utöva dina rättigheter, kontakta privacy@bolaxo.com
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">7. Lagringstid</h2>
              <p className="text-text-gray leading-relaxed">
                Vi lagrar dina personuppgifter så länge som är nödvändigt för att tillhandahålla våra tjänster. 
                Efter att ditt konto raderas sparar vi viss information för bokföringsändamål (7 år enligt lag) 
                och för att förhindra missbruk.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">8. Säkerhet</h2>
              <p className="text-text-gray leading-relaxed">
                Vi använder branschstandard säkerhetsåtgärder inklusive SSL-kryptering, säker datalagring 
                och regelbundna säkerhetsgranskningar. Ingen metod är dock 100% säker.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">9. Cookies</h2>
              <p className="text-text-gray leading-relaxed">
                Vi använder cookies för att förbättra din upplevelse. Läs mer i vår{' '}
                <Link href="/juridiskt/cookies" className="text-primary-blue hover:underline">
                  cookiepolicy
                </Link>.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">10. Ändringar</h2>
              <p className="text-text-gray leading-relaxed">
                Vi kan uppdatera denna policy. Väsentliga ändringar meddelas via e-post 30 dagar i förväg.
              </p>
            </section>

            <section className="pt-8 border-t border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Kontakta oss</h2>
              <p className="text-text-gray leading-relaxed mb-4">
                Har du frågor om hur vi hanterar dina personuppgifter?
              </p>
              <div className="bg-light-blue/20 p-6 rounded-card">
                <p className="text-text-dark font-medium mb-2">Dataskyddsombud:</p>
                <p className="text-text-gray">E-post: privacy@bolaxo.com</p>
                <p className="text-text-gray">Telefon: 08-123 456 78</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

