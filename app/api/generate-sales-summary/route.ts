import { NextResponse } from 'next/server'
import { callOpenAIResponses, OpenAIResponseError } from '@/lib/openai-response-utils'

type CategoryType = 'financialDocs' | 'businessRelations' | 'keyPerson' | 'balanceSheet' | 'legalDocs'

const categoryPrompts: Record<CategoryType, (data: any, scrapedData: any) => string> = {
  financialDocs: (data, scrapedData) => `
Skapa en professionell sammanfattning av företagets finansiella dokumentation baserat på följande information:

FÖRETAGSINFORMATION (från webbskrapning):
${scrapedData?.description || 'Ingen beskrivning tillgänglig'}
Bransch: ${scrapedData?.industry || 'Okänd'}
Anställda: ${scrapedData?.employees || 'Okänt'}

FINANSIELL DATA SOM ANGETTS:
- Omsättning senaste 3 åren: ${data.revenue3Years || 'Ej angivet'}
- Resultat senaste 3 åren: ${data.profit3Years || 'Ej angivet'}
- Reviderade årsredovisningar: ${data.hasAuditedReports ? 'Ja' : 'Nej'}
- Månadsrapporter tillgängliga: ${data.hasMonthlyReports ? 'Ja' : 'Nej'}
- Budget och prognoser: ${data.budgetAvailable ? 'Ja' : 'Nej'}
- Antal år med prognoser: ${data.forecastYears || 'Ej angivet'}
- EBITDA-justeringar: ${data.ebitdaNotes || 'Inga angivna'}
- Engångsposter: ${data.oneTimeItems || 'Inga angivna'}

Skriv en professionell, kortfattad sammanfattning (3-5 meningar) som kan användas i ett försäljningsmemorandum. 
Fokusera på styrkor och identifiera eventuella områden att förbättra.
Skriv på svenska, professionellt men inte för formellt.
`,

  businessRelations: (data, scrapedData) => `
Skapa en professionell sammanfattning av företagets affärsrelationer baserat på följande information:

FÖRETAGSINFORMATION:
${scrapedData?.description || 'Ingen beskrivning tillgänglig'}
Kunder: ${scrapedData?.customers || 'Okänt'}
Platser: ${scrapedData?.locations?.join(', ') || 'Okänt'}

AFFÄRSRELATIONSDATA:
Största kunder:
${data.topCustomers?.filter((c: any) => c.name).map((c: any) => `- ${c.name}: ${c.percentage}% av omsättningen`).join('\n') || 'Inga angivna'}

Kundkoncentrationsrisk: ${data.customerConcentrationRisk === 'low' ? 'Låg' : data.customerConcentrationRisk === 'medium' ? 'Medel' : data.customerConcentrationRisk === 'high' ? 'Hög' : 'Ej bedömd'}
Viktiga leverantörer: ${data.keySuppliers || 'Ej angivet'}
Exklusivitetsavtal: ${data.exclusivityAgreements || 'Inga'}
Informella överenskommelser att formalisera: ${data.informalAgreements || 'Inga'}

Skriv en professionell sammanfattning (3-5 meningar) som beskriver kundbasen och leverantörsrelationerna.
Identifiera styrkor och eventuella risker relaterade till kundkoncentration.
Skriv på svenska.
`,

  keyPerson: (data, scrapedData) => `
Skapa en professionell sammanfattning av företagets nyckelpersonberoende baserat på följande information:

FÖRETAGSINFORMATION:
${scrapedData?.description || 'Ingen beskrivning tillgänglig'}

NYCKELPERSONDATA:
- Ägarens betydelse för verksamheten: ${data.ownerInvolvement === 'critical' ? 'Kritisk - verksamheten stannar utan ägaren' : data.ownerInvolvement === 'high' ? 'Hög - involverad i de flesta beslut' : data.ownerInvolvement === 'medium' ? 'Medel - delegerar men övervakar' : data.ownerInvolvement === 'low' ? 'Låg - verksamheten fungerar utan ägaren' : 'Ej bedömd'}
- Dokumenterade processer: ${data.documentedProcesses ? 'Ja' : 'Nej'}
- Backup-personer för kritiska roller: ${data.backupPersons ? 'Ja' : 'Nej'}
- Ledningsgrupp: ${data.managementTeam || 'Ej beskriven'}
- Övergångsplan: ${data.transitionPlan || 'Ej beskriven'}

Skriv en professionell sammanfattning (3-5 meningar) som beskriver nyckelpersonberoendet.
Inkludera en bedömning av risknivån och eventuella rekommendationer för att minska beroendet.
Skriv på svenska.
`,

  balanceSheet: (data, scrapedData) => `
Skapa en professionell sammanfattning av företagets balansräkningsposition baserat på följande information:

FÖRETAGSINFORMATION:
${scrapedData?.description || 'Ingen beskrivning tillgänglig'}

BALANSRÄKNINGSDATA:
- Lån till ägare/närstående: ${data.loansToOwners || 'Inga'}
- Icke-operativa tillgångar: ${data.nonOperatingAssets || 'Inga'}
- Lagerstatus: ${data.inventoryStatus || 'Ej beskriven'}
- Kundfordringar: ${data.receivablesStatus || 'Ej beskrivet'}
- Skulder att reglera: ${data.liabilitiesToClean || 'Inga'}

Skriv en professionell sammanfattning (3-5 meningar) som beskriver balansräkningens skick inför en försäljning.
Identifiera poster som kan behöva åtgärdas och ge en övergripande bedömning.
Skriv på svenska.
`,

  legalDocs: (data, scrapedData) => `
Skapa en professionell sammanfattning av företagets juridiska dokumentation baserat på följande information:

FÖRETAGSINFORMATION:
${scrapedData?.description || 'Ingen beskrivning tillgänglig'}

JURIDISK DOKUMENTATION:
- Bolagsordning uppdaterad: ${data.articlesOfAssociationUpdated ? 'Ja' : 'Nej'}
- Aktiebok komplett: ${data.shareRegisterComplete ? 'Ja' : 'Nej'}
- Styrelsebeslut arkiverade: ${data.boardMinutesArchived ? 'Ja' : 'Nej'}
- Ägaravtal granskade: ${data.ownerAgreementsReviewed ? 'Ja' : 'Nej'}
- Tillstånd verifierade: ${data.permitsVerified ? 'Ja' : 'Nej'}
- Pågående juridiska frågor: ${data.pendingLegalIssues || 'Inga'}

Skriv en professionell sammanfattning (3-5 meningar) som beskriver statusen för juridisk dokumentation.
Identifiera eventuella brister som behöver åtgärdas före en försäljning.
Skriv på svenska.
`
}

