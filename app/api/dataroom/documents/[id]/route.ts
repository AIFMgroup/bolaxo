import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/request-auth'
import { logDataRoomAudit } from '@/lib/dataroom-audit'

async function getUserRole(dataRoomId: string, userId?: string | null) {
  if (!userId) return null
  const perm = await prisma.dataRoomPermission.findFirst({
    where: { dataRoomId, userId },
    select: { role: true },
  })
  return perm?.role || null
}

// PATCH /api/dataroom/documents/[id]
// Allows OWNER/EDITOR to update per-document policy.
// Body: { visibility?: "...", downloadBlocked?: boolean, watermarkRequired?: boolean, grantUserIds?: string[], grantEmails?: string[] }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params
    const userId = getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const visibility = body?.visibility as string | undefined
    const downloadBlocked = body?.downloadBlocked as boolean | undefined
    const watermarkRequired = body?.watermarkRequired as boolean | undefined
    const grantUserIds = Array.isArray(body?.grantUserIds) ? (body.grantUserIds as string[]) : []
    const grantEmails = Array.isArray(body?.grantEmails) ? (body.grantEmails as string[]) : []

    const doc = await prisma.dataRoomDocument.findUnique({
      where: { id: documentId },
      select: { id: true, dataRoomId: true, visibility: true, downloadBlocked: true, watermarkRequired: true },
    })
    if (!doc) return NextResponse.json({ error: 'Dokument hittades inte' }, { status: 404 })

    const role = await getUserRole(doc.dataRoomId, userId)
    if (!role || (role !== 'OWNER' && role !== 'EDITOR')) {
      return NextResponse.json({ error: 'Ingen behörighet' }, { status: 403 })
    }

    const updateData: any = {}
    if (visibility) updateData.visibility = visibility
    if (typeof downloadBlocked === 'boolean') updateData.downloadBlocked = downloadBlocked
    if (typeof watermarkRequired === 'boolean') updateData.watermarkRequired = watermarkRequired

    const updated = await prisma.dataRoomDocument.update({
      where: { id: documentId },
      data: updateData,
      select: { id: true, dataRoomId: true, visibility: true, downloadBlocked: true, watermarkRequired: true },
    })

    // Grants are only relevant for CUSTOM visibility.
    if ((visibility || updated.visibility) !== 'CUSTOM') {
      await prisma.dataRoomDocumentGrant.deleteMany({ where: { documentId } })
      await logDataRoomAudit({
        dataRoomId: doc.dataRoomId,
        actorId: userId,
        action: 'policy_change',
        targetType: 'document',
        targetId: documentId,
        meta: {
          from: { visibility: doc.visibility, downloadBlocked: doc.downloadBlocked, watermarkRequired: doc.watermarkRequired },
          to: { visibility: updated.visibility, downloadBlocked: updated.downloadBlocked, watermarkRequired: updated.watermarkRequired },
          grants: { userIds: [], emails: [] },
        },
      })
      return NextResponse.json({ success: true, document: updated, grants: [] })
    }

    // Sync grants (best-effort)
    const normalizedEmails = grantEmails
      .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
      .filter(Boolean)
    const normalizedUserIds = grantUserIds.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim())

    // Remove grants not present in new set
    await prisma.dataRoomDocumentGrant.deleteMany({
      where: {
        documentId,
        AND: [
          normalizedUserIds.length ? { userId: { notIn: normalizedUserIds } } : { userId: { not: null } },
          normalizedEmails.length ? { email: { notIn: normalizedEmails } } : { email: { not: null } },
        ],
      },
    })

    // Upsert userId grants
    for (const uid of normalizedUserIds) {
      await prisma.dataRoomDocumentGrant.upsert({
        where: { documentId_userId: { documentId, userId: uid } },
        create: { documentId, userId: uid },
        update: {},
      })
    }

    // Upsert email grants
    for (const email of normalizedEmails) {
      await prisma.dataRoomDocumentGrant.upsert({
        where: { documentId_email: { documentId, email } },
        create: { documentId, email },
        update: {},
      })
    }

    const grants = await prisma.dataRoomDocumentGrant.findMany({
      where: { documentId },
      select: { id: true, userId: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    await logDataRoomAudit({
      dataRoomId: doc.dataRoomId,
      actorId: userId,
      action: 'policy_change',
      targetType: 'document',
      targetId: documentId,
      meta: {
        from: { visibility: doc.visibility, downloadBlocked: doc.downloadBlocked, watermarkRequired: doc.watermarkRequired },
        to: { visibility: updated.visibility, downloadBlocked: updated.downloadBlocked, watermarkRequired: updated.watermarkRequired },
        grants: { userIds: normalizedUserIds, emails: normalizedEmails },
      },
    })

    return NextResponse.json({ success: true, document: updated, grants })
  } catch (error) {
    console.error('dataroom document policy update error', error)
    return NextResponse.json({ error: 'Kunde inte uppdatera dokument' }, { status: 500 })
  }
}


