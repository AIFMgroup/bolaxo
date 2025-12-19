import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { generateReferralCode } from '../lib/referral'

// Use the provided database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:EryeygGmUDHJSADKIVjnQBPxtJQOjxRG@switchback.proxy.rlwy.net:23773/railway'
    }
  }
})

async function createSeller() {
  const email = 'patrikswe@outlook.com'
  const role = 'seller'
  
  try {
    console.log('🔍 Kontrollerar om användare redan finns...')
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('✅ Användare finns redan med denna email:', email)
      console.log('   ID:', existingUser.id)
      console.log('   Roll:', existingUser.role)
      console.log('   Verifierad:', existingUser.verified)
      
      // Generate new magic link token
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Valid for 24 hours
      
      // Generate referral code if missing
      let referralCode = existingUser.referralCode
      if (!referralCode) {
        referralCode = await generateReferralCode()
      }
      
      // Update user with new token
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: role, // Ensure role is seller
          magicLinkToken: token,
          tokenExpiresAt: expiresAt,
          referralCode: referralCode,
        }
      })
      
      console.log('\n✅ Magic link token genererad!')
      console.log('   Token:', token)
      console.log('   Giltig till:', expiresAt.toISOString())
      
      // Generate magic link URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo-production.up.railway.app'
      const magicLink = `${baseUrl}/auth/verify?token=${token}`
      
      console.log('\n🔗 Magic Link:')
      console.log(magicLink)
      console.log('\n📧 Användaren kan nu logga in med denna länk!')
      
      return updatedUser
    }

    console.log('📝 Skapar ny användare...')
    
    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Valid for 24 hours
    
    // Generate referral code
    const referralCode = await generateReferralCode()
    
    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        role,
        name: 'Patrik', // Default name
        magicLinkToken: token,
        tokenExpiresAt: expiresAt,
        referralCode: referralCode,
        verified: false,
      }
    })

    console.log('✅ Användare skapad!')
    console.log('   ID:', user.id)
    console.log('   Email:', user.email)
    console.log('   Roll:', user.role)
    console.log('   Referral Code:', user.referralCode)
    console.log('\n✅ Magic link token genererad!')
    console.log('   Token:', token)
    console.log('   Giltig till:', expiresAt.toISOString())
    
    // Generate magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo-production.up.railway.app'
    const magicLink = `${baseUrl}/auth/verify?token=${token}`
    
    console.log('\n🔗 Magic Link:')
    console.log(magicLink)
    console.log('\n📧 Användaren kan nu logga in med denna länk!')
    
    return user
  } catch (error) {
    console.error('❌ Fel vid skapande av användare:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createSeller()
  .then(() => {
    console.log('\n✅ Klar!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script misslyckades:', error)
    process.exit(1)
  })
