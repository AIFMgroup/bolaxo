import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { REQUIREMENTS, RequirementCategory } from '@/lib/readiness/requirements'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface AnalysisResult {
  suggestedRequirementId: string | null
  suggestedCategory: RequirementCategory | null
  suggestedPeriodYear: number | null
  isSigned: boolean
  confidence: number // 0-100
  reasoning: string
  documentSummary: string
}

// POST /api/readiness/analyze
// Analyze a document's filename and content to suggest classification
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, fileContent, mimeType, documentId } = body

    if (!fileName) {
      return NextResponse.json({ error: 'fileName krävs' }, { status: 400 })
    }

    // Build the requirements context for GPT
    const requirementsContext = REQUIREMENTS.map(r => ({
      id: r.id,
      category: r.category,
      title: r.title,
      description: r.description,
      docTypes: r.docTypes,
      mandatory: r.mandatory,
      minYears: r.minYears,
      requiresSignature: r.requiresSignature,
    }))

    // Prepare prompt
    const systemPrompt = `Du är en expert på Due Diligence för företagsförsäljningar i Sverige. 
Din uppgift är att analysera filnamn (och eventuellt filinnehåll) och klassificera dokumentet enligt en checklista för säljberedskap.

Här är de tillgängliga krav-kategorierna och specifika krav:

${JSON.stringify(requirementsContext, null, 2)}

Kategorier:
- finans: Finansiella dokument (årsredovisningar, bokslut, huvudbok, reskontra etc.)
- skatt: Skattedeklarationer, tax rulings, TP-dokumentation
- juridik: Bolagsdokument, avtal, protokoll, GDPR
- hr: Anställningsavtal, lönestruktur, pensioner
- kommersiellt: Kundlistor, pipeline, SLA, partneravtal
- it: Systemkartor, IT-policyer, IP-dokumentation
- operation: Processdokumentation, ESG, leasingavtal`

    const userPrompt = `Analysera följande dokument:

Filnamn: ${fileName}
MIME-typ: ${mimeType || 'okänd'}
${fileContent ? `\nFilinnehåll (utdrag):\n${fileContent.substring(0, 3000)}` : ''}

Svara i följande JSON-format:
{
  "suggestedRequirementId": "<bästa matchande requirement id eller null>",
  "suggestedCategory": "<kategori: finans/skatt/juridik/hr/kommersiellt/it/operation>",
  "suggestedPeriodYear": <år som dokumentet gäller för, t.ex. 2023, eller null>,
  "isSigned": <true/false - verkar dokumentet vara signerat baserat på namn/innehåll>,
  "confidence": <0-100 - hur säker är du på klassificeringen>,
  "reasoning": "<kort förklaring på svenska av varför du klassificerade så>",
  "documentSummary": "<kort sammanfattning av dokumentet på svenska, max 100 tecken>"
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const rawContent = response.choices[0]?.message?.content || '{}'
    let analysis: AnalysisResult

    try {
      const parsed = JSON.parse(rawContent)
      analysis = {
        suggestedRequirementId: parsed.suggestedRequirementId || null,
        suggestedCategory: parsed.suggestedCategory || null,
        suggestedPeriodYear: parsed.suggestedPeriodYear || null,
        isSigned: parsed.isSigned === true,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
        reasoning: parsed.reasoning || '',
        documentSummary: parsed.documentSummary || '',
      }
    } catch {
      analysis = {
        suggestedRequirementId: null,
        suggestedCategory: null,
        suggestedPeriodYear: null,
        isSigned: false,
        confidence: 0,
        reasoning: 'Kunde inte analysera dokumentet',
        documentSummary: '',
      }
    }

    // If documentId is provided, update the document with suggested classification
    if (documentId && analysis.confidence >= 70) {
      try {
        // Fetch existing document
        const existingDoc = await prisma.document.findUnique({
          where: { id: documentId },
        })

        if (existingDoc && existingDoc.type.startsWith('READINESS:')) {
          // Update metadata in uploadedByName
          const existingMeta = existingDoc.uploadedByName?.startsWith('{')
            ? JSON.parse(existingDoc.uploadedByName)
            : {}

          const updatedMeta = {
            ...existingMeta,
            aiSuggestedRequirementId: analysis.suggestedRequirementId,
            aiSuggestedCategory: analysis.suggestedCategory,
            aiSuggestedPeriodYear: analysis.suggestedPeriodYear,
            aiIsSigned: analysis.isSigned,
            aiConfidence: analysis.confidence,
            aiAnalyzedAt: new Date().toISOString(),
          }

          // If confidence is very high (90+), auto-update the type
          if (analysis.confidence >= 90 && analysis.suggestedRequirementId) {
            await prisma.document.update({
              where: { id: documentId },
              data: {
                type: `READINESS:${analysis.suggestedRequirementId}`,
                uploadedByName: JSON.stringify(updatedMeta),
              },
            })
          } else {
            // Just store the suggestion
            await prisma.document.update({
              where: { id: documentId },
              data: {
                uploadedByName: JSON.stringify(updatedMeta),
              },
            })
          }
        }
      } catch (dbError) {
        console.error('Error updating document with AI analysis:', dbError)
      }
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Error analyzing document:', error)
    return NextResponse.json(
      { error: 'Kunde inte analysera dokumentet' },
      { status: 500 }
    )
  }
}

