import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/request-auth'

/**
 * GET /api/dataroom/audit
 * Fetch audit logs for a dataroom. Only OWNER can view full audit trail.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dataRoomId = searchParams.get('dataRoomId')
    const actorId = searchParams.get('actorId') // optional filter
    const action = searchParams.get('action') // optional filter
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!dataRoomId) {
      return NextResponse.json({ error: 'dataRoomId krävs' }, { status: 400 })
    }

    // Check permission: user must be OWNER of the dataroom
    const dataRoom = await prisma.dataRoom.findUnique({
      where: { id: dataRoomId },
      include: {
        permissions: {
          where: { userId }
        },
        listing: {
          select: { userId: true }
        }
      }
    })

    if (!dataRoom) {
      return NextResponse.json({ error: 'Datarum hittades inte' }, { status: 404 })
    }

    const isOwner = dataRoom.listing.userId === userId ||
      dataRoom.permissions.some(p => p.role === 'OWNER')

    if (!isOwner) {
      return NextResponse.json({ error: 'Endast ägare kan se audit-loggen' }, { status: 403 })
    }

    // Build filter
    const where: any = { dataRoomId }
    if (actorId) where.actorId = actorId
    if (action) where.action = action

    // Fetch logs
    const [logs, total] = await Promise.all([
      prisma.dataRoomAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.dataRoomAudit.count({ where })
    ])

    // Get unique actor IDs to fetch names
    const actorIds = [...new Set(logs.map(l => l.actorId).filter(Boolean))] as string[]
    const actors = actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, email: true }
        })
      : []
    const actorMap = new Map(actors.map(a => [a.id, a.name || a.email || 'Okänd']))

    // Format logs
    const formattedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      actionLabel: getActionLabel(log.action),
      actorId: log.actorId,
      actorName: log.actorId ? actorMap.get(log.actorId) : log.actorEmail || 'System',
      actorEmail: log.actorEmail,
      targetType: log.targetType,
      targetId: log.targetId,
      meta: log.meta,
      createdAt: log.createdAt.toISOString()
    }))

    return NextResponse.json({
      logs: formattedLogs,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Kunde inte hämta logg' }, { status: 500 })
  }
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    view: 'Visade dokument',
    download: 'Laddade ner',
    upload: 'Laddade upp',
    delete: 'Raderade',
    invite: 'Bjöd in',
    accept_nda: 'Godkände NDA',
    policy_change: 'Ändrade inställningar',
    folder_create: 'Skapade mapp',
    folder_delete: 'Raderade mapp',
    permission_change: 'Ändrade behörighet'
  }
  return labels[action] || action
}

