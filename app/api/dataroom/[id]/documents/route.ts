import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// GET /api/dataroom/[id]/documents
// List all documents in a dataroom (role-filtered)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dataRoomId } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
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

    const isOwner = permission.role === 'OWNER'
    const isEditor = permission.role === 'EDITOR'

    // For non-owners, check NDA acceptance
    if (!isOwner) {
      const ndaAccepted = await prisma.dataRoomNDAAcceptance.findFirst({
        where: {
          dataRoomId,
          userId,
        },
      })

      if (!ndaAccepted) {
        return NextResponse.json(
          { error: 'NDA måste accepteras först', ndaRequired: true },
          { status: 403 }
        )
      }
    }

    // Get dataroom with folders and documents
    const dataRoom = await prisma.dataRoom.findUnique({
      where: { id: dataRoomId },
      include: {
        listing: {
          select: {
            id: true,
            companyName: true,
            anonymousTitle: true,
          },
        },
        folders: {
          orderBy: { name: 'asc' },
        },
        documents: {
          include: {
            currentVersion: true,
            versions: {
              orderBy: { version: 'desc' },
              take: 5, // Last 5 versions
            },
            folder: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!dataRoom) {
      return NextResponse.json({ error: 'Datarum hittades inte' }, { status: 404 })
    }

    // Log view audit
    await prisma.dataRoomAudit.create({
      data: {
        dataRoomId,
        actorId: userId,
        action: 'VIEW',
        targetType: 'DATAROOM',
        targetId: dataRoomId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      },
    })

    // Transform documents for response
    const documents = dataRoom.documents.map((doc) => ({
      id: doc.id,
      name: doc.title,
      category: null,
      requirementId: doc.requirementId,
      folder: doc.folder
        ? { id: doc.folder.id, name: doc.folder.name }
        : null,
      currentVersion: doc.currentVersion
        ? {
            id: doc.currentVersion.id,
            versionNumber: doc.currentVersion.version,
            fileName: doc.currentVersion.fileName,
            fileSize: doc.currentVersion.size,
            mimeType: doc.currentVersion.mimeType,
            uploadedAt: doc.currentVersion.uploadedAt,
          }
        : null,
      versions: isOwner || isEditor
        ? doc.versions.map((v) => ({
            id: v.id,
            versionNumber: v.version,
            fileName: v.fileName,
            fileSize: v.size,
            createdAt: v.uploadedAt,
          }))
        : undefined, // Viewers only see current version
      uploadedBy: 'Okänd',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }))

    // Build folder structure
    const folders = dataRoom.folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      documentCount: documents.filter((d) => d.folder?.id === folder.id).length,
    }))

    return NextResponse.json({
      dataRoom: {
        id: dataRoom.id,
        listingId: dataRoom.listingId,
        listingName:
          dataRoom.listing?.anonymousTitle ||
          dataRoom.listing?.companyName ||
          'Okänt företag',
        ndaRequired: true,
      },
      folders,
      documents,
      permissions: {
        role: permission.role,
        canUpload: isOwner || isEditor,
        canDelete: isOwner || isEditor,
        canInvite: isOwner,
        canDownload: true, // All with access can download (after NDA)
      },
    })
  } catch (error) {
    console.error('Error listing dataroom documents:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta dokument' },
      { status: 500 }
    )
  }
}

