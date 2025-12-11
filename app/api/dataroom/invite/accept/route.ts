import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// POST /api/dataroom/invite/accept
// Accept an invite and gain access to the dataroom
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token krävs' }, { status: 400 })
    }

    // Find the invite
    const invite = await prisma.dataRoomInvite.findUnique({
      where: { token },
      include: {
        dataRoom: {
          include: {
            listing: {
              select: { companyName: true, anonymousTitle: true },
            },
          },
        },
        // no invitedBy relation available on invite; we only use invitedBy field on Permission
      },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Ogiltig inbjudan' }, { status: 404 })
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Inbjudan har redan använts eller avvisats' },
        { status: 400 }
      )
    }

    if (invite.expiresAt < new Date()) {
      await prisma.dataRoomInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      })
      return NextResponse.json({ error: 'Inbjudan har gått ut' }, { status: 400 })
    }

    // Get user email and verify it matches invite
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'Användare hittades inte' }, { status: 404 })
    }

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Inbjudan är för en annan e-postadress' },
        { status: 403 }
      )
    }

    // Check if permission already exists
    const existingPerm = await prisma.dataRoomPermission.findFirst({
      where: {
        dataRoomId: invite.dataRoomId,
        userId,
      },
    })

    if (existingPerm) {
      // Update invite status anyway
      await prisma.dataRoomInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      })
      return NextResponse.json({
        message: 'Du har redan åtkomst till datarummet',
        dataRoomId: invite.dataRoomId,
      })
    }

    // Create permission
    await prisma.dataRoomPermission.create({
      data: {
        dataRoomId: invite.dataRoomId,
        userId,
        role: invite.role as any,
        invitedBy: userId,
      },
    })

    // Update invite
    await prisma.dataRoomInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    })

    // Log audit
    await prisma.dataRoomAudit.create({
      data: {
        dataRoomId: invite.dataRoomId,
        actorId: userId,
        action: 'INVITE_ACCEPTED',
        targetType: 'INVITE',
        targetId: invite.id,
        metadata: { role: invite.role },
      },
    })

    return NextResponse.json({
      message: 'Inbjudan accepterad',
      dataRoomId: invite.dataRoomId,
      role: invite.role,
      listingName:
        invite.dataRoom.listing?.anonymousTitle ||
        invite.dataRoom.listing?.companyName ||
        'Okänt företag',
    })
  } catch (error) {
    console.error('Error accepting dataroom invite:', error)
    return NextResponse.json(
      { error: 'Kunde inte acceptera inbjudan' },
      { status: 500 }
    )
  }
}

