import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Secure document handling with encryption and access control

// Encryption key - should be in env vars in production
const ENCRYPTION_KEY = process.env.DOCUMENT_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32)
const IV_LENGTH = 16

// Encrypt data using AES-256-CBC
function encrypt(buffer: Buffer): { encrypted: Buffer; iv: string } {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])
  return { encrypted, iv: iv.toString('hex') }
}

// Decrypt data
function decrypt(encrypted: Buffer, ivHex: string): Buffer {
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  return Buffer.concat([decipher.update(encrypted), decipher.final()])
}

// Verify user has access to transaction
async function verifyTransactionAccess(transactionId: string, userId: string): Promise<{ allowed: boolean; role: string | null }> {
  // Get transaction
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      buyerId: true,
      sellerId: true,
      advisorId: true
    }
  })

  if (!transaction) {
    return { allowed: false, role: null }
  }

  // Check if user is buyer, seller, or advisor
  if (transaction.buyerId === userId) return { allowed: true, role: 'buyer' }
  if (transaction.sellerId === userId) return { allowed: true, role: 'seller' }
  if (transaction.advisorId === userId) return { allowed: true, role: 'advisor' }
  
  // Check if user is a team member (separate query since no direct relation)
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      transactionId,
      OR: [{ userId }, { email: userId }],
      status: 'ACCEPTED'
    }
  })

  if (teamMember) {
    return { allowed: true, role: 'team_member' }
  }

  return { allowed: false, role: null }
}

// Log document access
async function logAccess(transactionId: string, documentId: string, userId: string, action: string, userRole: string) {
  await prisma.activity.create({
    data: {
      transactionId,
      type: 'DOCUMENT_ACCESS',
      title: `Dokument ${action}`,
      description: `Användare (${userRole}) ${action} dokument`,
      actorId: userId,
      actorName: userId,
      actorRole: userRole,
      metadata: { documentId, action, timestamp: new Date().toISOString() }
    }
  })
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const transactionId = params.id

  try {
    // Get user from cookie
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Ej autentiserad. Logga in för att komma åt dokument.' },
        { status: 401 }
      )
    }

    // Verify user has access to this transaction
    const access = await verifyTransactionAccess(transactionId, userId)
    
    if (!access.allowed) {
      // Log unauthorized access attempt
      await prisma.activity.create({
        data: {
          transactionId,
          type: 'UNAUTHORIZED_ACCESS',
          title: 'Obehörigt åtkomstförsök',
          description: `Användare ${userId} försökte komma åt dokument utan behörighet`,
          actorId: userId,
          actorName: userId,
          actorRole: 'unknown'
        }
      })
      
      return NextResponse.json(
        { error: 'Du har inte behörighet att se dessa dokument.' },
        { status: 403 }
      )
    }

    // Fetch documents
    const documents = await prisma.document.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        status: true,
        createdAt: true,
        uploadedBy: true,
        uploadedByName: true,
        // Don't expose fileUrl or encryption IV
      }
    })

    // Log access
    await logAccess(transactionId, 'all', userId, 'listade', access.role!)

    // Transform for frontend
    const safeDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.fileName || 'Okänt dokument',
      size: (doc.fileSize || 0) / (1024 * 1024), // Convert to MB
      uploadedAt: doc.createdAt.toISOString(),
      uploadedBy: doc.uploadedByName || doc.uploadedBy || 'Okänd',
      type: doc.mimeType || 'application/octet-stream',
      encrypted: true,
      status: doc.status
    }))

    return NextResponse.json({ documents: safeDocuments })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta dokument' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const transactionId = params.id

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

    // Verify user has access
    const access = await verifyTransactionAccess(transactionId, userId)
    
    if (!access.allowed) {
      return NextResponse.json(
        { error: 'Du har inte behörighet att ladda upp dokument här.' },
        { status: 403 }
      )
    }

    // Only sellers and advisors can upload
    if (!['seller', 'advisor'].includes(access.role!)) {
      return NextResponse.json(
        { error: 'Endast säljare och rådgivare kan ladda upp dokument.' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const type = formData.get('type') as string || 'DOCUMENT'

    if (!file || !title) {
      return NextResponse.json(
        { error: 'Fil och titel krävs' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ogiltig filtyp. Endast PDF, Word, Excel och PowerPoint tillåts.' },
        { status: 400 }
      )
    }

    // Max 50MB
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Filen är för stor. Max 50 MB.' },
        { status: 400 }
      )
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    })

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Encrypt the file
    const { encrypted, iv } = encrypt(buffer)
    
    // Generate secure file path
    const fileId = crypto.randomUUID()
    const safeFileName = `${fileId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    // In production, upload to S3 with server-side encryption
    // For now, store encrypted data reference
    const fileUrl = `/secure-documents/${transactionId}/${safeFileName}`

    const document = await prisma.document.create({
      data: {
        transactionId,
        type,
        title,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: `${fileUrl}?iv=${iv}`, // Store IV in URL for now (in production, use separate secure storage)
        status: 'DRAFT',
        uploadedBy: userId,
        uploadedByName: user?.name || user?.email || 'Okänd'
      }
    })

    // Log upload
    await logAccess(transactionId, document.id, userId, 'laddade upp', access.role!)

    return NextResponse.json({
      document: {
        id: document.id,
        name: document.fileName || 'Okänt dokument',
        size: (document.fileSize || 0) / (1024 * 1024),
        uploadedAt: document.createdAt.toISOString(),
        uploadedBy: document.uploadedByName || 'Okänd',
        type: document.mimeType || 'application/octet-stream',
        encrypted: true,
        status: document.status
      }
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Kunde inte ladda upp dokument' },
      { status: 500 }
    )
  }
}
