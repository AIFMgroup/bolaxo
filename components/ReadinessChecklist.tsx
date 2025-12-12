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

interface AnalysisFinding {
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  description: string
}

interface AnalysisResult {
  score: number
  status: 'approved' | 'needs_review' | 'rejected'
  summary: string
  findings: AnalysisFinding[]
  suggestedCategory: RequirementCategory | null
  suggestedPeriodYear: number | null
  isSigned: boolean
  missingElements: string[]
  recommendations: string[]
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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [gapResult, setGapResult] = useState<any>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [analyzingDoc, setAnalyzingDoc] = useState<string | null>(null)
  const [expandedReq, setExpandedReq] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<{ doc: UploadedDoc; result: AnalysisResult } | null>(null)
  const [analysisModalTab, setAnalysisModalTab] = useState<'summary' | 'details' | 'actions'>('summary')
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
    setUploadProgress(0)

    const requirement = REQUIREMENTS.find(r => r.id === requirementId)
    if (!requirement) return

    try {
      const totalFiles = files.length
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i]
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 100)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('listingId', listingId)
        formData.append('requirementId', requirementId)
        formData.append('category', requirement.category)

        const res = await fetch('/api/readiness/upload', {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (res.ok) {
          const data = await res.json()
          setUploadedDocs(prev => [...prev, data.document])
          
          // Auto-trigger analysis for the uploaded document
          setTimeout(() => handleAnalyzeDoc(data.document), 500)
        }
        
        // Brief pause to show 100% completion
        await new Promise(resolve => setTimeout(resolve, 300))
        setUploadProgress(((i + 1) / totalFiles) * 100)
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(null)
      setUploadProgress(0)
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
    setAnalysisModalTab('summary')
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
        const data = await res.json()
        
        // Show analysis result in modal
        setAnalysisResult({
          doc,
          result: data.analysis || {
            score: 80,
            status: 'needs_review',
            summary: 'Dokumentet analyserades men kunde inte tolkas fullständigt.',
            findings: [{ type: 'info', title: 'Analys slutförd', description: 'DD-coach har granskat dokumentet.' }],
            suggestedCategory: null,
            suggestedPeriodYear: null,
            isSigned: false,
            missingElements: [],
            recommendations: ['Kontrollera dokumentet manuellt'],
          },
        })
        
        // Refresh documents list
        const docsRes = await fetch(`/api/readiness/documents?listingId=${listingId}`)
        if (docsRes.ok) {
          const docsData = await docsRes.json()
          setUploadedDocs(docsData.documents || [])
        }
      }
    } catch (err) {
      console.error('Analysis error:', err)
      // Show error result
      setAnalysisResult({
        doc,
        result: {
          score: 0,
          status: 'needs_review',
          summary: 'Kunde inte analysera dokumentet. Försök igen eller kontakta support.',
          findings: [{ type: 'error', title: 'Analysfel', description: 'Ett tekniskt fel uppstod vid analysen.' }],
          suggestedCategory: null,
          suggestedPeriodYear: null,
          isSigned: false,
          missingElements: [],
          recommendations: ['Försök igen eller ladda upp dokumentet på nytt'],
        },
      })
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
      {/* Upload Progress Overlay */}
      {uploading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 animate-pulse-shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-navy/5 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-navy border-t-transparent rounded-full animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Laddar upp dokument...</h3>
              <p className="text-sm text-gray-500">Vänligen vänta medan filen laddas upp</p>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-navy to-navy/80 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-400 mt-3">{Math.round(uploadProgress)}%</p>
          </div>
        </div>
      )}

      {/* Analysis Loading Overlay */}
      {analyzingDoc && !analysisResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 animate-pulse-shadow">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                <div className="absolute inset-0 rounded-full border-4 border-navy border-t-transparent animate-spin" />
                <div className="absolute inset-3 rounded-full border-4 border-emerald-100" />
                <div className="absolute inset-3 rounded-full border-4 border-emerald-500 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">DD-coach analyserar...</h3>
              <p className="text-sm text-gray-500 mb-4">AI granskar dokumentet för att säkerställa DD-kvalitet</p>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <div 
                    key={i}
                    className="w-2 h-2 rounded-full bg-navy animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Result Modal */}
      {analysisResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-pulse-shadow">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Analysresultat</h3>
                  <p className="text-sm text-gray-500">{analysisResult.doc.fileName}</p>
                </div>
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-1 mt-4 p-1 bg-gray-50 rounded-xl">
                {[
                  { id: 'summary', label: 'Sammanfattning' },
                  { id: 'details', label: 'Detaljer' },
                  { id: 'actions', label: 'Åtgärder' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setAnalysisModalTab(tab.id as typeof analysisModalTab)}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      analysisModalTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
              {analysisModalTab === 'summary' && (
                <div className="space-y-6">
                  {/* Score and Status */}
                  <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">DD-poäng</p>
                      <p className="text-4xl font-bold text-gray-900">{analysisResult.result.score}/100</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-sm font-medium ${
                      analysisResult.result.status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-700'
                        : analysisResult.result.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {analysisResult.result.status === 'approved' ? 'Godkänt' 
                        : analysisResult.result.status === 'rejected' ? 'Underkänt' 
                        : 'Behöver granskning'}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-5 bg-gray-50 rounded-2xl">
                    <p className="text-sm text-gray-500 mb-2">Sammanfattning</p>
                    <p className="text-gray-900 leading-relaxed">{analysisResult.result.summary}</p>
                  </div>

                  {/* Findings */}
                  {analysisResult.result.findings && analysisResult.result.findings.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">Resultat av granskningen</p>
                      {analysisResult.result.findings.map((finding, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl flex items-start gap-3 ${
                            finding.type === 'success' ? 'bg-emerald-50' :
                            finding.type === 'error' ? 'bg-rose-50' :
                            finding.type === 'warning' ? 'bg-amber-50' : 'bg-sky-50'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            finding.type === 'success' ? 'bg-emerald-100' :
                            finding.type === 'error' ? 'bg-rose-100' :
                            finding.type === 'warning' ? 'bg-amber-100' : 'bg-sky-100'
                          }`}>
                            {finding.type === 'success' && (
                              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {finding.type === 'error' && (
                              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            {finding.type === 'warning' && (
                              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                              </svg>
                            )}
                            {finding.type === 'info' && (
                              <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className={`font-medium ${
                              finding.type === 'success' ? 'text-emerald-900' :
                              finding.type === 'error' ? 'text-rose-900' :
                              finding.type === 'warning' ? 'text-amber-900' : 'text-sky-900'
                            }`}>{finding.title}</p>
                            <p className={`text-sm mt-0.5 ${
                              finding.type === 'success' ? 'text-emerald-700' :
                              finding.type === 'error' ? 'text-rose-700' :
                              finding.type === 'warning' ? 'text-amber-700' : 'text-sky-700'
                            }`}>{finding.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {analysisModalTab === 'details' && (
                <div className="space-y-4">
                  {/* Detected Properties */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Föreslagen kategori</p>
                      <p className="font-medium text-gray-900">
                        {analysisResult.result.suggestedCategory 
                          ? CATEGORY_META[analysisResult.result.suggestedCategory]?.label || analysisResult.result.suggestedCategory
                          : 'Ej detekterad'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Detekterat år</p>
                      <p className="font-medium text-gray-900">
                        {analysisResult.result.suggestedPeriodYear || 'Ej detekterat'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Signaturstatus</p>
                      <p className="font-medium text-gray-900">
                        {analysisResult.result.isSigned ? 'Signerad' : 'Ej signerad'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">DD-status</p>
                      <p className={`font-medium ${
                        analysisResult.result.status === 'approved' ? 'text-emerald-600' :
                        analysisResult.result.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'
                      }`}>
                        {analysisResult.result.status === 'approved' ? 'Godkänt' 
                          : analysisResult.result.status === 'rejected' ? 'Underkänt' 
                          : 'Behöver granskning'}
                      </p>
                    </div>
                  </div>

                  {/* Missing Elements */}
                  {analysisResult.result.missingElements && analysisResult.result.missingElements.length > 0 && (
                    <div className="p-4 bg-rose-50 rounded-xl">
                      <p className="text-xs text-rose-600 font-medium mb-2">Saknade element</p>
                      <ul className="space-y-1">
                        {analysisResult.result.missingElements.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-rose-700">
                            <span className="w-1 h-1 rounded-full bg-rose-400 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* File Info */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2">Filinformation</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-sm font-medium text-gray-500">
                        {analysisResult.doc.fileName.split('.').pop()?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{analysisResult.doc.fileName}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(analysisResult.doc.fileSize)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {analysisModalTab === 'actions' && (
                <div className="space-y-4">
                  {/* Status Message */}
                  {analysisResult.result.status === 'approved' ? (
                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-emerald-900 mb-1">Dokumentet är godkänt</p>
                          <p className="text-sm text-emerald-700">Detta dokument uppfyller DD-kraven och behöver ingen ytterligare åtgärd.</p>
                        </div>
                      </div>
                    </div>
                  ) : analysisResult.result.status === 'rejected' ? (
                    <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-rose-900 mb-1">Åtgärd krävs</p>
                          <p className="text-sm text-rose-700">Dokumentet behöver kompletteras eller bytas ut för att uppfylla DD-kraven.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-amber-900 mb-1">Behöver granskning</p>
                          <p className="text-sm text-amber-700">Dokumentet kan behöva kompletteras. Kontrollera att all information finns med.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysisResult.result.recommendations && analysisResult.result.recommendations.length > 0 && (
                    <div className="p-5 bg-sky-50 rounded-2xl border border-sky-100">
                      <p className="font-medium text-sky-900 mb-3">Rekommendationer från DD-coach</p>
                      <ul className="space-y-2">
                        {analysisResult.result.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-sky-800">
                            <span className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium text-sky-600">
                              {idx + 1}
                            </span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setAnalysisResult(null)}
                      className="flex-1 px-5 py-3 bg-navy text-white rounded-xl font-medium hover:bg-navy/90 transition-all"
                    >
                      Stäng
                    </button>
                    <button
                      onClick={() => {
                        handleAnalyzeDoc(analysisResult.doc)
                        setAnalysisResult(null)
                      }}
                      className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                    >
                      Analysera igen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {analyzingDoc === doc.id && (
                                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                )}
                                {analyzingDoc === doc.id ? 'Analyserar...' : 'DD-coach'}
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
                        disabled={isUploading}
                      />
                      <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isUploading 
                          ? 'bg-gray-100 text-gray-400 cursor-wait' 
                          : 'bg-navy text-white hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/20 cursor-pointer'
                      }`}>
                        {isUploading && (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        )}
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
