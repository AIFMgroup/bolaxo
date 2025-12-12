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

    // Demo mode: return intelligent mock analysis
    if (userId.startsWith('demo') || documentId?.startsWith('demo')) {
      const mockCategories: Record<string, RequirementCategory> = {
        'arsredovisning': 'finans',
        'årsredovisning': 'finans',
        'huvudbok': 'finans',
        'balans': 'finans',
        'resultat': 'finans',
        'skatt': 'skatt',
        'avtal': 'juridik',
        'anställning': 'hr',
        'kund': 'kommersiellt',
        'it': 'it',
      }

      let detectedCategory: RequirementCategory = 'finans'
      const lowerFileName = fileName.toLowerCase()
      for (const [keyword, category] of Object.entries(mockCategories)) {
        if (lowerFileName.includes(keyword)) {
          detectedCategory = category
          break
        }
      }

      const yearMatch = fileName.match(/20[0-9]{2}/)
      const detectedYear = yearMatch ? parseInt(yearMatch[0]) : 2024

      const score = 75 + Math.floor(Math.random() * 20)
      
      return NextResponse.json({
        analysis: {
          score,
          status: score >= 80 ? 'approved' : 'needs_review',
          summary: `${CATEGORY_META_LABELS[detectedCategory]} dokument för ${detectedYear}. Dokumentet innehåller grundläggande information men behöver kompletteras med vissa detaljer.`,
          findings: [
            { type: 'success', title: 'Rätt format', description: 'Dokumentet är i rätt format och läsbart.' },
            { type: 'success', title: 'Korrekt period', description: `Dokumentet avser ${detectedYear} vilket är aktuellt.` },
            { type: 'info', title: 'Identifierad typ', description: `Klassificerat som ${CATEGORY_META_LABELS[detectedCategory]}.` },
            ...(score < 85 ? [{ type: 'warning' as const, title: 'Ofullständig information', description: 'Vissa detaljer saknas för komplett DD-underlag.' }] : []),
          ],
          suggestedCategory: detectedCategory,
          suggestedPeriodYear: detectedYear,
          isSigned: lowerFileName.includes('sign'),
          missingElements: score < 85 ? ['Detaljerade noter', 'Jämförelsetal'] : [],
          recommendations: score < 85 
            ? ['Lägg till noter som förklarar större poster', 'Inkludera jämförelsetal från föregående år']
            : ['Dokumentet uppfyller DD-kraven'],
        },
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
