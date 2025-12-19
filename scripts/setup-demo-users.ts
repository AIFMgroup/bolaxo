import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Cleaning up database...')
  
  // Delete all data in order (respecting foreign keys)
  await prisma.earnoutPayment.deleteMany({})
  await prisma.earnOut.deleteMany({})
  await prisma.sPARevision.deleteMany({})
  await prisma.sPA.deleteMany({})
  await prisma.dDFinding.deleteMany({})
  await prisma.dDTask.deleteMany({})
  await prisma.dDProject.deleteMany({})
  await prisma.lOI.deleteMany({})
  await prisma.documentEngagement.deleteMany({})
  await prisma.question.deleteMany({})
  await prisma.milestone.deleteMany({})
  await prisma.transaction.deleteMany({})
  await prisma.nDARequest.deleteMany({})
  await prisma.listing.deleteMany({})
  await prisma.user.deleteMany({})

  console.log('✅ Database cleaned')

  console.log('👤 Creating demo users...')

  // Create Seller
  const seller = await prisma.user.create({
    data: {
      email: 'saljare@bolaxo.com',
      role: 'seller',
      name: 'Säljaren Demo',
      companyName: 'Tech Company AB',
      verified: true,
      bankIdVerified: true,
    },
  })
  console.log(`✅ Seller created: ${seller.email}`)

  // Create Buyer
  const buyer = await prisma.user.create({
    data: {
      email: 'kopare@bolaxo.com',
      role: 'buyer',
      name: 'Köparen Demo',
      companyName: 'Investment Partners',
      verified: true,
      bankIdVerified: true,
    },
  })
  console.log(`✅ Buyer created: ${buyer.email}`)

  // Create Advisor/Broker
  const advisor = await prisma.user.create({
    data: {
      email: 'maklare@bolaxo.com',
      role: 'broker',
      name: 'Mäklaren Demo',
      companyName: 'M&A Advisors',
      verified: true,
      bankIdVerified: true,
    },
  })
  console.log(`✅ Advisor created: ${advisor.email}`)

  console.log(`
═══════════════════════════════════════════════════════════════
✅ DEMO USERS SETUP COMPLETE
═══════════════════════════════════════════════════════════════

📧 LOGIN CREDENTIALS (Magic Link - no password needed):

1️⃣  SÄLJARE (Seller):
    Email: saljare@bolaxo.com
    Role: seller

2️⃣  KÖPARE (Buyer):
    Email: kopare@bolaxo.com
    Role: buyer

3️⃣  MÄKLARE (Advisor/Broker):
    Email: maklare@bolaxo.com
    Role: broker

═══════════════════════════════════════════════════════════════

🚀 NEXT STEPS:
1. Go to http://localhost:3000/login
2. Enter any of the above email addresses
3. Click "Get Magic Link"
4. Follow the magic link in terminal output (dev mode)
5. Test the M&A workflow:
   - Säljaren: Create listing, upload documents
   - Köparen: Find listing, ask questions, generate SPA
   - Mäklaren: Oversee the process

═══════════════════════════════════════════════════════════════
  `)

  console.log('✨ Setup complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
