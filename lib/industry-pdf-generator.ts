import PDFDocument from 'pdfkit'

// Industry icons as simple text representations for PDF
const INDUSTRY_ICONS: Record<string, string> = {
  'it-konsult-utveckling': '💻',
  'ehandel-d2c': '🛒',
  'saas-licensmjukvara': '☁️',
  'bygg-anlaggning': '🏗️',
  'el-vvs-installation': '🔧',
  'stad-facility-services': '🧹',
  'lager-logistik-3pl': '🚚',
  'restaurang-cafe': '🍽️',
  'detaljhandel-fysisk': '🏪',
  'grossist-partihandel': '📦',
  'latt-tillverkning-verkstad': '🏭',
  'fastighetsservice-forvaltning': '🏢',
  'marknadsforing-kommunikation-pr': '📢',
  'ekonomitjanster-redovisning': '📊',
  'halsa-skonhet': '✨',
  'gym-fitness-wellness': '💪',
  'event-konferens-upplevelser': '🎉',
  'utbildning-kurser-edtech': '🎓',
  'bilverkstad-fordonsservice': '🚗',
  'jord-skog-tradgard-gronyteskotsel': '🌲'
}

const INDUSTRY_LABELS: Record<string, string> = {
  'it-konsult-utveckling': 'IT-konsult & utveckling',
  'ehandel-d2c': 'E-handel/D2C',
  'saas-licensmjukvara': 'SaaS & licensmjukvara',
  'bygg-anlaggning': 'Bygg & anläggning',
  'el-vvs-installation': 'El, VVS & installation',
  'stad-facility-services': 'Städ & facility services',
  'lager-logistik-3pl': 'Lager, logistik & 3PL',
  'restaurang-cafe': 'Restaurang & café',
  'detaljhandel-fysisk': 'Detaljhandel (fysisk)',
  'grossist-partihandel': 'Grossist/partihandel',
  'latt-tillverkning-verkstad': 'Lätt tillverkning/verkstad',
  'fastighetsservice-forvaltning': 'Fastighetsservice & förvaltning',
  'marknadsforing-kommunikation-pr': 'Marknadsföring, kommunikation & PR',
  'ekonomitjanster-redovisning': 'Ekonomitjänster & redovisning',
  'halsa-skonhet': 'Hälsa/skönhet',
  'gym-fitness-wellness': 'Gym, fitness & wellness',
  'event-konferens-upplevelser': 'Event, konferens & upplevelser',
  'utbildning-kurser-edtech': 'Utbildning, kurser & edtech',
  'bilverkstad-fordonsservice': 'Bilverkstad & fordonsservice',
  'jord-skog-tradgard-gronyteskotsel': 'Jord/skog, trädgård & grönyteskötsel'
}

export interface IndustryAnalysisPdfData {
  companyName: string
  industryId: string
  orgNumber?: string
  website?: string
  generatedAt: string
  analysis: {
    companyOverview?: {
      description?: string
      yearsInBusiness?: string
      primaryServices?: string[]
      geographicReach?: string
    }
    industryAnalysis?: {
      marketPosition?: string
      competitiveAdvantages?: string[]
      industryTrends?: string[]
      marketOutlook?: string
    }
    keyMetrics?: {
      estimatedRevenue?: string
      employeeCount?: string
      industrySpecificMetrics?: Record<string, { name: string; value: string; benchmark?: string }>
    }
    riskAssessment?: {
      overallRisk?: string
      riskFactors?: Array<{
        category: string
        description: string
        severity: string
        mitigation?: string
      }>
    }
    valuationDrivers?: {
      positiveFactors?: string[]
      negativeFactors?: string[]
      valuationMultipleRange?: {
        low?: string
        high?: string
        reasoning?: string
      }
    }
    recommendations?: {
      forSeller?: string[]
      dueDiligenceFocus?: string[]
      quickWins?: string[]
    }
    sources?: Array<{
      title: string
      url?: string
      type?: string
    }>
    confidence?: {
      level?: string
      limitations?: string
    }
  }
  formData?: Record<string, any>
  documentsAnalyzed?: number
}

