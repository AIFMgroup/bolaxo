import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/request-auth'

function sanitizeFolderName(name: string) {
  return name.trim().replace(/\s+/g, ' ').replace(/[\/\\]/g, '-').slice(0, 80)
}

async function getUserRole(dataRoomId: string, userId: string) {
  const perm = await prisma.dataRoomPermission.findFirst({
    where: { dataRoomId, userId },
    select: { role: true },
  })
  return perm?.role || null
}

// POST /api/dataroom/folders
// Body: { dataRoomId: string, name: string, parentId?: string | null }
export async function POST(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const dataRoomId = body?.dataRoomId as string
    const rawName = body?.name as string
    const parentId = (body?.parentId as string | null | undefined) ?? null

    if (!dataRoomId || !rawName) {
      return NextResponse.json({ error: 'dataRoomId och name krävs' }, { status: 400 })
    }

    const role = await getUserRole(dataRoomId, userId)
    if (!role || (role !== 'OWNER' && role !== 'EDITOR')) {
      return NextResponse.json({ error: 'Ingen behörighet' }, { status: 403 })
    }

    const name = sanitizeFolderName(rawName)
    if (!name) return NextResponse.json({ error: 'Ogiltigt mappnamn' }, { status: 400 })

    let parentPath = '/'
    if (parentId) {
      const parent = await prisma.dataRoomFolder.findFirst({
        where: { id: parentId, dataRoomId },
        select: { id: true, path: true },
      })
      if (!parent) return NextResponse.json({ error: 'Ogiltig parentId' }, { status: 400 })
      parentPath = parent.path || '/'
    }

    const base = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath
    const path = (base ? `${base}/` : '/') + name

    const maxOrder = await prisma.dataRoomFolder.aggregate({
      where: { dataRoomId, parentId },
      _max: { order: true },
    })

    const folder = await prisma.dataRoomFolder.create({
      data: {
        dataRoomId,
        name,
        parentId,
        path,
        order: (maxOrder._max.order ?? 0) + 1,
      },
      select: { id: true, name: true, parentId: true, path: true },
    })

    return NextResponse.json({ success: true, folder })
  } catch (error) {
    console.error('dataroom folder create error', error)
    return NextResponse.json({ error: 'Kunde inte skapa mapp' }, { status: 500 })
  }
}


