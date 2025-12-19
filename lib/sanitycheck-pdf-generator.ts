import PDFDocument from 'pdfkit'

export interface SanitycheckPdfData {
  companyName: string
  orgNumber?: string
  industry?: string
  website?: string
  generatedAt: string
  score: number
  summary: string
  swot: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  valuationRange: {
    min: number
    max: number
    multipleMin: number
    multipleMax: number
    basis: string
  }
  recommendations: string[]
  pitchdeckSlides: string[]
  formData: Record<string, unknown>
}

// BOLAXO Color palette - primarily dark navy
const COLORS = {
  navy: '#0A1628',
  navyLight: '#1a2d4a',
  navyMedium: '#142238',
  white: '#FFFFFF',
  offWhite: '#F8FAFC',
  // Accent colors
  emerald: '#10B981',
  emeraldLight: '#D1FAE5',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  red: '#EF4444',
  redLight: '#FEE2E2',
  blue: '#3B82F6',
  blueLight: '#DBEAFE',
  // Grays
  gray: '#6B7280',
  grayLight: '#F3F4F6',
  grayDark: '#374151',
}

// Demo data
const DEMO_FINANCIALS = {
  revenue: [32, 42, 52, 58],
  ebitda: [6.4, 8.4, 10.4, 11.6],
  years: ['2021', '2022', '2023', '2024E'],
  margins: { gross: 72, operating: 20, net: 16 },
  kpis: {
    recurringRevenue: 67,
    customerRetention: 94,
    employeeCount: 24,
    avgContractValue: 185
  }
}

const DEMO_SCORES = [
  { name: 'Finansiell styrka', score: 78 },
  { name: 'Marknad & kunder', score: 72 },
  { name: 'Organisation', score: 68 },
  { name: 'Processer & system', score: 75 },
  { name: 'Tillväxtpotential', score: 82 },
  { name: 'Säljberedskap', score: 65 }
]

export async function generateSanitycheckPDF(data: SanitycheckPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: `Värderingsrapport - ${data.companyName}`,
          Author: 'BOLAXO',
          Subject: 'Företagsanalys och indikativ värdering',
          Creator: 'BOLAXO Sanitycheck'
        }
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const pageWidth = doc.page.width
      const pageHeight = doc.page.height
      const margin = 50
      const contentWidth = pageWidth - margin * 2

      // ===== PAGE 1: COVER =====
      drawCoverPage(doc, data, pageWidth, pageHeight, margin)

      // ===== PAGE 2: SUMMARY & SCORES =====
      doc.addPage()
      drawSummaryPage(doc, data, pageWidth, margin, contentWidth)

      // ===== PAGE 3: SWOT ANALYSIS =====
      doc.addPage()
      drawSwotPage(doc, data, pageWidth, margin, contentWidth)

      // ===== PAGE 4: VALUATION & RECOMMENDATIONS =====
      doc.addPage()
      drawValuationPage(doc, data, pageWidth, pageHeight, margin, contentWidth)

      // Add page numbers
      const range = doc.bufferedPageRange()
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i)
        
        // Skip page number on cover
        if (i > 0) {
          doc.fontSize(9)
             .fillColor(COLORS.gray)
             .text(
               `${i + 1} / ${range.count}`,
               margin,
               pageHeight - 35,
               { align: 'right', width: contentWidth }
             )
          
          doc.fontSize(8)
             .fillColor(COLORS.gray)
             .text('BOLAXO | Konfidentiellt', margin, pageHeight - 35)
        }
      }

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

