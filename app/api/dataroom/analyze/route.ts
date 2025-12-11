import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

// POST /api/dataroom/analyze
// Trigger AI analysis of a document version
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const body = await request.json()
    const { documentVersionId, dataRoomId } = body

    if (!documentVersionId || !dataRoomId) {
      return NextResponse.json(
        { error: 'documentVersionId och dataRoomId krävs' },
        { status: 400 }
      )
    }

    // Demo mode: return mock analysis
    if (userId.startsWith('demo') || documentVersionId.startsWith('demo')) {
      return NextResponse.json({
        status: 'ok',
        summary: 'Dokumentet ser komplett ut och uppfyller grundläggande DD-krav.',
        score: 85,
        findings: [
          { type: 'success', message: 'Dokumentet innehåller nödvändiga uppgifter' },
          { type: 'info', message: 'Kontrollera att alla perioder är inkluderade' },
        ],
      })
    }

    // Check permission
    const permission = await prisma.dataRoomPermission.findFirst({
      where: {
        dataRoomId,
        userId,
        role: { in: ['OWNER', 'EDITOR'] },
      },
    })

    if (!permission) {
      return NextResponse.json(
        { error: 'Ingen behörighet att analysera dokument' },
        { status: 403 }
      )
    }

    // Get document version
    const docVersion = await prisma.dataRoomDocumentVersion.findUnique({
      where: { id: documentVersionId },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            requirementId: true,
            dataRoom: {
              select: { id: true, listingId: true },
            },
          },
        },
      },
    })

    if (!docVersion) {
      return NextResponse.json(
        { error: 'Dokumentversion hittades inte' },
        { status: 404 }
      )
    }

    // Check dataroom match
    if (docVersion.document.dataRoom.id !== dataRoomId) {
      return NextResponse.json(
        { error: 'Dokumentet tillhör inte detta datarum' },
        { status: 403 }
      )
    }

    // Mark as analyzing
    await prisma.dataRoomDocumentVersion.update({
      where: { id: documentVersionId },
      data: { analysisStatus: 'analyzing' },
    })

    // Run analysis in background (non-blocking)
    runDocumentAnalysis(documentVersionId, docVersion.fileName, docVersion.document.title)
      .catch((err) => console.error('Analysis error:', err))

    return NextResponse.json({
      status: 'analyzing',
      message: 'Analys startad. Resultatet visas inom kort.',
    })
  } catch (error) {
    console.error('Error triggering document analysis:', error)
    return NextResponse.json(
      { error: 'Kunde inte starta analys' },
      { status: 500 }
    )
  }
}

// GET /api/dataroom/analyze?documentVersionId=xxx
// Get analysis status/result for a document version
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentVersionId = searchParams.get('documentVersionId')

    if (!documentVersionId) {
      return NextResponse.json(
        { error: 'documentVersionId krävs' },
        { status: 400 }
      )
    }

    // Demo mode
    if (userId.startsWith('demo') || documentVersionId.startsWith('demo')) {
      return NextResponse.json({
        status: 'ok',
        summary: 'Dokumentet ser komplett ut och uppfyller grundläggande DD-krav.',
        score: 85,
        findings: [
          { type: 'success', message: 'Dokumentet innehåller nödvändiga uppgifter' },
          { type: 'info', message: 'Kontrollera att alla perioder är inkluderade' },
        ],
      })
    }

    const docVersion = await prisma.dataRoomDocumentVersion.findUnique({
      where: { id: documentVersionId },
      select: {
        analysisStatus: true,
        analysisSummary: true,
        analysisFindings: true,
        analysisScore: true,
        analyzedAt: true,
      },
    })

    if (!docVersion) {
      return NextResponse.json(
        { error: 'Dokumentversion hittades inte' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: docVersion.analysisStatus,
      summary: docVersion.analysisSummary,
      score: docVersion.analysisScore,
      findings: docVersion.analysisFindings,
      analyzedAt: docVersion.analyzedAt,
    })
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta analys' },
      { status: 500 }
    )
  }
}

