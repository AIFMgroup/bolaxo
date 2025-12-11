'use client'

import { useState, useEffect, useRef } from 'react'
import { REQUIREMENTS, Requirement, RequirementCategory } from '@/lib/readiness/requirements'

// Category metadata - no emojis, just labels and colors
const CATEGORY_META: Record<RequirementCategory, { label: string; color: string; bgColor: string }> = {
  finans: { label: 'Finansiellt', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  skatt: { label: 'Skatt', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  juridik: { label: 'Juridik', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  hr: { label: 'HR & Personal', color: 'text-orange-700', bgColor: 'bg-orange-50' },
  kommersiellt: { label: 'Kommersiellt', color: 'text-sky-700', bgColor: 'bg-sky-50' },
  it: { label: 'IT & Säkerhet', color: 'text-rose-700', bgColor: 'bg-rose-50' },
  operation: { label: 'Operation & ESG', color: 'text-teal-700', bgColor: 'bg-teal-50' },
}

type DocumentStatus = 'missing' | 'uploaded' | 'verified' | 'incomplete'
type TabCategory = RequirementCategory | 'all'

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
  const [activeTab, setActiveTab] = useState<TabCategory>('all')
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [gapResult, setGapResult] = useState<any>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [analyzingDoc, setAnalyzingDoc] = useState<string | null>(null)
  const [expandedReq, setExpandedReq] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const docsRes = await fetch(`/api/readiness/documents?listingId=${listingId}`)
        if (docsRes.ok) {
          const data = await docsRes.json()
          setUploadedDocs(data.documents || [])
        }

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

  const getRequirementStatus = (reqId: string): DocumentStatus => {
    const docs = uploadedDocs.filter(d => d.requirementId === reqId)
    if (docs.length === 0) return 'missing'
    if (docs.some(d => d.status === 'verified')) return 'verified'
    if (docs.some(d => d.status === 'uploaded')) return 'uploaded'
    return 'incomplete'
  }

  const getStatusLabel = (status: DocumentStatus) => {
    switch (status) {
      case 'verified': return 'Verifierad'
      case 'uploaded': return 'Uppladdad'
      case 'incomplete': return 'Ofullständig'
      default: return 'Saknas'
    }
  }

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'verified': return 'bg-emerald-100 text-emerald-700'
      case 'uploaded': return 'bg-sky-100 text-sky-700'
      case 'incomplete': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-500'
    }
  }

  const handleFileSelect = async (requirementId: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(requirementId)

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
        
        let reportText = `SÄLJBEREDSKAPS-RAPPORT\n======================\n\n`
        reportText += `Företag: ${report.listingTitle}\n`
        reportText += `Genererad: ${new Date(report.generatedAt).toLocaleDateString('sv-SE')}\n\n`
        reportText += `ÖVERGRIPANDE STATUS\n-------------------\n`
        reportText += `Total poäng: ${report.overallScore}%\n`
        reportText += `Uppfyllda obligatoriska krav: ${report.fulfilledMandatory} av ${report.totalMandatory}\n\n`
        
        reportText += `STATUS PER KATEGORI\n-------------------\n`
        for (const cat of report.categorySummaries) {
          reportText += `${cat.categoryLabel}: ${cat.fulfilled}/${cat.total} (${cat.score}%)\n`
        }
        
        reportText += `\nSAKNADE OBLIGATORISKA DOKUMENT\n------------------------------\n`
        if (report.missingMandatory.length === 0) {
          reportText += `Alla obligatoriska dokument är uppladdade!\n`
        } else {
          for (const item of report.missingMandatory) {
            reportText += `\n[${item.categoryLabel}] ${item.title}\n`
            reportText += `  ${item.description}\n`
          }
        }

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

  const grouped = REQUIREMENTS.reduce((acc, req) => {
    if (!acc[req.category]) acc[req.category] = []
    acc[req.category].push(req)
    return acc
  }, {} as Record<RequirementCategory, Requirement[]>)

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

  // Filter requirements based on active tab
  const filteredRequirements = activeTab === 'all' 
    ? REQUIREMENTS 
    : REQUIREMENTS.filter(r => r.category === activeTab)

  const categories = Object.keys(CATEGORY_META) as RequirementCategory[]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Score Card */}
      {gapResult && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 animate-pulse-shadow">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Säljberedskap</h2>
              <p className="text-gray-500 text-sm">
                Baserat på {REQUIREMENTS.filter(r => r.mandatory).length} obligatoriska krav
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleDownloadGapReport}
                disabled={generatingReport}
                className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-all disabled:opacity-50"
              >
                {generatingReport ? 'Genererar...' : 'Ladda ner rapport'}
              </button>
              <div className="text-right">
                <div className="text-5xl font-bold text-gray-900 tracking-tight">
                  {Math.round(gapResult.totalScore * 100)}%
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  {gapResult.totalScore >= 0.8 ? 'Redo för DD' : gapResult.totalScore >= 0.5 ? 'På god väg' : 'Behöver kompletteras'}
                </p>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                gapResult.totalScore >= 0.8 ? 'bg-emerald-500' : gapResult.totalScore >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${gapResult.totalScore * 100}%` }}
            />
          </div>
          {/* Category mini-stats */}
          <div className="grid grid-cols-7 gap-4 mt-6">
            {categories.map(cat => {
              const stats = getCategoryStats(cat)
              const pct = stats.total > 0 ? (stats.fulfilled / stats.total) * 100 : 0
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`text-center p-3 rounded-xl transition-all hover:bg-gray-50 ${
                    activeTab === cat ? 'bg-gray-50 ring-1 ring-gray-200' : ''
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500 mb-1">{CATEGORY_META[cat].label}</div>
                  <div className="text-lg font-semibold text-gray-900">{Math.round(pct)}%</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Gap Summary */}
      {gapResult && gapResult.gaps?.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-rose-100 animate-pulse-shadow">
          <h3 className="font-semibold text-gray-900 mb-4">
            {gapResult.gaps.length} obligatoriska krav saknas
          </h3>
          <div className="space-y-2">
            {gapResult.gaps.slice(0, 5).map((gap: any) => (
              <div key={gap.requirementId} className="flex items-center gap-3 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="text-gray-700">{gap.title}</span>
                {gap.reason && <span className="text-gray-400 text-xs">({gap.reason})</span>}
              </div>
            ))}
            {gapResult.gaps.length > 5 && (
              <p className="text-gray-400 text-sm pl-4">... och {gapResult.gaps.length - 5} till</p>
            )}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Alla
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === cat
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {CATEGORY_META[cat].label}
          </button>
        ))}
      </div>

      {/* Requirements List */}
      <div className="space-y-3">
        {filteredRequirements.map(req => {
          const status = getRequirementStatus(req.id)
          const docs = uploadedDocs.filter(d => d.requirementId === req.id)
          const isUploading = uploading === req.id
          const isExpanded = expandedReq === req.id

          return (
            <div 
              key={req.id} 
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all hover:border-gray-200 animate-pulse-shadow"
            >
              <button
                onClick={() => setExpandedReq(isExpanded ? null : req.id)}
                className="w-full p-5 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    status === 'verified' || status === 'uploaded' ? 'bg-emerald-500' :
                    status === 'incomplete' ? 'bg-amber-500' : 'bg-gray-200'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">{req.title}</h4>
                      {req.mandatory && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-xs font-medium rounded-full">
                          Obligatorisk
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`w-5 h-5 flex items-center justify-center text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-0 border-t border-gray-50">
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{req.description}</p>
                  
                  {/* Metadata hints */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {req.docTypes && (
                      <span className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg">
                        {req.docTypes.join(', ').toUpperCase()}
                      </span>
                    )}
                    {req.minYears && (
                      <span className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg">
                        {req.minYears} år historik
                      </span>
                    )}
                    {req.requiresSignature && (
                      <span className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg">
                        Signatur krävs
                      </span>
                    )}
                  </div>

                  {/* Uploaded docs */}
                  {docs.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {docs.map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs font-medium text-gray-500 border border-gray-100">
                              {doc.fileName.split('.').pop()?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-gray-900 truncate">{doc.fileName}</p>
                              <p className="text-xs text-gray-400">{formatFileSize(doc.fileSize)}</p>
                            </div>
                          </div>
                          {!readOnly && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAnalyzeDoc(doc) }}
                                disabled={analyzingDoc === doc.id}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {analyzingDoc === doc.id ? 'Analyserar...' : 'Analysera'}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id) }}
                                className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                Ta bort
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  {!readOnly && (
                    <label className="cursor-pointer inline-block">
                      <input
                        type="file"
                        multiple
                        accept={req.docTypes?.map(t => `.${t}`).join(',') || '.pdf,.xlsx,.csv,.docx'}
                        className="hidden"
                        onChange={e => handleFileSelect(req.id, e.target.files)}
                      />
                      <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isUploading 
                          ? 'bg-gray-100 text-gray-400' 
                          : 'bg-navy text-white hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/20'
                      }`}>
                        {isUploading ? 'Laddar upp...' : docs.length > 0 ? 'Lägg till fler' : 'Ladda upp'}
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Completion CTA */}
      {gapResult && gapResult.totalScore >= 0.8 && onComplete && (
        <div className="bg-white rounded-3xl p-8 border border-emerald-100 text-center animate-pulse-shadow">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Dokumentationen är komplett!</h3>
          <p className="text-gray-500 mb-6">Ditt företag är redo för due diligence.</p>
          <button
            onClick={onComplete}
            className="px-8 py-3 bg-navy text-white rounded-xl font-medium hover:bg-navy/90 transition-all hover:shadow-lg hover:shadow-navy/20"
          >
            Gå vidare
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse-shadow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.03);
          }
          50% {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          }
        }
        .animate-pulse-shadow {
          animation: pulse-shadow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