function drawCoverPage(
  doc: PDFKit.PDFDocument, 
  data: SanitycheckPdfData, 
  pageWidth: number, 
  pageHeight: number,
  margin: number
): void {
  // Full page navy background
  doc.rect(0, 0, pageWidth, pageHeight).fill(COLORS.navy)

  // Decorative diagonal stripe
  doc.save()
  doc.moveTo(pageWidth - 200, 0)
     .lineTo(pageWidth, 0)
     .lineTo(pageWidth, 120)
     .lineTo(pageWidth - 280, 120)
     .closePath()
     .fill(COLORS.navyLight)
  doc.restore()

  // Logo
  doc.fontSize(42)
     .fillColor(COLORS.white)
     .text('BOLAXO', margin, 60)

  // Subtitle line
  doc.fontSize(11)
     .fillColor(COLORS.white)
     .opacity(0.5)
     .text('VÄRDERINGSRAPPORT', margin, 115)
     .opacity(1)

  // Green accent line
  doc.rect(margin, 140, 60, 4).fill(COLORS.emerald)

  // Company name
  doc.fontSize(36)
     .fillColor(COLORS.white)
     .text(data.companyName, margin, 170, { width: pageWidth - margin * 2 })

  // Metadata
  const metaY = 250
  const metaSpacing = 150

  const metaItems = [
    { label: 'ORG.NR', value: data.orgNumber || 'N/A' },
    { label: 'BRANSCH', value: data.industry || 'N/A' },
    { label: 'GENERERAD', value: new Date(data.generatedAt).toLocaleDateString('sv-SE') }
  ]

  metaItems.forEach((item, i) => {
    const x = margin + i * metaSpacing
    doc.fontSize(9)
       .fillColor(COLORS.white)
       .opacity(0.5)
       .text(item.label, x, metaY)
       .opacity(1)
       .fontSize(12)
       .text(item.value, x, metaY + 16)
  })

  // Large score circle
  const centerX = pageWidth / 2
  const scoreY = 450
  const scoreColor = data.score >= 70 ? COLORS.emerald : data.score >= 50 ? COLORS.amber : COLORS.red

  // Outer ring
  doc.circle(centerX, scoreY, 85)
     .lineWidth(8)
     .strokeColor(COLORS.navyLight)
     .stroke()

  // Score ring
  doc.circle(centerX, scoreY, 85)
     .lineWidth(8)
     .strokeColor(scoreColor)
     .stroke()

  // Inner circle
  doc.circle(centerX, scoreY, 70)
     .fill(COLORS.navyMedium)

  // Score number
  doc.fontSize(56)
     .fillColor(COLORS.white)
     .text(data.score.toString(), centerX - 45, scoreY - 25, { width: 90, align: 'center' })

  doc.fontSize(12)
     .fillColor(COLORS.white)
     .opacity(0.6)
     .text('POÄNG', centerX - 45, scoreY + 35, { width: 90, align: 'center' })
     .opacity(1)

  // Score label
  const scoreLabel = data.score >= 70 ? 'Hög säljberedskap' : data.score >= 50 ? 'Måttlig säljberedskap' : 'Kräver förbättring'
  doc.fontSize(18)
     .fillColor(COLORS.white)
     .text(scoreLabel, margin, scoreY + 110, { align: 'center', width: pageWidth - margin * 2 })

  // Summary text
  doc.fontSize(11)
     .fillColor(COLORS.white)
     .opacity(0.7)
     .text(data.summary, margin + 40, scoreY + 150, {
       align: 'center',
       width: pageWidth - margin * 2 - 80,
       lineGap: 5
     })
     .opacity(1)

  // Footer
  doc.fontSize(9)
     .fillColor(COLORS.white)
     .opacity(0.4)
     .text('Detta dokument är konfidentiellt och avsett endast för mottagaren.', margin, pageHeight - 50, {
       align: 'center',
       width: pageWidth - margin * 2
     })
     .opacity(1)
}