type PDFDocumentType = typeof PDFDocument extends new (options?: any) => infer R ? R : never

// Colors
const COLORS = {
  navy: '#0E2D5C',
  pink: '#FF69B4',
  darkGray: '#333333',
  gray: '#666666',
  lightGray: '#999999',
  border: '#E5E7EB',
  background: '#F9FAFB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444'
}

export async function generateIndustryAnalysisPDF(data: IndustryAnalysisPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true
      }) as PDFDocumentType

      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Document metadata
      doc.info.Title = `Branschanalys - ${data.companyName}`
      doc.info.Subject = `Branschspecifik analys för ${INDUSTRY_LABELS[data.industryId] || data.industryId}`
      doc.info.Author = 'BOLAXO'
      doc.info.Creator = 'BOLAXO Industry Analysis'

      // Cover page
      addCoverPage(doc, data)

      // Table of contents
      doc.addPage()
      addTableOfContents(doc)

      // Company Overview
      doc.addPage()
      addCompanyOverview(doc, data)

      // Industry Analysis
      doc.addPage()
      addIndustryAnalysis(doc, data)

      // Key Metrics
      doc.addPage()
      addKeyMetrics(doc, data)

      // Risk Assessment
      doc.addPage()
      addRiskAssessment(doc, data)

      // Valuation Drivers
      doc.addPage()
      addValuationDrivers(doc, data)

      // Recommendations
      doc.addPage()
      addRecommendations(doc, data)

      // Sources & Confidence
      doc.addPage()
      addSourcesAndConfidence(doc, data)

      // Add page numbers
      addPageNumbers(doc)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

