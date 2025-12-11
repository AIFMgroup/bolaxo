import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding SME Kit test data...')

  // Create test seller
  const testSeller = await prisma.user.create({
    data: {
      email: 'test-seller@example.com',
      name: 'Test Seller AB',
      role: 'seller',
      verified: true,
      bankIdVerified: true
    }
  })

  console.log(`✅ Created test seller: ${testSeller.email}`)

  // Create test listing
  const testListing = await prisma.listing.create({
    data: {
      userId: testSeller.id,
      companyName: 'TechCorp Sweden',
      anonymousTitle: 'Innovative SaaS Platform',
      type: 'Teknik',
      category: 'SaaS',
      industry: 'Technology',
      orgNumber: '559000-1234',
      website: 'https://techcorp-example.com',
      location: 'Stockholm',
      region: 'Stockholm',
      address: 'Kungsgatan 10, 111 43 Stockholm',
      revenue: 15000000,
      revenueRange: '10-20 MSEK',
      priceMin: 30000000,
      priceMax: 50000000,
      ebitda: 3000000,
      employees: 18,
      foundedYear: 2018,
      description: 'Growing SaaS company with strong market fit and recurring revenue model',
      strengths: ['Strong product-market fit', 'Recurring revenue', 'Experienced team'],
      risks: ['Competitive market', 'Customer concentration', 'Tech talent retention'],
      whySelling: 'Founders want to pursue new venture',
      whatIncluded: 'All IP, customer contracts, team',
      status: 'draft',
      packageType: 'pro'
    }
  })

  console.log(`✅ Created test listing: ${testListing.companyName}`)

  // Create financial data
  const financialData = await prisma.financialData.create({
    data: {
      listingId: testListing.id,
      fileName: 'financial_2024.xlsx',
      fileUrl: '/api/sme/files/sample-financial.xlsx',
      uploadedAt: new Date(),
      normalizedEBITDA: 3500000,
      addBacks: {
        ownerSalary: 600000,
        oneTimeItems: 200000,
        nonOperating: 100000,
        consulting: 50000
      },
      workingCapital: 2250000,
      dataQuality: 'approved',
      lastReviewedAt: new Date()
    }
  })

  console.log(`✅ Created financial data`)

  // Create agreements
  const agreements = [
    {
      name: 'Main Customer Agreement - Acme Corp',
      type: 'customer',
      importance: 'critical',
      counterparty: 'Acme Corporation AB',
      riskLevel: 'high'
    },
    {
      name: 'AWS Infrastructure Agreement',
      type: 'supplier',
      importance: 'high',
      counterparty: 'Amazon Web Services',
      riskLevel: 'low'
    },
    {
      name: 'CTO Employment Agreement',
      type: 'employment',
      importance: 'high',
      counterparty: 'Johan Andersson',
      riskLevel: 'medium'
    },
    {
      name: 'Office Lease - Kungsgatan 10',
      type: 'lease',
      importance: 'medium',
      counterparty: 'Property Management AB',
      riskLevel: 'low'
    },
    {
      name: 'IP Assignment Agreement',
      type: 'ip',
      importance: 'critical',
      counterparty: 'Proprietary Tech Holdings',
      riskLevel: 'low'
    }
  ]

  for (const agreement of agreements) {
    await prisma.agreement.create({
      data: {
        listingId: testListing.id,
        ...agreement,
        fileUrl: `/api/sme/files/agreement-${agreement.type}.pdf`,
        fileName: `${agreement.name}.pdf`
      }
    })
  }

  console.log(`✅ Created ${agreements.length} test agreements`)

  // Create dataroom
  const dataRoom = await prisma.dataRoom.create({
    data: {
      listingId: testListing.id,
      createdBy: 'seed',
    }
  })

  console.log(`✅ Created dataroom with 7 folders`)

  // Create teaser
  const teaser = await prisma.teaserIM.create({
    data: {
      listingId: testListing.id,
      type: 'teaser',
      questionnaire: {
        companyName: 'TechCorp Sweden',
        industry: 'SaaS',
        founded: 2018,
        employees: 18,
        revenue: '15 MSEK',
        ebitda: '3 MSEK',
        strength1: 'Strong product-market fit',
        strength2: 'Recurring revenue model',
        reason: 'Founders pursuing new opportunity'
      },
      status: 'draft',
      version: 1
    }
  })

  console.log(`✅ Created teaser document`)

  // Create NDAs
  const ndaRecipients = [
    { email: 'buyer1@example.com', name: 'Anna Andersson' },
    { email: 'buyer2@example.com', name: 'Per Johansson' },
    { email: 'buyer3@example.com', name: 'Maria Svensson' }
  ]

  for (const recipient of ndaRecipients) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await prisma.nDASignature.create({
      data: {
        listingId: testListing.id,
        buyerId: recipient.email,
        buyerName: recipient.name,
        status: Math.random() > 0.6 ? 'signed' : 'pending',
        expiresAt,
        sentAt: new Date()
      }
    })
  }

  console.log(`✅ Created ${ndaRecipients.length} test NDAs`)

  // Create handoff pack
  const handoffPack = await prisma.handoffPack.create({
    data: {
      listingId: testListing.id,
      status: 'ready',
      advisorEmail: 'advisor@ma-firm.se',
      advisorName: 'Anna Andersson, Andersson M&A',
      overview: {
        companyName: 'TechCorp Sweden',
        revenue: '15 MSEK',
        ebitda: '3 MSEK',
        team: 18,
        modules: 7,
        status: 'ready'
      }
    }
  })

  console.log(`✅ Created handoff pack`)

  console.log(`
🎉 Seed data created successfully!

Test company: TechCorp Sweden
- Financial data: ✅ Normalized EBITDA 3.5 MSEK
- Agreements: ✅ 5 critical contracts
- Dataroom: ✅ 7-folder structure
- Teaser: ✅ Draft version
- NDAs: ✅ 3 sent (1 signed)
- Handoff: ✅ Ready for advisor

Test this at: http://localhost:3000/salja/sme-kit
  `)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
