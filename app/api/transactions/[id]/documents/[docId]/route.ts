import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// Verify user has access to transaction
async function verifyTransactionAccess(transactionId: string, userId: string): Promise<{ allowed: boolean; role: string | null; userName: string | null }> {
  const [transaction, user] = await Promise.all([
    prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        buyerId: true,
        sellerId: true,
        advisorId: true
      }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    })
  ])

  if (!transaction) {
    return { allowed: false, role: null, userName: null }
  }

  const userName = user?.name || user?.email || userId

  if (transaction.buyerId === userId) return { allowed: true, role: 'buyer', userName }
  if (transaction.sellerId === userId) return { allowed: true, role: 'seller', userName }
  if (transaction.advisorId === userId) return { allowed: true, role: 'advisor', userName }
  
  // Check if user is a team member (separate query since no direct relation)
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      transactionId,
      OR: [{ userId }, { email: userId }],
      status: 'ACCEPTED'
    }
  })

  if (teamMember) {
    return { allowed: true, role: 'team_member', userName }
  }

  return { allowed: false, role: null, userName: null }
}

// Log document access
async function logAccess(
  transactionId: string, 
  documentId: string, 
  userId: string, 
  action: string, 
  userRole: string,
  documentName: string
) {
  await prisma.activity.create({
    data: {
      transactionId,
      type: 'DOCUMENT_ACCESS',
      title: `Dokument ${action}: ${documentName}`,
      description: `${userRole} ${action} dokumentet`,
      actorId: userId,
      actorName: userId,
      actorRole: userRole,
      metadata: { 
        documentId, 
        action, 
        documentName,
        timestamp: new Date().toISOString(),
        ipAddress: 'logged' // In production, get real IP
      }
    }
  })
}

/**
 * GET /api/transactions/[id]/documents/[docId] - Download document
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; docId: string }> }
) {
  const params = await context.params
  const { id: transactionId, docId } = params

  try {
    // Get user from cookie
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Ej autentiserad' },
        { status: 401 }
      )
    }

    // Verify access
    const access = await verifyTransactionAccess(transactionId, userId)
    
    if (!access.allowed) {
      // Log unauthorized attempt
      await prisma.activity.create({
        data: {
          transactionId,
          type: 'UNAUTHORIZED_ACCESS',
          title: 'Obehörigt nedladdningsförsök',
          description: `Användare ${userId} försökte ladda ner dokument ${docId}`,
          actorId: userId,
          actorName: userId,
          actorRole: 'unknown'
        }
      })
      
      return NextResponse.json(
        { error: 'Du har inte behörighet att ladda ner detta dokument.' },
        { status: 403 }
      )
    }

    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id: docId,
        transactionId
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Dokumentet hittades inte' },
        { status: 404 }
      )
    }

    // Log download
    await logAccess(transactionId, docId, userId, 'laddade ner', access.role!, document.fileName || 'Okänt dokument')

    // In production:
    // 1. Decrypt file from S3
    // 2. Add watermark with user info
    // 3. Re-encrypt for transfer
    // 4. Stream to client

    // For now, return metadata (actual file serving requires S3 integration)
    return NextResponse.json({
      message: 'Dokumentnedladdning loggad',
      document: {
        id: document.id,
        name: document.fileName,
        type: document.mimeType,
        size: document.fileSize,
        watermark: `Nedladdat av ${access.userName} (${access.role}) - ${new Date().toISOString()}`
      },
      // In production, this would be a signed URL or direct file stream
      downloadUrl: document.fileUrl
    })
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json(
      { error: 'Kunde inte ladda ner dokument' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/transactions/[id]/documents/[docId] - Delete document
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; docId: string }> }
) {
  const params = await context.params
  const { id: transactionId, docId } = params

  try {
    // Get user from cookie
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Ej autentiserad' },
        { status: 401 }
      )
    }

    // Verify access - only seller can delete
    const access = await verifyTransactionAccess(transactionId, userId)
    
    if (!access.allowed || access.role !== 'seller') {
      return NextResponse.json(
        { error: 'Endast säljaren kan ta bort dokument.' },
        { status: 403 }
      )
    }

    // Get document for logging
    const document = await prisma.document.findFirst({
      where: {
        id: docId,
        transactionId
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Dokumentet hittades inte' },
        { status: 404 }
      )
    }

    // Delete document
    await prisma.document.delete({
      where: { id: docId }
    })

    // Log deletion
    await logAccess(transactionId, docId, userId, 'raderade', access.role!, document.fileName || 'Okänt dokument')

    // In production: Also delete from S3

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort dokument' },
      { status: 500 }
    )
  }
}
