import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { checkRateLimit } from '@/lib/ratelimit'
import { sendMagicLinkEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

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
    const { email, role, acceptedPrivacy, referralCode } = await request.json()

    if (!email || !role || !acceptedPrivacy) {
      return NextResponse.json(
        { error: 'Email, role och godkännande av integritetspolicy krävs' },
        { status: 400 }
      )
    }

    // Generera säker magic link token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Giltig i 1 timme

    // Skapa eller uppdatera användare
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        magicLinkToken: token,
        tokenExpiresAt: expiresAt,
        role: role, // Uppdatera roll om ändrad
      },
      create: {
        email,
        role,
        magicLinkToken: token,
        tokenExpiresAt: expiresAt,
        verified: false,
        referredBy: referralCode ? referralCode.toUpperCase() : null,
      }
    })

    // Skapa magic link URL - detektera automatiskt från request
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`
    // Ta bort trailing slash om den finns
    baseUrl = baseUrl.replace(/\/$/, '')
    const magicLink = `${baseUrl}/auth/verify?token=${token}`

    // Skicka email via Sendinblue (Brevo)
    const emailResult = await sendMagicLinkEmail(email, magicLink, user.name || 'där')
    
    if (!emailResult.success && process.env.NODE_ENV === 'production') {
      console.error('Failed to send email:', emailResult.error)
      return NextResponse.json(
        { error: 'Kunde inte skicka magic link. Försök igen senare.' },
        { status: 500 }
      )
    }

    // I development eller om email-service inte är konfigurerad, visa länken direkt
    const shouldShowLink = process.env.NODE_ENV === 'development' || !process.env.BREVO_API_KEY

    return NextResponse.json({ 
      success: true,
      message: emailResult.success 
        ? 'Magic link skickad! Kolla din inkorg.' 
        : 'Magic link genererad (email service inte konfigurerad).',
      ...(shouldShowLink && { magicLink })
    })

  } catch (error) {
    console.error('Magic link send error:', error)
    return NextResponse.json(
      { error: 'Kunde inte skicka magic link' },
      { status: 500 }
    )
  }
}