// Background analysis function
async function runDocumentAnalysis(
  documentVersionId: string,
  fileName: string,
  documentTitle: string
) {
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) {
    console.error('OPENAI_API_KEY not configured')
    await prisma.dataRoomDocumentVersion.update({
      where: { id: documentVersionId },
      data: {
        analysisStatus: 'failed',
        analysisSummary: 'AI-analys ej konfigurerad',
      },
    })
    return
  }

  try {
    const client = new OpenAI({ apiKey: openaiApiKey })

    // Determine document type from filename/title for context-aware analysis
    const docContext = getDocumentContext(fileName, documentTitle)

    const systemPrompt = `Du är en erfaren Due Diligence-expert och DD-coach för företagsförsäljningar i Sverige. 
Din uppgift är att analysera uppladdade dokument och ge konstruktiv feedback på om de är kompletta och av god kvalitet för en DD-process.

Dokumenttyp som analyseras: ${docContext.type}
Förväntade innehåll för denna dokumenttyp: ${docContext.expectedContent}

Svara ALLTID på svenska och var konstruktiv. Ge konkret feedback som hjälper säljaren förbättra sin dokumentation.

Svara i följande JSON-format:
{
  "summary": "En kort sammanfattning (max 2 meningar) av dokumentets kvalitet",
  "score": <0-100 poäng baserat på fullständighet och kvalitet>,
  "findings": [
    {"type": "success", "message": "Positiv observation"},
    {"type": "warning", "message": "Något som bör ses över"},
    {"type": "error", "message": "Kritiskt problem som måste åtgärdas"},
    {"type": "info", "message": "Tips eller rekommendation"}
  ]
}

Ge 2-5 findings beroende på dokumentets komplexitet. Var balanserad - inkludera positiva observationer där det är befogat.`

    const userPrompt = `Analysera detta dokument för Due Diligence-processen:

Filnamn: ${fileName}
Dokumenttitel: ${documentTitle}

Baserat på filnamnet och dokumenttypen, bedöm:
1. Är detta rätt typ av dokument för kategorin?
2. Verkar dokumentet komplett baserat på vad man kan förvänta sig?
3. Finns det tecken på att viktig information saknas?
4. Ge konstruktiva tips för att förbättra dokumentationen.

OBS: Du har endast tillgång till metadata (filnamn, titel). Ge feedback baserat på vad du kan utläsa från dessa och allmänna DD-krav för denna dokumenttyp.`

    // Use Responses API with gpt-5.1-mini
    // Note: Falling back to gpt-4o-mini if gpt-5.1-mini not available yet
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Use gpt-5.1-mini when available
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const analysis = JSON.parse(content)

    // Validate and normalize response
    const normalizedFindings = Array.isArray(analysis.findings)
      ? analysis.findings.map((f: any) => ({
          type: ['success', 'warning', 'error', 'info'].includes(f.type)
            ? f.type
            : 'info',
          message: String(f.message || ''),
        }))
      : []

    const score = Math.min(100, Math.max(0, Number(analysis.score) || 50))
    const status = score >= 70 ? 'ok' : 'warnings'

    await prisma.dataRoomDocumentVersion.update({
      where: { id: documentVersionId },
      data: {
        analysisStatus: status,
        analysisSummary: String(analysis.summary || 'Analys slutförd'),
        analysisFindings: normalizedFindings,
        analysisScore: score,
        analyzedAt: new Date(),
      },
    })

    console.log(`Analysis completed for ${documentVersionId}: score=${score}`)
  } catch (error) {
    console.error('Document analysis failed:', error)
    await prisma.dataRoomDocumentVersion.update({
      where: { id: documentVersionId },
      data: {
        analysisStatus: 'failed',
        analysisSummary: 'Analysen kunde inte slutföras. Försök igen.',
      },
    })
  }
}

