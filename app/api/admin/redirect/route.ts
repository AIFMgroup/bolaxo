import { NextRequest, NextResponse } from 'next/server'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || ''

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('adminToken')?.value
    
    console.log(' [REDIRECT] Token check...')
    
    if (!adminToken) {
      console.log('X [REDIRECT] No token found')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Verify token
    try {
      jwt.verify(adminToken, JWT_SECRET)
      console.log('OK [REDIRECT] Token valid, redirecting to /admin')
      return NextResponse.redirect(new URL('/admin', request.url))
    } catch (err) {
      console.log('X [REDIRECT] Token invalid:', err)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  } catch (error) {
    console.error('X [REDIRECT] Error:', error)
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
}
