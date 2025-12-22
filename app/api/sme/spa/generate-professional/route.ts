import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { PROFESSIONAL_SPA_CONTENT } from '@/lib/professional-spa-content'

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return new Promise<Response>((resolve) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
        info: {
          Title: 'Aktieöverlåtelseavtal - TechVision AB',
          Author: 'BOLAXO',
          Subject: 'Share Purchase Agreement'
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
            'Content-Disposition': `attachment; filename="SPA-TechVision-${new Date().toISOString().split('T')[0]}.pdf"`,
          },
        }))
      })

      // Title Page
      doc.fontSize(28).text(PROFESSIONAL_SPA_CONTENT.title, { align: 'center' })
      doc.fontSize(16).text(PROFESSIONAL_SPA_CONTENT.subtitle, { align: 'center' })
      doc.moveDown(2)
      
      // Parties
      doc.fontSize(14).text('PARTER', { underline: true })
      doc.fontSize(11)
      doc.moveDown()
      doc.text(`Säljare: ${PROFESSIONAL_SPA_CONTENT.parties.seller.name}`)
      doc.text(`Org.nr: ${PROFESSIONAL_SPA_CONTENT.parties.seller.orgNumber}`)
      doc.moveDown()
      doc.text(`Köpare: ${PROFESSIONAL_SPA_CONTENT.parties.buyer.name}`)
      doc.text(`Org.nr: ${PROFESSIONAL_SPA_CONTENT.parties.buyer.orgNumber}`)
      doc.moveDown()
      doc.text(`Målbolag: ${PROFESSIONAL_SPA_CONTENT.parties.target.name}`)
      doc.text(`Org.nr: ${PROFESSIONAL_SPA_CONTENT.parties.target.orgNumber}`)
      
      doc.addPage()
      
      // Table of Contents
      doc.fontSize(18).text('INNEHÅLLSFÖRTECKNING', { underline: true })
      doc.moveDown()
      doc.fontSize(11)
      
      PROFESSIONAL_SPA_CONTENT.sections.forEach(section => {
        doc.text(`${section.number}. ${section.title}`)
      })
      
      // Main Content
      PROFESSIONAL_SPA_CONTENT.sections.forEach(section => {
        doc.addPage()
        doc.fontSize(16).text(`${section.number}. ${section.title}`, { underline: true })
        doc.moveDown()
        doc.fontSize(11)
        section.content.forEach(paragraph => {
          doc.text(paragraph)
          doc.moveDown(0.5)
        })
      })
      
      // Schedules
      doc.addPage()
      doc.fontSize(18).text('BILAGOR', { underline: true })
      doc.moveDown()
      
      PROFESSIONAL_SPA_CONTENT.schedules.forEach(schedule => {
        doc.fontSize(14).text(schedule.title)
        doc.moveDown()
        doc.fontSize(11)
        schedule.content.forEach(item => {
          doc.text(`• ${item}`)
        })
        doc.moveDown()
      })
      
      // Signature Page
      doc.addPage()
      doc.fontSize(16).text('UNDERTECKNINGAR', { underline: true })
      doc.moveDown(2)
      
      doc.fontSize(11)
      doc.text('SÄLJARE:')
      doc.moveDown(3)
      doc.text('_'.repeat(50))
      doc.text(PROFESSIONAL_SPA_CONTENT.signatories.seller.name)
      doc.text(PROFESSIONAL_SPA_CONTENT.signatories.seller.title)
      doc.moveDown(3)
      
      doc.text('KÖPARE:')
      doc.moveDown(3)
      doc.text('_'.repeat(50))
      doc.text(PROFESSIONAL_SPA_CONTENT.signatories.buyer.name)
      doc.text(PROFESSIONAL_SPA_CONTENT.signatories.buyer.title)
      
      doc.end()
    })
  } catch (error) {
    console.error('Error generating professional SPA:', error)
    return NextResponse.json({ 
      error: 'Failed to generate SPA', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
