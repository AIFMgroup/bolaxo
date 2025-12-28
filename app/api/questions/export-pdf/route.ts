import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/request-auth'
import PDFDocument from 'pdfkit'

async function getQaAccess(listingId: string, userId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, userId: true, anonymousTitle: true, companyName: true, dataroom: { select: { id: true } } },
  })
  if (!listing) return { ok: false as const, status: 404 as const, error: 'Objekt hittades inte' }

  if (listing.userId === userId) return { ok: true as const, role: 'seller' as const, listing }

  const nda = await prisma.nDARequest.findFirst({
    where: {
      listingId,
      buyerId: userId,
      status: { in: ['approved', 'signed'] },
    },
    select: { id: true },
  })
  const tx = await prisma.transaction.findFirst({
    where: { listingId, buyerId: userId },
    select: { id: true },
  })
  const dataroomNda = listing.dataroom?.id
    ? await prisma.dataRoomNDAAcceptance.findFirst({
        where: { dataRoomId: listing.dataroom.id, userId },
        select: { id: true },
      })
    : null

  if (!nda && !tx && !dataroomNda) {
    return { ok: false as const, status: 403 as const, error: 'NDA eller transaktion krävs för Q&A' }
  }

  return { ok: true as const, role: 'buyer' as const, listing }
}

// GET /api/questions/export-pdf?listingId=...
export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const listingId = searchParams.get('listingId')
  if (!listingId) return NextResponse.json({ error: 'listingId krävs' }, { status: 400 })

  const access = await getQaAccess(listingId, userId)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

  const where: any = { listingId }
  if (access.role === 'buyer') where.buyerId = userId

  const questions = await prisma.question.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: { answers: { orderBy: { createdAt: 'asc' } }, buyer: { select: { name: true } } },
  })

  const title = access.listing.anonymousTitle || access.listing.companyName || listingId

  const doc = new PDFDocument({ margin: 50 })
  const chunks: Buffer[] = []
  doc.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))

  doc.fontSize(18).text(`Q&A – ${title}`, { underline: true })
  doc.moveDown()
  doc.fontSize(10).fillColor('#666').text(`Export: ${new Date().toLocaleString('sv-SE')}`)
  doc.fillColor('#000')
  doc.moveDown()

  questions.forEach((q, idx) => {
    doc.fontSize(12).text(`${idx + 1}. ${q.title}`)
    doc.fontSize(10).fillColor('#666').text(`Kategori: ${q.category} • Prioritet: ${q.priority} • Status: ${q.status}`)
    if (q.buyer?.name) doc.text(`Köpare: ${q.buyer.name}`)
    doc.fillColor('#000')
    doc.moveDown(0.5)
    doc.fontSize(11).text(q.description)
    doc.moveDown(0.5)
    if (q.answers.length === 0) {
      doc.fontSize(10).fillColor('#999').text('Inget svar ännu.')
      doc.fillColor('#000')
    } else {
      q.answers.forEach((a, aIdx) => {
        doc.fontSize(10).fillColor('#333').text(`Svar ${aIdx + 1}:`)
        doc.fillColor('#000')
        doc.fontSize(11).text(a.content)
        doc.moveDown(0.5)
      })
    }
    doc.moveDown()
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor('#eee').stroke()
    doc.strokeColor('#000')
    doc.moveDown()
  })

  doc.end()

  const buffer = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  // NextResponse expects a web BodyInit; use Uint8Array for type-safe binary response.
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="qa-${listingId}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}