export async function POST(request: Request) {
  try {
    const { category, categoryData, scrapedData, companyName } = await request.json()

    if (!category || !categoryData) {
      return NextResponse.json(
        { error: 'Kategori och data krävs' },
        { status: 400 }
      )
    }

    const validCategories: CategoryType[] = ['financialDocs', 'businessRelations', 'keyPerson', 'balanceSheet', 'legalDocs']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Ogiltig kategori' },
        { status: 400 }
      )
    }

    console.log('[GENERATE] Starting summary generation for category:', category)

    const prompt = categoryPrompts[category as CategoryType](categoryData, {
      ...scrapedData?.combined,
      companyName
    })

    const { text } = await callOpenAIResponses({
      model: 'gpt-5.1-mini',
      messages: [
        {
          role: 'system',
          content: `Du är en erfaren svensk M&A-rådgivare som hjälper företagsägare att förbereda sina företag för försäljning. 
Du skriver professionella men lättlästa sammanfattningar som kan användas i försäljningsdokumentation.
Var konstruktiv och identifiera både styrkor och förbättringsområden.
Skriv alltid på flytande svenska.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      metadata: {
        feature: 'sales-process-summary'
      }
    })

    console.log('[GENERATE] Summary generated successfully')

    return NextResponse.json({
      success: true,
      summary: text
    })
  } catch (error) {
    if (error instanceof OpenAIResponseError) {
      console.error('[GENERATE] OpenAI error:', error.status, error.body)
    } else {
      console.error('[GENERATE] Error:', error)
    }
    
    return NextResponse.json(
      { error: 'Ett fel uppstod vid generering av sammanfattning' },
      { status: 500 }
    )
  }
}

