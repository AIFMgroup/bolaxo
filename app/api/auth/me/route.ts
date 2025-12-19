import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('bolaxo_user_id')?.value
    const userEmailCookie = cookieStore.get('bolaxo_user_email')?.value
    const userRoleCookie = cookieStore.get('bolaxo_user_role')?.value

    console.log(' [AUTH ME] Cookie check:', {
      userId: userIdCookie ? userIdCookie.substring(0, 10) + '...' : 'none',
      userEmail: userEmailCookie || 'none',
      userRole: userRoleCookie || 'none',
    })

    if (!userIdCookie) {
      return NextResponse.json({ user: null })
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdCookie },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verified: true,
        bankIdVerified: true,
        phone: true,
        companyName: true,
        orgNumber: true,
        region: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
        lastLoginAt: true,
      }
    })

    if (!user) {
      console.log('X [AUTH ME] User not found for ID:', userIdCookie.substring(0, 10) + '...')
      const response = NextResponse.json({ user: null })
      response.cookies.delete('bolaxo_user_id')
      response.cookies.delete('bolaxo_user_email')
      response.cookies.delete('bolaxo_user_role')
      return response
    }

    console.log('OK [AUTH ME] User found:', user.email, user.role)
    const response = NextResponse.json({ user })

    if (!userEmailCookie || userEmailCookie !== user.email) {
      response.cookies.set('bolaxo_user_email', user.email, COOKIE_OPTIONS)
    }

    if (!userRoleCookie || userRoleCookie !== user.role) {
      response.cookies.set('bolaxo_user_role', user.role, COOKIE_OPTIONS)
    }

    return response

  } catch (error) {
    console.error('X [AUTH ME] Error:', error)
    return NextResponse.json({ user: null })
  }
}

