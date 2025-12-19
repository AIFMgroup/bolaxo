/**
 * NDA Template Generator
 * Genererar professionella NDA-dokument för företagsförmedling
 */

export interface NDATemplateData {
  sellerName: string
  sellerCompany?: string
  buyerName: string
  buyerCompany?: string
  listingTitle: string
  listingId: string
  date: Date
  customTerms?: string[]
}

export function generateNDATemplate(data: NDATemplateData): string {
  const dateStr = data.date.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
SEKRETESSAVTAL (NDA)

Företagsöverlåtelse - Konfidentiellt informationsutbyte

─────────────────────────────────────────────────────────────

Mellan:

Säljare:
${data.sellerCompany ? `${data.sellerCompany}` : ''}
${data.sellerName}
(Listing ID: ${data.listingId})

och

Köpare:
${data.buyerCompany ? `${data.buyerCompany}` : ''}
${data.buyerName}

Datum: ${dateStr}

─────────────────────────────────────────────────────────────

1. BAKGRUND OCH SYFTE

Detta sekretessavtal ("Avtalet") ingås i samband med eventuell förvärv av 
${data.listingTitle} ("Verksamheten"). Syftet är att skydda konfidentiell 
information som utbyts mellan parterna i samband med förhandlingar och 
due diligence-processen.

2. DEFINITION AV KONFIDENTIELL INFORMATION

Konfidentiell information omfattar alla uppgifter, oavsett form, som 
avslöjas av Säljaren till Köparen i samband med denna potentiella affär, 
inklusive men inte begränsat till:

• Företagsnamn, organisationsnummer och fullständig adress
• Exakta ekonomiska nyckeltal (omsättning, resultat, EBITDA, kassaflöde)
• Bokslut, årsredovisningar och ekonomiska rapporter
• Kundlistor, kundavtal och kundrelationer
• Leverantörsavtal och leverantörsrelationer
• Anställda och personalavtal
• Affärshemligheter, processer och know-how
• Marknadsanalys och strategiska planer
• Alla dokument i datarummet
• All annan information som är märkt eller bör anses vara konfidentiell

3. KÖPARENS ÅTAGANDEN

Köparen förbinder sig att:

a) Hålla all konfidentiell information strikt konfidentiell och inte 
   avslöja den för någon tredje part utan Säljarens skriftliga godkännande

b) Endast använda den konfidentiella informationen för utvärdering av 
   denna potentiella affär

c) Endast ge tillgång till konfidentiell information till personer inom 
   Köparens organisation som har ett legitimt behov av att känna till 
   informationen för att utvärdera affären, och endast efter att dessa 
   personer har åtagit sig samma sekretessförpliktelser

d) Vidta alla rimliga försiktighetsåtgärder för att skydda den 
   konfidentiella informationen mot oavsiktlig eller obehörig användning 
   eller avslöjande

e) Om affären inte genomförs, omedelbart returnera eller förstöra all 
   konfidentiell information, inklusive kopior och sammanfattningar, 
   samt bekräfta detta skriftligt till Säljaren

4. UNDANTAG

Detta avtal gäller inte för information som:

a) Redan är allmänt känd eller tillgänglig för allmänheten vid tiden för 
   avslöjandet

b) Redan var känd för Köparen från tidigare källor utan sekretessförpliktelse

c) Lagligen erhållits från en tredje part utan sekretessförpliktelse

d) Måste avslöjas enligt lag eller domstolsbeslut (dock endast efter 
   rimligt varsel till Säljaren)

5. GILTIGHETSTID

Detta avtal träder i kraft vid signering och gäller tills:
• Affären genomförs och avslutas, eller
• 24 månader från datumet för detta avtal, eller
• Tills Köparen skriftligen återför all konfidentiell information

6. SKADESTÅND

Köparen erkänner att överträdelse av detta avtal skulle orsaka irreparabel 
skada för Säljaren och att Säljaren därför har rätt till injunktiv hjälp 
utöver eventuella skadeståndsanspråk.

7. ALLMÄNNA VILLKOR

a) Detta avtal kan inte överlåtas utan Säljarens skriftliga samtycke

b) Detta avtal omfattar hela avtalet mellan parterna rörande ämnet

c) Ändringar av detta avtal måste göras skriftligt och undertecknas av 
   båda parter

d) Om någon del av detta avtal skulle vara ogiltig, påverkar detta inte 
   avtalets övriga delar

${data.customTerms && data.customTerms.length > 0 ? `
8. SÄRSKILDA VILLKOR

${data.customTerms.map((term, i) => `${i + 1}. ${term}`).join('\n')}
` : ''}

─────────────────────────────────────────────────────────────

UNDERSKRIFTER

Säljare:                          Köpare:

${data.sellerName}                ${data.buyerName}
${data.sellerCompany || ''}       ${data.buyerCompany || ''}

Datum: ${dateStr}                 Datum: ${dateStr}

Signature: _______________         Signature: _______________

─────────────────────────────────────────────────────────────

Detta avtal har skapats och signerats digitalt via BOLAXO-plattformen.
`.trim()
}

/**
 * Generate NDA as HTML for display
 */
export function generateNDAHTML(data: NDATemplateData): string {
  const template = generateNDATemplate(data)
  
  return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sekretessavtal - ${data.listingTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    h1 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 30px;
      text-align: center;
      border-bottom: 2px solid #1F3C58;
      padding-bottom: 15px;
    }
    h2 {
      font-size: 18px;
      font-weight: bold;
      margin-top: 30px;
      margin-bottom: 15px;
      color: #1F3C58;
    }
    p {
      margin-bottom: 12px;
    }
    ul {
      margin-left: 20px;
      margin-bottom: 12px;
    }
    li {
      margin-bottom: 8px;
    }
    .signature-section {
      margin-top: 50px;
      border-top: 1px solid #ccc;
      padding-top: 30px;
    }
    .signature-box {
      display: inline-block;
      width: 45%;
      vertical-align: top;
      margin-right: 5%;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 50px;
      padding-top: 5px;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <pre style="font-family: inherit; white-space: pre-wrap;">${template}</pre>
</body>
</html>
  `.trim()
}

/**
 * Generate NDA summary for display in UI
 */
export function generateNDASummary(data: NDATemplateData): {
  title: string
  parties: string
  keyPoints: string[]
  validity: string
} {
  return {
    title: `Sekretessavtal för ${data.listingTitle}`,
    parties: `${data.sellerCompany || data.sellerName} ↔ ${data.buyerCompany || data.buyerName}`,
    keyPoints: [
      'Konfidentiell information skyddas tills affären avslutas eller 24 månader',
      'Endast användning för utvärdering av denna potentiella affär',
      'Returnering/förstöring av information om affär ej genomförs',
      'Sekretessförpliktelse gäller även medarbetare och rådgivare',
    ],
    validity: '24 månader från signering eller tills affären avslutas',
  }
}