function drawSummaryPage(
  doc: PDFKit.PDFDocument,
  data: SanitycheckPdfData,
  pageWidth: number,
  margin: number,
  contentWidth: number
): void {
  let y = 50

  // Header
  doc.fontSize(24).fillColor(COLORS.navy).text('Sammanfattning', margin, y)
  doc.rect(margin, y + 32, 50, 3).fill(COLORS.emerald)
  y += 60

  // Key metrics boxes
  doc.fontSize(13).fillColor(COLORS.navy).text('Nyckeltal', margin, y)
  y += 25

  const metrics = [
    { label: 'Säljberedskap', value: `${data.score}/100`, color: data.score >= 70 ? COLORS.emerald : COLORS.amber },
    { label: 'Värderingsspann', value: `${data.valuationRange.min}-${data.valuationRange.max} MSEK`, color: COLORS.navy },
    { label: 'EBITDA-multipel', value: `${data.valuationRange.multipleMin}x-${data.valuationRange.multipleMax}x`, color: COLORS.navy },
    { label: 'Styrkor identifierade', value: `${data.swot.strengths.length} st`, color: COLORS.emerald }
  ]

  const boxWidth = (contentWidth - 30) / 2
  const boxHeight = 65

  metrics.forEach((m, i) => {
    const x = margin + (i % 2) * (boxWidth + 30)
    const boxY = y + Math.floor(i / 2) * (boxHeight + 12)

    doc.roundedRect(x, boxY, boxWidth, boxHeight, 6).fill(COLORS.grayLight)
    doc.rect(x, boxY, 4, boxHeight).fill(m.color)

    doc.fontSize(22).fillColor(COLORS.navy).text(m.value, x + 16, boxY + 12, { width: boxWidth - 24 })
    doc.fontSize(10).fillColor(COLORS.gray).text(m.label, x + 16, boxY + 42)
  })

  y += boxHeight * 2 + 40

  // Category scores
  doc.fontSize(13).fillColor(COLORS.navy).text('Poäng per kategori', margin, y)
  y += 25

  DEMO_SCORES.forEach((cat, i) => {
    const barMaxWidth = contentWidth - 160
    const barWidth = (cat.score / 100) * barMaxWidth
    const barColor = cat.score >= 75 ? COLORS.emerald : cat.score >= 60 ? COLORS.amber : COLORS.red

    doc.fontSize(10).fillColor(COLORS.grayDark).text(cat.name, margin, y + i * 32)
    doc.roundedRect(margin + 130, y + i * 32, barMaxWidth, 16, 4).fill(COLORS.grayLight)
    doc.roundedRect(margin + 130, y + i * 32, barWidth, 16, 4).fill(barColor)
    doc.fontSize(10).fillColor(COLORS.navy).text(`${cat.score}%`, margin + 130 + barMaxWidth + 10, y + i * 32 + 2)
  })

  y += DEMO_SCORES.length * 32 + 30

  // Financial charts - Revenue
  doc.fontSize(13).fillColor(COLORS.navy).text('Omsättning (MSEK)', margin, y)
  y += 20

  const chartHeight = 100
  const barSpacing = 55
  const maxRev = Math.max(...DEMO_FINANCIALS.revenue)

  DEMO_FINANCIALS.revenue.forEach((val, i) => {
    const barH = (val / maxRev) * chartHeight
    const x = margin + i * barSpacing
    const barY = y + chartHeight - barH

    doc.roundedRect(x, barY, 35, barH, 3).fill(COLORS.navy)
    doc.fontSize(9).fillColor(COLORS.navy).text(val.toString(), x, barY - 14, { width: 35, align: 'center' })
    doc.fontSize(8).fillColor(COLORS.gray).text(DEMO_FINANCIALS.years[i], x, y + chartHeight + 4, { width: 35, align: 'center' })
  })

  // EBITDA chart next to it
  const ebitdaX = margin + 260
  doc.fontSize(13).fillColor(COLORS.navy).text('EBITDA (MSEK)', ebitdaX, y - 20)

  const maxEbitda = Math.max(...DEMO_FINANCIALS.ebitda)

  DEMO_FINANCIALS.ebitda.forEach((val, i) => {
    const barH = (val / maxEbitda) * chartHeight
    const x = ebitdaX + i * barSpacing
    const barY = y + chartHeight - barH

    doc.roundedRect(x, barY, 35, barH, 3).fill(COLORS.emerald)
    doc.fontSize(9).fillColor(COLORS.navy).text(val.toFixed(1), x, barY - 14, { width: 35, align: 'center' })
    doc.fontSize(8).fillColor(COLORS.gray).text(DEMO_FINANCIALS.years[i], x, y + chartHeight + 4, { width: 35, align: 'center' })
  })

  y += chartHeight + 50

  // KPIs row
  doc.fontSize(13).fillColor(COLORS.navy).text('Nyckel-KPIer', margin, y)
  y += 20

  const kpis = [
    { label: 'Återkommande intäkter', value: `${DEMO_FINANCIALS.kpis.recurringRevenue}%` },
    { label: 'Kundretention', value: `${DEMO_FINANCIALS.kpis.customerRetention}%` },
    { label: 'Medarbetare', value: DEMO_FINANCIALS.kpis.employeeCount.toString() },
    { label: 'Snitt avtal (kSEK)', value: DEMO_FINANCIALS.kpis.avgContractValue.toString() }
  ]

  const kpiWidth = (contentWidth - 30) / 4

  kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiWidth + 10)
    doc.roundedRect(x, y, kpiWidth, 55, 4).fill(COLORS.grayLight)
    doc.fontSize(18).fillColor(COLORS.navy).text(kpi.value, x + 8, y + 10, { width: kpiWidth - 16, align: 'center' })
    doc.fontSize(8).fillColor(COLORS.gray).text(kpi.label, x + 4, y + 36, { width: kpiWidth - 8, align: 'center' })
  })
}

