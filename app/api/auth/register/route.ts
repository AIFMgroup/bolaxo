import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { checkRateLimit } from '@/lib/ratelimit'
import { sendMagicLinkEmail } from '@/lib/email'

const prisma = new PrismaClient()

/**
 * Register a new user and send magic link email
 * In production, users must verify their email via magic link
 */
export async function POST(request: Request) {
  // Rate limit: 5 requests per 15 min per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success, remaining } = await checkRateLimit(ip, 'auth')
  
  if (!success) {
    return NextResponse.json(
      { error: 'För många försök. Försök igen om 15 minuter.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    )
  }

  try {
    const { email, role, name, phone, acceptedPrivacy } = await request.json()

    if (!email || !role || !name || !phone || !acceptedPrivacy) {
      return NextResponse.json(
        { error: 'Alla fält måste fyllas i' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // User exists - send magic link for login instead
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1)

      await prisma.user.update({
        where: { email },
        data: {
          magicLinkToken: token,
          tokenExpiresAt: expiresAt,
        }
      })

      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const host = request.headers.get('host') || 'bolaxo.com'
      let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`
      // Ta bort trailing slash om den finns
      baseUrl = baseUrl.replace(/\/$/, '')
      const magicLink = `${baseUrl}/auth/verify?token=${token}`

      await sendMagicLinkEmail(email, magicLink, name)

      return NextResponse.json({
        success: true,
        message: 'Ett konto finns redan med denna email. Vi har skickat en inloggningslänk till din email.',
        requiresEmailVerification: true
      })
    }

    // Create new user with magic link token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    const user = await prisma.user.create({
      data: {
        email,
        role,
        name,
        phone,
        magicLinkToken: token,
        tokenExpiresAt: expiresAt,
        verified: false,
      }
    })

    // Generate magic link
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || 'bolaxo.com'
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`
    // Ta bort trailing slash om den finns
    baseUrl = baseUrl.replace(/\/$/, '')
    const magicLink = `${baseUrl}/auth/verify?token=${token}`

    // Send magic link email
    const emailResult = await sendMagicLinkEmail(email, magicLink, name)

    if (!emailResult.success && process.env.NODE_ENV === 'production') {
      // In production, email must work
      await prisma.user.delete({ where: { id: user.id } })
      return NextResponse.json(
        { error: 'Kunde inte skicka verifieringsemail. Försök igen.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kontot har skapats! Vi har skickat en verifieringslänk till din email.',
      requiresEmailVerification: true
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Kunde inte skapa konto. Försök igen.' },
      { status: 500 }
    )
  }
}

