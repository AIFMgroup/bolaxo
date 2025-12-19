import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { generateSPAText, validateSPAData } from '@/lib/spa-generator'

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

    // Hämta transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Hämta user-info för att fylla i SPA
    const buyer = await prisma.user.findUnique({ where: { id: transaction.buyerId } })
    const seller = await prisma.user.findUnique({ where: { id: transaction.sellerId } })

    if (!buyer || !seller) {
      return NextResponse.json(
        { error: 'Buyer or seller not found' },
        { status: 404 }
      )
    }

    // Bygg SPA data
    const spaData = {
      sellerName: seller.companyName || seller.name || seller.email,
      sellerOrgNumber: seller.orgNumber || '000000-0000',
      sellerAddress: 'Adress från profil (implementera senare)',
      
      buyerName: buyer.companyName || buyer.name || buyer.email,
      buyerOrgNumber: buyer.orgNumber || '000000-0000',
      buyerAddress: 'Adress från profil (implementera senare)',
      
      companyName: 'Bolaget AB', // Från listing
      companyOrgNumber: '556000-0000',
      companyAddress: 'Bolagets adress',
      
      agreedPrice: transaction.agreedPrice,
      depositAmount: Math.round(transaction.agreedPrice * 0.1),
      closingDate: transaction.closingDate 
        ? new Date(transaction.closingDate).toLocaleDateString('sv-SE')
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE'),
      
      numberOfShares: 1000, // Default, bör hämtas från listing
      shareNominalValue: 100,
      transferMethod: 'shares' as const,
      
      conditions: transaction.notes || undefined,
    }

    // Validera
    const validation = validateSPAData(spaData)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Incomplete data', details: validation.errors },
        { status: 400 }
      )
    }

    // Generera SPA-text
    const spaText = generateSPAText(spaData)

    // Spara som dokument
    const user = await prisma.user.findUnique({ where: { id: userId } })
    
    const document = await prisma.document.create({
      data: {
        transactionId: params.id,
        type: 'SPA',
        title: `Aktieöverlåtelseavtal - ${spaData.companyName}`,
        fileName: `SPA_${spaData.companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`,
        fileUrl: '#', // I produktion: upload till blob storage
        status: 'DRAFT',
        uploadedBy: userId,
        uploadedByName: user?.name || user?.email || 'Användare'
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        transactionId: params.id,
        type: 'DOCUMENT_UPLOADED',
        title: 'SPA genererat från mall',
        description: 'Aktieöverlåtelseavtal skapat automatiskt. Granska och skicka för signering.',
        actorId: userId,
        actorName: user?.name || user?.email || 'Användare',
        actorRole: transaction.buyerId === userId ? 'buyer' : 'seller'
      }
    })

    console.log('✅ SPA generated:', document.id)

    return NextResponse.json({ 
      document,
      content: spaText,
      message: 'SPA genererat. Granska och skicka för signering.'
    })

  } catch (error) {
    console.error('Generate SPA error:', error)
    return NextResponse.json(
      { error: 'Failed to generate SPA' },
      { status: 500 }
    )
  }
}

