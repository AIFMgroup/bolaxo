import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// POST /api/dataroom/invite
// Invite a buyer or advisor to the dataroom
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('afterfounder_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    // Demo bypass: accept invites but do nothing server-side
    if (userId.startsWith('demo')) {
      const body = await request.json()
      const { dataRoomId, email, role } = body
      return NextResponse.json({
        invite: {
          id: 'demo-invite',
          email,
          role,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        message: 'Demo-invite skapad (mock)',
      })
    }

    const body = await request.json()
    const { dataRoomId, email, role, message } = body

    if (!dataRoomId || !email || !role) {
      return NextResponse.json(
        { error: 'dataRoomId, email och role krävs' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['EDITOR', 'VIEWER'].includes(role)) {
      return NextResponse.json(
        { error: 'Ogiltig roll. Tillåtna: EDITOR, VIEWER' },
        { status: 400 }
      )
    }

    // Check user has OWNER permission on this dataroom
    const permission = await prisma.dataRoomPermission.findFirst({
      where: {
        dataRoomId,
        userId,
        role: 'OWNER',
      },
    })

    if (!permission) {
      return NextResponse.json(
        { error: 'Endast ägare kan bjuda in användare' },
        { status: 403 }
      )
    }

    // Check if invite already exists
    const existingInvite = await prisma.dataRoomInvite.findFirst({
      where: {
        dataRoomId,
        email: email.toLowerCase(),
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    })

    if (existingInvite) {
      return NextResponse.json(
        { error: 'En inbjudan finns redan för denna e-postadress' },
        { status: 400 }
      )
    }

    // Check if user already has permission
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      const existingPerm = await prisma.dataRoomPermission.findFirst({
        where: {
          dataRoomId,
          userId: existingUser.id,
        },
      })

      if (existingPerm) {
        return NextResponse.json(
          { error: 'Användaren har redan åtkomst till datarummet' },
          { status: 400 }
        )
      }
    }

    // Generate invite token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invite
    const invite = await prisma.dataRoomInvite.create({
      data: {
        dataRoomId,
        email: email.toLowerCase(),
        role,
        token,
        expiresAt,
      },
    })

    // Log audit
    await prisma.dataRoomAudit.create({
      data: {
        dataRoomId,
        actorId: userId,
        action: 'INVITE_SENT',
        targetType: 'INVITE',
        targetId: invite.id,
        meta: { email: email.toLowerCase(), role, message },
      },
    })

    // TODO: Send invitation email
    // await sendDataRoomInviteEmail({ email, token, dataRoomId, message })

    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
      },
    })
  } catch (error) {
    console.error('Error creating dataroom invite:', error)
    return NextResponse.json(
      { error: 'Kunde inte skapa inbjudan' },
      { status: 500 }
    )
  }
}

// GET /api/dataroom/invite?dataRoomId=xxx
// List all invites for a dataroom (owner only)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('afterfounder_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    // Demo bypass: return mocked invites
    if (userId.startsWith('demo')) {
      return NextResponse.json({
        invites: [
          {
            id: 'demo-invite-1',
            email: 'advisor@demo.se',
            role: 'VIEWER',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            acceptedAt: null,
          },
        ],
      })
    }

    const { searchParams } = new URL(request.url)
    const dataRoomId = searchParams.get('dataRoomId')

    if (!dataRoomId) {
      return NextResponse.json({ error: 'dataRoomId krävs' }, { status: 400 })
    }

    // Check user has OWNER permission
    const permission = await prisma.dataRoomPermission.findFirst({
      where: {
        dataRoomId,
        userId,
        role: 'OWNER',
      },
    })

    if (!permission) {
      return NextResponse.json({ error: 'Ingen behörighet' }, { status: 403 })
    }

    const invites = await prisma.dataRoomInvite.findMany({
      where: { dataRoomId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      invites: invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
      })),
    })
  } catch (error) {
    console.error('Error listing dataroom invites:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta inbjudningar' },
      { status: 500 }
    )
  }
}

