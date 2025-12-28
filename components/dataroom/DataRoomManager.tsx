'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

interface Folder {
  id: string
  name: string
  parentId: string | null
  documentCount: number
}

interface DocumentVersion {
  id: string
  version: number
  fileName: string
  size: number
  createdAt: string
}

interface AnalysisFinding {
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
}

interface DocumentAnalysis {
  status: 'pending' | 'analyzing' | 'ok' | 'warnings' | 'failed'
  summary?: string
  score?: number
  findings?: AnalysisFinding[]
}

interface Document {
  id: string
  title: string
  category: string | null
  requirementId: string | null
  visibility?: 'ALL' | 'OWNER_ONLY' | 'NDA_ONLY' | 'TRANSACTION_ONLY' | 'CUSTOM'
  downloadBlocked?: boolean
  watermarkRequired?: boolean
  canDownload?: boolean
  grants?: Array<{ id: string; userId?: string | null; email?: string | null; createdAt?: string }>
  folder: { id: string; name: string } | null
  currentVersion: {
    id: string
    version: number
    fileName: string
    size: number
    mimeType: string
    uploadedAt: string
    analysis?: DocumentAnalysis
  } | null
  versions?: DocumentVersion[]
  uploadedBy: string
  createdAt: string
}

interface Invite {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
  expiresAt: string
}

interface DataRoomInfo {
  id: string
  listingId: string
  listingName: string
  ndaRequired: boolean
}

interface Permissions {
  role: string
  canUpload: boolean
  canDelete: boolean
  canInvite: boolean
  canDownload: boolean
}

interface Props {
  listingId: string
  listingName?: string
}

type Tab = 'documents' | 'sharing' | 'qa' | 'audit'

interface AuditLog {
  id: string
  action: string
  actionLabel: string
  actorId: string | null
  actorName: string
  actorEmail: string | null
  targetType: string | null
  targetId: string | null
  meta: any
  createdAt: string
}

// LocalStorage key for demo documents
const DEMO_DATAROOM_DOCS_KEY = 'bolaxo_demo_dataroom_docs'
const DEMO_DATAROOM_FILES_KEY = 'bolaxo_demo_dataroom_files'

// Save docs to localStorage for demo persistence
const saveDemoDocsToStorage = (listingId: string, docs: Document[]) => {
  if (typeof window === 'undefined') return
  try {
    const allDocs = JSON.parse(localStorage.getItem(DEMO_DATAROOM_DOCS_KEY) || '{}')
    allDocs[listingId] = docs
    localStorage.setItem(DEMO_DATAROOM_DOCS_KEY, JSON.stringify(allDocs))
  } catch (e) {
    console.error('Error saving demo docs:', e)
  }
}

// Load docs from localStorage for demo
const loadDemoDocsFromStorage = (listingId: string): Document[] => {
  if (typeof window === 'undefined') return []
  try {
    const allDocs = JSON.parse(localStorage.getItem(DEMO_DATAROOM_DOCS_KEY) || '{}')
    return allDocs[listingId] || []
  } catch (e) {
    console.error('Error loading demo docs:', e)
    return []
  }
}

// Store file content for demo download
const storeFileForDemoDataroom = async (docId: string, file: File) => {
  if (typeof window === 'undefined') return
  try {
    const reader = new FileReader()
    reader.onload = () => {
      const fileData = {
        name: file.name,
        type: file.type,
        data: reader.result as string, // base64
      }
      const storedFiles = JSON.parse(localStorage.getItem(DEMO_DATAROOM_FILES_KEY) || '{}')
      storedFiles[docId] = fileData
      localStorage.setItem(DEMO_DATAROOM_FILES_KEY, JSON.stringify(storedFiles))
    }
    reader.readAsDataURL(file)
  } catch (e) {
    console.error('Error storing file for demo:', e)
  }
}

