import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get magic link for a user by email
 * GET /api/admin/get-magic-link?email=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email krävs' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        magicLinkToken: true,
        tokenExpiresAt: true,
        verified: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Användare hittades inte' },
        { status: 404 }
      )
    }

    if (!user.magicLinkToken) {
      return NextResponse.json(
        { error: 'Ingen aktiv magic link token. Skicka en ny magic link först.' },
        { status: 404 }
      )
    }

    // Generate magic link URL
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || 'bolaxo.com'
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`
    baseUrl = baseUrl.replace(/\/$/, '')
    const magicLink = `${baseUrl}/auth/verify?token=${user.magicLinkToken}`

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verified: user.verified,
      },
      magicLink: magicLink,
      token: user.magicLinkToken,
      expiresAt: user.tokenExpiresAt?.toISOString(),
    })
  } catch (error: any) {
    console.error('Error getting magic link:', error)
    return NextResponse.json(
      { error: error.message || 'Fel vid hämtning av magic link' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

