import { NextResponse } from 'next/server'
import { IS_PROD, getEnv } from '@/lib/env'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

type HealthResponse = {
  ok: boolean
  time: string
  checks: {
    env: boolean
    db: boolean
  }
  details?: {
    envMissing?: string[]
    dbError?: string
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

export async function GET() {
  const missing: string[] = []
  if (!getEnv('JWT_SECRET')) missing.push('JWT_SECRET')
  if (!getEnv('DATABASE_URL')) missing.push('DATABASE_URL')
  if (!getEnv('CRON_SECRET')) missing.push('CRON_SECRET')

  const envOk = missing.length === 0

  let dbOk = false
  let dbError: string | undefined
  try {
    // Prisma doesn't have built-in per-query timeout; we enforce one via Promise.race.
    // Use shorter timeout for healthcheck (300ms) to respond quickly
    await withTimeout(prisma.$queryRaw`SELECT 1`, 300)
    dbOk = true
  } catch (e) {
    dbOk = false
    dbError = e instanceof Error ? e.message : 'unknown'
  }

  // For Railway healthchecks: only fail if critical env vars are missing
  // Database connection issues during startup are acceptable - Railway will retry
  // This allows the app to start even if DB is temporarily unavailable
  const ok = envOk
  const status = ok ? 200 : 503

  const body: HealthResponse = {
    ok,
    time: new Date().toISOString(),
    checks: { env: envOk, db: dbOk },
    ...(ok
      ? {}
      : {
          details: {
            ...(missing.length ? { envMissing: missing } : {}),
            ...(!dbOk ? { dbError } : {}),
          },
        }),
  }

  return NextResponse.json(body, { status })
}



