import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SCAN_TOKEN = process.env.SCAN_WEBHOOK_TOKEN || ''

// POST /api/dataroom/scan/callback
// Body: { versionId: string, status: 'clean' | 'blocked', reason?: string }
export async function POST(request: NextRequest) {
  try {
    if (!SCAN_TOKEN) {
      return NextResponse.json({ error: 'Webhook token saknas' }, { status: 500 })
    }

    const auth = request.headers.get('authorization')
    if (!auth || auth !== `Bearer ${SCAN_TOKEN}`) {
      return NextResponse.json({ error: 'Otillåten' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { versionId, status, reason } = body

    if (!versionId || !status || !['clean', 'blocked'].includes(status)) {
      return NextResponse.json({ error: 'Ogiltig payload' }, { status: 400 })
    }

    const version = await prisma.dataRoomDocumentVersion.findUnique({
      where: { id: versionId },
      include: { document: true },
    })
    if (!version) {
      return NextResponse.json({ error: 'Version hittades inte' }, { status: 404 })
    }

    await prisma.dataRoomDocumentVersion.update({
      where: { id: versionId },
      data: { virusScan: status },
    })

    // If blocked, mark document status blocked
    if (status === 'blocked') {
      await prisma.dataRoomDocument.update({
        where: { id: version.documentId },
        data: { status: 'blocked' },
      })
    } else {
      await prisma.dataRoomDocument.update({
        where: { id: version.documentId },
        data: { status: 'ready' },
      })
    }

    await prisma.dataRoomAudit.create({
      data: {
        dataRoomId: version.document.dataRoomId,
        action: 'VIRUS_SCAN',
        targetType: 'documentVersion',
        targetId: versionId,
        meta: { status, reason },
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('scan callback error', error)
    return NextResponse.json({ error: 'Internt fel' }, { status: 500 })
  }
}

