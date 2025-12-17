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
  analysis?: AnalysisResult // Cached DD-coach analysis
  analyzedAt?: string // When the analysis was performed
}

interface Props {
  listingId: string
  onComplete?: () => void
  readOnly?: boolean
}

// LocalStorage key for demo documents
const DEMO_DOCS_KEY = 'afterfounder_demo_readiness_docs'

// Helper to check if we're in demo mode (check both cookie and listingId)
const isDemoMode = (listingId?: string) => {
  if (typeof window === 'undefined') return false
  if (listingId?.startsWith('demo')) return true
  const userId = document.cookie.split('; ').find(row => row.startsWith('afterfounder_user_id='))?.split('=')[1]
  return userId?.startsWith('demo') || false
}

// Save docs to localStorage for demo persistence
const saveDemoDocsToStorage = (listingId: string, docs: UploadedDoc[]) => {
  if (typeof window === 'undefined') return
  try {
    const allDocs = JSON.parse(localStorage.getItem(DEMO_DOCS_KEY) || '{}')
    allDocs[listingId] = docs
    localStorage.setItem(DEMO_DOCS_KEY, JSON.stringify(allDocs))
    console.log('[Demo] Saved docs to localStorage:', listingId, docs.length)
  } catch (e) {
    console.error('Error saving demo docs:', e)
  }
}

