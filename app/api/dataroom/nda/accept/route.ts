import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// POST /api/dataroom/nda/accept
// Accept the NDA for a dataroom (required for buyers/advisors to download)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const body = await request.json()
    const { dataRoomId, ndaVersion } = body

    if (!dataRoomId) {
      return NextResponse.json({ error: 'dataRoomId krävs' }, { status: 400 })
    }

    // Check user has permission to this dataroom
    const permission = await prisma.dataRoomPermission.findFirst({
      where: {
        dataRoomId,
        userId,
      },
    })

    if (!permission) {
      return NextResponse.json(
        { error: 'Du har inte åtkomst till detta datarum' },
        { status: 403 }
      )
    }

    // Owners don't need to accept NDA
    if (permission.role === 'OWNER') {
      return NextResponse.json({
        message: 'Ägare behöver inte acceptera NDA',
        accepted: true,
      })
    }

    // Check if already accepted
    const existing = await prisma.dataRoomNDAAcceptance.findFirst({
      where: {
        dataRoomId,
        userId,
      },
    })

    if (existing) {
      return NextResponse.json({
        message: 'NDA redan accepterat',
        accepted: true,
        acceptedAt: existing.acceptedAt,
      })
    }

    // Get user info for recording
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    // Create NDA acceptance
    const acceptance = await prisma.dataRoomNDAAcceptance.create({
      data: {
        dataRoomId,
        userId,
        ndaVersion: ndaVersion || 'v1.0',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    // Log audit
    await prisma.dataRoomAudit.create({
      data: {
        dataRoomId,
        actorId: userId,
        action: 'NDA_ACCEPTED',
        targetType: 'NDA',
        targetId: acceptance.id,
        meta: {
          ndaVersion: ndaVersion || 'v1.0',
          email: user?.email,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        },
      },
    })

    return NextResponse.json({
      message: 'NDA accepterat',
      accepted: true,
      acceptedAt: acceptance.acceptedAt,
    })
  } catch (error) {
    console.error('Error accepting NDA:', error)
    return NextResponse.json(
      { error: 'Kunde inte acceptera NDA' },
      { status: 500 }
    )
  }
}

// GET /api/dataroom/nda/accept?dataRoomId=xxx
// Check NDA status for current user
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dataRoomId = searchParams.get('dataRoomId')

    if (!dataRoomId) {
      return NextResponse.json({ error: 'dataRoomId krävs' }, { status: 400 })
    }

    // Check permission
    const permission = await prisma.dataRoomPermission.findFirst({
      where: {
        dataRoomId,
        userId,
      },
    })

    if (!permission) {
      return NextResponse.json(
        { error: 'Du har inte åtkomst till detta datarum' },
        { status: 403 }
      )
    }

    // Owners don't need NDA
    if (permission.role === 'OWNER') {
      return NextResponse.json({
        required: false,
        accepted: true,
        role: 'OWNER',
      })
    }

    // Check NDA acceptance
    const acceptance = await prisma.dataRoomNDAAcceptance.findFirst({
      where: {
        dataRoomId,
        userId,
      },
    })

    return NextResponse.json({
      required: true,
      accepted: !!acceptance,
      acceptedAt: acceptance?.acceptedAt || null,
      role: permission.role,
    })
  } catch (error) {
    console.error('Error checking NDA status:', error)
    return NextResponse.json(
      { error: 'Kunde inte kontrollera NDA-status' },
      { status: 500 }
    )
  }
}