// Helper: Get document context based on filename/title
function getDocumentContext(fileName: string, title: string): {
  type: string
  expectedContent: string
} {
  const lower = (fileName + ' ' + title).toLowerCase()

  if (lower.includes('huvudbok') || lower.includes('general ledger')) {
    return {
      type: 'Huvudbok / General Ledger',
      expectedContent:
        'Komplett kontolista med saldon, transaktioner per konto, datum, belopp, motpart/beskrivning. Bör täcka minst 3 år.',
    }
  }
  if (lower.includes('balans') || lower.includes('balance sheet')) {
    return {
      type: 'Balansräkning',
      expectedContent:
        'Tillgångar, skulder och eget kapital. Bör visa jämförelsetal från föregående år. Signerad av revisor om tillgängligt.',
    }
  }
  if (lower.includes('resultat') || lower.includes('income') || lower.includes('p&l')) {
    return {
      type: 'Resultaträkning',
      expectedContent:
        'Intäkter, kostnader, rörelseresultat, finansnetto, resultat före/efter skatt. Jämförelsetal. Minst 3 år historik.',
    }
  }
  if (lower.includes('årsredovisning') || lower.includes('annual report')) {
    return {
      type: 'Årsredovisning',
      expectedContent:
        'Förvaltningsberättelse, resultaträkning, balansräkning, noter, revisionsberättelse. Komplett och signerad.',
    }
  }
  if (lower.includes('avtal') || lower.includes('kontrakt') || lower.includes('agreement') || lower.includes('contract')) {
    return {
      type: 'Avtal/Kontrakt',
      expectedContent:
        'Parter, avtalsdatum, löptid, villkor, eventuella ändringsklausuler, underskrifter. Komplett med bilagor.',
    }
  }
  if (lower.includes('kund') || lower.includes('customer')) {
    return {
      type: 'Kunddata/Kundlista',
      expectedContent:
        'Kundnamn, omsättning per kund, avtalsstatus, löptider. Anonymiserat om känsligt. Top 10-20 kunder detaljerat.',
    }
  }
  if (lower.includes('personal') || lower.includes('anställ') || lower.includes('employee')) {
    return {
      type: 'Personaldata',
      expectedContent:
        'Antal anställda, roller, anställningsdatum, lönenivåer (aggregerat), nyckelpersoner, eventuella avtal.',
    }
  }
  if (lower.includes('patent') || lower.includes('varumärke') || lower.includes('ip') || lower.includes('trademark')) {
    return {
      type: 'Immateriella rättigheter (IP)',
      expectedContent:
        'Registreringsnummer, registreringsdatum, giltighetstid, territorium, ägare. Kopior av registreringsbevis.',
    }
  }
  if (lower.includes('budget') || lower.includes('prognos') || lower.includes('forecast')) {
    return {
      type: 'Budget/Prognos',
      expectedContent:
        'Intäkts- och kostnadsprognoser, antaganden bakom siffrorna, månads- eller kvartalsuppdelning, jämförelse med historik.',
    }
  }
  if (lower.includes('skatt') || lower.includes('tax')) {
    return {
      type: 'Skatteunderlag',
      expectedContent:
        'Deklarationer, skattebesked, eventuella pågående skatteärenden, momsredovisningar.',
    }
  }
  if (lower.includes('försäkring') || lower.includes('insurance')) {
    return {
      type: 'Försäkringar',
      expectedContent:
        'Försäkringstyp, försäkringsgivare, täckningsbelopp, premie, giltighetstid, eventuella undantag.',
    }
  }
  if (lower.includes('miljö') || lower.includes('environment')) {
    return {
      type: 'Miljödokumentation',
      expectedContent:
        'Tillstånd, miljörapporter, eventuella anmärkningar eller pågående ärenden, certifieringar.',
    }
  }

  // Default/generic
  return {
    type: 'Allmänt DD-dokument',
    expectedContent:
      'Relevant information för due diligence-processen. Bör vara komplett, daterat och helst signerat där tillämpligt.',
  }
}


