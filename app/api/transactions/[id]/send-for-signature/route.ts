import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { getScriveClient } from '@/lib/scrive'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 }
      )
    }

    // Hämta dokument och transaction
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { transaction: true }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Hämta parter
    const buyer = await prisma.user.findUnique({ 
      where: { id: document.transaction.buyerId } 
    })
    const seller = await prisma.user.findUnique({ 
      where: { id: document.transaction.sellerId } 
    })

    if (!buyer || !seller) {
      return NextResponse.json(
        { error: 'Parties not found' },
        { status: 404 }
      )
    }

    // Skicka till Scrive för signering
    const scriveClient = getScriveClient()
    
    // I produktion: läs faktisk PDF från blob storage
    // Nu: skapa mock base64
    const mockPdfBase64 = Buffer.from('Mock SPA PDF content').toString('base64')

    const result = await scriveClient.createDocument({
      title: document.title,
      fileName: document.fileName || 'SPA.pdf',
      fileContent: mockPdfBase64,
      parties: [
        {
          email: seller.email,
          name: seller.name || seller.email,
          role: 'seller',
          authenticationMethod: 'se_bankid'
        },
        {
          email: buyer.email,
          name: buyer.name || buyer.email,
          role: 'buyer',
          authenticationMethod: 'se_bankid'
        }
      ]
    })

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to send for signature. Check Scrive configuration.' },
        { status: 500 }
      )
    }

    // Uppdatera dokument-status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'PENDING_SIGNATURE'
      }
    })

    // Log activity
    const user = await prisma.user.findUnique({ where: { id: userId } })
    
    await prisma.activity.create({
      data: {
        transactionId: document.transactionId,
        type: 'DOCUMENT_UPLOADED',
        title: 'Dokument skickat för signering',
        description: `${document.title} skickat via Scrive till ${seller.name} och ${buyer.name}`,
        actorId: userId,
        actorName: user?.name || user?.email || 'Användare',
        actorRole: document.transaction.buyerId === userId ? 'buyer' : 'seller'
      }
    })

    console.log('✅ Document sent via Scrive:', result.id)

    return NextResponse.json({ 
      success: true,
      scriveId: result.id,
      signingUrl: result.signingUrl,
      message: 'Dokument skickat för signering via Scrive. Parterna får email med BankID-länk.'
    })

  } catch (error) {
    console.error('Send for signature error:', error)
    return NextResponse.json(
      { error: 'Failed to send for signature' },
      { status: 500 }
    )
  }
}

