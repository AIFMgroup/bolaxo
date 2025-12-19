import Link from 'next/link'
import { FileText, ArrowLeft } from 'lucide-react'

export default function UserTermsPage() {
  return (
    <main className="min-h-screen bg-white py-6 sm:py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center text-primary-blue hover:text-blue-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till startsidan
        </Link>

        <div className="card-static">
          <div className="flex items-center mb-6">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary-blue mr-3" />
            <h1 className="text-4xl font-bold text-text-dark">Användarvillkor</h1>
          </div>
          
          <p className="text-text-gray mb-8">
            Senast uppdaterad: 20 oktober 2025
          </p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">1. Allmänt</h2>
              <p className="text-text-gray leading-relaxed">
                Dessa användarvillkor ("Villkoren") reglerar din användning av BOLAXO:s plattform och tjänster 
                ("Tjänsten"). Genom att registrera ett konto eller använda Tjänsten godkänner du dessa Villkor.
              </p>
              <p className="text-text-gray leading-relaxed">
                BOLAXO tillhandahålls av BOLAXO AB (org.nr 559123-4567), med säte i Stockholm, Sverige.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">2. Tjänstens omfattning</h2>
              <p className="text-text-gray leading-relaxed mb-3">
                BOLAXO är en digital marknadsplats där säljare kan annonsera företag till försäljning och 
                köpare kan söka efter investeringsmöjligheter. Tjänsten inkluderar:
              </p>
              <ul className="list-disc ml-6 text-text-gray space-y-2">
                <li>Skapa och publicera annonser för företagsförsäljning</li>
                <li>Sök och filtrera bland tillgängliga företag</li>
                <li>NDA-hantering och dokumentdelning</li>
                <li>Kommunikation mellan köpare och säljare</li>
                <li>Datarum för säker dokumenthantering</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">3. Kontoregistrering</h2>
              <p className="text-text-gray leading-relaxed">
                För att använda Tjänsten måste du registrera ett konto. Du ansvarar för att hålla dina 
                inloggningsuppgifter säkra och för all aktivitet som sker via ditt konto.
              </p>
              <p className="text-text-gray leading-relaxed">
                Du måste vara minst 18 år och ha rätt att ingå bindande avtal. För mäklare krävs BankID-verifiering.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">4. Priser och betalning</h2>
              <p className="text-text-gray leading-relaxed mb-3">
                Priser för våra tjänster anges tydligt på plattformen. Betalning kan ske via:
              </p>
              <ul className="list-disc ml-6 text-text-gray space-y-2">
                <li>Kort (Visa, Mastercard) med 3-D Secure</li>
                <li>Faktura med 10 dagars betalningsvillkor</li>
              </ul>
              <p className="text-text-gray leading-relaxed mt-3">
                Alla priser anges exklusive moms (25%). Betalning är bindande och återbetalning sker endast 
                enligt våra returnvillkor (se avsnitt 7).
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">5. Annonsering</h2>
              <p className="text-text-gray leading-relaxed">
                Som säljare ansvarar du för att informationen i din annons är korrekt och inte vilseledande. 
                Du har rätt att vara anonym tills NDA signeras, men måste ändå tillhandahålla korrekta uppgifter.
              </p>
              <p className="text-text-gray leading-relaxed">
                BOLAXO förbehåller sig rätten att granska och vid behov ta bort annonser som bryter mot 
                dessa Villkor eller svensk lag.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">6. NDA och sekretess</h2>
              <p className="text-text-gray leading-relaxed">
                NDA-avtal signerade via plattformen är juridiskt bindande. Båda parter är skyldiga att följa 
                sekretessåtaganden. BOLAXO är inte part i NDA-avtalet utan endast faciliterar signeringen.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">7. Återbetalning och ångerrätt</h2>
              <p className="text-text-gray leading-relaxed">
                Om din annons inte fått några visningar inom 14 dagar från publicering har du rätt till 
                full återbetalning. Efter 14 dagar eller om annonsen fått visningar gäller ingen återbetalningsrätt.
              </p>
              <p className="text-text-gray leading-relaxed">
                Ångerrätt enligt distansavtalslagen gäller ej för tjänster som fullgjorts med ditt samtycke 
                innan ångerfristen löpt ut.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">8. Ansvarsbegränsning</h2>
              <p className="text-text-gray leading-relaxed">
                BOLAXO tillhandahåller en plattform för att koppla samman köpare och säljare. Vi är inte 
                part i transaktionen och tar inget ansvar för:
              </p>
              <ul className="list-disc ml-6 text-text-gray space-y-2">
                <li>Riktighet i annonserad information</li>
                <li>Genomförande av transaktioner</li>
                <li>Tvister mellan köpare och säljare</li>
                <li>Ekonomiska förluster till följd av användarnas beslut</li>
              </ul>
              <p className="text-text-gray leading-relaxed mt-3">
                Vi rekommenderar alltid professionell juridisk och finansiell rådgivning vid företagsförsäljning.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">9. Immateriella rättigheter</h2>
              <p className="text-text-gray leading-relaxed">
                Allt innehåll på plattformen, inklusive design, logotyper, texter och kod, ägs av BOLAXO eller 
                våra licensgivare. Du får inte kopiera, reproducera eller använda vårt material utan tillstånd.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">10. Uppsägning</h2>
              <p className="text-text-gray leading-relaxed">
                Du kan när som helst avsluta ditt konto. BOLAXO förbehåller sig rätten att stänga av konton 
                som bryter mot dessa Villkor.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">11. Ändringar av villkor</h2>
              <p className="text-text-gray leading-relaxed">
                Vi kan uppdatera dessa Villkor från tid till annan. Väsentliga ändringar kommer att meddelas 
                via e-post. Fortsatt användning efter ändringar innebär att du godkänner de nya villkoren.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">12. Tvistlösning och tillämplig lag</h2>
              <p className="text-text-gray leading-relaxed">
                Dessa Villkor regleras av svensk lag. Eventuella tvister ska avgöras av svensk domstol, 
                med Stockholms tingsrätt som första instans.
              </p>
            </section>

            <section className="pt-8 border-t border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Kontakt</h2>
              <p className="text-text-gray leading-relaxed">
                Har du frågor om dessa villkor? Kontakta oss:
              </p>
              <div className="mt-4 space-y-2 text-text-gray">
                <p>E-post: legal@bolaxo.com</p>
                <p>Telefon: 08-123 456 78</p>
                <p>Adress: Regeringsgatan 38, 111 56 Stockholm</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

