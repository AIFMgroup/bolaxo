import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { generateDDAnalysisPDF } from '@/lib/dd-analysis-pdf-generator'

// GET /api/dataroom/analyze/export-pdf?versionId=xxx
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('afterfounder_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const versionId = request.nextUrl.searchParams.get('versionId')

    if (!versionId) {
      return NextResponse.json({ error: 'versionId krävs' }, { status: 400 })
    }

    // Get the document version with analysis data
    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        document: {
          include: {
            dataRoom: {
              include: {
                listing: {
                  select: {
                    companyName: true,
                    anonymousTitle: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!version) {
      return NextResponse.json({ error: 'Dokumentversion hittades inte' }, { status: 404 })
    }

    // Check if analysis exists
    if (!version.analysisStatus || version.analysisStatus === 'pending' || version.analysisStatus === 'analyzing') {
      return NextResponse.json({ error: 'Ingen analys tillgänglig' }, { status: 400 })
    }

    // Get document type from category or title
    const docTitle = version.document.title
    const documentType = getDocumentType(docTitle, version.fileName)

    // Prepare PDF data
    const pdfData = {
      documentTitle: docTitle,
      fileName: version.fileName,
      documentType,
      analyzedAt: new Date().toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      score: version.analysisScore || 0,
      summary: version.analysisSummary || 'Ingen sammanfattning tillgänglig.',
      findings: (version.analysisFindings as Array<{ type: string; message: string }>) || [],
      listingName: version.document.dataRoom?.listing?.companyName || 
                   version.document.dataRoom?.listing?.anonymousTitle || 
                   undefined,
    }

    // Generate PDF
    const pdfBuffer = await generateDDAnalysisPDF(pdfData as any)

    // Return PDF with appropriate headers
    const filename = `DD-Analys_${docTitle.replace(/[^a-zA-Z0-9åäöÅÄÖ]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating DD analysis PDF:', error)
    return NextResponse.json(
      { error: 'Kunde inte generera PDF' },
      { status: 500 }
    )
  }
}

function getDocumentType(title: string, fileName: string): string {
  const text = `${title} ${fileName}`.toLowerCase()
  
  if (text.includes('årsredovisning') || text.includes('annual')) return 'Årsredovisning'
  if (text.includes('balans')) return 'Balansräkning'
  if (text.includes('resultat')) return 'Resultaträkning'
  if (text.includes('aktiebok') || text.includes('shareholder')) return 'Aktiebok'
  if (text.includes('bolagsordning') || text.includes('articles')) return 'Bolagsordning'
  if (text.includes('avtal') || text.includes('contract') || text.includes('agreement')) return 'Avtal'
  if (text.includes('budget') || text.includes('forecast') || text.includes('prognos')) return 'Budget/Prognos'
  if (text.includes('patent') || text.includes('ip') || text.includes('varumärke')) return 'IP/Patent'
  if (text.includes('anställ') || text.includes('employee') || text.includes('personal')) return 'Personalrelaterat'
  if (text.includes('kund') || text.includes('customer') || text.includes('client')) return 'Kundrelaterat'
  if (text.includes('leverantör') || text.includes('supplier') || text.includes('vendor')) return 'Leverantörsrelaterat'
  if (text.includes('försäkring') || text.includes('insurance')) return 'Försäkring'
  if (text.includes('skatt') || text.includes('tax')) return 'Skatterelaterat'
  
  return 'Övrigt dokument'
}