function drawSwotPage(
  doc: PDFKit.PDFDocument,
  data: SanitycheckPdfData,
  pageWidth: number,
  margin: number,
  contentWidth: number
): void {
  let y = 50

  // Header
  doc.fontSize(24).fillColor(COLORS.navy).text('SWOT-analys', margin, y)
  doc.rect(margin, y + 32, 50, 3).fill(COLORS.emerald)
  y += 60

  const boxWidth = (contentWidth - 20) / 2
  const boxHeight = 300

  // Strengths - Green
  drawSwotBox(doc, margin, y, boxWidth, boxHeight, 'Styrkor', data.swot.strengths, COLORS.emerald, COLORS.emeraldLight)

  // Weaknesses - Amber
  drawSwotBox(doc, margin + boxWidth + 20, y, boxWidth, boxHeight, 'Svagheter', data.swot.weaknesses, COLORS.amber, COLORS.amberLight)

  y += boxHeight + 20

  // Opportunities - Blue
  drawSwotBox(doc, margin, y, boxWidth, boxHeight, 'Möjligheter', data.swot.opportunities, COLORS.blue, COLORS.blueLight)

  // Threats - Red
  drawSwotBox(doc, margin + boxWidth + 20, y, boxWidth, boxHeight, 'Hot', data.swot.threats, COLORS.red, COLORS.redLight)
}

function drawSwotBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  items: string[],
  accentColor: string,
  bgColor: string
): void {
  // Background
  doc.roundedRect(x, y, width, height, 8).fill(bgColor)

  // Top accent bar
  doc.rect(x, y, width, 5).fill(accentColor)

  // Title
  doc.fontSize(14).fillColor(accentColor).text(title, x + 15, y + 20)

  // Items
  let itemY = y + 50
  items.forEach((item) => {
    if (itemY < y + height - 30) {
      doc.circle(x + 20, itemY + 5, 3).fill(accentColor)
      doc.fontSize(10).fillColor(COLORS.navy).text(item, x + 32, itemY, { width: width - 50, lineGap: 3 })
      const textH = doc.heightOfString(item, { width: width - 50 })
      itemY += Math.max(textH + 12, 28)
    }
  })
}

