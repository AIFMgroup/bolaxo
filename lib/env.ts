/**
 * Centralized environment access + validation.
 *
 * Design goals:
 * - Fail fast in production for truly required secrets.
 * - Avoid printing sensitive values in logs.
 * - Keep dependency-free (no zod) to minimize surface area.
 */

export type EnvMode = 'development' | 'test' | 'production'

export const NODE_ENV: EnvMode = (process.env.NODE_ENV as EnvMode) || 'development'
export const IS_PROD = NODE_ENV === 'production'

function missing(name: string): never {
  throw new Error(`Missing required environment variable: ${name}`)
}

export function getEnv(name: string): string | undefined {
  const v = process.env[name]
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  return trimmed.length ? trimmed : undefined
}

export function requireEnv(name: string): string {
  return getEnv(name) ?? missing(name)
}

/**
 * Validates a minimal set of environment variables for production.
 *
 * This is intentionally conservative: only includes values that will cause
 * unsafe behavior or runtime breakage if missing.
 */
export function assertProdEnv(): void {
  if (!IS_PROD) return

  // Auth/session integrity: must never fall back to a dev secret in prod.
  requireEnv('JWT_SECRET')

  // Core runtime: without DB we can't serve most authenticated flows.
  requireEnv('DATABASE_URL')

  // Cron endpoints are protected by CRON_SECRET, but CRON is optional.
  // If CRON_SECRET is missing, cron endpoints will reject requests (401),
  // but the app should still be able to boot and serve normal traffic.
}



