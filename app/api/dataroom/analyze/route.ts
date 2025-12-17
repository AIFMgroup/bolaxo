import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { callLLM, parseJSONResponse, getLLMProviderInfo } from '@/lib/llm-client'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { extractTextFromDocument } from '@/lib/universal-document-reader'

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET = process.env.AWS_S3_BUCKET_NAME || 'trestor-dataroom-prod'

// POST /api/dataroom/analyze
// Trigger AI analysis of a document version
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('afterfounder_user_id')?.value

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

    // Get document version with storage info
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
    runDocumentAnalysis(
      documentVersionId, 
      docVersion.fileName, 
      docVersion.document.title,
      docVersion.storageKey,
      docVersion.mimeType
    ).catch((err) => console.error('Analysis error:', err))

    // Return provider info so frontend knows data handling
    const providerInfo = getLLMProviderInfo()

    return NextResponse.json({
      status: 'analyzing',
      message: 'Analys startad. Dokumentet läses och analyseras...',
      provider: providerInfo.provider,
      secure: providerInfo.secure,
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
    const userId = cookieStore.get('afterfounder_user_id')?.value

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

// Fetch document content from S3
async function fetchDocumentContent(storageKey: string): Promise<Buffer | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: storageKey,
    })
    
    const response = await s3.send(command)
    
    if (!response.Body) {
      console.error('[DD-Coach] No body in S3 response')
      return null
    }
    
    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    for await (const chunk of response.Body as any) {
      chunks.push(chunk)
    }
    
    return Buffer.concat(chunks)
  } catch (error) {
    console.error('[DD-Coach] Error fetching from S3:', error)
    return null
  }
}

