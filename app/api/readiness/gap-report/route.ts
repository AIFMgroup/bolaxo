import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { REQUIREMENTS, RequirementCategory, Requirement } from '@/lib/readiness/requirements'
import { computeReadiness, DocumentMeta } from '@/lib/readiness/gap'

// Category display names
const CATEGORY_NAMES: Record<RequirementCategory, string> = {
  finans: 'Finansiellt',
  skatt: 'Skatt',
  juridik: 'Juridik',
  hr: 'HR & Personal',
  kommersiellt: 'Kommersiellt',
  it: 'IT & Säkerhet',
  operation: 'Operation & ESG',
}

interface GapItem {
  id: string
  title: string
  description: string
  category: string
  categoryLabel: string
  mandatory: boolean
  status: string
  reason: string
  docTypes?: string[]
  minYears?: number
  requiresSignature?: boolean
}

interface CategorySummary {
  category: string
  categoryLabel: string
  total: number
  fulfilled: number
  missing: number
  score: number
}

interface GapReport {
  listingId: string
  listingTitle: string
  generatedAt: string
  overallScore: number
  totalMandatory: number
  fulfilledMandatory: number
  categorySummaries: CategorySummary[]
  missingMandatory: GapItem[]
  missingOptional: GapItem[]
  recommendations: string[]
}

// GET /api/readiness/gap-report?listingId=xxx
// Generate a comprehensive gap report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json({ error: 'listingId krävs' }, { status: 400 })
    }

    // Verify user access
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    // Check ownership
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, userId },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Ingen behörighet' }, { status: 403 })
    }

    // Fetch documents
    const documents = await prisma.document.findMany({
      where: {
        transactionId: listingId,
        type: { startsWith: 'READINESS:' },
      },
    })

    // Convert to DocumentMeta format
    const docsMeta: DocumentMeta[] = documents.map(doc => {
      const requirementId = doc.type.replace('READINESS:', '')
      let meta: any = {}
      try {
        if (doc.uploadedByName?.startsWith('{')) {
          meta = JSON.parse(doc.uploadedByName)
        }
      } catch {}

      return {
        id: doc.id,
        fileName: doc.fileName || undefined,
        mimeType: doc.mimeType || undefined,
        sizeBytes: doc.fileSize || undefined,
        uploadedAt: doc.createdAt,
        requirementId,
        category: meta.category,
        periodYear: meta.periodYear,
        signed: meta.signed,
      }
    })

    // Compute readiness
    const result = computeReadiness(docsMeta)

    // Build category summaries
    const categorySummaries: CategorySummary[] = result.categories.map(c => ({
      category: c.category,
      categoryLabel: CATEGORY_NAMES[c.category],
      total: c.total,
      fulfilled: c.fulfilled,
      missing: c.total - c.fulfilled,
      score: c.score,
    }))

    // Build missing items lists
    const missingMandatory: GapItem[] = result.requirements
      .filter(r => r.mandatory && r.status !== 'fulfilled')
      .map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        categoryLabel: CATEGORY_NAMES[r.category],
        mandatory: r.mandatory,
        status: r.status,
        reason: r.status === 'incomplete' ? r.issues.join(', ') : 'Ej uppladdad',
        docTypes: r.docTypes,
        minYears: r.minYears,
        requiresSignature: r.requiresSignature,
      }))

    const missingOptional: GapItem[] = result.requirements
      .filter(r => !r.mandatory && r.status !== 'fulfilled')
      .map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        categoryLabel: CATEGORY_NAMES[r.category],
        mandatory: r.mandatory,
        status: r.status,
        reason: r.status === 'incomplete' ? r.issues.join(', ') : 'Ej uppladdad',
        docTypes: r.docTypes,
        minYears: r.minYears,
        requiresSignature: r.requiresSignature,
      }))

    // Generate recommendations
    const recommendations: string[] = []

    if (result.totalScore < 50) {
      recommendations.push('Din säljberedskap är under 50%. Fokusera på att ladda upp de mest kritiska dokumenten först.')
    }

    // Check specific weak categories
    for (const cat of categorySummaries) {
      if (cat.score < 30 && cat.total > 0) {
        recommendations.push(`Kategorin "${cat.categoryLabel}" behöver prioriteras - endast ${cat.score}% av obligatoriska dokument är uppladdade.`)
      }
    }

    // Check for common missing items
    const missingAR = missingMandatory.find(m => m.id === 'fin-arsredovisning')
    if (missingAR) {
      recommendations.push('Årsredovisningar saknas - detta är ofta det första en köpare vill se. Ladda upp de senaste 3-5 årens ÅR.')
    }

    const missingBolag = missingMandatory.find(m => m.id === 'leg-bolagsdokument')
    if (missingBolag) {
      recommendations.push('Bolagsdokument (registreringsbevis, bolagsordning) saknas - hämta dessa från Bolagsverket.')
    }

    if (result.totalScore >= 80) {
      recommendations.push('Bra jobbat! Din dokumentation är i stort sett komplett. Kontrollera att alla dokument är aktuella och signerade där så krävs.')
    }

    // Build report
    const report: GapReport = {
      listingId,
      listingTitle: listing.anonymousTitle || listing.companyName || 'Okänt företag',
      generatedAt: new Date().toISOString(),
      overallScore: result.totalScore,
      totalMandatory: result.requirements.filter(r => r.mandatory).length,
      fulfilledMandatory: result.requirements.filter(r => r.mandatory && r.status === 'fulfilled').length,
      categorySummaries,
      missingMandatory,
      missingOptional,
      recommendations,
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Error generating gap report:', error)
    return NextResponse.json(
      { error: 'Kunde inte generera gap-rapport' },
      { status: 500 }
    )
  }
}

