import PDFDocument from 'pdfkit'

export interface DDAnalysisPdfData {
  documentTitle: string
  fileName: string
  documentType: string
  analyzedAt: string
  score: number
  summary: string
  findings: Array<{
    type: 'success' | 'warning' | 'error' | 'info'
    message: string
  }>
  listingName?: string
}

// BOLAXO Color palette
const COLORS = {
  navy: '#0A1628',
  navyLight: '#1a2d4a',
  white: '#FFFFFF',
  offWhite: '#F8FAFC',
  emerald: '#10B981',
  emeraldLight: '#D1FAE5',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  red: '#EF4444',
  redLight: '#FEE2E2',
  blue: '#3B82F6',
  blueLight: '#DBEAFE',
  gray: '#6B7280',
  grayLight: '#F3F4F6',
}

function getScoreColor(score: number): string {
  if (score >= 80) return COLORS.emerald
  if (score >= 60) return COLORS.amber
  return COLORS.red
}

function getFindingColor(type: string): { bg: string; text: string } {
  switch (type) {
    case 'success':
      return { bg: COLORS.emeraldLight, text: COLORS.emerald }
    case 'warning':
      return { bg: COLORS.amberLight, text: COLORS.amber }
    case 'error':
      return { bg: COLORS.redLight, text: COLORS.red }
    default:
      return { bg: COLORS.blueLight, text: COLORS.blue }
  }
}

function getFindingIcon(type: string): string {
  switch (type) {
    case 'success':
      return '✓'
    case 'warning':
      return '⚠'
    case 'error':
      return '✗'
    default:
      return 'ℹ'
  }
}

export async function generateDDAnalysisPDF(data: DDAnalysisPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const pageWidth = doc.page.width - 100 // margins

      // Header with navy background
      doc.rect(0, 0, doc.page.width, 120).fill(COLORS.navy)

      // Logo text
      doc.fillColor(COLORS.white)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('BOLAXO', 50, 35)

      doc.fontSize(12)
        .font('Helvetica')
        .text('DD-Coach Analys', 50, 65)

      // Date
      doc.fontSize(10)
        .fillColor(COLORS.gray)
        .text(data.analyzedAt, 50, 90)

      // Document info box
      doc.rect(50, 140, pageWidth, 80)
        .fill(COLORS.grayLight)

      doc.fillColor(COLORS.navy)
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(data.documentTitle, 70, 155)

      doc.fontSize(11)
        .font('Helvetica')
        .fillColor(COLORS.gray)
        .text(`Filnamn: ${data.fileName}`, 70, 180)
        .text(`Dokumenttyp: ${data.documentType}`, 70, 195)

      if (data.listingName) {
        doc.text(`Bolag: ${data.listingName}`, 300, 180)
      }

      // Score section
      const scoreY = 245
      const scoreColor = getScoreColor(data.score)
      
      doc.rect(50, scoreY, 100, 100)
        .fill(scoreColor)

      doc.fillColor(COLORS.white)
        .fontSize(42)
        .font('Helvetica-Bold')
        .text(data.score.toString(), 65, scoreY + 20, { width: 70, align: 'center' })

      doc.fontSize(12)
        .font('Helvetica')
        .text('/100', 65, scoreY + 70, { width: 70, align: 'center' })

      // Score label
      doc.fillColor(COLORS.navy)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Kvalitetspoäng', 170, scoreY + 10)

      const scoreLabel = data.score >= 80 
        ? 'Utmärkt - Dokumentet är väl förberett för DD'
        : data.score >= 60 
        ? 'Godkänt - Några förbättringar rekommenderas'
        : 'Behöver åtgärdas - Väsentliga brister identifierade'

      doc.fontSize(11)
        .font('Helvetica')
        .fillColor(COLORS.gray)
        .text(scoreLabel, 170, scoreY + 30)

      // Progress bar
      doc.rect(170, scoreY + 55, pageWidth - 140, 12)
        .fill(COLORS.grayLight)

      doc.rect(170, scoreY + 55, (pageWidth - 140) * (data.score / 100), 12)
        .fill(scoreColor)

      // Summary section
      const summaryY = scoreY + 120
      doc.fillColor(COLORS.navy)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Sammanfattning', 50, summaryY)

      doc.rect(50, summaryY + 25, pageWidth, 2).fill(COLORS.navy)

      doc.fontSize(11)
        .font('Helvetica')
        .fillColor(COLORS.gray)
        .text(data.summary, 50, summaryY + 40, {
          width: pageWidth,
          lineGap: 4,
        })

      // Findings section
      let findingsY = summaryY + 100
      
      // Check if we need a new page
      if (findingsY > 600) {
        doc.addPage()
        findingsY = 50
      }

      doc.fillColor(COLORS.navy)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Observationer', 50, findingsY)

      doc.rect(50, findingsY + 25, pageWidth, 2).fill(COLORS.navy)

      let currentY = findingsY + 40

      for (const finding of data.findings) {
        // Check if we need a new page
        if (currentY > 720) {
          doc.addPage()
          currentY = 50
        }

        const colors = getFindingColor(finding.type)
        const icon = getFindingIcon(finding.type)

        // Finding box
        doc.rect(50, currentY, pageWidth, 50)
          .fill(colors.bg)

        // Icon circle
        doc.circle(75, currentY + 25, 12)
          .fill(colors.text)

        doc.fillColor(COLORS.white)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(icon, 68, currentY + 18)

        // Finding text
        doc.fillColor(COLORS.navy)
          .fontSize(11)
          .font('Helvetica')
          .text(finding.message, 100, currentY + 12, {
            width: pageWidth - 70,
            lineGap: 3,
          })

        currentY += 60
      }

      // Footer
      const footerY = doc.page.height - 40
      doc.fillColor(COLORS.gray)
        .fontSize(9)
        .font('Helvetica')
        .text(
          'Genererad av BOLAXO DD-Coach | www.bolaxo.com',
          50,
          footerY,
          { width: pageWidth, align: 'center' }
        )

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

