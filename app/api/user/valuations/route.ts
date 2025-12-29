import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/request-auth'

export async function GET(request: NextRequest) {
  try {
    const actorId = getAuthenticatedUserId(request)
    if (!actorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')

    // Non-admin users may only fetch their own valuations.
    const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { role: true, email: true } })
    const isAdmin = actor?.role === 'admin'

    const where: any = {}
    if (isAdmin) {
      if (userId) where.userId = userId
      if (email) where.email = email
      if (!userId && !email) {
        return NextResponse.json({ error: 'userId or email required' }, { status: 400 })
      }
    } else {
      where.userId = actorId
    }
    
    const valuations = await prisma.valuation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    
    return NextResponse.json({ valuations })
  } catch (error) {
    console.error('Error fetching valuations:', error)
    return NextResponse.json({ error: 'Failed to fetch valuations' }, { status: 500 })
  }
}
