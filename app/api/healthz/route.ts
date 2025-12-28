import { NextResponse } from 'next/server'

// Simple liveness probe for platforms like Railway.
// Must return 200 quickly and must NOT depend on DB/external services.
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      time: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'cache-control': 'no-store, max-age=0',
      },
    }
  )
}


