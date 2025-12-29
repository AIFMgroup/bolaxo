import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function seedDatabase() {
  try {

    console.log(' Seeding database...')

    // 1. Skapa demo-users (passwordless - använder magic links)
    const demoSeller = await prisma.user.upsert({
      where: { email: 'demo@seller.com' },
      update: {},
      create: {
        email: 'demo@seller.com',
        name: 'Demo Säljare',
        companyName: 'TechVision Solutions AB',
        role: 'seller',
        verified: true,
        bankIdVerified: true,
      },
    })
    console.log('OK Demo seller created:', demoSeller.email)

    const demoBuyer = await prisma.user.upsert({
      where: { email: 'demo@buyer.com' },
      update: {},
      create: {
        email: 'demo@buyer.com',
        name: 'Demo Köpare',
        companyName: 'Investment Group AB',
        role: 'buyer',
        verified: true,
        bankIdVerified: true,
      },
    })
    console.log('OK Demo buyer created:', demoBuyer.email)

    const demoAdvisor = await prisma.user.upsert({
      where: { email: 'advisor@bolaxo.com' },
      update: {},
      create: {
        email: 'advisor@bolaxo.com',
        name: 'Maria Svensson',
        companyName: 'Svensson Corporate Finance',
        role: 'advisor',
        verified: true,
        bankIdVerified: true,
      },
    })
    console.log('OK Demo advisor created:', demoAdvisor.email)

    // 2. Skapa demo listing först
    const demoListing = await prisma.listing.upsert({
      where: { id: 'demo-listing-001' },
      update: {},
      create: {
        id: 'demo-listing-001',
        userId: demoSeller.id,
        companyName: 'TechVision Solutions AB',
        anonymousTitle: 'Etablerat Tech-bolag med stark tillväxt',
        industry: 'Technology',
        type: 'Teknologi',
        category: 'SaaS',
        revenue: 12000000,
        revenueRange: '10-25 MSEK',
        employees: 18,
        location: 'Stockholm',
        region: 'Stockholm, Sverige',
        priceMin: 14000000,
        priceMax: 18000000,
        description: 'Etablerat techbolag med återkommande intäkter och stark tillväxt. Stabil kundbas inom B2B och skalbar produktportfölj.',
        image: '/Annonsbilder/tech_1.png',
        status: 'active',
        packageType: 'premium',
        publishedAt: new Date(),
      },
    })
    console.log('OK Demo listing created:', demoListing.id)

    // 3. Skapa demo-transaktion med känt ID
    const demoTransaction = await prisma.transaction.upsert({
      where: { id: 'demo-transaction-001' },
      update: {},
      create: {
        id: 'demo-transaction-001',
        listingId: demoListing.id,
        sellerId: demoSeller.id,
        buyerId: demoBuyer.id,
        advisorId: demoAdvisor.id,
        stage: 'DD_IN_PROGRESS',
        agreedPrice: 14500000,
        closingDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 dagar framåt
      },
    })
    console.log('OK Demo transaction created:', demoTransaction.id)

    // 4. Skapa milestones för transaktionen
    const milestones = [
      {
        transactionId: demoTransaction.id,
        title: 'NDA Signerad',
        description: 'Sekretessavtal undertecknat av båda parter',
        dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dagar sedan
        completed: true,
        completedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        completedBy: demoBuyer.id,
        order: 1,
        isRequired: true,
      },
      {
        transactionId: demoTransaction.id,
        title: 'Due Diligence Påbörjad',
        description: 'Genomgång av finansiella dokument och företagsdata',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dagar framåt
        completed: false,
        assignedTo: demoBuyer.id,
        assignedToName: demoBuyer.name || 'Demo Köpare',
        order: 2,
        isRequired: true,
      },
      {
        transactionId: demoTransaction.id,
        title: 'Aktieöverlåtelseavtal (SPA)',
        description: 'Förhandling och signering av överlåtelseavtal',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 dagar framåt
        completed: false,
        order: 3,
        isRequired: true,
      },
      {
        transactionId: demoTransaction.id,
        title: 'Betalning Genomförd',
        description: 'Överföring av köpeskilling',
        dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 dagar framåt
        completed: false,
        order: 4,
        isRequired: true,
      },
    ]

    for (const milestone of milestones) {
      await prisma.milestone.create({
        data: milestone,
      })
    }
    console.log('OK Milestones created')

    return {
      success: true,
      message: ' Database seeded successfully!',
      data: {
        seller: demoSeller.email,
        buyer: demoBuyer.email,
        advisor: demoAdvisor.email,
        transaction: demoTransaction.id,
        transactionUrl: `/transaktion/${demoTransaction.id}`,
      },
    }

  } catch (error) {
    console.error('X Seed error:', error)
    return {
      success: false,
      error: 'Seed failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Support both GET and POST for easy browser access
export async function GET(request: NextRequest) {
  const result = await seedDatabase()
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}

export async function POST(request: NextRequest) {
  const result = await seedDatabase()
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}

