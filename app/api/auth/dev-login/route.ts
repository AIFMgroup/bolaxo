import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Development-only endpoint: Direct login without magic link
 * Creates user if doesn't exist, then logs them in immediately
 * Only works in development mode (NODE_ENV === 'development')
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const { email, role, name } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Create or get user (don't update role if user already exists)
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        // Only update name if provided, don't change role
        name: name || undefined,
        verified: true,
        bankIdVerified: true,
      },
      create: {
        email,
        role,
        name: name || 'Test User',
        verified: true,
        bankIdVerified: true,
      }
    })

    // Set auth cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: true,
        bankIdVerified: true
      }
    })

    // Set session cookies that /api/auth/me endpoint expects
    response.cookies.set({
      name: 'bolaxo_user_id',
      value: user.id,
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    response.cookies.set({
      name: 'bolaxo_user_email',
      value: user.email,
      httpOnly: false, // Allow client to read
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })

    response.cookies.set({
      name: 'bolaxo_user_role',
      value: user.role,
      httpOnly: false,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Dev login error:', error)
    return NextResponse.json(
      { error: 'Failed to create dev session' },
      { status: 500 }
    )
  }
}
