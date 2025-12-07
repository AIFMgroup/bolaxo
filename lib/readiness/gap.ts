import { REQUIREMENTS, Requirement, RequirementCategory } from './requirements'

export type DocumentMeta = {
  id?: string
  fileName?: string
  mimeType?: string
  sizeBytes?: number
  uploadedAt?: string | Date
  uploadedBy?: string
  // Classification fields
  category?: RequirementCategory
  requirementId?: string
  periodYear?: number
  periodType?: 'FY' | 'YTD' | 'LTM' | 'Monthly'
  signed?: boolean
  docTypeExt?: string // derived from filename/mime
}

export type RequirementStatus = 'fulfilled' | 'missing' | 'incomplete'

export type RequirementWithStatus = Requirement & {
  status: RequirementStatus
  matchedDocs: DocumentMeta[]
  issues: string[]
}

export type CategoryScore = {
  category: RequirementCategory
  total: number
  fulfilled: number
  score: number // 0-100
}

export type ReadinessResult = {
  requirements: RequirementWithStatus[]
  categories: CategoryScore[]
  totalScore: number
}

function getExt(fileName?: string, mime?: string): string | undefined {
  if (fileName && fileName.includes('.')) {
    return fileName.split('.').pop()?.toLowerCase()
  }
  if (mime) {
    if (mime.includes('pdf')) return 'pdf'
    if (mime.includes('excel') || mime.includes('spreadsheet')) return 'xlsx'
    if (mime.includes('csv')) return 'csv'
  }
  return undefined
}

function checkDocMatches(req: Requirement, doc: DocumentMeta): { ok: boolean; issues: string[] } {
  const issues: string[] = []

  // Category match if specified
  if (doc.category && doc.category !== req.category) {
    issues.push('Fel kategori')
  }

  // Requirement exact match if set
  if (doc.requirementId && doc.requirementId !== req.id) {
    issues.push('Fel requirementId')
  }

  // Doc type/extension
  const ext = doc.docTypeExt || getExt(doc.fileName, doc.mimeType)
  if (req.docTypes && req.docTypes.length > 0) {
    if (!ext || !req.docTypes.includes(ext)) {
      issues.push(`Ogiltig filtyp, förväntar ${req.docTypes.join(', ')}`)
    }
  }

  // Signature
  if (req.requiresSignature && doc.signed === false) {
    issues.push('Saknar signatur')
  }

  // Period/år
  if (req.minYears && doc.periodYear) {
    const currentYear = new Date().getFullYear()
    if (currentYear - doc.periodYear + 1 > (req.minYears || 0) + 5) {
      // heuristic: too old
      issues.push('För gammal period')
    }
  }

  return { ok: issues.length === 0, issues }
}

export function computeReadiness(
  docs: DocumentMeta[],
  requirements: Requirement[] = REQUIREMENTS
): ReadinessResult {
  const reqWithStatus: RequirementWithStatus[] = requirements.map((req) => {
    const matches: DocumentMeta[] = []
    const issuesCollected: string[] = []

    // pick docs that either have requirementId or same category
    const candidates = docs.filter((d) => {
      if (d.requirementId) return d.requirementId === req.id
      if (d.category) return d.category === req.category
      return true
    })

    for (const doc of candidates) {
      const check = checkDocMatches(req, doc)
      if (check.ok) {
        matches.push(doc)
      } else {
        issuesCollected.push(...check.issues.map((i) => `${doc.fileName || 'dok'}: ${i}`))
      }
    }

    let status: RequirementStatus = 'missing'
    if (matches.length > 0) {
      status = issuesCollected.length === 0 ? 'fulfilled' : 'incomplete'
    }

    return {
      ...req,
      status,
      matchedDocs: matches,
      issues: issuesCollected,
    }
  })

  const categoriesMap: Record<RequirementCategory, { total: number; fulfilled: number }> = {
    finans: { total: 0, fulfilled: 0 },
    skatt: { total: 0, fulfilled: 0 },
    juridik: { total: 0, fulfilled: 0 },
    hr: { total: 0, fulfilled: 0 },
    kommersiellt: { total: 0, fulfilled: 0 },
    it: { total: 0, fulfilled: 0 },
    operation: { total: 0, fulfilled: 0 },
  }

  reqWithStatus.forEach((r) => {
    categoriesMap[r.category].total += r.mandatory ? 1 : 0
    if (r.mandatory && r.status === 'fulfilled') {
      categoriesMap[r.category].fulfilled += 1
    }
  })

  const categories: CategoryScore[] = Object.entries(categoriesMap).map(
    ([cat, v]) => ({
      category: cat as RequirementCategory,
      total: v.total,
      fulfilled: v.fulfilled,
      score: v.total === 0 ? 100 : Math.round((v.fulfilled / v.total) * 100),
    })
  )

  const mandatoryTotal = reqWithStatus.filter((r) => r.mandatory).length
  const mandatoryFulfilled = reqWithStatus.filter(
    (r) => r.mandatory && r.status === 'fulfilled'
  ).length
  const totalScore = mandatoryTotal === 0 ? 100 : Math.round((mandatoryFulfilled / mandatoryTotal) * 100)

  return {
    requirements: reqWithStatus,
    categories,
    totalScore,
  }
}