function addCoverPage(doc: PDFDocumentType, data: IndustryAnalysisPdfData) {
  const pageWidth = doc.page.width
  const pageHeight = doc.page.height

  // Navy header background
  doc.rect(0, 0, pageWidth, 280).fill(COLORS.navy)

  // Title
  doc.fillColor('#FFFFFF')
  doc.fontSize(32).font('Helvetica-Bold')
  doc.text('BRANSCHANALYS', 50, 80, { align: 'center', width: pageWidth - 100 })

  // Subtitle
  doc.fontSize(16).font('Helvetica')
  doc.text(INDUSTRY_LABELS[data.industryId] || data.industryId, 50, 130, { align: 'center', width: pageWidth - 100 })

  // Company name
  doc.fillColor(COLORS.pink)
  doc.fontSize(28).font('Helvetica-Bold')
  doc.text(data.companyName, 50, 180, { align: 'center', width: pageWidth - 100 })

  // Details section
  doc.fillColor(COLORS.darkGray)
  doc.fontSize(12).font('Helvetica')
  
  let yPos = 340

  if (data.orgNumber) {
    doc.text(`Organisationsnummer: ${data.orgNumber}`, 50, yPos)
    yPos += 25
  }

  if (data.website) {
    doc.text(`Webbplats: ${data.website}`, 50, yPos)
    yPos += 25
  }

  doc.text(`Genererad: ${new Date(data.generatedAt).toLocaleDateString('sv-SE', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 50, yPos)
  yPos += 25

  if (data.documentsAnalyzed && data.documentsAnalyzed > 0) {
    doc.text(`Dokument analyserade: ${data.documentsAnalyzed}`, 50, yPos)
  }

  // Confidential notice
  doc.fontSize(10).fillColor(COLORS.danger)
  doc.text('KONFIDENTIELLT', 50, pageHeight - 80, { align: 'center', width: pageWidth - 100 })
  doc.fillColor(COLORS.lightGray)
  doc.text('För auktoriserade mottagare endast', 50, pageHeight - 65, { align: 'center', width: pageWidth - 100 })

  // BOLAXO branding
  doc.fontSize(10).fillColor(COLORS.gray)
  doc.text('Powered by BOLAXO', 50, pageHeight - 40, { align: 'center', width: pageWidth - 100 })
}

function addTableOfContents(doc: PDFDocumentType) {
  doc.fontSize(24).fillColor(COLORS.navy).font('Helvetica-Bold')
  doc.text('INNEHÅLLSFÖRTECKNING', 50, 50)

  doc.moveDown(1)
  doc.fontSize(12).fillColor(COLORS.darkGray).font('Helvetica')

  const items = [
    { title: '1. Företagsöversikt', page: 3 },
    { title: '2. Branschanalys', page: 4 },
    { title: '3. Nyckeltal', page: 5 },
    { title: '4. Riskbedömning', page: 6 },
    { title: '5. Värdedrivare', page: 7 },
    { title: '6. Rekommendationer', page: 8 },
    { title: '7. Källor & Konfidens', page: 9 }
  ]

  items.forEach(item => {
    doc.text(`${item.title}`, 70, doc.y, { continued: true })
    doc.text(`${item.page}`, { align: 'right' })
    doc.moveDown(0.5)
  })
}

function addCompanyOverview(doc: PDFDocumentType, data: IndustryAnalysisPdfData) {
  addSectionHeader(doc, '1. FÖRETAGSÖVERSIKT')

  const overview = data.analysis.companyOverview
  if (!overview) {
    doc.fontSize(11).fillColor(COLORS.gray).text('Ingen företagsöversikt tillgänglig.')
    return
  }

  if (overview.description) {
    doc.fontSize(11).fillColor(COLORS.darkGray)
    doc.text(overview.description, { lineGap: 4 })
    doc.moveDown(1)
  }

  // Info boxes
  const infoItems = [
    { label: 'År i verksamhet', value: overview.yearsInBusiness },
    { label: 'Geografisk räckvidd', value: overview.geographicReach }
  ].filter(item => item.value)

  if (infoItems.length > 0) {
    doc.fontSize(10).fillColor(COLORS.gray)
    infoItems.forEach(item => {
      doc.font('Helvetica-Bold').text(`${item.label}: `, { continued: true })
      doc.font('Helvetica').text(item.value!)
      doc.moveDown(0.3)
    })
  }

  if (overview.primaryServices && overview.primaryServices.length > 0) {
    doc.moveDown(1)
    doc.fontSize(14).fillColor(COLORS.navy).font('Helvetica-Bold')
    doc.text('Huvudtjänster/produkter')
    doc.moveDown(0.5)
    
    doc.fontSize(11).fillColor(COLORS.darkGray).font('Helvetica')
    overview.primaryServices.forEach(service => {
      doc.text(`• ${service}`, { indent: 10 })
      doc.moveDown(0.3)
    })
  }
}

function addIndustryAnalysis(doc: PDFDocumentType, data: IndustryAnalysisPdfData) {
  addSectionHeader(doc, '2. BRANSCHANALYS')

  const analysis = data.analysis.industryAnalysis
  if (!analysis) {
    doc.fontSize(11).fillColor(COLORS.gray).text('Ingen branschanalys tillgänglig.')
    return
  }

  if (analysis.marketPosition) {
    doc.fontSize(14).fillColor(COLORS.navy).font('Helvetica-Bold')
    doc.text('Marknadsposition')
    doc.moveDown(0.5)
    doc.fontSize(11).fillColor(COLORS.darkGray).font('Helvetica')
    doc.text(analysis.marketPosition, { lineGap: 4 })
    doc.moveDown(1)
  }

  if (analysis.competitiveAdvantages && analysis.competitiveAdvantages.length > 0) {
    doc.fontSize(14).fillColor(COLORS.navy).font('Helvetica-Bold')
    doc.text('Konkurrensfördelar')
    doc.moveDown(0.5)
    doc.fontSize(11).fillColor(COLORS.darkGray).font('Helvetica')
    analysis.competitiveAdvantages.forEach(advantage => {
      doc.text(`✓ ${advantage}`, { indent: 10 })
      doc.moveDown(0.3)
    })
    doc.moveDown(1)
  }

  if (analysis.industryTrends && analysis.industryTrends.length > 0) {
    doc.fontSize(14).fillColor(COLORS.navy).font('Helvetica-Bold')
    doc.text('Branschtrender')
    doc.moveDown(0.5)
    doc.fontSize(11).fillColor(COLORS.darkGray).font('Helvetica')
    analysis.industryTrends.forEach(trend => {
      doc.text(`→ ${trend}`, { indent: 10 })
      doc.moveDown(0.3)
    })
    doc.moveDown(1)
  }

  if (analysis.marketOutlook) {
    doc.fontSize(14).fillColor(COLORS.navy).font('Helvetica-Bold')
    doc.text('Marknadsutsikter')
    doc.moveDown(0.5)
    doc.fontSize(11).fillColor(COLORS.darkGray).font('Helvetica')
    doc.text(analysis.marketOutlook, { lineGap: 4 })
  }
}

function addKeyMetrics(doc: PDFDocumentType, data: IndustryAnalysisPdfData) {
  addSectionHeader(doc, '3. NYCKELTAL')

  const metrics = data.analysis.keyMetrics
  if (!metrics) {
    doc.fontSize(11).fillColor(COLORS.gray).text('Inga nyckeltal tillgängliga.')
    return
  }

  // General metrics
  if (metrics.estimatedRevenue || metrics.employeeCount) {
    doc.fontSize(14).fillColor(COLORS.navy).font('Helvetica-Bold')
    doc.text('Övergripande')
    doc.moveDown(0.5)
    
    if (metrics.estimatedRevenue) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.darkGray)
      doc.text('Uppskattad omsättning: ', { continued: true })
      doc.font('Helvetica').text(metrics.estimatedRevenue)
    }
    
    if (metrics.employeeCount) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.darkGray)
      doc.text('Antal anställda: ', { continued: true })
      doc.font('Helvetica').text(metrics.employeeCount)
    }
    doc.moveDown(1)
  }

  // Industry-specific metrics
  if (metrics.industrySpecificMetrics && Object.keys(metrics.industrySpecificMetrics).length > 0) {
    doc.fontSize(14).fillColor(COLORS.navy).font('Helvetica-Bold')
    doc.text('Branschspecifika nyckeltal')
    doc.moveDown(0.5)

    Object.values(metrics.industrySpecificMetrics).forEach((metric: any) => {
      doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.darkGray)
      doc.text(`${metric.name}: `, { continued: true })
      doc.font('Helvetica').text(metric.value)
      
      if (metric.benchmark) {
        doc.fontSize(10).fillColor(COLORS.gray)
        doc.text(`   Branschsnitt: ${metric.benchmark}`, { indent: 20 })
      }
      doc.moveDown(0.5)
    })
  }
}

function addRiskAssessment(doc: PDFDocumentType, data: IndustryAnalysisPdfData) {
  addSectionHeader(doc, '4. RISKBEDÖMNING')

  const risk = data.analysis.riskAssessment
  if (!risk) {
    doc.fontSize(11).fillColor(COLORS.gray).text('Ingen riskbedömning tillgänglig.')
    return
  }

  // Overall risk
  if (risk.overallRisk) {
    const riskColor = risk.overallRisk === 'Låg' ? COLORS.success : 
                      risk.overallRisk === 'Medel' ? COLORS.warning : COLORS.danger

    doc.fontSize(14).fillColor(COLORS.navy).font('Helvetica-Bold')
    doc.text('Övergripande risknivå')
    doc.moveDown(0.5)
    
    doc.fontSize(18).fillColor(riskColor).font('Helvetica-Bold')
    doc.text(risk.overallRisk.toUpperCase())
    doc.moveDown(1)
  }

  // Risk factors
  if (risk.riskFactors && risk.riskFactors.length > 0) {
    doc.fontSize(14).fillColor(COLORS.navy).font('Helvetica-Bold')
    doc.text('Identifierade risker')
    doc.moveDown(0.5)

    risk.riskFactors.forEach((factor, index) => {
      const severityColor = factor.severity === 'Låg' ? COLORS.success : 
                           factor.severity === 'Medel' ? COLORS.warning : COLORS.danger

      doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.darkGray)
      doc.text(`${index + 1}. ${factor.category}`, { continued: true })
      doc.fillColor(severityColor).text(` [${factor.severity}]`)
      
      doc.fontSize(11).font('Helvetica').fillColor(COLORS.darkGray)
      doc.text(factor.description, { indent: 15 })
      
      if (factor.mitigation) {
        doc.fontSize(10).fillColor(COLORS.success)
        doc.text(`Åtgärd: ${factor.mitigation}`, { indent: 15 })
      }
      doc.moveDown(0.5)
    })
  }
}

function addValuationDrivers(doc: PDFDocumentType, data: IndustryAnalysisPdfData) {
  addSectionHeader(doc, '5. VÄRDEDRIVARE')

  const drivers = data.analysis.valuationDrivers
  if (!drivers) {
    doc.fontSize(11).fillColor(COLORS.gray).text('Ingen värdedriv-analys tillgänglig.')
    return
  }

  // Positive factors
  if (drivers.positiveFactors && drivers.positiveFactors.length > 0) {
    doc.fontSize(14).fillColor(COLORS.success).font('Helvetica-Bold')
    doc.text('✓ Positiva värdefaktorer')
    doc.moveDown(0.5)
    
    doc.fontSize(11).fillColor(COLORS.darkGray).font('Helvetica')
    drivers.positiveFactors.forEach(factor => {
      doc.text(`• ${factor}`, { indent: 10 })
      doc.moveDown(0.3)
    })
    doc.moveDown(1)
  }

  // Negative factors
  if (drivers.negativeFactors && drivers.negativeFactors.length > 0) {
    doc.fontSize(14).fillColor(COLORS.danger).font('Helvetica-Bold')
    doc.text('⚠ Negativa värdefaktorer')
    doc.moveDown(0.5)
    
    doc.fontSize(11).fillColor(COLORS.darkGray).font('Helvetica')
    drivers.negativeFactors.forEach(factor => {
      doc.text(`• ${factor}`, { indent: 10 })
      doc.moveDown(0.3)
    })
    doc.moveDown(1)
  }

  // Valuation range
  if (drivers.valuationMultipleRange) {
    doc.fontSize(14).fillColor(COLORS.navy).font('Helvetica-Bold')
    doc.text('Värderingsmultiplar')
    doc.moveDown(0.5)
    
    doc.fontSize(12).fillColor(COLORS.darkGray).font('Helvetica')
    if (drivers.valuationMultipleRange.low && drivers.valuationMultipleRange.high) {
      doc.text(`Spann: ${drivers.valuationMultipleRange.low} - ${drivers.valuationMultipleRange.high}`)
    }
    
    if (drivers.valuationMultipleRange.reasoning) {
      doc.moveDown(0.3)
      doc.fontSize(10).fillColor(COLORS.gray)
      doc.text(drivers.valuationMultipleRange.reasoning, { lineGap: 3 })
    }
  }
}

function addRecommendations(doc: PDFDocumentType, data: IndustryAnalysisPdfData) {
  addSectionHeader(doc, '6. REKOMMENDATIONER')

  const recs = data.analysis.recommendations
  if (!recs) {
    doc.fontSize(11).fillColor(COLORS.gray).text('Inga rekommendationer tillgängliga.')
    return
  }

  // For seller
  if (recs.forSeller && recs.forSeller.length > 0) {
    doc.fontSize(14).fillColor(COLORS.navy).font('Helvetica-Bold')
    doc.text('För säljaren')
    doc.moveDown(0.5)
    
    doc.fontSize(11).fillColor(COLORS.darkGray).font('Helvetica')
    recs.forSeller.forEach((rec, i) => {
      doc.text(`${i + 1}. ${rec}`, { indent: 10 })
      doc.moveDown(0.3)
    })
    doc.moveDown(1)
  }

  // Quick wins
  if (recs.quickWins && recs.quickWins.length > 0) {
    doc.fontSize(14).fillColor(COLORS.success).font('Helvetica-Bold')
    doc.text('⚡ Quick Wins')
    doc.moveDown(0.5)
    
    doc.fontSize(11).fillColor(COLORS.darkGray).font('Helvetica')
    recs.quickWins.forEach(win => {
      doc.text(`• ${win}`, { indent: 10 })
      doc.moveDown(0.3)
    })
    doc.moveDown(1)
  }

  // DD Focus
  if (recs.dueDiligenceFocus && recs.dueDiligenceFocus.length > 0) {
    doc.fontSize(14).fillColor(COLORS.warning).font('Helvetica-Bold')
    doc.text('🔍 Due Diligence-fokus')
    doc.moveDown(0.5)
    
    doc.fontSize(11).fillColor(COLORS.darkGray).font('Helvetica')
    recs.dueDiligenceFocus.forEach(focus => {
      doc.text(`• ${focus}`, { indent: 10 })
      doc.moveDown(0.3)
    })
  }
}

function addSourcesAndConfidence(doc: PDFDocumentType, data: IndustryAnalysisPdfData) {
  addSectionHeader(doc, '7. KÄLLOR & KONFIDENS')

  // Confidence
  if (data.analysis.confidence) {
    doc.fontSize(14).fillColor(COLORS.navy).font('Helvetica-Bold')
    doc.text('Konfidensnivå')
    doc.moveDown(0.5)
    
    const confColor = data.analysis.confidence.level === 'Hög' ? COLORS.success : 
                      data.analysis.confidence.level === 'Medel' ? COLORS.warning : COLORS.danger

    doc.fontSize(16).fillColor(confColor).font('Helvetica-Bold')
    doc.text(data.analysis.confidence.level || 'Medel')
    
    if (data.analysis.confidence.limitations) {
      doc.moveDown(0.5)
      doc.fontSize(10).fillColor(COLORS.gray).font('Helvetica')
      doc.text(`Begränsningar: ${data.analysis.confidence.limitations}`)
    }
    doc.moveDown(1)
  }

  // Sources
  if (data.analysis.sources && data.analysis.sources.length > 0) {
    doc.fontSize(14).fillColor(COLORS.navy).font('Helvetica-Bold')
    doc.text('Källor')
    doc.moveDown(0.5)
    
    doc.fontSize(10).fillColor(COLORS.darkGray).font('Helvetica')
    data.analysis.sources.forEach((source, i) => {
      doc.text(`${i + 1}. ${source.title}`, { indent: 10 })
      if (source.url) {
        doc.fillColor(COLORS.gray)
        doc.text(`   ${source.url}`, { indent: 15 })
        doc.fillColor(COLORS.darkGray)
      }
      doc.moveDown(0.3)
    })
  }

  // Disclaimer
  doc.moveDown(2)
  doc.fontSize(9).fillColor(COLORS.lightGray)
  doc.text('ANSVARSFRISKRIVNING', { underline: true })
  doc.moveDown(0.3)
  doc.text('Denna analys är baserad på offentligt tillgänglig information och användarinput. ' +
    'Den utgör inte finansiell rådgivning och bör inte användas som enda beslutsunderlag. ' +
    'BOLAXO tar inget ansvar för beslut fattade baserat på denna analys.', { lineGap: 2 })
}

function addSectionHeader(doc: PDFDocumentType, title: string) {
  doc.fontSize(20).fillColor(COLORS.navy).font('Helvetica-Bold')
  doc.text(title)
  
  // Underline
  doc.moveTo(50, doc.y + 5)
     .lineTo(200, doc.y + 5)
     .strokeColor(COLORS.pink)
     .lineWidth(3)
     .stroke()
  
  doc.moveDown(1)
}

function addPageNumbers(doc: PDFDocumentType) {
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    
    // Skip cover page
    if (i === 0) continue
    
    doc.fontSize(9).fillColor(COLORS.lightGray)
    doc.text(
      `Sida ${i} av ${range.count - 1}`,
      50,
      doc.page.height - 30,
      { align: 'center', width: doc.page.width - 100 }
    )
  }
}

