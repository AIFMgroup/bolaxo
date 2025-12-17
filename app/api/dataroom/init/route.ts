import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

// POST /api/dataroom/init
// Ensures a datarum exists for a listing and seeds root folder + owner permission
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const listingId = body?.listingId as string

    if (!listingId) {
      return NextResponse.json({ error: 'listingId krävs' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const userId = cookieStore.get('afterfounder_user_id')?.value
    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    // Demo bypass: allow demo users to get a static dataroom without DB lookups
    if (userId.startsWith('demo')) {
      const demoDataRoomId = `demo-dataroom-${listingId || '1'}`
      return NextResponse.json({
        dataroomId: demoDataRoomId,
        dataRoom: {
          id: demoDataRoomId,
          listingId: listingId || 'demo-listing-1',
          createdBy: userId,
        },
        rootFolderId: 'demo-root-folder',
      })
    }

    // Verify ownership
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, userId },
      select: { id: true, userId: true },
    })
    if (!listing) {
      return NextResponse.json({ error: 'Ingen behörighet' }, { status: 403 })
    }

    // Upsert datarum
    let dataroom = await prisma.dataRoom.findUnique({ where: { listingId } })
    let rootFolderId: string | undefined

    if (!dataroom) {
      dataroom = await prisma.dataRoom.create({
        data: {
          listingId,
          createdBy: userId,
          folders: {
            create: {
              name: 'Root',
              path: '/',
            },
          },
          permissions: {
            create: {
              userId,
              role: 'OWNER',
              invitedBy: userId,
            },
          },
        },
      })
      // root folder is freshly created
      const root = await prisma.dataRoomFolder.findFirst({
        where: { dataRoomId: dataroom.id, parentId: null },
        select: { id: true },
      })
      rootFolderId = root?.id
    } else {
      const root = await prisma.dataRoomFolder.findFirst({
        where: { dataRoomId: dataroom.id, parentId: null },
        select: { id: true },
      })
      rootFolderId = root?.id
    }

    return NextResponse.json({
      dataroomId: dataroom.id,
      rootFolderId: rootFolderId || null,
    })
  } catch (error) {
    console.error('dataroom init error', error)
    return NextResponse.json({ error: 'Kunde inte initiera datarum' }, { status: 500 })
  }
}

