import { NextRequest, NextResponse } from 'next/server'
import { REQUIREMENTS } from '@/lib/readiness/requirements'
import { computeReadiness, DocumentMeta } from '@/lib/readiness/gap'

// GET: return canonical requirements
export async function GET() {
  return NextResponse.json({ requirements: REQUIREMENTS })
}

// POST: accept documents metadata to compute readiness (no DB side-effects)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const docs: DocumentMeta[] = Array.isArray(body?.documents) ? body.documents : []

    const result = computeReadiness(docs)
    
    // Create a simplified gaps array for UI
    const gaps = result.requirements
      .filter(r => r.mandatory && r.status !== 'fulfilled')
      .map(r => ({
        requirementId: r.id,
        title: r.title,
        category: r.category,
        status: r.status,
        reason: r.status === 'incomplete' ? r.issues.join(', ') : 'Saknas',
      }))

    // Convert totalScore to 0-1 range for consistency with UI
    const totalScoreNormalized = result.totalScore / 100

    return NextResponse.json({
      ...result,
      totalScore: totalScoreNormalized,
      gaps,
    })
  } catch (error) {
    console.error('Readiness POST error:', error)
    return NextResponse.json(
      { error: 'Failed to compute readiness' },
      { status: 500 }
    )
  }
}