// Background analysis function with FULL document content
async function runDocumentAnalysis(
  documentVersionId: string,
  fileName: string,
  documentTitle: string,
  storageKey: string,
  mimeType: string
) {
  try {
    console.log(`[DD-Coach] Starting analysis for ${fileName} (${mimeType})`)
    
    // Determine document type from filename/title for context-aware analysis
    const docContext = getDocumentContext(fileName, documentTitle)
    
    // Try to extract actual document content
    let documentContent = ''
    let extractionMethod = 'metadata-only'
    
    if (storageKey) {
      const fileBuffer = await fetchDocumentContent(storageKey)
      
      if (fileBuffer) {
        try {
          const extraction = await extractTextFromDocument(fileBuffer, fileName, mimeType)
          
          if (extraction.text && extraction.text.length > 50) {
            // Limit content to avoid token limits (max ~8000 chars for analysis)
            documentContent = extraction.text.slice(0, 8000)
            extractionMethod = `${extraction.format} (${extraction.confidence}% confidence)`
            console.log(`[DD-Coach] Extracted ${extraction.text.length} chars from ${extraction.format}`)
          } else {
            console.log(`[DD-Coach] Extraction returned minimal text, using metadata`)
          }
        } catch (extractError) {
          console.error('[DD-Coach] Text extraction failed:', extractError)
        }
      }
    }

    const hasContent = documentContent.length > 100
    
    const systemPrompt = `Du är en erfaren Due Diligence-expert och DD-coach för företagsförsäljningar i Sverige. 
Din uppgift är att analysera uppladdade dokument och ge konstruktiv feedback på om de är kompletta och av god kvalitet för en DD-process.

Dokumenttyp som analyseras: ${docContext.type}
Förväntade innehåll för denna dokumenttyp: ${docContext.expectedContent}

${hasContent ? 'Du har tillgång till dokumentets faktiska innehåll nedan.' : 'Du har endast tillgång till metadata (filnamn, titel).'}

Svara ALLTID på svenska och var konstruktiv. Ge konkret feedback som hjälper säljaren förbättra sin dokumentation.

Svara i följande JSON-format:
{
  "summary": "En kort sammanfattning (max 2 meningar) av dokumentets kvalitet och vad det innehåller",
  "score": <0-100 poäng baserat på fullständighet och kvalitet>,
  "findings": [
    {"type": "success", "message": "Positiv observation om något som är bra"},
    {"type": "warning", "message": "Något som bör ses över eller kompletteras"},
    {"type": "error", "message": "Kritiskt problem som måste åtgärdas"},
    {"type": "info", "message": "Tips eller rekommendation för förbättring"}
  ]
}

Ge 3-6 findings beroende på dokumentets komplexitet. Var balanserad - inkludera positiva observationer där det är befogat.
${hasContent ? 'Basera din analys på det faktiska innehållet i dokumentet.' : ''}`

    let userPrompt = `Analysera detta dokument för Due Diligence-processen:

Filnamn: ${fileName}
Dokumenttitel: ${documentTitle}
Dokumenttyp: ${docContext.type}`

    if (hasContent) {
      userPrompt += `

=== DOKUMENTINNEHÅLL (extraherat) ===
${documentContent}
=== SLUT DOKUMENTINNEHÅLL ===

Baserat på dokumentets FAKTISKA innehåll ovan, analysera:
1. Är dokumentet komplett för sin kategori (${docContext.type})?
2. Vilken information finns och vilken saknas?
3. Är kvaliteten tillräcklig för en professionell DD-process?
4. Finns det specifika problem eller förbättringsområden?
5. Ge konkreta tips för att förbättra dokumentet.`
    } else {
      userPrompt += `

OBS: Dokumentinnehållet kunde inte extraheras. Ge generell feedback baserat på dokumenttypen och filnamnet.

Baserat på filnamnet och dokumenttypen, bedöm:
1. Är detta rätt typ av dokument för kategorin?
2. Vad förväntas typiskt i denna typ av dokument?
3. Ge generella tips för att säkerställa kvalitet.`
    }

    // Call LLM (automatically uses Bedrock or OpenAI based on configuration)
    const response = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 1500 }
    )

    console.log(`[DD-Coach] Analysis completed using ${response.provider} (${response.model}), extraction: ${extractionMethod}`)

    // Parse JSON response
    const analysis = parseJSONResponse(response.content)

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

    // Add extraction info to summary if content was analyzed
    let summary = String(analysis.summary || 'Analys slutförd')
    if (hasContent && !summary.includes('analyserat')) {
      summary = `Dokumentet har analyserats. ${summary}`
    }

    await prisma.dataRoomDocumentVersion.update({
      where: { id: documentVersionId },
      data: {
        analysisStatus: status,
        analysisSummary: summary,
        analysisFindings: normalizedFindings,
        analysisScore: score,
        analyzedAt: new Date(),
      },
    })

    console.log(`[DD-Coach] Analysis saved for ${documentVersionId}: score=${score}, method=${extractionMethod}`)
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
  if (lower.includes('aktiebok') || lower.includes('shareholder') || lower.includes('cap table')) {
    return {
      type: 'Aktiebok / Cap Table',
      expectedContent:
        'Aktieägare, antal aktier per ägare, aktieslag, eventuella optionsprogram, historik över emissioner och överlåtelser.',
    }
  }
  if (lower.includes('bolagsordning') || lower.includes('articles')) {
    return {
      type: 'Bolagsordning',
      expectedContent:
        'Firma, säte, verksamhet, aktiekapital, antal aktier, styrelse, revisorer, räkenskapsår. Aktuell registrerad version.',
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
  if (lower.includes('hyra') || lower.includes('lokaler') || lower.includes('lease') || lower.includes('fastighet')) {
    return {
      type: 'Hyresavtal/Fastigheter',
      expectedContent:
        'Hyresvärd, adress, yta, hyra, löptid, uppsägningstid, eventuella optioner, särskilda villkor.',
    }
  }

  // Default/generic
  return {
    type: 'Allmänt DD-dokument',
    expectedContent:
      'Relevant information för due diligence-processen. Bör vara komplett, daterat och helst signerat där tillämpligt.',
  }
}