export default function DataRoomManager({ listingId, listingName }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataRoom, setDataRoom] = useState<DataRoomInfo | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [invites, setInvites] = useState<Invite[]>([])

  const [activeTab, setActiveTab] = useState<Tab>('documents')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [showVersions, setShowVersions] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER')
  const [showAnalysis, setShowAnalysis] = useState<Document | null>(null)
  const [analysisData, setAnalysisData] = useState<DocumentAnalysis | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  // Per-document policy editor (OWNER/EDITOR)
  const [policyVisibility, setPolicyVisibility] = useState<Document['visibility']>('NDA_ONLY')
  const [policyDownloadBlocked, setPolicyDownloadBlocked] = useState(false)
  const [policyWatermarkRequired, setPolicyWatermarkRequired] = useState(false)
  const [policyCustomEmails, setPolicyCustomEmails] = useState('')
  const [savingPolicy, setSavingPolicy] = useState(false)

  // Q&A (per object)
  const [qaLoading, setQaLoading] = useState(false)
  const [qaRole, setQaRole] = useState<'buyer' | 'seller' | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [newQuestionTitle, setNewQuestionTitle] = useState('')
  const [newQuestionCategory, setNewQuestionCategory] = useState('other')
  const [newQuestionPriority, setNewQuestionPriority] = useState('medium')
  const [newQuestionDescription, setNewQuestionDescription] = useState('')
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})

  // Audit log
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditFilter, setAuditFilter] = useState<string>('all')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if demo mode
  const isDemo = listingId?.startsWith('demo') || (typeof window !== 'undefined' && document.cookie.includes('bolaxo_user_id=demo'))

  // Save to localStorage whenever docs change (for demo persistence)
  useEffect(() => {
    if (isDemo && documents.length > 0) {
      saveDemoDocsToStorage(listingId, documents)
    }
  }, [documents, listingId, isDemo])

  useEffect(() => {
    const initDataRoom = async () => {
      try {
        setLoading(true)

        // Load stored documents first for demo mode
        if (isDemo) {
          const storedDocs = loadDemoDocsFromStorage(listingId)
          if (storedDocs.length > 0) {
            setDocuments(storedDocs)
          }
        }

        const initRes = await fetch('/api/dataroom/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        })

        if (!initRes.ok) {
          const data = await initRes.json()
          throw new Error(data.error || 'Kunde inte initiera datarum')
        }

        const initData = await initRes.json()
        const dataRoomId = initData.dataRoom?.id || initData.dataroomId

        if (!dataRoomId) {
          throw new Error('Ingen datarums-ID kunde hämtas')
        }

        await loadDocuments(dataRoomId)
        await loadInvites(dataRoomId)
      } catch (err: any) {
        console.error('Error initializing dataroom:', err)
        setError(err.message || 'Kunde inte ladda datarum')
      } finally {
        setLoading(false)
      }
    }

    if (listingId) {
      initDataRoom()
    }
  }, [listingId])

  useEffect(() => {
    if (!showVersions || !selectedDoc) return
    setPolicyVisibility(selectedDoc.visibility || 'NDA_ONLY')
    setPolicyDownloadBlocked(!!selectedDoc.downloadBlocked)
    setPolicyWatermarkRequired(!!selectedDoc.watermarkRequired)
    const emails = (selectedDoc.grants || [])
      .map((g) => (g.email || '').trim())
      .filter(Boolean)
      .join(', ')
    setPolicyCustomEmails(emails)
  }, [showVersions, selectedDoc])

  useEffect(() => {
    if (activeTab !== 'qa') return
    ;(async () => {
      await loadQa()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'audit' || !dataRoom) return
    ;(async () => {
      await loadAuditLogs()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dataRoom?.id])

  const loadDocuments = async (dataRoomId: string) => {
    const res = await fetch(`/api/dataroom/${dataRoomId}/documents`)
    if (res.ok) {
      const data = await res.json()
      setDataRoom(data.dataRoom)
      setFolders(data.folders || [])
      setPermissions(data.permissions)
      
      // For demo mode, merge API docs with stored docs
      const apiDocs = data.documents || []
      const storedDocs = loadDemoDocsFromStorage(listingId)
      
      if (storedDocs.length > 0) {
        const existingIds = new Set(apiDocs.map((d: Document) => d.id))
        const mergedDocs = [
          ...apiDocs,
          ...storedDocs.filter((d: Document) => !existingIds.has(d.id))
        ]
        setDocuments(mergedDocs)
      } else {
        setDocuments(apiDocs)
      }
    }
  }

  const loadInvites = async (dataRoomId: string) => {
    const res = await fetch(`/api/dataroom/invite?dataRoomId=${dataRoomId}`)
    if (res.ok) {
      const data = await res.json()
      setInvites(data.invites || [])
    }
  }

  const createFolder = async (parentId: string | null) => {
    if (!dataRoom) return
    if (!permissions?.canUpload) return
    const name = window.prompt('Namn på ny mapp?')
    if (!name) return

    try {
      const res = await fetch('/api/dataroom/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataRoomId: dataRoom.id,
          name,
          parentId,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || 'Kunde inte skapa mapp')
        return
      }
      await loadDocuments(dataRoom.id)
    } catch (err) {
      console.error('Create folder error:', err)
      alert('Kunde inte skapa mapp')
    }
  }

  const saveDocPolicy = async () => {
    if (!dataRoom || !selectedDoc) return
    if (!(permissions?.role === 'OWNER' || permissions?.role === 'EDITOR')) return

    setSavingPolicy(true)
    try {
      const grantEmails =
        policyVisibility === 'CUSTOM'
          ? policyCustomEmails
              .split(',')
              .map((e) => e.trim().toLowerCase())
              .filter(Boolean)
          : []

      const res = await fetch(`/api/dataroom/documents/${selectedDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visibility: policyVisibility,
          downloadBlocked: policyDownloadBlocked,
          watermarkRequired: policyWatermarkRequired,
          grantEmails,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || 'Kunde inte spara inställningar')
        return
      }
      await loadDocuments(dataRoom.id)
    } finally {
      setSavingPolicy(false)
    }
  }

  const loadQa = async () => {
    setQaLoading(true)
    try {
      const res = await fetch(`/api/questions?listingId=${encodeURIComponent(listingId)}`, {
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setQaRole(null)
        setQuestions([])
        return
      }
      setQaRole(data.role || null)
      setQuestions(Array.isArray(data.questions) ? data.questions : [])
    } finally {
      setQaLoading(false)
    }
  }

  const loadAuditLogs = async () => {
    if (!dataRoom) return
    setAuditLoading(true)
    try {
      const url = new URL('/api/dataroom/audit', window.location.origin)
      url.searchParams.set('dataRoomId', dataRoom.id)
      if (auditFilter !== 'all') url.searchParams.set('action', auditFilter)
      
      const res = await fetch(url.toString(), { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setAuditLogs(Array.isArray(data.logs) ? data.logs : [])
      } else {
        setAuditLogs([])
      }
    } finally {
      setAuditLoading(false)
    }
  }

  const submitQuestion = async () => {
    if (!newQuestionTitle || !newQuestionDescription) return
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        listingId,
        title: newQuestionTitle,
        description: newQuestionDescription,
        category: newQuestionCategory,
        priority: newQuestionPriority,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'Kunde inte skapa fråga')
      return
    }
    setNewQuestionTitle('')
    setNewQuestionDescription('')
    setNewQuestionCategory('other')
    setNewQuestionPriority('medium')
    await loadQa()
  }

  const submitAnswer = async (questionId: string) => {
    const content = (answerDrafts[questionId] || '').trim()
    if (!content) return
    const res = await fetch(`/api/questions/${questionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'Kunde inte svara')
      return
    }
    setAnswerDrafts((prev) => ({ ...prev, [questionId]: '' }))
    await loadQa()
  }

  const handleUpload = async (files: FileList) => {
    if (!dataRoom) return
    // Allow demo uploads even without canUpload permission
    const isDemo = dataRoom.id.startsWith('demo') || dataRoom.listingId.startsWith('demo')
    if (!isDemo && !permissions?.canUpload) return

    setUploading(true)
    setUploadProgress(0)
    setShowUpload(false)

    const uploadedVersions: { documentId: string; versionId: string }[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(Math.round(((i + 0.5) / files.length) * 100))

        const urlRes = await fetch('/api/dataroom/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: dataRoom.listingId,
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
            folderId: selectedFolder,
          }),
        })

        if (!urlRes.ok) {
          const data = await urlRes.json()
          throw new Error(data.error || 'Kunde inte få upload-URL')
        }

        const { uploadUrl, documentId, versionId, demo } = await urlRes.json()

        // For demo mode, just simulate the upload
        if (demo) {
          // Store file content for later download
          await storeFileForDemoDataroom(documentId, file)
          
          // Add mock document to local state
          const mockDoc: Document = {
            id: documentId,
            title: file.name,
            category: null,
            requirementId: null,
            folder: selectedFolder ? folders.find(f => f.id === selectedFolder) ? { id: selectedFolder, name: folders.find(f => f.id === selectedFolder)!.name } : null : null,
            currentVersion: {
              id: versionId,
              version: 1,
              fileName: file.name,
              size: file.size,
              mimeType: file.type || 'application/octet-stream',
              uploadedAt: new Date().toISOString(),
            },
            versions: [{
              id: versionId,
              version: 1,
              fileName: file.name,
              size: file.size,
              createdAt: new Date().toISOString(),
            }],
            uploadedBy: 'Demo User',
            createdAt: new Date().toISOString(),
          }
          setDocuments(prev => [mockDoc, ...prev])
        } else {
          // Real upload to S3
          await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          })
        }

        uploadedVersions.push({ documentId, versionId })
        setUploadProgress(Math.round(((i + 1) / files.length) * 100))
      }

      // Only reload from server if not demo
      if (!isDemo) {
        await loadDocuments(dataRoom.id)
      }

      for (const { versionId } of uploadedVersions) {
        triggerAnalysis(versionId).catch(console.error)
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      alert(err.message || 'Uppladdning misslyckades')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const triggerAnalysis = async (documentVersionId: string) => {
    if (!dataRoom) return
    try {
      await fetch('/api/dataroom/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentVersionId,
          dataRoomId: dataRoom.id,
        }),
      })
    } catch (err) {
      console.error('Failed to trigger analysis:', err)
    }
  }

  const loadAnalysis = async (doc: Document) => {
    setShowAnalysis(doc)
    setLoadingAnalysis(true)
    setAnalysisData(null)

    const versionId = doc.currentVersion?.id
    if (!versionId) {
      setAnalysisData({ status: 'pending', summary: 'Ingen version tillgänglig' })
      setLoadingAnalysis(false)
      return
    }

    try {
      const res = await fetch(`/api/dataroom/analyze?documentVersionId=${versionId}`)
      if (res.ok) {
        const data = await res.json()
        setAnalysisData(data)
      } else {
        setAnalysisData({ status: 'failed', summary: 'Kunde inte hämta analys' })
      }
    } catch (err) {
      setAnalysisData({ status: 'failed', summary: 'Nätverksfel' })
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const rerunAnalysis = async () => {
    if (!showAnalysis || !dataRoom) return
    const versionId = showAnalysis.currentVersion?.id
    if (!versionId) return

    setLoadingAnalysis(true)
    try {
      await fetch('/api/dataroom/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentVersionId: versionId,
          dataRoomId: dataRoom.id,
        }),
      })
      setTimeout(() => loadAnalysis(showAnalysis), 2000)
    } catch (err) {
      setLoadingAnalysis(false)
    }
  }

  const handleDownload = async (doc: Document, versionId?: string) => {
    if (!dataRoom) return

    const vid = versionId || doc.currentVersion?.id
    if (!vid) return

    if (doc.canDownload === false) {
      alert('Nedladdning är blockerad för detta dokument')
      return
    }

    setDownloading(doc.id)
    try {
      // First, check localStorage for demo files
      const storedFiles = JSON.parse(localStorage.getItem(DEMO_DATAROOM_FILES_KEY) || '{}')
      const storedFile = storedFiles[doc.id]
      
      if (storedFile) {
        // Download from stored data
        const link = document.createElement('a')
        link.href = storedFile.data
        link.download = storedFile.name || doc.currentVersion?.fileName || 'dokument'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }

      // Fallback: try API download
      const res = await fetch(
        `/api/dataroom/download-url?documentId=${doc.id}&versionId=${vid}`
      )
      const data = await res.json()

      if (res.ok && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
      } else {
        // Demo fallback: create a sample text file
        const blob = new Blob([`Demo dokument: ${doc.title}\n\nDetta är en demo-fil.`], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = (doc.currentVersion?.fileName || doc.title).replace(/\.[^.]+$/, '.txt')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Download error:', err)
      alert('Kunde inte ladda ner fil')
    } finally {
      setDownloading(null)
    }
  }

  const handleView = async (doc: Document, versionId?: string) => {
    if (!dataRoom) return
    const vid = versionId || doc.currentVersion?.id
    if (!vid) return

    try {
      const res = await fetch(`/api/dataroom/view-url?documentId=${doc.id}&versionId=${vid}`)
      const data = await res.json()
      if (res.ok && data.viewUrl) {
        window.open(data.viewUrl, '_blank')
      } else {
        alert(data.error || 'Kunde inte visa dokument')
      }
    } catch (err) {
      console.error('View error:', err)
      alert('Kunde inte visa dokument')
    }
  }

  const handleInvite = async () => {
    if (!dataRoom || !inviteEmail) return

    setInviting(true)
    try {
      const res = await fetch('/api/dataroom/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataRoomId: dataRoom.id,
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      if (res.ok) {
        setInviteEmail('')
        await loadInvites(dataRoom.id)
      } else {
        const data = await res.json()
        alert(data.error || 'Kunde inte skicka inbjudan')
      }
    } catch (err) {
      console.error('Invite error:', err)
      alert('Kunde inte skicka inbjudan')
    } finally {
      setInviting(false)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files)
      }
    },
    [dataRoom, selectedFolder]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileTypeLabel = (mimeType?: string) => {
    if (!mimeType) return 'FIL'
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'XLS'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOC'
    if (mimeType.includes('image')) return 'IMG'
    return 'FIL'
  }

  const getFileTypeColor = (mimeType?: string) => {
    if (!mimeType) return 'bg-gray-100 text-gray-600'
    if (mimeType.includes('pdf')) return 'bg-rose-50 text-rose-600'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'bg-emerald-50 text-emerald-600'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'bg-blue-50 text-blue-600'
    if (mimeType.includes('image')) return 'bg-purple-50 text-purple-600'
    return 'bg-gray-100 text-gray-600'
  }

  const filteredDocs = documents
    .filter((d) => !selectedFolder || d.folder?.id === selectedFolder)
    .filter((d) =>
      !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.currentVersion?.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const pendingInvites = invites.filter((i) => i.status === 'PENDING')

  const folderDepthById = useMemo(() => {
    const byId = new Map<string, Folder>()
    folders.forEach((f) => byId.set(f.id, f))
    const cache = new Map<string, number>()
    const depth = (id: string, seen = new Set<string>()): number => {
      if (cache.has(id)) return cache.get(id)!
      const f = byId.get(id)
      if (!f || !f.parentId) {
        cache.set(id, 0)
        return 0
      }
      if (seen.has(id)) {
        cache.set(id, 0)
        return 0
      }
      seen.add(id)
      const d = 1 + depth(f.parentId, seen)
      cache.set(id, d)
      return d
    }
    folders.forEach((f) => depth(f.id))
    return cache
  }, [folders])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary-navy border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-500 text-sm">Laddar datarum...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center mb-3">
          <span className="text-lg text-red-500">!</span>
        </div>
        <p className="text-gray-900 font-medium text-sm mb-1">Något gick fel</p>
        <p className="text-gray-500 text-xs mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm text-primary-navy hover:bg-gray-100 rounded-lg transition-colors"
        >
          Försök igen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'documents'
                ? 'bg-primary-navy text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Dokument
            <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
              activeTab === 'documents' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {documents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sharing')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'sharing'
                ? 'bg-primary-navy text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Delning
            {pendingInvites.length > 0 && (
              <span className="ml-1.5 w-2 h-2 inline-block rounded-full bg-amber-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('qa')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'qa'
                ? 'bg-primary-navy text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Q&amp;A
          </button>
          {permissions?.role === 'OWNER' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'audit'
                  ? 'bg-primary-navy text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Logg
            </button>
          )}
        </div>

        {activeTab === 'documents' && permissions?.canUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-primary-navy text-white rounded-lg text-sm font-medium hover:bg-primary-navy/90 transition-colors"
          >
            Ladda upp
          </button>
        )}
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Mappar
                </h3>
                {permissions?.canUpload && (
                  <button
                    onClick={() => createFolder(selectedFolder)}
                    className="text-xs font-medium text-primary-navy hover:underline"
                    title="Skapa mapp"
                  >
                    + Ny
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    !selectedFolder
                      ? 'bg-primary-navy text-white'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>Alla filer</span>
                  <span className={`text-xs ${!selectedFolder ? 'text-white/70' : 'text-gray-400'}`}>
                    {documents.length}
                  </span>
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                      selectedFolder === folder.id
                        ? 'bg-primary-navy text-white'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span
                      className="truncate"
                      style={{ paddingLeft: `${(folderDepthById.get(folder.id) || 0) * 10}px` }}
                    >
                      {folder.name}
                    </span>
                    <span className={`text-xs ${selectedFolder === folder.id ? 'text-white/70' : 'text-gray-400'}`}>
                      {folder.documentCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Översikt
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Filer</span>
                  <span className="font-medium text-gray-900">{documents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delade med</span>
                  <span className="font-medium text-gray-900">{invites.filter(i => i.status === 'ACCEPTED').length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-4">
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Sök dokument..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-navy/20 focus:border-primary-navy/40 transition-all"
              />
            </div>

            {/* Drop zone / Document list */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`bg-white rounded-lg border transition-all ${
                isDragging
                  ? 'border-primary-navy border-dashed bg-primary-navy/5'
                  : 'border-gray-200'
              }`}
            >
              {isDragging ? (
                <div className="p-16 text-center">
                  <p className="text-primary-navy font-medium">Släpp filer här</p>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl text-gray-300">+</span>
                  </div>
                  <p className="text-gray-900 font-medium text-sm mb-1">
                    {searchQuery ? 'Inga dokument matchade sökningen' : 'Inga dokument ännu'}
                  </p>
                  <p className="text-gray-500 text-xs mb-4">Dra och släpp filer hit</p>
                  {permissions?.canUpload && !searchQuery && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-primary-navy text-white rounded-lg text-sm font-medium hover:bg-primary-navy/90 transition-colors"
                    >
                      Välj filer
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${getFileTypeColor(doc.currentVersion?.mimeType)}`}>
                          {getFileTypeLabel(doc.currentVersion?.mimeType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 text-sm truncate">{doc.title}</h3>
                            {doc.versions && doc.versions.length > 1 && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                                v{doc.currentVersion?.version}
                              </span>
                            )}
                            {/* Analysis status indicator */}
                            {doc.currentVersion?.analysis && (
                              <button
                                onClick={() => loadAnalysis(doc)}
                                className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                                  doc.currentVersion.analysis.status === 'analyzing' || doc.currentVersion.analysis.status === 'pending'
                                    ? 'bg-blue-50 text-blue-600'
                                    : doc.currentVersion.analysis.status === 'failed'
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : doc.currentVersion.analysis.score !== undefined && doc.currentVersion.analysis.score >= 80
                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    : doc.currentVersion.analysis.score !== undefined && doc.currentVersion.analysis.score >= 60
                                    ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                    : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
                                }`}
                              >
                                {doc.currentVersion.analysis.status === 'analyzing' || doc.currentVersion.analysis.status === 'pending' ? (
                                  'Analyserar...'
                                ) : doc.currentVersion.analysis.status === 'failed' ? (
                                  'Misslyckad'
                                ) : (
                                  doc.currentVersion.analysis.score !== undefined 
                                    ? `${doc.currentVersion.analysis.score}/100` 
                                    : 'OK'
                                )}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span className="truncate">{doc.currentVersion?.fileName}</span>
                            <span>•</span>
                            <span>{formatFileSize(doc.currentVersion?.size || 0)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => loadAnalysis(doc)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                          >
                            DD-coach
                          </button>
                          {doc.versions && doc.versions.length > 1 && (
                            <button
                              onClick={() => {
                                setSelectedDoc(doc)
                                setShowVersions(true)
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
                            >
                              Versioner
                            </button>
                          )}
                          <button
                            onClick={() => handleView(doc)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Visa
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloading === doc.id || doc.canDownload === false}
                            className="px-3 py-1.5 bg-primary-navy text-white rounded-lg text-xs font-medium hover:bg-primary-navy/90 transition-colors disabled:opacity-50"
                          >
                            {downloading === doc.id ? '...' : doc.canDownload === false ? 'Blockerad' : 'Ladda ner'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sharing Tab */}
      {activeTab === 'sharing' && (
        <div className="max-w-xl mx-auto space-y-5">
          {/* Invite form */}
          {permissions?.canInvite && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Bjud in till datarummet</h3>
              <p className="text-xs text-gray-500 mb-4">Dela med köpare eller rådgivare</p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="namn@företag.se"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-navy/20 focus:border-primary-navy/40"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'VIEWER' | 'EDITOR')}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="VIEWER">Läsare</option>
                  <option value="EDITOR">Redigerare</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail}
                  className="px-4 py-2 bg-primary-navy text-white rounded-lg text-sm font-medium hover:bg-primary-navy/90 transition-colors disabled:opacity-50"
                >
                  {inviting ? 'Skickar...' : 'Bjud in'}
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Inbjudna måste godkänna NDA innan de får åtkomst
              </p>
            </div>
          )}

          {/* Invites list */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="font-medium text-gray-900 text-sm">Inbjudna ({invites.length})</h3>
            </div>

            {invites.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-gray-500 text-sm">Inga inbjudningar ännu</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {invites.map((inv) => (
                  <div key={inv.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                        {inv.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{inv.email}</p>
                        <p className="text-xs text-gray-500">
                          {inv.role === 'VIEWER' ? 'Läsare' : 'Redigerare'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {inv.status === 'PENDING' && (
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded">
                          Väntande
                        </span>
                      )}
                      {inv.status === 'ACCEPTED' && (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded">
                          Accepterad
                        </span>
                      )}
                      {inv.status === 'EXPIRED' && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                          Utgången
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Q&A Tab */}
      {activeTab === 'qa' && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Frågor &amp; Svar</h3>
                <p className="text-xs text-gray-500">Strukturerade frågor för due diligence</p>
              </div>
              <a
                href={`/api/questions/export-pdf?listingId=${encodeURIComponent(listingId)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-medium text-primary-navy hover:bg-gray-100 rounded-lg transition-colors"
              >
                Exportera PDF
              </a>
            </div>

            {qaLoading ? (
              <div className="py-8 text-center text-sm text-gray-500">Laddar…</div>
            ) : qaRole === null ? (
              <div className="py-6 text-center">
                <p className="text-sm text-gray-600">
                  Du har inte åtkomst till Q&amp;A ännu.
                </p>
                <p className="text-xs text-gray-500 mt-1">Kräver godkänd NDA eller transaktion.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {qaRole === 'buyer' && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-gray-900">Ställ en fråga</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input
                        value={newQuestionTitle}
                        onChange={(e) => setNewQuestionTitle(e.target.value)}
                        placeholder="Titel på frågan"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                      />
                      <div className="flex gap-2">
                        <select
                          value={newQuestionCategory}
                          onChange={(e) => setNewQuestionCategory(e.target.value)}
                          className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                          <option value="financial">Finansiellt</option>
                          <option value="legal">Juridiskt</option>
                          <option value="commercial">Kommersiellt</option>
                          <option value="it">IT/Teknik</option>
                          <option value="hr">Personal</option>
                          <option value="other">Övrigt</option>
                        </select>
                        <select
                          value={newQuestionPriority}
                          onChange={(e) => setNewQuestionPriority(e.target.value)}
                          className="px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                          <option value="low">Låg</option>
                          <option value="medium">Medium</option>
                          <option value="high">Hög</option>
                          <option value="critical">Kritisk</option>
                        </select>
                      </div>
                    </div>
                    <textarea
                      value={newQuestionDescription}
                      onChange={(e) => setNewQuestionDescription(e.target.value)}
                      placeholder="Beskriv din fråga i detalj..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white min-h-[100px]"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={submitQuestion}
                        className="px-4 py-2 bg-primary-navy text-white rounded-lg text-sm font-medium hover:bg-primary-navy/90 transition-colors disabled:opacity-50"
                        disabled={!newQuestionTitle || !newQuestionDescription}
                      >
                        Skicka fråga
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {questions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Inga frågor ännu.</p>
                  ) : (
                    questions.map((q) => (
                      <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{q.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded">{q.category}</span>
                              <span className={`px-1.5 py-0.5 rounded ${
                                q.priority === 'critical' ? 'bg-red-50 text-red-600' :
                                q.priority === 'high' ? 'bg-amber-50 text-amber-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>{q.priority}</span>
                              <span>{q.status}</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {new Date(q.createdAt).toLocaleDateString('sv-SE')}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{q.description}</p>

                        {(q.answers || []).length > 0 && (
                          <div className="mt-3 space-y-2">
                            {(q.answers || []).map((a: any) => (
                              <div key={a.id} className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                                <p className="text-xs text-emerald-700 font-medium mb-1">Svar från säljaren</p>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{a.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {qaRole === 'seller' && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <textarea
                              value={answerDrafts[q.id] || ''}
                              onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder="Skriv ditt svar..."
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white min-h-[80px]"
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => submitAnswer(q.id)}
                                disabled={!(answerDrafts[q.id] || '').trim()}
                                className="px-4 py-2 bg-primary-navy text-white rounded-lg text-sm font-medium hover:bg-primary-navy/90 transition-colors disabled:opacity-50"
                              >
                                Skicka svar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && permissions?.role === 'OWNER' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Aktivitetslogg</h3>
                <p className="text-xs text-gray-500">Spåra alla händelser i datarummet</p>
              </div>
              <select
                value={auditFilter}
                onChange={(e) => {
                  setAuditFilter(e.target.value)
                  // Reload with new filter
                  setTimeout(loadAuditLogs, 0)
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="all">Alla händelser</option>
                <option value="view">Visningar</option>
                <option value="download">Nedladdningar</option>
                <option value="upload">Uppladdningar</option>
                <option value="invite">Inbjudningar</option>
                <option value="policy_change">Policyändringar</option>
              </select>
            </div>

            {auditLoading ? (
              <div className="py-8 text-center text-sm text-gray-500">Laddar logg…</div>
            ) : auditLogs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">Inga logghändelser ännu</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      log.action === 'download' ? 'bg-blue-100 text-blue-700' :
                      log.action === 'view' ? 'bg-gray-100 text-gray-600' :
                      log.action === 'upload' ? 'bg-emerald-100 text-emerald-700' :
                      log.action === 'delete' ? 'bg-red-100 text-red-700' :
                      log.action === 'invite' ? 'bg-purple-100 text-purple-700' :
                      log.action === 'policy_change' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {log.action === 'download' ? '↓' :
                       log.action === 'view' ? '👁' :
                       log.action === 'upload' ? '↑' :
                       log.action === 'delete' ? '✕' :
                       log.action === 'invite' ? '✉' :
                       log.action === 'policy_change' ? '⚙' :
                       '•'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{log.actionLabel}</p>
                        {log.meta?.fileName && (
                          <span className="text-xs text-gray-500 truncate max-w-[200px]">
                            {log.meta.fileName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        <span>{log.actorName}</span>
                        <span>•</span>
                        <span>{new Date(log.createdAt).toLocaleString('sv-SE', { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Ladda upp dokument</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              >
                ×
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-primary-navy bg-primary-navy/5'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-xl text-gray-400">+</span>
              </div>
              <p className="text-gray-700 font-medium text-sm mb-1">
                Dra och släpp filer här
              </p>
              <p className="text-xs text-gray-400">eller klicka för att välja</p>
            </div>

            {uploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-600">Laddar upp...</span>
                  <span className="text-primary-navy font-semibold">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-navy transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Versions Modal */}
      {showVersions && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Dokumentversioner</h2>
                <p className="text-sm text-gray-500 truncate">{selectedDoc.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowVersions(false)
                  setSelectedDoc(null)
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              >
                ×
              </button>
            </div>

            {(permissions?.role === 'OWNER' || permissions?.role === 'EDITOR') && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Åtkomstinställningar</p>
                    <p className="text-xs text-gray-500 mt-0.5">Styr vem som kan se och ladda ner detta dokument</p>
                  </div>
                  <button
                    onClick={saveDocPolicy}
                    disabled={savingPolicy || (policyVisibility === 'CUSTOM' && !policyCustomEmails.trim())}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-navy text-white disabled:opacity-50"
                  >
                    {savingPolicy ? 'Sparar…' : 'Spara'}
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Vem kan se dokumentet?
                    </label>
                    <select
                      value={policyVisibility || 'NDA_ONLY'}
                      onChange={(e) => setPolicyVisibility(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="NDA_ONLY">🔒 Endast köpare med signerad NDA</option>
                      <option value="TRANSACTION_ONLY">💼 Endast köpare i aktiv transaktion</option>
                      <option value="ALL">👥 Alla som har åtkomst till datarummet</option>
                      <option value="CUSTOM">✉️ Endast specifika e-postadresser</option>
                      <option value="OWNER_ONLY">🔐 Endast jag (ägaren)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {policyVisibility === 'NDA_ONLY' && 'Dokumentet visas bara för köpare som har godkänt och signerat NDA.'}
                      {policyVisibility === 'TRANSACTION_ONLY' && 'Dokumentet visas endast för köpare som har inlett en transaktion.'}
                      {policyVisibility === 'ALL' && 'Alla inbjudna till datarummet kan se dokumentet.'}
                      {policyVisibility === 'CUSTOM' && 'Ange specifika e-postadresser som ska ha åtkomst.'}
                      {policyVisibility === 'OWNER_ONLY' && 'Endast du kan se dokumentet. Ingen annan har åtkomst.'}
                    </p>
                  </div>

                  {policyVisibility === 'CUSTOM' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tillåtna e-postadresser
                      </label>
                      <input
                        value={policyCustomEmails}
                        onChange={(e) => setPolicyCustomEmails(e.target.value)}
                        placeholder="anna@bolag.se, erik@bolag.se"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separera med komma. Endast dessa personer kan se dokumentet.
                      </p>
                      {policyVisibility === 'CUSTOM' && !policyCustomEmails.trim() && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ Du måste ange minst en e-postadress för att kunna spara.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-200 space-y-2">
                    <p className="text-xs font-medium text-gray-700">Extra skydd</p>
                    <label className="flex items-start gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={policyDownloadBlocked}
                        onChange={(e) => setPolicyDownloadBlocked(e.target.checked)}
                        className="rounded mt-0.5"
                      />
                      <span>
                        <span className="font-medium">Blockera nedladdning</span>
                        <span className="block text-gray-500">Användare kan se dokumentet men inte ladda ner det.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={policyWatermarkRequired}
                        onChange={(e) => setPolicyWatermarkRequired(e.target.checked)}
                        className="rounded mt-0.5"
                      />
                      <span>
                        <span className="font-medium">Lägg till vattenstämpel</span>
                        <span className="block text-gray-500">Dokumentet märks med mottagarens e-post vid visning/nedladdning.</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedDoc.versions?.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    v.id === selectedDoc.currentVersion?.id
                      ? 'bg-primary-navy/5 border border-primary-navy/20'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      v.id === selectedDoc.currentVersion?.id
                        ? 'bg-primary-navy text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      v{v.version}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">{v.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(v.size)} • {new Date(v.createdAt).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleView(selectedDoc, v.id)}
                      className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-white rounded transition-colors"
                    >
                      Visa
                    </button>
                    <button
                      onClick={() => handleDownload(selectedDoc, v.id)}
                      disabled={selectedDoc.canDownload === false}
                      className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-white rounded transition-colors disabled:opacity-50"
                    >
                      {selectedDoc.canDownload === false ? 'Blockerad' : 'Ladda ner'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DD-Coach Analysis Modal */}
      {showAnalysis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">DD-coach</h2>
                <p className="text-sm text-gray-500 truncate">{showAnalysis.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowAnalysis(null)
                  setAnalysisData(null)
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              >
                ×
              </button>
            </div>

            {loadingAnalysis ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-primary-navy border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">Analyserar dokument...</p>
              </div>
            ) : analysisData ? (
              <div className="space-y-4">
                {/* Score */}
                {analysisData.score !== undefined && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold ${
                      analysisData.score >= 80 ? 'bg-emerald-100 text-emerald-600' :
                      analysisData.score >= 60 ? 'bg-amber-100 text-amber-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {analysisData.score}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1.5">Kvalitetspoäng</p>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            analysisData.score >= 80 ? 'bg-emerald-500' :
                            analysisData.score >= 60 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${analysisData.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {analysisData.summary && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 leading-relaxed">{analysisData.summary}</p>
                  </div>
                )}

                {/* Findings */}
                {analysisData.findings && analysisData.findings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Observationer</h4>
                    {analysisData.findings.map((finding, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                          finding.type === 'success' ? 'bg-emerald-50 text-emerald-800' :
                          finding.type === 'warning' ? 'bg-amber-50 text-amber-800' :
                          finding.type === 'error' ? 'bg-red-50 text-red-800' :
                          'bg-blue-50 text-blue-800'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          finding.type === 'success' ? 'bg-emerald-500' :
                          finding.type === 'warning' ? 'bg-amber-500' :
                          finding.type === 'error' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`} />
                        <p>{finding.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={rerunAnalysis}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Kör om
                  </button>
                  <button
                    onClick={async () => {
                      if (!showAnalysis?.currentVersion?.id) return
                      try {
                        const res = await fetch(`/api/dataroom/analyze/export-pdf?versionId=${showAnalysis.currentVersion.id}`)
                        if (res.ok) {
                          const blob = await res.blob()
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `DD-Analys_${showAnalysis.title}.pdf`
                          document.body.appendChild(a)
                          a.click()
                          window.URL.revokeObjectURL(url)
                          document.body.removeChild(a)
                        }
                      } catch (err) {
                        console.error('PDF export error:', err)
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                  >
                    Ladda ner PDF
                  </button>
                  <button
                    onClick={() => {
                      setShowAnalysis(null)
                      setAnalysisData(null)
                    }}
                    className="px-4 py-2 bg-primary-navy text-white rounded-lg text-sm font-medium hover:bg-primary-navy/90 transition-colors"
                  >
                    Stäng
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-500 mb-4">Ingen analys tillgänglig</p>
                <button
                  onClick={rerunAnalysis}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                >
                  Starta analys
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => e.target.files && handleUpload(e.target.files)}
      />
    </div>
  )
}
