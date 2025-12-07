'use client'

import { useState, useEffect, useRef } from 'react'
import {
  CheckCircle,
  Circle,
  AlertCircle,
  Upload,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Info,
  Sparkles,
  X,
  File,
  Trash2,
  Eye,
  Download,
  Wand2
} from 'lucide-react'
import { REQUIREMENTS, Requirement, RequirementCategory } from '@/lib/readiness/requirements'

// Category metadata
const CATEGORY_META: Record<RequirementCategory, { label: string; icon: string; color: string }> = {
  finans: { label: 'Finansiellt', icon: '💰', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  skatt: { label: 'Skatt', icon: '🏦', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  juridik: { label: 'Juridik', icon: '⚖️', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  hr: { label: 'HR & Personal', icon: '👥', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  kommersiellt: { label: 'Kommersiellt', icon: '📈', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  it: { label: 'IT & Säkerhet', icon: '🔐', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  operation: { label: 'Operation & ESG', icon: '🌱', color: 'bg-teal-100 text-teal-700 border-teal-200' },
}

type DocumentStatus = 'missing' | 'uploaded' | 'verified' | 'incomplete'

interface UploadedDoc {
  id: string
  requirementId: string
  fileName: string
  fileSize: number
  uploadedAt: string
  status: DocumentStatus
  fileUrl?: string
  periodYear?: number
  signed?: boolean
}

interface Props {
  listingId: string
  onComplete?: () => void
  readOnly?: boolean
}

export default function ReadinessChecklist({ listingId, onComplete, readOnly = false }: Props) {
  const [expandedCategories, setExpandedCategories] = useState<RequirementCategory[]>(['finans'])
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [gapResult, setGapResult] = useState<any>(null)
  const [showUploadModal, setShowUploadModal] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [analyzingDoc, setAnalyzingDoc] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch existing documents and calculate gap
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch uploaded documents for this listing
        const docsRes = await fetch(`/api/readiness/documents?listingId=${listingId}`)
        if (docsRes.ok) {
          const data = await docsRes.json()
          setUploadedDocs(data.documents || [])
        }

        // Calculate gap
        const gapRes = await fetch('/api/readiness/requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documents: uploadedDocs.map(d => ({
              requirementId: d.requirementId,
              category: REQUIREMENTS.find(r => r.id === d.requirementId)?.category || 'finans',
              mimeType: 'application/pdf',
              periodYear: d.periodYear,
              signed: d.signed,
            })),
          }),
        })
        if (gapRes.ok) {
          const gapData = await gapRes.json()
          setGapResult(gapData)
        }
      } catch (err) {
        console.error('Error fetching readiness data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [listingId])

  // Re-calculate gap when docs change
  useEffect(() => {
    if (uploadedDocs.length === 0) return
    const recalcGap = async () => {
      try {
        const gapRes = await fetch('/api/readiness/requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documents: uploadedDocs.map(d => ({
              requirementId: d.requirementId,
              category: REQUIREMENTS.find(r => r.id === d.requirementId)?.category || 'finans',
              mimeType: 'application/pdf',
              periodYear: d.periodYear,
              signed: d.signed,
            })),
          }),
        })
        if (gapRes.ok) {
          const gapData = await gapRes.json()
          setGapResult(gapData)
        }
      } catch (err) {
        console.error('Error recalculating gap:', err)
      }
    }
    recalcGap()
  }, [uploadedDocs])

  const toggleCategory = (cat: RequirementCategory) => {
    setExpandedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const getRequirementStatus = (reqId: string): DocumentStatus => {
    const docs = uploadedDocs.filter(d => d.requirementId === reqId)
    if (docs.length === 0) return 'missing'
    if (docs.some(d => d.status === 'verified')) return 'verified'
    if (docs.some(d => d.status === 'uploaded')) return 'uploaded'
    return 'incomplete'
  }

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />
      case 'uploaded':
        return <CheckCircle className="w-5 h-5 text-sky-600" />
      case 'incomplete':
        return <AlertCircle className="w-5 h-5 text-amber-500" />
      default:
        return <Circle className="w-5 h-5 text-gray-300" />
    }
  }

  const getStatusLabel = (status: DocumentStatus) => {
    switch (status) {
      case 'verified':
        return 'Verifierad'
      case 'uploaded':
        return 'Uppladdad'
      case 'incomplete':
        return 'Ofullständig'
      default:
        return 'Saknas'
    }
  }

  const handleFileSelect = async (requirementId: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(requirementId)
    setShowUploadModal(null)

    const requirement = REQUIREMENTS.find(r => r.id === requirementId)
    if (!requirement) return

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('listingId', listingId)
        formData.append('requirementId', requirementId)
        formData.append('category', requirement.category)

        const res = await fetch('/api/readiness/upload', {
          method: 'POST',
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          setUploadedDocs(prev => [...prev, data.document])
        }
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(null)
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta dokument?')) return
    try {
      const res = await fetch(`/api/readiness/documents/${docId}`, { method: 'DELETE' })
      if (res.ok) {
        setUploadedDocs(prev => prev.filter(d => d.id !== docId))
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleDownloadGapReport = async () => {
    setGeneratingReport(true)
    try {
      const res = await fetch(`/api/readiness/gap-report?listingId=${listingId}`)
      if (res.ok) {
        const data = await res.json()
        const report = data.report
        
        // Generate text report
        let reportText = `SÄLJBEREDSKAPS-RAPPORT\n`
        reportText += `======================\n\n`
        reportText += `Företag: ${report.listingTitle}\n`
        reportText += `Genererad: ${new Date(report.generatedAt).toLocaleDateString('sv-SE')}\n\n`
        reportText += `ÖVERGRIPANDE STATUS\n`
        reportText += `-------------------\n`
        reportText += `Total poäng: ${report.overallScore}%\n`
        reportText += `Uppfyllda obligatoriska krav: ${report.fulfilledMandatory} av ${report.totalMandatory}\n\n`
        
        reportText += `STATUS PER KATEGORI\n`
        reportText += `-------------------\n`
        for (const cat of report.categorySummaries) {
          reportText += `${cat.categoryLabel}: ${cat.fulfilled}/${cat.total} (${cat.score}%)\n`
        }
        
        reportText += `\nSAKNADE OBLIGATORISKA DOKUMENT\n`
        reportText += `------------------------------\n`
        if (report.missingMandatory.length === 0) {
          reportText += `Alla obligatoriska dokument är uppladdade!\n`
        } else {
          for (const item of report.missingMandatory) {
            reportText += `\n[${item.categoryLabel}] ${item.title}\n`
            reportText += `  ${item.description}\n`
            if (item.docTypes) reportText += `  Format: ${item.docTypes.join(', ')}\n`
            if (item.minYears) reportText += `  Kräver: ${item.minYears} års historik\n`
            if (item.requiresSignature) reportText += `  Kräver: Signatur\n`
          }
        }
        
        reportText += `\nREKOMMENDATIONER\n`
        reportText += `----------------\n`
        for (const rec of report.recommendations) {
          reportText += `• ${rec}\n`
        }

        // Download as text file
        const blob = new Blob([reportText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `gap-rapport-${listingId}.txt`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Error generating report:', err)
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleAnalyzeDoc = async (doc: UploadedDoc) => {
    setAnalyzingDoc(doc.id)
    try {
      const res = await fetch('/api/readiness/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: doc.fileName,
          documentId: doc.id,
        }),
      })
      if (res.ok) {
        // Refresh documents to get updated classification
        const docsRes = await fetch(`/api/readiness/documents?listingId=${listingId}`)
        if (docsRes.ok) {
          const data = await docsRes.json()
          setUploadedDocs(data.documents || [])
        }
      }
    } catch (err) {
      console.error('Analysis error:', err)
    } finally {
      setAnalyzingDoc(null)
    }
  }

  // Group requirements by category
  const grouped = REQUIREMENTS.reduce((acc, req) => {
    if (!acc[req.category]) acc[req.category] = []
    acc[req.category].push(req)
    return acc
  }, {} as Record<RequirementCategory, Requirement[]>)

  // Calculate category stats
  const getCategoryStats = (cat: RequirementCategory) => {
    const reqs = grouped[cat] || []
    const mandatory = reqs.filter(r => r.mandatory)
    const fulfilled = mandatory.filter(r => ['uploaded', 'verified'].includes(getRequirementStatus(r.id)))
    return { total: mandatory.length, fulfilled: fulfilled.length }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
        <span className="ml-3 text-gray-600">Laddar checklista...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      {gapResult && (
        <div className="bg-gradient-to-br from-navy to-navy/90 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-butter" />
                Säljberedskap
              </h2>
              <p className="text-white/70 text-sm mt-1">
                Baserat på {REQUIREMENTS.filter(r => r.mandatory).length} obligatoriska krav
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleDownloadGapReport}
                disabled={generatingReport}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {generatingReport ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Gap-rapport
              </button>
              <div className="text-right">
                <div className="text-4xl font-bold">
                  {Math.round(gapResult.totalScore * 100)}%
                </div>
                <p className="text-white/70 text-sm">
                  {gapResult.totalScore >= 0.8 ? 'Redo för DD' : gapResult.totalScore >= 0.5 ? 'På god väg' : 'Behöver kompletteras'}
                </p>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                gapResult.totalScore >= 0.8 ? 'bg-mint' : gapResult.totalScore >= 0.5 ? 'bg-butter' : 'bg-coral'
              }`}
              style={{ width: `${gapResult.totalScore * 100}%` }}
            />
          </div>
          {/* Category mini-stats */}
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mt-4">
            {(Object.keys(CATEGORY_META) as RequirementCategory[]).map(cat => {
              const stats = getCategoryStats(cat)
              const pct = stats.total > 0 ? (stats.fulfilled / stats.total) * 100 : 0
              return (
                <div key={cat} className="text-center">
                  <div className="text-lg">{CATEGORY_META[cat].icon}</div>
                  <div className="text-xs text-white/70 mt-1">{Math.round(pct)}%</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Gap Summary (if missing items) */}
      {gapResult && gapResult.gaps?.length > 0 && (
        <div className="bg-coral/10 border border-coral/30 rounded-xl p-4">
          <h3 className="font-semibold text-coral flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" />
            {gapResult.gaps.length} obligatoriska krav saknas
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            {gapResult.gaps.slice(0, 5).map((gap: any) => (
              <li key={gap.requirementId} className="flex items-start gap-2">
                <span className="text-coral">•</span>
                <span>{gap.title}</span>
                {gap.reason && <span className="text-gray-500 text-xs">({gap.reason})</span>}
              </li>
            ))}
            {gapResult.gaps.length > 5 && (
              <li className="text-gray-500">... och {gapResult.gaps.length - 5} till</li>
            )}
          </ul>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-3">
        {(Object.keys(grouped) as RequirementCategory[]).map(cat => {
          const meta = CATEGORY_META[cat]
          const reqs = grouped[cat]
          const stats = getCategoryStats(cat)
          const isExpanded = expandedCategories.includes(cat)

          return (
            <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meta.icon}</span>
                  <div className="text-left">
                    <h3 className="font-semibold text-navy">{meta.label}</h3>
                    <p className="text-xs text-gray-500">
                      {stats.fulfilled} av {stats.total} obligatoriska
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Mini progress */}
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        stats.fulfilled === stats.total ? 'bg-emerald-500' : stats.fulfilled > 0 ? 'bg-sky-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${stats.total > 0 ? (stats.fulfilled / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Requirements */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {reqs.map(req => {
                    const status = getRequirementStatus(req.id)
                    const docs = uploadedDocs.filter(d => d.requirementId === req.id)
                    const isUploading = uploading === req.id

                    return (
                      <div key={req.id} className="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(status)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-navy">{req.title}</h4>
                                {req.mandatory && (
                                  <span className="text-xs bg-coral/10 text-coral px-2 py-0.5 rounded-full">
                                    Obligatorisk
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                              {/* Metadata hints */}
                              <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                                {req.docTypes && (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                                    {req.docTypes.join(', ').toUpperCase()}
                                  </span>
                                )}
                                {req.minYears && (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                                    {req.minYears} år historik
                                  </span>
                                )}
                                {req.requiresSignature && (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                                    Signerad krävs
                                  </span>
                                )}
                              </div>
                              {/* Uploaded docs */}
                              {docs.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {docs.map(doc => (
                                    <div
                                      key={doc.id}
                                      className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                                    >
                                      <File className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm text-gray-700 flex-1 truncate">
                                        {doc.fileName}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {formatFileSize(doc.fileSize)}
                                      </span>
                                      {!readOnly && (
                                        <>
                                          <button
                                            onClick={() => handleAnalyzeDoc(doc)}
                                            disabled={analyzingDoc === doc.id}
                                            className="p-1 text-gray-400 hover:text-sky-600 transition-colors disabled:opacity-50"
                                            title="AI-analysera"
                                          >
                                            {analyzingDoc === doc.id ? (
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                              <Wand2 className="w-4 h-4" />
                                            )}
                                          </button>
                                          <button
                                            onClick={() => handleDeleteDoc(doc.id)}
                                            className="p-1 text-gray-400 hover:text-coral transition-colors"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Upload button */}
                          {!readOnly && (
                            <div className="flex-shrink-0">
                              {isUploading ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Laddar upp...
                                </div>
                              ) : (
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    multiple
                                    accept={req.docTypes?.map(t => `.${t}`).join(',') || '.pdf,.xlsx,.csv,.docx'}
                                    className="hidden"
                                    onChange={e => handleFileSelect(req.id, e.target.files)}
                                  />
                                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-navy/5 text-navy rounded-lg hover:bg-navy/10 transition-colors text-sm font-medium">
                                    <Upload className="w-4 h-4" />
                                    {docs.length > 0 ? 'Lägg till' : 'Ladda upp'}
                                  </span>
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Completion CTA */}
      {gapResult && gapResult.totalScore >= 0.8 && onComplete && (
        <div className="bg-mint/20 border border-mint rounded-xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-navy mb-2">Dokumentationen är komplett!</h3>
          <p className="text-gray-600 mb-4">Ditt företag är redo för due diligence.</p>
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-navy text-white rounded-xl font-medium hover:bg-navy/90 transition-colors"
          >
            Gå vidare
          </button>
        </div>
      )}
    </div>
  )
}

