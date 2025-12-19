import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { generateReferralCode } from '../lib/referral'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:EryeygGmUDHJSADKIVjnQBPxtJQOjxRG@switchback.proxy.rlwy.net:23773/railway'
    }
  }
})

async function fixSeller() {
  const email = 'patrikswe@outlook.com'
  
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('❌ Användare hittades inte')
      return
    }

    console.log('📝 Nuvarande roll:', user.role)
    
    // Generate new magic link token (64 characters hex)
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)
    
    let referralCode = user.referralCode
    if (!referralCode) {
      referralCode = await generateReferralCode()
    }
    
    // Update user to seller with new token
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'seller',
        magicLinkToken: token,
        tokenExpiresAt: expiresAt,
        referralCode: referralCode,
      }
    })

    console.log('✅ Användare uppdaterad!')
    console.log('   Email:', updatedUser.email)
    console.log('   Roll:', updatedUser.role)
    console.log('   Token längd:', token.length, 'tecken')
    console.log('   Token:', token)
    console.log('   Giltig till:', expiresAt.toISOString())
    
    const baseUrl = 'https://bolaxo-production.up.railway.app'
    const magicLink = `${baseUrl}/auth/verify?token=${token}`
    
    console.log('\n🔗 Magic Link:')
    console.log(magicLink)
    
  } catch (error) {
    console.error('❌ Fel:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSeller()
