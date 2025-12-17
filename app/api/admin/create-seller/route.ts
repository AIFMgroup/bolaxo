import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { generateReferralCode } from '@/lib/referral'

const prisma = new PrismaClient()

/**
 * Create a seller account with magic link
 * POST /api/admin/create-seller
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email krävs' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Valid for 24 hours

    let user
    let referralCode

    if (existingUser) {
      // User exists - update with new token and ensure role is seller
      referralCode = existingUser.referralCode || await generateReferralCode()
      
      user = await prisma.user.update({
        where: { email },
        data: {
          role: 'seller',
          magicLinkToken: token,
          tokenExpiresAt: expiresAt,
          referralCode: referralCode,
        }
      })
    } else {
      // Create new user
      referralCode = await generateReferralCode()
      
      user = await prisma.user.create({
        data: {
          email,
          role: 'seller',
          name: email.split('@')[0], // Use email prefix as name
          magicLinkToken: token,
          tokenExpiresAt: expiresAt,
          referralCode: referralCode,
          verified: false,
        }
      })
    }

    // Generate magic link URL
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || 'afterfounder.com'
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`
    baseUrl = baseUrl.replace(/\/$/, '')
    const magicLink = `${baseUrl}/auth/verify?token=${token}`

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
      },
      magicLink: magicLink,
      token: token,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Error creating seller:', error)
    return NextResponse.json(
      { error: error.message || 'Fel vid skapande av användare' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

