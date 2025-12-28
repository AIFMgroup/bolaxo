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
    const userEmail = cookieStore.get('bolaxo_user_email')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const isDemo = userId.startsWith('demo') || dataRoomId.startsWith('demo')

    // Demo mode: return mock data without any database operations
    if (isDemo) {
      return NextResponse.json({
        dataRoom: {
          id: dataRoomId,
          listingId: 'demo-listing-1',
          listingName: 'Demo Företag AB',
          ndaRequired: false,
        },
        folders: [
          { id: 'demo-root', name: 'Root', parentId: null, documentCount: 0 },
        ],
        documents: [],
        permissions: {
          role: 'OWNER',
          canUpload: true,
          canDelete: true,
          canInvite: true,
          canDownload: true,
        },
      })
    }

    // Non-demo: full database operations
    let permission: { role: string } | null = null
    let isOwner = false
    let isEditor = false
    
    // Check permission
    permission = await prisma.dataRoomPermission.findFirst({
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

    isOwner = permission.role === 'OWNER'
    isEditor = permission.role === 'EDITOR'

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

    const grantsInclude: any =
      isOwner || isEditor
        ? {
            select: { id: true, userId: true, email: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 200,
          }
        : {
            where: {
              OR: [
                userId ? { userId } : undefined,
                userEmail ? { email: userEmail } : undefined,
              ].filter(Boolean) as any,
            },
            select: { id: true },
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
            userId: true,
          },
        },
        folders: {
          orderBy: { name: 'asc' },
        },
        documents: {
          include: {
            grants: grantsInclude,
            currentVersion: {
              select: {
                id: true,
                version: true,
                fileName: true,
                size: true,
                mimeType: true,
                uploadedAt: true,
                analysisStatus: true,
                analysisSummary: true,
                analysisScore: true,
                analysisFindings: true,
              },
            },
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
        meta: {
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        },
      },
    })

    // Transform documents for response
    const isViewer = !(isOwner || isEditor)
    const listingId = dataRoom.listing?.id

    const hasTransaction = async () => {
      if (!listingId) return false
      const tx = await prisma.transaction.findFirst({
        where: { listingId, OR: [{ buyerId: userId }, { sellerId: userId }] },
        select: { id: true },
      })
      return !!tx
    }
    const txOk = isViewer ? await hasTransaction() : true

    const documents = dataRoom.documents
      .filter((doc) => {
        if (!isViewer) return true
        const vis = (doc as any).visibility as string | undefined
        if (vis === 'OWNER_ONLY') return false
        if (vis === 'TRANSACTION_ONLY') return txOk
        if (vis === 'CUSTOM') return (doc as any).grants?.length > 0
        // ALL / NDA_ONLY are fine (NDA already checked above for non-owners)
        return true
      })
      .map((doc) => {
        const canDownload =
          !isViewer ||
          (!!dataRoom.downloadEnabled && !(doc as any).downloadBlocked)

        return {
      id: doc.id,
      name: doc.title,
      title: doc.title,
      category: null,
      requirementId: doc.requirementId,
      visibility: (doc as any).visibility,
      downloadBlocked: !!(doc as any).downloadBlocked,
      watermarkRequired: !!(doc as any).watermarkRequired,
      canDownload,
      grants: isViewer
        ? undefined
        : (doc as any).grants?.map((g: any) => ({ id: g.id, userId: g.userId, email: g.email, createdAt: g.createdAt })),
      folder: doc.folder
        ? { id: doc.folder.id, name: doc.folder.name }
        : null,
      currentVersion: doc.currentVersion
        ? {
            id: doc.currentVersion.id,
            version: doc.currentVersion.version,
            versionNumber: doc.currentVersion.version,
            fileName: doc.currentVersion.fileName,
            size: doc.currentVersion.size,
            fileSize: doc.currentVersion.size,
            mimeType: doc.currentVersion.mimeType,
            uploadedAt: doc.currentVersion.uploadedAt,
            // Include analysis data
            analysis: doc.currentVersion.analysisStatus ? {
              status: doc.currentVersion.analysisStatus as string,
              summary: doc.currentVersion.analysisSummary || undefined,
              score: doc.currentVersion.analysisScore || undefined,
              findings: doc.currentVersion.analysisFindings 
                ? (doc.currentVersion.analysisFindings as Array<{ type: string; message: string }>)
                : undefined,
            } : undefined,
          }
        : null,
      versions: isOwner || isEditor
        ? doc.versions.map((v) => ({
            id: v.id,
            version: v.version,
            versionNumber: v.version,
            fileName: v.fileName,
            size: v.size,
            fileSize: v.size,
            createdAt: v.uploadedAt,
          }))
        : undefined, // Viewers only see current version
      uploadedBy: 'Okänd',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
      })

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
        downloadEnabled: dataRoom.downloadEnabled,
        watermarkDownloads: dataRoom.watermarkDownloads,
      },
      folders,
      documents,
      permissions: {
        role: permission?.role || 'VIEWER',
        canUpload: isOwner || isEditor,
        canDelete: isOwner || isEditor,
        canInvite: isOwner,
        canDownload: true, // per-doc download capability is returned on each doc
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

