/**
 * SPA (Share Purchase Agreement) Generator
 * Genererar ett köpeavtal baserat på transaction data
 * 
 * OBS: Detta är en TEMPLATE. Måste granskas av advokat innan produktion.
 */

interface SPAData {
  // Parter
  sellerName: string
  sellerOrgNumber: string
  sellerAddress: string
  buyerName: string
  buyerOrgNumber: string
  buyerAddress: string
  
  // Företag som säljs
  companyName: string
  companyOrgNumber: string
  companyAddress: string
  
  // Deal terms
  agreedPrice: number
  depositAmount: number
  closingDate: string
  
  // Överlåtelse
  numberOfShares: number
  shareNominalValue: number
  transferMethod: 'shares' | 'assets'
  
  // Villkor
  conditions?: string
  earnOut?: {
    enabled: boolean
    amount?: number
    terms?: string
  }
}

export function generateSPAText(data: SPAData): string {
  const today = new Date().toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
═══════════════════════════════════════════════════════════════
                    AKTIEÖVERLÅTELSEAVTAL
                  (Share Purchase Agreement)
═══════════════════════════════════════════════════════════════

Upprättat: ${today}
Genererat via: BOLAXO Deal Management Platform

⚠️  JURIDISK GRANSKNING KRÄVS
Detta dokument är en MALL och måste granskas av advokat innan signering.
BOLAXO AB tar inget juridiskt ansvar för innehållet.

═══════════════════════════════════════════════════════════════


1. PARTER

1.1 Säljare
${data.sellerName}
Org.nr: ${data.sellerOrgNumber}
Adress: ${data.sellerAddress}
("Säljaren")

1.2 Köpare
${data.buyerName}
Org.nr: ${data.buyerOrgNumber}
Adress: ${data.buyerAddress}
("Köparen")


2. ÖVERLÅTELSEOBJEKT

2.1 Bolaget
Säljaren äger aktier i:
${data.companyName}
Org.nr: ${data.companyOrgNumber}
Adress: ${data.companyAddress}
("Bolaget")

2.2 Aktierna
Antal aktier: ${data.numberOfShares}
Kvotvärde: ${data.shareNominalValue} SEK per aktie
Överlåtelseform: ${data.transferMethod === 'shares' ? 'Aktieöverlåtelse' : 'Inkråmsöverlåtelse'}


3. KÖPESKILLING

3.1 Överenskommet pris
Köpeskillingen för Aktierna uppgår till:
${(data.agreedPrice / 1000000).toFixed(2)} MSEK (${data.agreedPrice.toLocaleString('sv-SE')} SEK)

3.2 Betalning
a) Handpenning: ${(data.depositAmount / 1000000).toFixed(2)} MSEK ska betalas till depositionskonto senast 5 bankdagar efter signering.
b) Slutbetalning: ${((data.agreedPrice - data.depositAmount) / 1000000).toFixed(2)} MSEK ska betalas på Tillträdesdagen.

${data.earnOut?.enabled ? `
3.3 Earn-out
Utöver fast köpeskilling kan tilläggsköpeskilling utgå enligt följande:
Maxbelopp: ${((data.earnOut.amount || 0) / 1000000).toFixed(2)} MSEK
Villkor: ${data.earnOut.terms || 'Se bilaga A'}
` : ''}


4. TILLTRÄDE

4.1 Tillträdesdatum
Tillträde ska ske: ${data.closingDate}

4.2 Villkor för tillträde
Följande villkor ska vara uppfyllda för att tillträde ska ske:
a) Godkänd due diligence
b) Inga väsentliga negativa förändringar sedan signering (MAC-klausul)
c) Styrelseprotokoll som godkänner överlåtelsen
d) Handpenning mottagen på depositionskonto
${data.conditions ? `e) ${data.conditions}` : ''}


5. FÖRSÄKRINGAR OCH GARANTIER

5.1 Säljarens försäkringar
Säljaren försäkrar att:
a) Säljaren är laglig ägare till Aktierna
b) Aktierna är fria från panträtt och andra belastningar
c) Bolaget är korrekt registrerat och aktivt
d) Inga dolda skulder eller förpliktelser utöver vad som framgår av årsredovisning
e) Inga pågående tvister eller anspråk mot Bolaget
f) All väsentlig information har lämnats till Köparen

5.2 Köparens försäkringar
Köparen försäkrar att:
a) Köparen har finansiering för köpeskillingen
b) Köparen har erhållit alla nödvändiga godkännanden


6. ANSVARSBEGRÄNSNING

6.1 Tidsfrister för anspråk
Anspråk p.g.a. brott mot Säljarens försäkringar ska framställas senast:
- Skattefrågor: 6 år från Tillträdesdagen
- Övriga frågor: 18 månader från Tillträdesdagen

6.2 Beloppsbegränsning
Säljarens totala ansvar är begränsat till köpeskillingen.
Inget ansvar föreligger för belopp under 50 000 SEK per anspråk.


7. SEKRETESS

Parterna förbinder sig att hemlighålla villkoren i detta avtal.
Undantag: När lag eller myndighet kräver information.


8. ÖVERLÅTELSE AV AKTIER

8.1 Aktiebrev och avstämningsförbehåll
Säljaren ska på Tillträdesdagen överlämna:
- Aktiebrev eller motsvarande
- Bolagsordning
- Aktiebok
- Registreringsbevis från Bolagsverket
- Protokoll från bolagsstämma som godkänner överlåtelsen

8.2 Registrering
Köparen ansvarar för att anmäla ägarbyte till Bolagsverket.


9. ÖVRIGT

9.1 Tillämlig lag
Detta avtal ska regleras av svensk rätt.

9.2 Tvistlösning
Tvist ska avgöras av Stockholms tingsrätt som första instans.

9.3 Ändringar
Ändringar i avtalet ska vara skriftliga och undertecknade av båda parter.

9.4 Kostnader
Vardera part bär sina egna kostnader för rådgivare och transaktionen.


10. SIGNATURER

Detta avtal har upprättats i två exemplar, varav parterna tagit var sitt.


För Säljaren:

_________________________________
${data.sellerName}
Datum: ________________


För Köparen:

_________________________________
${data.buyerName}
Datum: ________________


═══════════════════════════════════════════════════════════════

Genererat av: BOLAXO Deal Management Platform
Datum: ${today}
Transaction ID: [Kommer från systemet]

OBS: Detta är en förenklad mall. För komplex transaktion (earn-out, 
warranty insurance, escrow-arrangemang, mm) rekommenderas jurist.

Rekommenderade advokatbyråer för granskning:
- Setterwalls: 08-598 890 00
- Vinge: 08-614 30 00
- Delphi: 08-665 78 00

═══════════════════════════════════════════════════════════════
`
}

// Generera SPA som downloadbar text-fil (i produktion: PDF med pdfkit)
export function generateSPAFile(data: SPAData): { content: string; filename: string } {
  const content = generateSPAText(data)
  const filename = `SPA_${data.companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`
  
  return { content, filename }
}

// Validera att all nödvändig data finns
export function validateSPAData(data: Partial<SPAData>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.sellerName) errors.push('Säljarens namn saknas')
  if (!data.buyerName) errors.push('Köparens namn saknas')
  if (!data.companyName) errors.push('Bolagets namn saknas')
  if (!data.agreedPrice || data.agreedPrice <= 0) errors.push('Köpeskilling saknas')
  if (!data.closingDate) errors.push('Tillträdesdatum saknas')
  
  return {
    valid: errors.length === 0,
    errors
  }
}

