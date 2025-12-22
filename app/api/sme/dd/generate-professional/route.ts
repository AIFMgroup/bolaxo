import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { PROFESSIONAL_DD_CONTENT } from '@/lib/professional-dd-content'

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return new Promise<Response>((resolve) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
        info: {
          Title: 'Due Diligence Report - TechVision AB',
          Author: 'BOLAXO',
          Subject: 'Comprehensive Due Diligence Analysis'
        }
      })

      const chunks: Buffer[] = []
      doc.on('data', chunk => chunks.push(chunk))
      
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        resolve(new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="DD-Report-TechVision-${new Date().toISOString().split('T')[0]}.pdf"`,
          },
        }))
      })

      // Cover Page
      doc.fontSize(32).text(PROFESSIONAL_DD_CONTENT.title, { align: 'center' })
      doc.fontSize(20).text(PROFESSIONAL_DD_CONTENT.subtitle, { align: 'center' })
      doc.moveDown(3)
      
      doc.fontSize(24).text(PROFESSIONAL_DD_CONTENT.metadata.target)
      doc.fontSize(14).text(`Org.nr: ${PROFESSIONAL_DD_CONTENT.metadata.orgNumber}`)
      doc.moveDown(2)
      
      doc.fontSize(12)
      doc.text(`Uppdragsgivare: ${PROFESSIONAL_DD_CONTENT.metadata.buyer}`)
      doc.text(`DD-ledare: ${PROFESSIONAL_DD_CONTENT.metadata.ddTeam.lead}`)
      doc.text(`Period: ${PROFESSIONAL_DD_CONTENT.metadata.timeline.start} - ${PROFESSIONAL_DD_CONTENT.metadata.timeline.end}`)
      
      // Executive Summary
      doc.addPage()
      doc.fontSize(20).text('VERKSTÄLLANDE SAMMANFATTNING', { underline: true })
      doc.moveDown()
      
      doc.fontSize(16).fillColor('red').text(PROFESSIONAL_DD_CONTENT.executiveSummary.overallRating)
      doc.fillColor('black')
      doc.moveDown()
      
      doc.fontSize(12).text(PROFESSIONAL_DD_CONTENT.executiveSummary.dealRecommendation)
      doc.moveDown()
      
      // Key Metrics
      doc.fontSize(14).text('NYCKELTAL', { underline: true })
      doc.moveDown()
      doc.fontSize(11)
      
      Object.entries(PROFESSIONAL_DD_CONTENT.executiveSummary.keyMetrics).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`)
      })
      
      // Risk Summary
      doc.addPage()
      doc.fontSize(18).text('RISKSAMMANFATTNING', { underline: true })
      doc.moveDown()
      
      // Critical Risks
      doc.fontSize(14).fillColor('red').text('KRITISKA RISKER')
      doc.fillColor('black')
      PROFESSIONAL_DD_CONTENT.risks.critical.forEach(risk => {
        doc.fontSize(12).text(`• ${risk.area}`)
        doc.fontSize(10).text(`  ${risk.description}`)
        doc.text(`  Åtgärd: ${risk.mitigation}`)
        doc.moveDown()
      })
      
      // Financial Findings
      doc.addPage()
      doc.fontSize(18).text('FINANSIELL ANALYS', { underline: true })
      doc.moveDown()
      
      doc.fontSize(14).text(PROFESSIONAL_DD_CONTENT.findings.financial.summary)
      doc.moveDown()
      
      PROFESSIONAL_DD_CONTENT.findings.financial.details.forEach(detail => {
        doc.fontSize(12).text(detail.title)
        doc.fontSize(10).text(detail.finding)
        if (detail.action) {
          doc.text(`Åtgärd: ${detail.action}`)
        }
        doc.moveDown()
      })
      
      // Historical Financials Table
      doc.fontSize(12).text('Historisk utveckling:')
      doc.fontSize(10)
      PROFESSIONAL_DD_CONTENT.findings.financial.historicals.revenue.forEach(item => {
        doc.text(`${item.year}: ${(item.amount/1000000).toFixed(1)} MSEK`)
      })
      
      // Legal Findings
      doc.addPage()
      doc.fontSize(18).text('JURIDISK ANALYS', { underline: true })
      doc.moveDown()
      
      PROFESSIONAL_DD_CONTENT.findings.legal.findings.forEach(finding => {
        doc.fontSize(12).text(`${finding.category} - Risk: ${finding.risk}`)
        doc.fontSize(10).text(finding.issue)
        if (finding.action) {
          doc.text(`Åtgärd: ${finding.action}`)
        }
        doc.moveDown()
      })
      
      // Commercial Analysis
      doc.addPage()
      doc.fontSize(18).text('KOMMERSIELL ANALYS', { underline: true })
      doc.moveDown()
      
      doc.fontSize(14).text('Marknadsanalys')
      doc.fontSize(10)
      Object.entries(PROFESSIONAL_DD_CONTENT.findings.commercial.marketAnalysis).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`)
      })
      
      // Technical Assessment
      doc.addPage()
      doc.fontSize(18).text('TEKNISK BEDÖMNING', { underline: true })
      doc.moveDown()
      
      doc.fontSize(14).text(PROFESSIONAL_DD_CONTENT.findings.technical.summary)
      doc.moveDown()
      
      doc.fontSize(12).text('Rekommendationer:')
      PROFESSIONAL_DD_CONTENT.findings.technical.recommendations.forEach(rec => {
        doc.fontSize(10).text(`• ${rec}`)
      })
      
      // Valuation
      doc.addPage()
      doc.fontSize(18).text('VÄRDERING', { underline: true })
      doc.moveDown()
      
      doc.fontSize(14).text('DCF-analys')
      doc.fontSize(11).text(PROFESSIONAL_DD_CONTENT.valuation.methodology.dcf.value)
      doc.fontSize(10).text(PROFESSIONAL_DD_CONTENT.valuation.methodology.dcf.assumptions)
      doc.moveDown()
      
      doc.fontSize(14).text('Känslighetsanalys')
      doc.fontSize(10)
      Object.entries(PROFESSIONAL_DD_CONTENT.valuation.sensitivityAnalysis).forEach(([scenario, value]) => {
        doc.text(`${scenario}: ${value}`)
      })
      
      // Post-Merger Plan
      doc.addPage()
      doc.fontSize(18).text('INTEGRATIONSPLAN', { underline: true })
      doc.moveDown()
      
      doc.fontSize(14).text('Första 100 dagarna')
      doc.fontSize(10)
      PROFESSIONAL_DD_CONTENT.postMergerPlan.first100Days.forEach(action => {
        doc.text(`• ${action}`)
      })
      doc.moveDown()
      
      doc.fontSize(14).text('Förväntade synergier')
      doc.fontSize(10)
      Object.entries(PROFESSIONAL_DD_CONTENT.postMergerPlan.synergies).forEach(([type, value]) => {
        doc.text(`${type}: ${value}`)
      })
      
      // Conclusion
      doc.addPage()
      doc.fontSize(20).text('SLUTSATS OCH REKOMMENDATION', { underline: true })
      doc.moveDown()
      
      doc.fontSize(16).fillColor('green').text(PROFESSIONAL_DD_CONTENT.conclusion.recommendation)
      doc.fillColor('black')
      doc.moveDown()
      
      doc.fontSize(12).text('Villkor för genomförande:')
      doc.fontSize(10)
      PROFESSIONAL_DD_CONTENT.conclusion.conditions.forEach(condition => {
        doc.text(`• ${condition}`)
      })
      doc.moveDown()
      
      doc.fontSize(12).text(`Förväntad avkastning: ${PROFESSIONAL_DD_CONTENT.conclusion.expectedReturn}`)
      
      // Footer
      doc.fontSize(8).text('KONFIDENTIELLT - Endast för auktoriserade mottagare', { align: 'center' })
      
      doc.end()
    })
  } catch (error) {
    console.error('Error generating professional DD report:', error)
    return NextResponse.json({ 
      error: 'Failed to generate DD report', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
