import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Minimal production seed...')

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bolaxo.com'
  const adminName = process.env.ADMIN_NAME || 'BOLAXO Admin'

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'admin',
      verified: true,
      bankIdVerified: true,
    },
    create: {
      email: adminEmail,
      name: adminName,
      role: 'admin',
      verified: true,
      bankIdVerified: true,
    }
  })

  console.log(`✓ Ensured admin account (${admin.email})`)
  console.log('ℹ️  Run npm run seed:demo for full demo data in dev/staging environments.')
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
