import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { IS_PROD, getEnv } from '@/lib/env'

// Use the same secret as admin-auth.ts
const JWT_SECRET = getEnv('JWT_SECRET')
// In middleware (edge), prefer to fail closed for protected routes if misconfigured.
const secret = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null

// Create next-intl middleware
const intlMiddleware = createMiddleware({
  locales: ['sv', 'en'],
  defaultLocale: 'sv',
  localePrefix: 'always', // Always show locale prefix (e.g., /sv/, /en/)
  localeDetection: false // Disable automatic locale detection - always use URL locale
})

function safeHeader(request: NextRequest, headerName: string): string {
  try {
    if (request?.headers && typeof request.headers.get === 'function') {
      return request.headers.get(headerName) ?? ''
    }
  } catch (error) {
    console.warn('[middleware] Failed to read header:', headerName, error)
  }
  return ''
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const cookieUserId = request.cookies.get('bolaxo_user_id')?.value
  const cookieUserRole = request.cookies.get('bolaxo_user_role')?.value

  // Block any dev-only routes in production.
  if (IS_PROD && (pathname === '/dev-login' || pathname.startsWith('/dev-login/'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/sv'
    return NextResponse.redirect(url, 308)
  }
  
  // Explicit redirect from root to /sv
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/sv'
    return NextResponse.redirect(url, 308)
  }

  // CRITICAL: If pathname already has valid locale prefix, NEVER process through next-intl middleware
  // This is the root cause of locale switching - we must completely bypass it
  const hasValidLocalePrefix = pathname.startsWith('/sv/') || pathname.startsWith('/en/') || pathname === '/sv' || pathname === '/en'
  
  if (hasValidLocalePrefix) {
    // Extract current locale
    const currentLocale = pathname.split('/')[1]
    const isDashboard = pathname.startsWith(`/${currentLocale}/dashboard`)

    if (IS_PROD && pathname === `/${currentLocale}/dev-login`) {
      const url = request.nextUrl.clone()
      url.pathname = `/${currentLocale}`
      return NextResponse.redirect(url, 308)
    }
    
    // Handle admin routes first
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
      if (IS_PROD && !secret) {
        return NextResponse.json(
          { error: 'Server misconfigured: JWT_SECRET is missing' },
          { status: 503 }
        )
      }
      const adminToken = request.cookies.get('adminToken')?.value
      
      if (!adminToken) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      try {
        if (!secret) throw new Error('JWT secret missing')
        await jwtVerify(adminToken, secret)
      } catch (err) {
        const loginUrl = new URL('/admin/login', request.url)
        const res = NextResponse.redirect(loginUrl)
        res.cookies.delete('adminToken')
        return res
      }
    }
    
    // Protect dashboard routes: require session cookie
    if (isDashboard && !cookieUserId) {
      const loginUrl = new URL(`/${currentLocale}/login`, request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Pass through with locale header
    const response = NextResponse.next()
    response.headers.set('x-next-intl-locale', currentLocale)
    response.cookies.set('NEXT_LOCALE', currentLocale, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    })
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    if (process.env.NODE_ENV === 'production') {
      const currentHost = safeHeader(request, 'host')
      const isBOLAXODomain = currentHost.includes('bolaxo.com')
      response.headers.set(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com blob:",
          "style-src 'self' 'unsafe-inline' https://unpkg.com",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data: https:",
          "connect-src 'self' https://api.openai.com https://api.brevo.com https://api.sendinblue.com https://*.amazonaws.com https://*.s3.amazonaws.com https://*.s3.eu-north-1.amazonaws.com blob:",
          "frame-src 'self' https://player.vimeo.com https://vimeo.com",
          `frame-ancestors 'self'${isBOLAXODomain ? ' https://bolaxo.com https://www.bolaxo.com' : ''}`,
          "worker-src 'self' blob:",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ')
      )
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }
    
    return response
  }

  // For paths WITHOUT locale prefix, use next-intl middleware
  // But only for paths that don't have one
  if (!hasValidLocalePrefix && pathname !== '/') {
    // Extract locale from referer header if available
    const referer = safeHeader(request, 'referer')
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        const refererPath = refererUrl.pathname
        const refererLocale = refererPath.split('/')[1]
        
        // If referer has a valid locale, preserve it
        if (refererLocale === 'sv' || refererLocale === 'en') {
          const url = request.nextUrl.clone()
          url.pathname = `/${refererLocale}${pathname}`
          return NextResponse.redirect(url, 307)
        }
      } catch (e) {
        // Invalid referer URL, continue with normal flow
      }
    }
  }

  // For all other paths without locale prefix, use next-intl middleware
  const response = intlMiddleware(request)
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (process.env.NODE_ENV === 'production') {
    const currentHost = safeHeader(request, 'host')
    const isBOLAXODomain = currentHost.includes('bolaxo.com')
    
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com blob:",
        "style-src 'self' 'unsafe-inline' https://unpkg.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https:",
        "connect-src 'self' https://api.openai.com https://api.brevo.com https://api.sendinblue.com https://*.amazonaws.com https://*.s3.amazonaws.com https://*.s3.eu-north-1.amazonaws.com blob:",
        "frame-src 'self' https://player.vimeo.com https://vimeo.com",
        `frame-ancestors 'self'${isBOLAXODomain ? ' https://bolaxo.com https://www.bolaxo.com' : ''}`,
        "worker-src 'self' blob:",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    )
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match alla routes utom:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}