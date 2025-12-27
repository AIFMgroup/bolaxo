import type { NextRequest } from 'next/server'
import { IS_PROD } from '@/lib/env'

/**
 * Auth helper for API routes.
 *
 * Production source of truth: signed session cookies.
 * Development fallback: allow `x-user-id` header to support local/dev tools.
 */
export function getAuthenticatedUserId(request: NextRequest): string | null {
  const cookieUserId = request.cookies.get('bolaxo_user_id')?.value
  if (cookieUserId) return cookieUserId

  const headerUserId = request.headers.get('x-user-id')
  if (headerUserId && !IS_PROD) return headerUserId

  return null
}



