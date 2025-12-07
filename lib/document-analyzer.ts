import { callOpenAIResponses, OpenAIResponseError } from '@/lib/openai-response-utils'

export interface DocumentAnalysisResult {
  documentType: string
  extractedData: Record<string, any>
  confidence: number
  summary: string
}

export interface DocumentMappings {
  financialStatements?: {
    revenue?: number
    ebitda?: number
    netIncome?: number
    assets?: number
    liabilities?: number
  }
  employeeData?: {
    totalEmployees?: number
    departments?: Record<string, number>
  }
  keyContracts?: {
    customerContracts?: Array<{ name: string; value: number; term: string }>
    vendorContracts?: Array<{ name: string; value: number }>
  }
  companyInfo?: {
    companyName?: string
    registrationNumber?: string
    foundedYear?: number
    employees?: number
  }
}

// ===== SPA-SPECIFIC EXTRACTION PROMPTS =====

const spaExtractorPrompts = {
  company_info: `Du är en legal expert specialiserad på bolagsrätt. Analysera detta dokument och extrahera följande information om företaget:

EXTRAHERA:
- Företagsnamn (officiellt namn från Bolagsverket)
- Organisationsnummer / Registreringsnummer
- Adress
- Grundat/Registrerat år
- Antal anställda
- Verksamhetstyp
- Huvudsaklig näring

RETURNERA som JSON:
{
  "companyName": "...",
  "registrationNumber": "...",
  "address": "...",
  "foundedYear": 2020,
  "employees": 25,
  "businessType": "...",
  "primaryIndustry": "..."
}

Om information saknas, använd null.`,

  financial_analysis: `Du är en finansiell revisor. Analysera denna finansiella rapport/bokslut och extrahera:

EXTRAHERA:
- Total intäkter/omsättning (senaste 3 år om tillgängligt)
- EBITDA (eller ungefärligt värde baserat på driftsresultat)
- Nettoresultat/Vinst
- Totala tillgångar
- Totala skulder
- Rörelsekapital (Current Assets - Current Liabilities)
- Nettoskuld (Totala skulder - Likvida medel)
- Räntekostnad
- Skattekostnad
- Marginal (brutto, drift, netto)

RETURNERA som JSON:
{
  "latestYear": 2024,
  "revenue": 50000000,
  "ebitda": 8000000,
  "netIncome": 5000000,
  "totalAssets": 30000000,
  "totalLiabilities": 10000000,
  "workingCapital": 5000000,
  "netDebt": 8000000,
  "interestExpense": 300000,
  "taxExpense": 1000000,
  "margins": {
    "gross": 0.40,
    "operating": 0.16,
    "net": 0.10
  },
  "yearOverYearGrowth": 0.08
}

Presentera siffror i SEK. Om information saknas, använd null.`,

  customer_contracts: `Du är en affärsanalytiker specialiserad på försäljning. Analysera dessa kontrakt och extrahera:

EXTRAHERA:
1. Lista över de 10 största kundkontrakten:
   - Kundens namn
   - Årligt värde / Totalvärde (i SEK)
   - Kontraktslängd / Slutdatum
   - Procentandel av total omsättning
   - Kritiskhet för verksamheten

2. Kundberoende-analys:
   - Procent av omsättning från top 5 kunder
   - Procent från top 10 kunder
   - Churn-historia (kundförluster) senaste 2 år

RETURNERA som JSON:
{
  "topCustomers": [
    {
      "name": "Kundnamn AB",
      "annualValue": 15000000,
      "endDate": "2026-06-30",
      "percentageOfRevenue": 30,
      "criticality": "Critical"
    }
  ],
  "customerConcentration": {
    "top5Percent": 60,
    "top10Percent": 75
  },
  "churnRisk": "Low/Medium/High"
}

Om information saknas, använd null eller reasonable estimates.`,

  vendor_contracts: `Du är en supply chain specialist. Analysera leverantörsavtal och extrahera:

EXTRAHERA:
- Huvudsakliga leverantörer (top 5-10)
- Leveranstyp / Kategori
- Årligt värde
- Kontraktslängd / Slutdatum
- Kritiskhet för verksamheten
- Alternativa leverantörer tillgängliga?

RETURNERA som JSON:
{
  "topVendors": [
    {
      "name": "Leverantör AB",
      "category": "Raw Materials",
      "annualValue": 5000000,
      "endDate": "2025-12-31",
      "criticality": "Medium",
      "hasAlternatives": true
    }
  ],
  "supplierConcentration": "Low/Medium/High",
  "supplyRisks": "..."
}`,

  ip_patents: `Du är en IP-expert. Analysera denna IP-dokumentation och extrahera:

EXTRAHERA:
- Registrerade varumärken (namn, nummer, registreringsland)
- Patent (nummer, namn, expireringsdatum)
- Registrerad design
- Copyright / Källkod
- Licensierad teknologi från tredje part
- Ägnarskap och rättigheter

RETURNERA som JSON:
{
  "trademarks": [
    {
      "name": "...",
      "registrationNumber": "...",
      "registrationDate": "2020-01-15",
      "expiryDate": "2030-01-15",
      "countries": ["SE", "EU"]
    }
  ],
  "patents": [
    {
      "name": "...",
      "patentNumber": "...",
      "filingDate": "2019-06-01",
      "expiryDate": "2039-06-01"
    }
  ],
  "licensedTechnology": [],
  "ipRisks": "..."
}`,

  personnel_hr: `Du är en HR-specialist. Analysera HR-data och extrahera:

EXTRAHERA:
- Totalt antal anställda
- Fördelning per avdelning/roll
- Ledningsgrupp och nyckelpersoner
- Lönesumma / Genomsnittlig lön
- Pensionsförpliktelser (ITP osv)
- Turnover-rate (personalomsättning)
- Nyckelkompetenser

RETURNERA som JSON:
{
  "totalEmployees": 45,
  "departments": {
    "Engineering": 15,
    "Sales": 10,
    "Operations": 8,
    "Finance": 5,
    "Other": 7
  },
  "keyPersonnel": [
    {
      "name": "...",
      "role": "CEO",
      "yearsWithCompany": 5,
      "criticality": "Critical"
    }
  ],
  "totalSalaryExpense": 20000000,
  "pensionScheme": "ITP2",
  "annualTurnoverRate": 0.15
}`,

  legal_compliance: `Du är en juridisk expert. Analysera denna juridiska dokumentation och extrahera:

EXTRAHERA:
- Pågående tvister / Rättegångar
- Myndighetsprövningar
- Överträdelser eller påföljder
- GDPR / Dataskydd status
- Miljölagstiftning compliance
- Försäkring (vad är försäkrat?)
- Juridiska risker

RETURNERA som JSON:
{
  "litigation": [
    {
      "case": "Namn på tvisten",
      "opponent": "Motpart",
      "status": "Ongoing/Settled",
      "estimatedCost": 500000,
      "year": 2024
    }
  ],
  "regulatoryRisks": [],
  "gdprCompliance": "Compliant/Non-Compliant/Partial",
  "insuranceCoverage": "...",
  "legalRisks": "Low/Medium/High"
}`,

  market_position: `Du är en marknadsanalytiker. Analysera marknadspositionering och extrahera:

EXTRAHERA:
- Marknadsposition och marknadsandel
- Huvudsakliga konkurrenter
- Produkter/Tjänster (intäktsmix)
- Tillväxtstrategi
- Geografisk närvaro

RETURNERA som JSON:
{
  "marketShare": 0.05,
  "competitors": ["Konkurrent 1", "Konkurrent 2"],
  "productMix": [
    {
      "name": "Produkt A",
      "percentageOfRevenue": 60
    }
  ],
  "growthStrategy": "...",
  "geographicReach": ["Sweden", "Norway"]
}`,

  real_estate_assets: `Du är en fastighetsvärderare. Analysera denna tillgångsinventering och extrahera:

EXTRAHERA:
- Fastigheter (äga vs hyra)
- Värde på fastigheter
- Hyresbokslut (om tillämpligt)
- Inventarier och utrustning
- Teknisk bana/skick

RETURNERA som JSON:
{
  "realEstate": [
    {
      "property": "Kontor Stockholm",
      "ownership": "Owned/Leased",
      "value": 25000000,
      "leaseEndDate": null,
      "monthlyRent": null
    }
  ],
  "equipment": {
    "totalValue": 5000000,
    "condition": "Good"
  }
}`
}

