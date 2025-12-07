import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { callOpenAIResponses, OpenAIResponseError } from '@/lib/openai-response-utils'

// Schema for GPT assessment response
const AssessmentSchema = z.object({
  completenessScore: z.number().min(0).max(100),
  overallAssessment: z.string(),
  missingCritical: z.array(z.object({
    category: z.string(),
    description: z.string(),
    importance: z.enum(['Kritisk', 'Viktig', 'Bra att ha']),
    suggestedDocument: z.string()
  })),
  strengths: z.array(z.string()),
  recommendations: z.array(z.object({
    area: z.string(),
    action: z.string(),
    impact: z.string()
  })),
  readinessLevel: z.enum(['Redo för försäljning', 'Nästan redo', 'Behöver mer förberedelse', 'Tidigt stadium'])
})

export async function POST(req: NextRequest) {
  try {
    const { formData, uploadedDocuments } = await req.json()

    // Prepare the data summary for GPT
    const dataSummary = {
      companyInfo: {
        name: formData.identity?.companyName || 'Ej angivet',
        orgNumber: formData.identity?.orgNumber || 'Ej angivet',
        industry: formData.identity?.industry || 'Ej angivet',
        founded: formData.identity?.foundedYear || 'Ej angivet',
        employees: formData.identity?.employees || 'Ej angivet',
        description: formData.identity?.description || 'Ej angivet'
      },
      financialData: {
        revenue: formData.financials?.revenue || 'Ej angivet',
        ebitda: formData.financials?.ebitda || 'Ej angivet',
        askingPrice: formData.financials?.askingPrice || 'Ej angivet',
        hasFinancialDocs: !!uploadedDocuments?.financials?.length
      },
      legalCompliance: {
        hasContracts: !!uploadedDocuments?.contracts?.length,
        hasIP: !!uploadedDocuments?.assets?.length,
        hasCompliance: !!uploadedDocuments?.compliance?.length
      },
      documentation: {
        totalUploaded: Object.values(uploadedDocuments || {}).flat().length,
        categories: Object.keys(uploadedDocuments || {})
      },
      sellingReason: formData.identity?.sellingReason || 'Ej angivet',
      keySellingPoints: formData.identity?.keySellingPoints || 'Ej angivet'
    }

    const systemPrompt = `Du är en expert på företagsförsäljningar och due diligence i Sverige. 
    Analysera följande företagsinformation och ge en bedömning av hur redo företaget är för försäljning.
    
    Bedöm särskilt:
    1. Fullständighet av information (0-100 poäng)
    2. Kvalitet på befintlig dokumentation
    3. Kritiska dokument som saknas
    4. Styrkor i presentationen
    5. Konkreta rekommendationer för förbättring
    
    Var specifik och praktisk i dina rekommendationer. Fokusera på vad som verkligen behövs för en framgångsrik försäljningsprocess.`

    let assessmentData: any
    
    try {
      const { text } = await callOpenAIResponses({
        model: 'gpt-5.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analysera följande företagsinformation för försäljningsberedskap:\n\n${JSON.stringify(dataSummary, null, 2)}\n\nReturnera JSON enligt schemat.` }
        ],
        maxOutputTokens: 4000,
        metadata: {
          feature: 'sme-assessment',
          documentCount: dataSummary.documentation.totalUploaded
        }
      })
      
      const cleaned = (text || '{}').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      assessmentData = JSON.parse(cleaned)
    } catch (error) {
      if (error instanceof OpenAIResponseError) {
        console.error('SME assessment OpenAI error:', error.status, error.body)
      } else {
        console.error('SME assessment parse error:', error)
      }
      return NextResponse.json(
        { error: 'Failed to analyze completeness', details: 'OpenAI processing failed' },
        { status: 502 }
      )
    }

    const assessment = AssessmentSchema.parse(assessmentData)

    // Add timestamp
    const result = {
      ...assessment,
      analyzedAt: new Date().toISOString(),
      dataPoints: {
        hasFinancials: dataSummary.financialData.hasFinancialDocs,
        hasLegalDocs: dataSummary.legalCompliance.hasContracts,
        totalDocuments: dataSummary.documentation.totalUploaded
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Assessment error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze completeness', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