// Load docs from localStorage for demo
const loadDemoDocsFromStorage = (listingId: string): UploadedDoc[] => {
  if (typeof window === 'undefined') return []
  try {
    const allDocs = JSON.parse(localStorage.getItem(DEMO_DOCS_KEY) || '{}')
    const docs = allDocs[listingId] || []
    console.log('[Demo] Loaded docs from localStorage:', listingId, docs.length)
    return docs
  } catch (e) {
    console.error('Error loading demo docs:', e)
    return []
  }
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

  // Save to localStorage whenever docs change (for demo persistence)
  useEffect(() => {
    if (isDemoMode(listingId) && uploadedDocs.length > 0) {
      saveDemoDocsToStorage(listingId, uploadedDocs)
    }
  }, [uploadedDocs, listingId])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // First, load from localStorage for demo mode
        const storedDocs = loadDemoDocsFromStorage(listingId)
        const isDemo = isDemoMode(listingId)
        
        console.log('[Readiness] Fetching docs, isDemo:', isDemo, 'storedDocs:', storedDocs.length)
        
        let finalDocs: UploadedDoc[] = storedDocs
        
        try {
          const docsRes = await fetch(`/api/readiness/documents?listingId=${listingId}`)
          if (docsRes.ok) {
            const data = await docsRes.json()
            const apiDocs = data.documents || []
            
            console.log('[Readiness] API returned docs:', apiDocs.length)
            
            // Merge API docs with stored docs (avoid duplicates)
            const existingIds = new Set(apiDocs.map((d: UploadedDoc) => d.id))
            finalDocs = [
              ...apiDocs,
              ...storedDocs.filter(d => !existingIds.has(d.id))
            ]
          }
        } catch (apiErr) {
          console.log('[Readiness] API error, using stored docs:', apiErr)
        }
        
        console.log('[Readiness] Final docs count:', finalDocs.length)
        setUploadedDocs(finalDocs)
        
        // Calculate gap with the final docs
        if (finalDocs.length > 0) {
          const gapRes = await fetch('/api/readiness/requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documents: finalDocs.map(d => ({
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

  // Store file content in localStorage for demo download
  const storeFileForDemo = async (docId: string, file: File) => {
    if (typeof window === 'undefined') return
    try {
      const reader = new FileReader()
      reader.onload = () => {
        const fileData = {
          name: file.name,
          type: file.type,
          data: reader.result as string, // base64
        }
        const storedFiles = JSON.parse(localStorage.getItem('afterfounder_demo_files') || '{}')
        storedFiles[docId] = fileData
        localStorage.setItem('afterfounder_demo_files', JSON.stringify(storedFiles))
      }
      reader.readAsDataURL(file)
    } catch (e) {
      console.error('Error storing file for demo:', e)
    }
  }

  // Download handler for demo mode
  const handleDownloadDoc = async (doc: UploadedDoc) => {
    try {
      // First, try to get from localStorage (for demo uploads)
      const storedFiles = JSON.parse(localStorage.getItem('afterfounder_demo_files') || '{}')
      const storedFile = storedFiles[doc.id]
      
      if (storedFile) {
        // Download from stored data
        const link = document.createElement('a')
        link.href = storedFile.data
        link.download = storedFile.name || doc.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }
      
      // Fallback: try API download
      const res = await fetch(`/api/readiness/documents/${doc.id}/download`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = doc.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        // Demo fallback: create a sample text file
        const blob = new Blob([`Demo dokument: ${doc.fileName}\n\nDetta är en demo-fil.`], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = doc.fileName.replace(/\.[^.]+$/, '.txt')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Download error:', err)
      alert('Kunde inte ladda ner filen')
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
          const newDoc = data.document
          
          // Store file content for demo downloads
          if (isDemoMode()) {
            await storeFileForDemo(newDoc.id, file)
          }
          
          setUploadedDocs(prev => [...prev, newDoc])
          
          // Auto-trigger analysis for the uploaded document
          setTimeout(() => handleAnalyzeDoc(newDoc), 500)
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
    
    // For demo mode, remove from state immediately (localStorage will be updated via useEffect)
    const isDemo = isDemoMode(listingId) || docId.startsWith('demo')
    
    // Remove from state first for instant feedback
    setUploadedDocs(prev => prev.filter(d => d.id !== docId))
    
    // Also remove from demo files storage
    if (isDemo) {
      try {
        const storedFiles = JSON.parse(localStorage.getItem('afterfounder_demo_files') || '{}')
        delete storedFiles[docId]
        localStorage.setItem('afterfounder_demo_files', JSON.stringify(storedFiles))
      } catch (e) {
        console.error('Error removing file from localStorage:', e)
      }
    }
    
    // Try to delete from server (for non-demo, or just to clean up)
    try {
      await fetch(`/api/readiness/documents/${docId}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Delete error:', err)
      // For demo mode, we already removed from state, so no rollback needed
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

  const handleAnalyzeDoc = async (doc: UploadedDoc, forceReanalyze = false) => {
    setAnalysisModalTab('summary')
    
    // Check if we have a cached analysis and don't need to re-analyze
    if (doc.analysis && !forceReanalyze) {
      console.log('[DD-coach] Using cached analysis for:', doc.fileName)
      setAnalysisResult({ doc, result: doc.analysis })
      return
    }
    
    // Need to run analysis
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
        const data = await res.json()
        
        const analysisResult: AnalysisResult = data.analysis || {
          score: 80,
          status: 'needs_review',
          summary: 'Dokumentet analyserades men kunde inte tolkas fullständigt.',
          findings: [{ type: 'info', title: 'Analys slutförd', description: 'DD-coach har granskat dokumentet.' }],
          suggestedCategory: null,
          suggestedPeriodYear: null,
          isSigned: false,
          missingElements: [],
          recommendations: ['Kontrollera dokumentet manuellt'],
        }
        
        // Update the document with the analysis result
        const updatedDoc: UploadedDoc = {
          ...doc,
          analysis: analysisResult,
          analyzedAt: new Date().toISOString(),
        }
        
        // Update the docs list with the cached analysis
        setUploadedDocs(prev => prev.map(d => d.id === doc.id ? updatedDoc : d))
        
        // Show analysis result in modal
        setAnalysisResult({ doc: updatedDoc, result: analysisResult })
        
        console.log('[DD-coach] Analysis complete and cached for:', doc.fileName)
      }
    } catch (err) {
      console.error('Analysis error:', err)
      // Show error result (but don't cache errors)
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
                        setAnalysisResult(null)
                        handleAnalyzeDoc(analysisResult.doc, true) // Force re-analyze
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

      {/* Score Dashboard */}
      {gapResult && (
        <div className="space-y-4 sm:space-y-6">
          {/* Main Score Card */}
          <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden animate-pulse-shadow">
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Header - Stack on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">DD-beredskap</h2>
                  <p className="text-sm sm:text-base text-gray-500">
                    {REQUIREMENTS.filter(r => r.mandatory).length} obligatoriska dokument
                  </p>
                </div>
                <button
                  onClick={handleDownloadGapReport}
                  disabled={generatingReport}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-navy text-white rounded-xl sm:rounded-2xl text-sm font-medium hover:bg-navy/90 transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-navy/20"
                >
                  {generatingReport ? 'Genererar...' : 'Ladda ner rapport'}
                </button>
              </div>

              {/* Score Display - Stack on mobile */}
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 mb-6 sm:mb-8">
                {/* Circular Progress - Smaller on mobile */}
                <div className="relative w-32 h-32 sm:w-44 sm:h-44 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 176 176">
                    <circle
                      cx="88"
                      cy="88"
                      r="78"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="12"
                    />
                    <circle
                      cx="88"
                      cy="88"
                      r="78"
                      fill="none"
                      stroke={gapResult.totalScore >= 0.8 ? '#10b981' : gapResult.totalScore >= 0.5 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${gapResult.totalScore * 490} 490`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl sm:text-5xl font-bold text-gray-900">{Math.round(gapResult.totalScore * 100)}</span>
                    <span className="text-gray-400 text-base sm:text-lg">%</span>
                  </div>
                </div>

                {/* Status & Stats */}
                <div className="flex-1 w-full text-center sm:text-left">
                  <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4 ${
                    gapResult.totalScore >= 0.8 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : gapResult.totalScore >= 0.5 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'bg-rose-50 text-rose-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      gapResult.totalScore >= 0.8 ? 'bg-emerald-500' : gapResult.totalScore >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    {gapResult.totalScore >= 0.8 ? 'Redo för DD' : gapResult.totalScore >= 0.5 ? 'På god väg' : 'Kompletteras'}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 sm:gap-6">
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{uploadedDocs.filter(d => d.status === 'verified' || d.status === 'uploaded').length}</div>
                      <div className="text-xs sm:text-sm text-gray-500">Uppladdade</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-amber-600">{gapResult.gaps?.length || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-500">Saknas</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900">{REQUIREMENTS.filter(r => r.mandatory).length}</div>
                      <div className="text-xs sm:text-sm text-gray-500">Totalt</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Progress Cards - Responsive grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                {categories.map(cat => {
                  const stats = getCategoryStats(cat)
                  const pct = stats.total > 0 ? (stats.fulfilled / stats.total) * 100 : 0
                  const isActive = activeTab === cat
                  const meta = CATEGORY_META[cat]
                  
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`group relative p-4 rounded-2xl text-left transition-all duration-300 ${
                        isActive 
                          ? 'bg-white shadow-lg ring-2 ring-navy/20 scale-[1.02]' 
                          : 'bg-gray-50/80 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      {/* Progress bar background */}
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-100 rounded-b-2xl overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 ${
                            pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : pct > 0 ? 'bg-rose-400' : 'bg-gray-200'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      
                      <div className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1 sm:mb-2 truncate">{meta.label}</div>
                      <div className="flex items-end justify-between">
                        <span className={`text-lg sm:text-2xl font-bold ${
                          pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : pct > 0 ? 'text-rose-500' : 'text-gray-300'
                        }`}>
                          {Math.round(pct)}%
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-400">
                          {stats.fulfilled}/{stats.total}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Missing Requirements Alert - Mobile optimized */}
          {gapResult.gaps?.length > 0 && (
            <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-rose-100">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl font-bold text-rose-500">{gapResult.gaps.length}</span>
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">
                    Obligatoriska dokument saknas
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {gapResult.gaps.slice(0, 4).map((gap: any) => {
                      const req = REQUIREMENTS.find(r => r.id === gap.requirementId)
                      const cat = req?.category as RequirementCategory
                      const meta = cat ? CATEGORY_META[cat] : null
                      return (
                        <button
                          key={gap.requirementId}
                          onClick={() => {
                            if (cat) setActiveTab(cat)
                            setExpandedReq(gap.requirementId)
                          }}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/60 hover:bg-white rounded-lg sm:rounded-xl text-left transition-all group"
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta?.color.replace('text-', 'bg-') || 'bg-gray-400'}`} />
                          <span className="text-xs sm:text-sm text-gray-700 truncate flex-1">{gap.title}</span>
                          <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">Gå till →</span>
                        </button>
                      )
                    })}
                  </div>
                  {gapResult.gaps.length > 4 && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                      + {gapResult.gaps.length - 4} fler dokument saknas
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Tabs - Horizontal scroll on mobile */}
      <div className="flex gap-1.5 sm:gap-2 p-1 sm:p-1.5 bg-gray-50 rounded-xl sm:rounded-2xl overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
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
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === cat
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {CATEGORY_META[cat].label}
          </button>
        ))}
      </div>

      {/* Requirements List - Mobile optimized */}
      <div className="space-y-2 sm:space-y-3">
        {filteredRequirements.map(req => {
          const status = getRequirementStatus(req.id)
          const docs = uploadedDocs.filter(d => d.requirementId === req.id)
          const isUploading = uploading === req.id
          const isExpanded = expandedReq === req.id

          return (
            <div 
              key={req.id} 
              className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden transition-all hover:border-gray-200 animate-pulse-shadow"
            >
              <button
                onClick={() => setExpandedReq(isExpanded ? null : req.id)}
                className="w-full p-3 sm:p-5 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                  <div className={`w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full flex-shrink-0 ${
                    status === 'verified' || status === 'uploaded' ? 'bg-emerald-500' :
                    status === 'incomplete' ? 'bg-amber-500' : 'bg-gray-200'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900">{req.title}</h4>
                      {req.mandatory && (
                        <span className="px-1.5 sm:px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] sm:text-xs font-medium rounded-full">
                          Obl.
                        </span>
                      )}
                      <span className={`px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-medium rounded-full ${getStatusColor(status)}`}>
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
                <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-0 border-t border-gray-50">
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed">{req.description}</p>
                  
                  {/* Metadata hints */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    {req.docTypes && (
                      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gray-50 text-gray-600 text-[10px] sm:text-xs rounded-md sm:rounded-lg">
                        {req.docTypes.join(', ').toUpperCase()}
                      </span>
                    )}
                    {req.minYears && (
                      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gray-50 text-gray-600 text-[10px] sm:text-xs rounded-md sm:rounded-lg">
                        {req.minYears} år
                      </span>
                    )}
                    {req.requiresSignature && (
                      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gray-50 text-gray-600 text-[10px] sm:text-xs rounded-md sm:rounded-lg">
                        Signatur
                      </span>
                    )}
                  </div>

                  {/* Uploaded docs - Mobile optimized */}
                  {docs.length > 0 && (
                    <div className="space-y-2 mb-3 sm:mb-4">
                      {docs.map(doc => (
                        <div
                          key={doc.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:px-4 sm:py-3"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-white flex items-center justify-center text-[10px] sm:text-xs font-medium text-gray-500 border border-gray-100 flex-shrink-0">
                              {doc.fileName.split('.').pop()?.toUpperCase().slice(0, 4)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm text-gray-900 truncate">{doc.fileName}</p>
                              <p className="text-[10px] sm:text-xs text-gray-400">{formatFileSize(doc.fileSize)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 ml-9 sm:ml-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDownloadDoc(doc) }}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-navy hover:text-navy/70 hover:bg-navy/5 rounded-md sm:rounded-lg transition-colors"
                            >
                              Ladda ner
                            </button>
                            {!readOnly && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAnalyzeDoc(doc) }}
                                  disabled={analyzingDoc === doc.id}
                                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md sm:rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {analyzingDoc === doc.id && (
                                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                  )}
                                  {doc.analysis && (
                                    <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500" title="Analyserad" />
                                  )}
                                  <span className="hidden sm:inline">{analyzingDoc === doc.id ? 'Analyserar...' : doc.analysis ? 'Visa analys' : 'DD-coach'}</span>
                                  <span className="sm:hidden">{analyzingDoc === doc.id ? '...' : doc.analysis ? 'Analys' : 'AI'}</span>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id) }}
                                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md sm:rounded-lg transition-colors"
                                >
                                  <span className="hidden sm:inline">Ta bort</span>
                                  <span className="sm:hidden">×</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button - Full width on mobile */}
                  {!readOnly && (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        multiple
                        accept={req.docTypes?.map(t => `.${t}`).join(',') || '.pdf,.xlsx,.csv,.docx'}
                        className="hidden"
                        onChange={e => handleFileSelect(req.id, e.target.files)}
                        disabled={isUploading}
                      />
                      <span className={`flex sm:inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                        isUploading 
                          ? 'bg-gray-100 text-gray-400 cursor-wait' 
                          : 'bg-navy text-white hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/20 cursor-pointer'
                      }`}>
                        {isUploading && (
                          <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
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
