import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { REQUIREMENTS, RequirementCategory } from '@/lib/readiness/requirements'
import { callLLM, parseJSONResponse, getLLMProviderInfo } from '@/lib/llm-client'
import { extractTextFromDocument, splitTextForGPT } from '@/lib/universal-document-reader'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

const CATEGORY_META_LABELS: Record<RequirementCategory, string> = {
  finans: 'Finansiellt',
  skatt: 'Skatte-relaterat',
  juridik: 'Juridiskt',
  hr: 'HR-relaterat',
  kommersiellt: 'Kommersiellt',
  it: 'IT-relaterat',
  operation: 'Operationellt',
}

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'trestor-dataroom-prod'

interface AnalysisFinding {
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  description: string
}

interface AnalysisResult {
  score: number // 0-100
  status: 'approved' | 'needs_review' | 'rejected'
  summary: string
  findings: AnalysisFinding[]
  suggestedCategory: RequirementCategory | null
  suggestedPeriodYear: number | null
  isSigned: boolean
  missingElements: string[]
  recommendations: string[]
}

// Build the DD expert prompt
function buildSystemPrompt(): string {
  const requirementsContext = REQUIREMENTS.map(r => ({
    id: r.id,
    category: r.category,
    title: r.title,
    description: r.description,
    mandatory: r.mandatory,
  }))

  return `Du är en erfaren Due Diligence-expert specialiserad på företagsförsäljningar i Sverige. Din uppgift är att granska dokument som företagare laddar upp inför en potentiell försäljning.

Du ska:
1. Analysera dokumentets innehåll noggrant
2. Identifiera vad dokumentet är (årsredovisning, huvudbok, avtal, etc.)
3. Bedöma om dokumentet är komplett och uppfyller DD-krav
4. Ge konkret feedback på vad som saknas eller behöver förbättras
5. Ge ett poäng (0-100) baserat på dokumentets DD-kvalitet

Viktiga DD-krav för svenska företag:
${JSON.stringify(requirementsContext, null, 2)}

Var konstruktiv och specifik i din feedback. Fokusera på:
- Saknas någon viktig information?
- Är perioderna/datumen korrekta och aktuella?
- Är dokumentet signerat (om det krävs)?
- Stämmer siffrorna överens?
- Finns det några varningssignaler?

Svara ALLTID på svenska.`
}

function buildUserPrompt(fileName: string, mimeType: string, textContent: string): string {
  return `Analysera följande dokument för Due Diligence:

**Filnamn:** ${fileName}
**Filtyp:** ${mimeType}

**Dokumentinnehåll:**
${textContent.substring(0, 15000)}
${textContent.length > 15000 ? '\n\n[...dokumentet trunkerat, visa endast de första 15000 tecknen...]' : ''}

Ge din analys i följande JSON-format:
{
  "score": <0-100 poäng>,
  "status": "<approved|needs_review|rejected>",
  "summary": "<kort sammanfattning av dokumentet på 1-2 meningar>",
  "findings": [
    {"type": "<success|warning|error|info>", "title": "<kort titel>", "description": "<beskrivning>"}
  ],
  "suggestedCategory": "<finans|skatt|juridik|hr|kommersiellt|it|operation eller null>",
  "suggestedPeriodYear": <årtal eller null>,
  "isSigned": <true|false>,
  "missingElements": ["<sak som saknas 1>", "<sak som saknas 2>"],
  "recommendations": ["<rekommendation 1>", "<rekommendation 2>"]
}

Var noggrann och specifik. Om du hittar problem, förklara exakt vad som är fel och hur det kan åtgärdas.`
}

