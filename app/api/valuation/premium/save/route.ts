import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { purchaseId, formData, currentSection } = await request.json()
    
    if (!purchaseId) {
      return NextResponse.json({ error: 'Purchase ID required' }, { status: 400 })
    }
    
    // Spara eller uppdatera premium värderingsdata
    const premiumValuation = await prisma.premiumValuation.upsert({
      where: { purchaseId },
      update: {
        formData,
        currentSection,
        lastUpdated: new Date()
      },
      create: {
        purchaseId,
        formData,
        currentSection,
        status: 'draft'
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      id: premiumValuation.id 
    })
    
  } catch (error) {
    console.error('Error saving premium valuation:', error)
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    )
  }
}
