import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/request-auth'

// POST /api/questions/[id]/answers
// Seller answers a question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })

  const { id: questionId } = await params
  const body = await request.json().catch(() => ({}))
  const content = body?.content as string
  if (!content) return NextResponse.json({ error: 'content krävs' }, { status: 400 })

  const q = await prisma.question.findUnique({
    where: { id: questionId },
    include: { listing: { select: { userId: true } } },
  })
  if (!q) return NextResponse.json({ error: 'Fråga hittades inte' }, { status: 404 })
  if (q.listing.userId !== userId) return NextResponse.json({ error: 'Endast säljaren kan svara' }, { status: 403 })

  const answer = await prisma.answer.create({
    data: {
      questionId,
      sellerId: userId,
      content,
    },
    select: { id: true, createdAt: true },
  })

  await prisma.question.update({
    where: { id: questionId },
    data: { status: 'answered', answeredAt: new Date() },
  })

  return NextResponse.json({ success: true, answerId: answer.id, createdAt: answer.createdAt })
}


