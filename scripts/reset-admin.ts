import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function resetAdmin() {
  console.log('\n🔐 RESET ADMIN-ANVÄNDARE')
  console.log('========================\n')

  try {
    // Delete old admin account
    const oldEmail = 'admin@afterfounder.se'
    console.log(`⏳ Tar bort ${oldEmail}...`)
    
    const deleted = await prisma.user.deleteMany({
      where: { email: oldEmail }
    })
    
    if (deleted.count > 0) {
      console.log(`✅ Deleted ${deleted.count} old account(s)`)
    } else {
      console.log(`⚠️ No accounts found with email ${oldEmail}`)
    }

    // Create new admin account
    const newEmail = 'admin@afterfounder.com'
    const password = 'Password123'
    
    console.log(`\n⏳ Skapar nytt admin-konto...`)
    
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const adminUser = await prisma.user.create({
      data: {
        email: newEmail,
        name: 'Administrator',
        role: 'admin',
        passwordHash,
        verified: true,
        bankIdVerified: true,
        createdAt: new Date()
      }
    })

    console.log('\n✅ Admin-användare skapad framgångsrikt!\n')
    console.log('📋 Inloggningsuppgifter:')
    console.log(`   E-post: ${adminUser.email}`)
    console.log(`   Lösenord: ${password}`)
    console.log(`   URL: https://afterfounder-production.up.railway.app/admin/login\n`)

  } catch (error) {
    console.error('❌ Fel vid reset av admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdmin().then(() => process.exit(0))
