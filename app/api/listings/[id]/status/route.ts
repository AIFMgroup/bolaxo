import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/request-auth'

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const id = params.id

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    if (!action) {
      return NextResponse.json({ error: 'action krävs' }, { status: 400 })
    }

    const actorId = await getAuthenticatedUserId(request)
    if (!actorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, userId: true }
    })

    if (!listing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Allow admins too
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true }
    })

    const isAdmin = actor?.role === 'admin'
    const isOwner = listing.userId === actorId
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (action === 'delete') {
      await prisma.listing.delete({
        where: { id }
      })
      return NextResponse.json({ success: true, message: 'Annons borttagen' })
    }

    if (action === 'pause') {
      const updated = await prisma.listing.update({
        where: { id },
        data: { status: 'paused' }
      })
      return NextResponse.json({ success: true, listing: updated, message: 'Annons pausad' })
    }

    if (action === 'resume') {
      const updated = await prisma.listing.update({
        where: { id },
        data: { status: 'active' }
      })
      return NextResponse.json({ success: true, listing: updated, message: 'Annons aktiv igen' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating listing status:', error)
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}
