import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { callLLM } from '@/lib/llm-client'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { extractTextFromDocument } from '@/lib/universal-document-reader'

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET = process.env.AWS_S3_BUCKET_NAME || 'trestor-dataroom-prod'

// POST /api/ai/price-suggestion
// Analyzes uploaded documents and suggests a price range
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('afterfounder_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const body = await request.json()
    const { listingId, dataRoomId } = body

    if (!listingId && !dataRoomId) {
      return NextResponse.json({ error: 'listingId eller dataRoomId krävs' }, { status: 400 })
    }

    // Get listing info
    let listing = null
    let documents: any[] = []

    if (listingId) {
      listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          dataroom: {
            include: {
              documents: {
                include: {
                  currentVersion: true,
                },
              },
            },
          },
        },
      })

      if (!listing) {
        return NextResponse.json({ error: 'Listing hittades inte' }, { status: 404 })
      }

      documents = listing.dataroom?.documents || []
    } else if (dataRoomId) {
      const dataRoom = await prisma.dataRoom.findUnique({
        where: { id: dataRoomId },
        include: {
          listing: true,
          documents: {
            include: {
              currentVersion: true,
            },
          },
        },
      })

      if (!dataRoom) {
        return NextResponse.json({ error: 'Datarum hittades inte' }, { status: 404 })
      }

      listing = dataRoom.listing
      documents = dataRoom.documents
    }

    // Extract text from financial documents
    const financialDocs = documents.filter(doc => {
      const title = doc.title.toLowerCase()
      const fileName = doc.currentVersion?.fileName?.toLowerCase() || ''
      return (
        title.includes('årsredovisning') ||
        title.includes('annual') ||
        title.includes('balans') ||
        title.includes('resultat') ||
        title.includes('budget') ||
        title.includes('prognos') ||
        title.includes('forecast') ||
        title.includes('financial') ||
        fileName.includes('årsredovisning') ||
        fileName.includes('resultat') ||
        fileName.includes('balans')
      )
    })

    let extractedContent = ''
    
    for (const doc of financialDocs.slice(0, 3)) { // Limit to 3 docs
      if (doc.currentVersion?.storageKey) {
        try {
          const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: doc.currentVersion.storageKey,
          })
          
          const response = await s3.send(command)
          const bodyBytes = await response.Body?.transformToByteArray()
          
          if (bodyBytes) {
            const buffer = Buffer.from(bodyBytes)
            const extraction = await extractTextFromDocument(
              buffer,
              doc.currentVersion.fileName,
              doc.currentVersion.mimeType
            )
            
            if (extraction.text.length > 100) {
              extractedContent += `\n\n=== ${doc.title} ===\n${extraction.text.slice(0, 5000)}`
            }
          }
        } catch (error) {
          console.error(`Error extracting ${doc.title}:`, error)
        }
      }
    }

    // Prepare listing context
    const listingContext = listing ? `
Företagsinformation:
- Bransch: ${listing.industry || 'Ej angiven'}
- Region: ${listing.region || 'Ej angiven'}
- Omsättning: ${listing.revenue ? `${listing.revenue.toLocaleString('sv-SE')} SEK` : 'Ej angiven'}
- EBITDA: ${listing.ebitda ? `${listing.ebitda.toLocaleString('sv-SE')} SEK` : 'Ej angiven'}
- Vinstmarginal: ${listing.profitMargin ? `${listing.profitMargin}%` : 'Ej angiven'}
- Anställda: ${listing.employees || 'Ej angiven'}
- Nuvarande pris: ${listing.askingPrice ? `${listing.askingPrice.toLocaleString('sv-SE')} SEK` : 'Ej satt'}
` : ''

    const systemPrompt = `Du är en erfaren företagsvärderingsexpert i Sverige. Din uppgift är att analysera finansiell data och ge ett prisförslag för ett företag till försäljning.

Analysera den givna informationen och dokumentinnehållet för att:
1. Identifiera relevanta finansiella nyckeltal (omsättning, EBITDA, vinst, tillgångar)
2. Bedöm lämplig värderingsmetod (multipel, kassaflöde, substans)
3. Beräkna ett rimligt prisintervall
4. Förklara din värdering

Svara på svenska i JSON-format:
{
  "priceRange": {
    "min": <lägsta pris i SEK>,
    "max": <högsta pris i SEK>,
    "recommended": <rekommenderat pris i SEK>
  },
  "methodology": "<huvudsaklig värderingsmetod>",
  "multiples": {
    "revenue": <omsättningsmultipel om tillämplig>,
    "ebitda": <EBITDA-multipel om tillämplig>,
    "profit": <vinstmultipel om tillämplig>
  },
  "keyFinancials": {
    "revenue": <identifierad omsättning>,
    "ebitda": <identifierad EBITDA>,
    "profit": <identifierad nettovinst>,
    "assets": <identifierade tillgångar>
  },
  "rationale": "<förklaring av värderingen på 2-3 meningar>",
  "confidence": <0-100 hur säker du är på värderingen>,
  "recommendations": ["<rekommendation 1>", "<rekommendation 2>"],
  "warnings": ["<eventuella varningar eller osäkerheter>"]
}

Om data saknas, gör rimliga antaganden baserat på bransch och storlek. Ange alltid confidence < 50 om viktig data saknas.`

    const userPrompt = `Analysera detta företag och föreslå ett pris:

${listingContext}

${extractedContent ? `
EXTRAHERAT DOKUMENTINNEHÅLL:
${extractedContent}
` : 'Inga finansiella dokument kunde läsas.'}

Baserat på ovanstående information, vad är ett rimligt prisintervall för detta företag?`

    const response = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 2000 }
    )

    // Parse JSON response
    let analysis
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      return NextResponse.json(
        { error: 'Kunde inte analysera AI-svar' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis,
      documentsAnalyzed: financialDocs.length,
      provider: response.provider,
    })
  } catch (error) {
    console.error('Error generating price suggestion:', error)
    return NextResponse.json(
      { error: 'Kunde inte generera prisförslag' },
      { status: 500 }
    )
  }
}