const documentTypePrompts = {
  financial_statements: spaExtractorPrompts.financial_analysis,
  employee_data: spaExtractorPrompts.personnel_hr,
  key_contracts: spaExtractorPrompts.customer_contracts,
  company_info: spaExtractorPrompts.company_info,
  
  // SPA-specific
  company_registration: spaExtractorPrompts.company_info,
  customer_analysis: spaExtractorPrompts.customer_contracts,
  vendor_analysis: spaExtractorPrompts.vendor_contracts,
  ip_documentation: spaExtractorPrompts.ip_patents,
  hr_documentation: spaExtractorPrompts.personnel_hr,
  legal_documentation: spaExtractorPrompts.legal_compliance,
  market_analysis: spaExtractorPrompts.market_position,
  asset_inventory: spaExtractorPrompts.real_estate_assets
}

export async function analyzeDocument(documentContent: string, documentType: keyof typeof documentTypePrompts): Promise<DocumentAnalysisResult> {
  const prompt = documentTypePrompts[documentType]
  if (!prompt) {
    throw new Error(`Unknown document type: ${documentType}`)
  }

  const messages = [
    {
      role: 'system',
      content: prompt
    },
    {
      role: 'user',
      content: `Dokumentinnehål:\n\n${documentContent}\n\nExtrahera informationen enligt instruktionerna ovan.`
    }
  ]

  try {
    const { text } = await callOpenAIResponses({
      model: 'gpt-5.1-mini',
      messages: messages as any,
      maxOutputTokens: 4000,
      metadata: {
        feature: 'document-analyzer',
        documentType
      },
      responseFormat: { type: 'json_object' }
    })

    const extractedData = JSON.parse(text || '{}')

    return {
      documentType,
      extractedData,
      confidence: 0.85,
      summary: `Successfully extracted data from ${documentType} document`
    }
  } catch (error) {
    if (error instanceof OpenAIResponseError) {
      console.error('Document analysis OpenAI error:', error.status, error.body)
      throw new Error(`Failed to analyze ${documentType}: OpenAI error ${error.status}`)
    }
    console.error('Document analysis error:', error)
    throw new Error(`Failed to analyze ${documentType}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// ===== SPA-SPECIFIC AUTO-POPULATION FUNCTION =====

export async function extractSPAData(documents: Array<{ type: string; content: string }>): Promise<Record<string, any>> {
  const spaData: Record<string, any> = {}

  for (const doc of documents) {
    try {
      const analysis = await analyzeDocument(doc.content, doc.type as keyof typeof documentTypePrompts)
      
      // Map extracted data to SPA fields
      if (doc.type === 'company_info') {
        spaData.companyName = analysis.extractedData.companyName
        spaData.companyOrgNumber = analysis.extractedData.registrationNumber
        spaData.companyAddress = analysis.extractedData.address
      }
      
      if (doc.type === 'financial_statements') {
        spaData.financialData = analysis.extractedData
      }
      
      if (doc.type === 'customer_analysis') {
        spaData.customerData = analysis.extractedData
        spaData.customerConcentration = analysis.extractedData.customerConcentration
      }
      
      if (doc.type === 'hr_documentation') {
        spaData.employeeData = analysis.extractedData
        spaData.numberOfEmployees = analysis.extractedData.totalEmployees
      }
      
      if (doc.type === 'legal_documentation') {
        spaData.legalRisks = analysis.extractedData
      }
      
      if (doc.type === 'ip_documentation') {
        spaData.ipData = analysis.extractedData
      }

    } catch (error) {
      console.error(`Error processing ${doc.type}:`, error)
      // Continue with other documents
    }
  }

  return spaData
}