// Fetch file from S3
async function fetchFileFromS3(s3Key: string): Promise<Buffer> {
  const key = s3Key.startsWith('s3://') 
    ? s3Key.replace(`s3://${BUCKET_NAME}/`, '')
    : s3Key

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const response = await s3Client.send(command)
  
  if (!response.Body) {
    throw new Error('Empty file from S3')
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

// POST /api/readiness/analyze
// Analyze a document's content using AI
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, documentId, fileContent: directContent, mimeType } = body

    if (!fileName) {
      return NextResponse.json({ error: 'fileName krävs' }, { status: 400 })
    }

    // Demo mode: return intelligent mock analysis based on document type
    if (userId.startsWith('demo') || documentId?.startsWith('demo')) {
      // Simulate processing delay for realism
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
      
      const lowerFileName = fileName.toLowerCase()
      
      // Detect document type and category from filename
      const documentTypes: Record<string, { 
        category: RequirementCategory
        type: string
        baseScore: number
        findings: AnalysisFinding[]
        missingElements: string[]
        recommendations: string[]
      }> = {
        'årsredovisning': {
          category: 'finans',
          type: 'Årsredovisning',
          baseScore: 85,
          findings: [
            { type: 'success', title: 'Komplett årsredovisning', description: 'Dokumentet innehåller balansräkning, resultaträkning och förvaltningsberättelse.' },
            { type: 'success', title: 'Revisorsyttrande', description: 'Revisionsberättelse finns inkluderad.' },
            { type: 'info', title: 'Notapparat', description: 'Noter finns men kan behöva mer detaljer för fullständig DD.' },
          ],
          missingElements: [],
          recommendations: ['Säkerställ att alla noter är kompletta', 'Kontrollera att jämförelsetal finns för alla poster'],
        },
        'huvudbok': {
          category: 'finans',
          type: 'Huvudbok',
          baseScore: 78,
          findings: [
            { type: 'success', title: 'Transaktionshistorik', description: 'Dokumentet innehåller fullständig transaktionshistorik.' },
            { type: 'warning', title: 'Periodavgränsning', description: 'Kontrollera att alla periodiseringar är korrekta vid årsskifte.' },
            { type: 'info', title: 'Kontoplan', description: 'Konteringar följer BAS-kontoplanen.' },
          ],
          missingElements: ['Kontospecifikationer för väsentliga poster', 'Avstämning mot bokslut'],
          recommendations: ['Inkludera kontospecifikationer för konton med stora saldon', 'Lägg till avstämningskommentarer'],
        },
        'balans': {
          category: 'finans',
          type: 'Balansrapport',
          baseScore: 82,
          findings: [
            { type: 'success', title: 'Tillgångar och skulder', description: 'Dokumentet visar fullständig ställning av tillgångar och skulder.' },
            { type: 'success', title: 'Eget kapital', description: 'Eget kapital och obeskattade reserver redovisas korrekt.' },
            { type: 'warning', title: 'Värdering', description: 'Kontrollera värdering av materiella anläggningstillgångar.' },
          ],
          missingElements: ['Specifikation av kundfordringar', 'Åldersanalys av lager'],
          recommendations: ['Lägg till åldersanalys för kundfordringar', 'Inkludera lagervärderingsmetod'],
        },
        'resultat': {
          category: 'finans',
          type: 'Resultaträkning',
          baseScore: 80,
          findings: [
            { type: 'success', title: 'Intäkter och kostnader', description: 'Fullständig resultaträkning med alla poster.' },
            { type: 'info', title: 'Bruttomarginal', description: 'Bruttomarginalen kan beräknas från dokumentet.' },
            { type: 'warning', title: 'Extraordinära poster', description: 'Kontrollera om det finns engångsposter som påverkar jämförbarheten.' },
          ],
          missingElements: ['Segmentanalys om tillämpligt', 'Jämförelse med budget'],
          recommendations: ['Identifiera och markera eventuella engångsposter', 'Lägg till månadsvisa siffror för trendanalys'],
        },
        'avtal': {
          category: 'juridik',
          type: 'Avtal',
          baseScore: 75,
          findings: [
            { type: 'success', title: 'Avtalsstruktur', description: 'Dokumentet har tydlig avtalsstruktur med parter och villkor.' },
            { type: 'warning', title: 'Signatur', description: 'Kontrollera att alla parter har signerat avtalet.' },
            { type: 'info', title: 'Giltighetstid', description: 'Avtalsperiod och uppsägningsvillkor bör verifieras.' },
          ],
          missingElements: ['Signatursida', 'Bilagor'],
          recommendations: ['Säkerställ att alla bilagor finns med', 'Verifiera att avtalet fortfarande är giltigt'],
        },
        'skatt': {
          category: 'skatt',
          type: 'Skattedeklaration',
          baseScore: 83,
          findings: [
            { type: 'success', title: 'Deklaration inlämnad', description: 'Skattedeklarationen verkar vara komplett.' },
            { type: 'info', title: 'Skatteberäkning', description: 'Kontrollera att skatteberäkningen stämmer överens med årsredovisningen.' },
            { type: 'success', title: 'Periodicitet', description: 'Dokumentet avser rätt beskattningsperiod.' },
          ],
          missingElements: ['Kvitto på inlämning från Skatteverket'],
          recommendations: ['Bifoga kvitto/bekräftelse från Skatteverket', 'Inkludera eventuella korrigeringsdeklarationer'],
        },
        'anställning': {
          category: 'hr',
          type: 'Anställningsavtal',
          baseScore: 77,
          findings: [
            { type: 'success', title: 'Anställningsvillkor', description: 'Grundläggande anställningsvillkor finns dokumenterade.' },
            { type: 'warning', title: 'Konkurrensklausul', description: 'Kontrollera om det finns konkurrens- eller sekretessklausuler.' },
            { type: 'info', title: 'Kollektivavtal', description: 'Verifiera koppling till eventuellt kollektivavtal.' },
          ],
          missingElements: ['Signatur från båda parter', 'Lönebilaga'],
          recommendations: ['Säkerställ att alla anställningsavtal är signerade', 'Inkludera aktuell lönespecifikation'],
        },
        'kund': {
          category: 'kommersiellt',
          type: 'Kundavtal/Kundlista',
          baseScore: 79,
          findings: [
            { type: 'success', title: 'Kundinformation', description: 'Dokumentet innehåller relevant kundinformation.' },
            { type: 'warning', title: 'GDPR', description: 'Säkerställ att personuppgiftshantering följer GDPR.' },
            { type: 'info', title: 'Kundkoncentration', description: 'Analysera beroendet av enskilda stora kunder.' },
          ],
          missingElements: ['Kundomsättning per segment', 'Churn-analys'],
          recommendations: ['Inkludera omsättning per kund/segment', 'Lägg till historisk kunddata för trendanalys'],
        },
      }

      // Find matching document type
      let matchedType = null
      for (const [keyword, config] of Object.entries(documentTypes)) {
        if (lowerFileName.includes(keyword)) {
          matchedType = config
          break
        }
      }

      // Default fallback if no match
      if (!matchedType) {
        matchedType = {
          category: 'finans' as RequirementCategory,
          type: 'Dokument',
          baseScore: 72,
          findings: [
            { type: 'success' as const, title: 'Dokument laddat', description: 'Dokumentet har laddats upp och kan läsas.' },
            { type: 'info' as const, title: 'Manuell granskning', description: 'DD-coach kunde inte automatiskt klassificera dokumentet.' },
            { type: 'warning' as const, title: 'Verifiering behövs', description: 'Kontrollera att dokumentet uppfyller DD-kraven manuellt.' },
          ],
          missingElements: ['Tydlig dokumenttyp', 'Datummärkning'],
          recommendations: ['Namnge filen tydligare (t.ex. "Årsredovisning 2024.pdf")', 'Säkerställ att dokumentet är komplett'],
        }
      }

      // Extract year from filename
      const yearMatch = fileName.match(/20[0-9]{2}/)
      const detectedYear = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear()

      // Add some randomness to score for realism
      const scoreVariation = Math.floor(Math.random() * 10) - 5
      const finalScore = Math.max(50, Math.min(100, matchedType.baseScore + scoreVariation))

      // Determine status based on score
      const status = finalScore >= 85 ? 'approved' : finalScore >= 65 ? 'needs_review' : 'rejected'

      // Build dynamic summary
      const summary = `${matchedType.type} för ${detectedYear} har analyserats. ${
        status === 'approved' 
          ? 'Dokumentet uppfyller DD-kraven och är redo för granskning.'
          : status === 'needs_review'
          ? 'Dokumentet behöver kompletteras med vissa uppgifter innan det kan godkännas.'
          : 'Dokumentet saknar väsentlig information och behöver åtgärdas.'
      }`

      return NextResponse.json({
        analysis: {
          score: finalScore,
          status,
          summary,
          findings: [
            ...matchedType.findings,
            { 
              type: 'info' as const, 
              title: 'Period identifierad', 
              description: `Dokumentet avser ${detectedYear}.` 
            },
          ],
          suggestedCategory: matchedType.category,
          suggestedPeriodYear: detectedYear,
          isSigned: lowerFileName.includes('sign') || lowerFileName.includes('under'),
          missingElements: status === 'approved' ? [] : matchedType.missingElements,
          recommendations: status === 'approved' 
            ? ['Dokumentet uppfyller DD-kraven - inga åtgärder krävs'] 
            : matchedType.recommendations,
        },
        provider: 'demo',
      })
    }

    let textContent = ''
    let extractedMimeType = mimeType || 'application/octet-stream'

    // Try to get file content
    if (directContent) {
      // Content was passed directly (from upload)
      textContent = directContent
    } else if (documentId) {
      // Fetch from database and S3
      try {
        const document = await prisma.document.findUnique({
          where: { id: documentId },
        })

        if (document?.fileUrl) {
          extractedMimeType = document.mimeType || extractedMimeType
          
          // Fetch file from S3
          const fileBuffer = await fetchFileFromS3(document.fileUrl)
          
          // Extract text from the document
          const extraction = await extractTextFromDocument(fileBuffer, fileName, extractedMimeType)
          textContent = extraction.text
          
          console.log(`[Analyze] Extracted ${textContent.length} chars from ${fileName} (${extraction.format}, confidence: ${extraction.confidence})`)
        }
      } catch (fetchError) {
        console.error('Error fetching document:', fetchError)
        // Continue with just filename analysis if S3 fails
      }
    }

    // If we couldn't extract text, still analyze based on filename
    if (!textContent || textContent.length < 50) {
      textContent = `[Kunde inte extrahera fullständigt textinnehåll från filen. Analyserar baserat på filnamn: ${fileName}]`
    }

    // Call LLM for analysis
    const { provider } = getLLMProviderInfo()
    console.log(`[Analyze] Using LLM provider: ${provider}`)

    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(fileName, extractedMimeType, textContent)

    const llmResponse = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.2,
        maxTokens: 2000,
        jsonMode: true,
      }
    )

    // Parse the response
    let analysis: AnalysisResult
    try {
      analysis = parseJSONResponse(llmResponse.content)
    } catch (parseError) {
      console.error('Failed to parse LLM response:', llmResponse.content)
      // Return a fallback analysis
      analysis = {
        score: 60,
        status: 'needs_review',
        summary: 'Dokumentet kunde analyseras men resultatet kunde inte tolkas korrekt.',
        findings: [
          { type: 'info', title: 'Analys slutförd', description: 'DD-coach har granskat dokumentet.' },
          { type: 'warning', title: 'Manuell granskning rekommenderas', description: 'Automatisk analys kunde inte slutföras helt.' },
        ],
        suggestedCategory: null,
        suggestedPeriodYear: null,
        isSigned: false,
        missingElements: [],
        recommendations: ['Kontrollera dokumentet manuellt'],
      }
    }

    // Update document metadata in database if documentId provided
    if (documentId && !documentId.startsWith('demo')) {
      try {
        const existingDoc = await prisma.document.findUnique({
          where: { id: documentId },
        })

        if (existingDoc) {
          const existingMeta = existingDoc.uploadedByName?.startsWith('{')
            ? JSON.parse(existingDoc.uploadedByName)
            : {}

          const updatedMeta = {
            ...existingMeta,
            aiScore: analysis.score,
            aiStatus: analysis.status,
            aiSummary: analysis.summary,
            aiFindings: analysis.findings,
            aiCategory: analysis.suggestedCategory,
            aiPeriodYear: analysis.suggestedPeriodYear,
            aiIsSigned: analysis.isSigned,
            aiMissingElements: analysis.missingElements,
            aiRecommendations: analysis.recommendations,
            aiAnalyzedAt: new Date().toISOString(),
            aiProvider: provider,
          }

          await prisma.document.update({
            where: { id: documentId },
            data: {
              uploadedByName: JSON.stringify(updatedMeta),
              status: analysis.status === 'approved' ? 'APPROVED' : 'UPLOADED',
            },
          })
        }
      } catch (dbError) {
        console.error('Error updating document with AI analysis:', dbError)
      }
    }

    return NextResponse.json({ 
      analysis,
      provider,
    })
  } catch (error) {
    console.error('Error analyzing document:', error)
    return NextResponse.json(
      { error: 'Kunde inte analysera dokumentet' },
      { status: 500 }
    )
  }
}
