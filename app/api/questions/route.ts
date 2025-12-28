import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/request-auth'

async function getQaAccess(listingId: string, userId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, userId: true, dataroom: { select: { id: true } } },
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

// GET /api/questions?listingId=...
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
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      buyer: { select: { id: true, name: true } },
      answers: {
        orderBy: { createdAt: 'asc' },
        include: { seller: { select: { id: true, name: true } } },
      },
    },
  })

  return NextResponse.json({
    role: access.role,
    questions: questions.map((q) => ({
      id: q.id,
      listingId: q.listingId,
      buyerId: q.buyerId,
      buyerName: q.buyer?.name || null,
      title: q.title,
      description: q.description,
      category: q.category,
      priority: q.priority,
      status: q.status,
      slaHours: q.slaHours,
      slaDeadline: q.slaDeadline,
      answeredAt: q.answeredAt,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      answers: q.answers.map((a) => ({
        id: a.id,
        sellerId: a.sellerId,
        sellerName: a.seller?.name || null,
        content: a.content,
        createdAt: a.createdAt,
      })),
    })),
  })
}

// POST /api/questions
// Buyer creates a question
export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const listingId = body?.listingId as string
  const title = body?.title as string
  const description = body?.description as string
  const category = (body?.category as string) || 'other'
  const priority = (body?.priority as string) || 'medium'

  if (!listingId || !title || !description) {
    return NextResponse.json({ error: 'listingId, title, description krävs' }, { status: 400 })
  }

  const access = await getQaAccess(listingId, userId)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  if (access.role !== 'buyer') return NextResponse.json({ error: 'Endast köpare kan ställa frågor' }, { status: 403 })

  const slaHours = 48
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000)

  const q = await prisma.question.create({
    data: {
      listingId,
      buyerId: userId,
      title: title.trim().slice(0, 200),
      description,
      category,
      priority,
      status: 'open',
      slaHours,
      slaDeadline,
    },
    select: { id: true, createdAt: true },
  })

  return NextResponse.json({ success: true, questionId: q.id, createdAt: q.createdAt })
}


