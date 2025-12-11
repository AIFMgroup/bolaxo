'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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

type Tab = 'documents' | 'sharing'

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

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const initDataRoom = async () => {
      try {
        setLoading(true)
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

  const loadDocuments = async (dataRoomId: string) => {
    const res = await fetch(`/api/dataroom/${dataRoomId}/documents`)
    if (res.ok) {
      const data = await res.json()
      setDataRoom(data.dataRoom)
      setFolders(data.folders || [])
      setDocuments(data.documents || [])
      setPermissions(data.permissions)
    }
  }

  const loadInvites = async (dataRoomId: string) => {
    const res = await fetch(`/api/dataroom/invite?dataRoomId=${dataRoomId}`)
    if (res.ok) {
      const data = await res.json()
      setInvites(data.invites || [])
    }
  }

  const handleUpload = async (files: FileList) => {
    if (!dataRoom || !permissions?.canUpload) return

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

        const { uploadUrl, documentId, versionId } = await urlRes.json()

        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })

        uploadedVersions.push({ documentId, versionId })
        setUploadProgress(Math.round(((i + 1) / files.length) * 100))
      }

      await loadDocuments(dataRoom.id)

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

    setDownloading(doc.id)
    try {
      const res = await fetch(
        `/api/dataroom/download-url?documentId=${doc.id}&versionId=${vid}`
      )
      const data = await res.json()

      if (res.ok && data.url) {
        window.open(data.url, '_blank')
      } else {
        alert(data.error || 'Kunde inte ladda ner fil')
      }
    } catch (err) {
      console.error('Download error:', err)
      alert('Kunde inte ladda ner fil')
    } finally {
      setDownloading(null)
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500">Laddar datarum...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center mb-4 animate-pulse-shadow">
          <span className="text-2xl text-rose-500">!</span>
        </div>
        <p className="text-gray-900 font-medium mb-2">Något gick fel</p>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 text-sm text-navy hover:bg-navy/5 rounded-xl transition-colors"
        >
          Försök igen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1.5 bg-gray-50 rounded-2xl">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'documents'
                ? 'bg-white text-gray-900 shadow-sm animate-pulse-shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Dokument
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'documents' ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'
            }`}>
              {documents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sharing')}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'sharing'
                ? 'bg-white text-gray-900 shadow-sm animate-pulse-shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Delning
            {pendingInvites.length > 0 && (
              <span className="ml-2 w-2 h-2 inline-block rounded-full bg-amber-500" />
            )}
          </button>
        </div>

        {activeTab === 'documents' && permissions?.canUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="px-6 py-3 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90 transition-all hover:shadow-lg hover:shadow-navy/20 animate-pulse-shadow-navy"
          >
            Ladda upp
          </button>
        )}
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 p-5 animate-pulse-shadow">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Mappar
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between ${
                    !selectedFolder
                      ? 'bg-navy text-white'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>Alla</span>
                  <span className={`text-xs font-medium ${!selectedFolder ? 'text-white/60' : 'text-gray-400'}`}>
                    {documents.length}
                  </span>
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between ${
                      selectedFolder === folder.id
                        ? 'bg-navy text-white'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="truncate">{folder.name}</span>
                    <span className={`text-xs font-medium ${selectedFolder === folder.id ? 'text-white/60' : 'text-gray-400'}`}>
                      {folder.documentCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-5 animate-pulse-shadow">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Filer</span>
                  <span className="font-semibold text-gray-900">{documents.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delade med</span>
                  <span className="font-semibold text-gray-900">{invites.filter(i => i.status === 'ACCEPTED').length}</span>
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
                className="w-full px-5 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 transition-all"
              />
            </div>

            {/* Drop zone / Document list */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`bg-white rounded-3xl border-2 transition-all ${
                isDragging
                  ? 'border-navy border-dashed bg-navy/5'
                  : 'border-gray-100'
              }`}
            >
              {isDragging ? (
                <div className="p-20 text-center">
                  <p className="text-navy font-medium text-lg">Släpp filer här</p>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl text-gray-300">+</span>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">
                    {searchQuery ? 'Inga dokument matchade sökningen' : 'Inga dokument ännu'}
                  </p>
                  <p className="text-gray-400 text-sm mb-6">Dra och släpp filer hit</p>
                  {permissions?.canUpload && !searchQuery && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90 transition-all"
                    >
                      Välj filer
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-5 hover:bg-gray-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold ${getFileTypeColor(doc.currentVersion?.mimeType)}`}>
                          {getFileTypeLabel(doc.currentVersion?.mimeType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                            {doc.versions && doc.versions.length > 1 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                v{doc.currentVersion?.version}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-gray-400">{doc.currentVersion?.fileName}</span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-sm text-gray-400">{formatFileSize(doc.currentVersion?.size || 0)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => loadAnalysis(doc)}
                          className="px-4 py-2 text-xs font-medium rounded-xl transition-all bg-violet-50 text-violet-700 hover:bg-violet-100"
                        >
                          DD-coach
                        </button>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {doc.versions && doc.versions.length > 1 && (
                            <button
                              onClick={() => {
                                setSelectedDoc(doc)
                                setShowVersions(true)
                              }}
                              className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Versioner
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloading === doc.id}
                            className="px-4 py-2 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90 transition-all disabled:opacity-50"
                          >
                            {downloading === doc.id ? 'Laddar...' : 'Ladda ner'}
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
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Invite form */}
          {permissions?.canInvite && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse-shadow">
              <h3 className="font-semibold text-gray-900 mb-1">Bjud in</h3>
              <p className="text-sm text-gray-500 mb-5">Dela datarum med köpare eller rådgivare</p>

              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="namn@företag.se"
                    className="w-full px-5 py-3 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 transition-all"
                  />
                </div>
                <div className="flex gap-1 p-1 bg-gray-50 rounded-xl">
                  <button
                    onClick={() => setInviteRole('VIEWER')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inviteRole === 'VIEWER'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Läsare
                  </button>
                  <button
                    onClick={() => setInviteRole('EDITOR')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inviteRole === 'EDITOR'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Redigerare
                  </button>
                </div>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail}
                  className="px-6 py-3 bg-navy text-white rounded-xl font-medium hover:bg-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? 'Skickar...' : 'Bjud in'}
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Inbjudna måste godkänna NDA innan åtkomst
              </p>
            </div>
          )}

          {/* Invites list */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse-shadow">
            <div className="px-6 py-5 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900">Inbjudna ({invites.length})</h3>
            </div>

            {invites.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gray-300">0</span>
                </div>
                <p className="text-gray-500 text-sm">Inga inbjudningar ännu</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {invites.map((inv) => (
                  <div key={inv.id} className="px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                        {inv.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{inv.email}</p>
                        <p className="text-sm text-gray-400">
                          {inv.role === 'VIEWER' ? 'Läsare' : 'Redigerare'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {inv.status === 'PENDING' && (
                        <span className="px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-medium rounded-full">
                          Väntande
                        </span>
                      )}
                      {inv.status === 'ACCEPTED' && (
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
                          Accepterad
                        </span>
                      )}
                      {inv.status === 'EXPIRED' && (
                        <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
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

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-pulse-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Ladda upp</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
              >
                ×
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-navy bg-navy/5'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">+</span>
              </div>
              <p className="text-gray-700 font-medium mb-1">
                Dra och släpp filer
              </p>
              <p className="text-sm text-gray-400">eller klicka för att välja</p>
            </div>

            {uploading && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Laddar upp...</span>
                  <span className="text-navy font-semibold">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-navy transition-all duration-300 rounded-full"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-pulse-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Versioner</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedDoc.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowVersions(false)
                  setSelectedDoc(null)
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedDoc.versions?.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
                    v.id === selectedDoc.currentVersion?.id
                      ? 'bg-navy/5 border border-navy/20'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      v.id === selectedDoc.currentVersion?.id
                        ? 'bg-navy text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {v.version}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{v.fileName}</p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(v.size)} • {new Date(v.createdAt).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(selectedDoc, v.id)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                  >
                    Ladda ner
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DD-Coach Analysis Modal */}
      {showAnalysis && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-pulse-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">DD-coach</h2>
                <p className="text-sm text-gray-500 mt-1">{showAnalysis.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowAnalysis(null)
                  setAnalysisData(null)
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
              >
                ×
              </button>
            </div>

            {loadingAnalysis ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Analyserar dokument...</p>
              </div>
            ) : analysisData ? (
              <div className="space-y-6">
                {/* Score */}
                {analysisData.score !== undefined && (
                  <div className="flex items-center gap-5">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-bold ${
                      analysisData.score >= 80 ? 'bg-emerald-50 text-emerald-600' :
                      analysisData.score >= 60 ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {analysisData.score}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-2">Kvalitetspoäng</p>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            analysisData.score >= 80 ? 'bg-emerald-500' :
                            analysisData.score >= 60 ? 'bg-amber-500' :
                            'bg-rose-500'
                          }`}
                          style={{ width: `${analysisData.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {analysisData.summary && (
                  <div className="p-5 bg-gray-50 rounded-2xl">
                    <p className="text-sm text-gray-700 leading-relaxed">{analysisData.summary}</p>
                  </div>
                )}

                {/* Findings */}
                {analysisData.findings && analysisData.findings.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Observationer</h4>
                    {analysisData.findings.map((finding, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-4 p-4 rounded-2xl ${
                          finding.type === 'success' ? 'bg-emerald-50' :
                          finding.type === 'warning' ? 'bg-amber-50' :
                          finding.type === 'error' ? 'bg-rose-50' :
                          'bg-blue-50'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          finding.type === 'success' ? 'bg-emerald-500' :
                          finding.type === 'warning' ? 'bg-amber-500' :
                          finding.type === 'error' ? 'bg-rose-500' :
                          'bg-blue-500'
                        }`} />
                        <p className={`text-sm leading-relaxed ${
                          finding.type === 'success' ? 'text-emerald-800' :
                          finding.type === 'warning' ? 'text-amber-800' :
                          finding.type === 'error' ? 'text-rose-800' :
                          'text-blue-800'
                        }`}>
                          {finding.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={rerunAnalysis}
                    className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Kör om analys
                  </button>
                  <button
                    onClick={() => {
                      setShowAnalysis(null)
                      setAnalysisData(null)
                    }}
                    className="flex-1 px-5 py-3 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90 transition-colors"
                  >
                    Stäng
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-gray-500 mb-6">Ingen analys tillgänglig</p>
                <button
                  onClick={rerunAnalysis}
                  className="px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
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

      <style jsx global>{`
        @keyframes pulse-shadow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.03);
          }
          50% {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          }
        }
        @keyframes pulse-shadow-navy {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(30, 58, 95, 0.15);
          }
          50% {
            box-shadow: 0 8px 30px rgba(30, 58, 95, 0.25);
          }
        }
        .animate-pulse-shadow {
          animation: pulse-shadow 3s ease-in-out infinite;
        }
        .animate-pulse-shadow-navy {
          animation: pulse-shadow-navy 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