function drawValuationPage(
  doc: PDFKit.PDFDocument,
  data: SanitycheckPdfData,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  contentWidth: number
): void {
  let y = 50

  // Header
  doc.fontSize(24).fillColor(COLORS.navy).text('Värdering & Nästa steg', margin, y)
  doc.rect(margin, y + 32, 50, 3).fill(COLORS.emerald)
  y += 60

  // Main valuation box
  doc.roundedRect(margin, y, contentWidth, 140, 10).fill(COLORS.navy)

  // Green accent
  doc.rect(margin, y, 6, 140).fill(COLORS.emerald)

  // Value range
  doc.fontSize(10).fillColor(COLORS.white).opacity(0.5).text('UPPSKATTAT VÄRDERINGSSPANN', margin + 25, y + 20).opacity(1)
  doc.fontSize(42).fillColor(COLORS.white).text(`${data.valuationRange.min} – ${data.valuationRange.max}`, margin + 25, y + 40)
  doc.fontSize(16).fillColor(COLORS.white).opacity(0.7).text('MSEK', margin + 25, y + 90).opacity(1)

  // Multiple badge
  const badgeX = pageWidth - margin - 120
  doc.roundedRect(badgeX, y + 25, 100, 60, 6).fill(COLORS.navyLight)
  doc.fontSize(9).fillColor(COLORS.white).opacity(0.5).text('MULTIPEL', badgeX + 10, y + 35).opacity(1)
  doc.fontSize(18).fillColor(COLORS.emerald).text(`${data.valuationRange.multipleMin}x-${data.valuationRange.multipleMax}x`, badgeX + 10, y + 52)

  // Range bar
  doc.roundedRect(margin + 25, y + 115, contentWidth - 60, 10, 5).fillOpacity(0.2).fill(COLORS.white).fillOpacity(1)
  doc.roundedRect(margin + 25 + (contentWidth - 60) * 0.25, y + 115, (contentWidth - 60) * 0.5, 10, 5).fill(COLORS.emerald)

  y += 160

  // Valuation basis
  doc.fontSize(12).fillColor(COLORS.navy).text('Värderingsgrund', margin, y)
  y += 18
  doc.fontSize(10).fillColor(COLORS.gray).text(data.valuationRange.basis, margin, y, { width: contentWidth, lineGap: 4 })
  y += 50

  // Recommendations
  doc.fontSize(14).fillColor(COLORS.navy).text('Prioriterade åtgärder', margin, y)
  y += 25

  data.recommendations.slice(0, 5).forEach((rec, i) => {
    // Number circle
    doc.circle(margin + 12, y + 8, 12).fill(COLORS.navy)
    doc.fontSize(10).fillColor(COLORS.white).text((i + 1).toString(), margin + 6, y + 3, { width: 12, align: 'center' })
    
    // Text
    doc.fontSize(10).fillColor(COLORS.grayDark).text(rec, margin + 35, y, { width: contentWidth - 50, lineGap: 3 })
    const h = doc.heightOfString(rec, { width: contentWidth - 50 })
    y += Math.max(h + 12, 32)
  })

  y += 15

  // Pitchdeck slides
  doc.fontSize(12).fillColor(COLORS.navy).text('Pitchdeck-struktur', margin, y)
  y += 20

  const slideW = (contentWidth - 30) / 4

  data.pitchdeckSlides.slice(0, 8).forEach((slide, i) => {
    const sx = margin + (i % 4) * (slideW + 10)
    const sy = y + Math.floor(i / 4) * 38
    doc.roundedRect(sx, sy, slideW, 30, 4).fill(COLORS.grayLight)
    doc.fontSize(8).fillColor(COLORS.navy).text(`${i + 1}. ${slide}`, sx + 6, sy + 10, { width: slideW - 12 })
  })

  y += Math.ceil(Math.min(data.pitchdeckSlides.length, 8) / 4) * 38 + 25

  // CTA box
  if (y < pageHeight - 120) {
    doc.roundedRect(margin, y, contentWidth, 80, 8).fill(COLORS.navy)
    doc.fontSize(14).fillColor(COLORS.white).text('Redo att ta nästa steg?', margin + 20, y + 18)
    doc.fontSize(10).fillColor(COLORS.white).opacity(0.7)
       .text('Kontakta oss för personlig rådgivning och matchning med kvalificerade köpare.', margin + 20, y + 40, { width: contentWidth - 40 })
       .opacity(1)
    doc.roundedRect(margin + 20, y + 60, 140, 28, 4).fill(COLORS.emerald)
    doc.fontSize(10).fillColor(COLORS.white).text('bolaxo.com', margin + 20, y + 68, { width: 140, align: 'center' })
  }
}
