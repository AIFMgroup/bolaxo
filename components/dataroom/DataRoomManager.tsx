'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FolderOpen, FileText, Upload, Download, Trash2,
  Plus, Users, Share2, Clock, Eye,
  CheckCircle, AlertCircle, Loader2, X, History, Shield, Mail,
  Search, Grid3X3, List, ChevronRight, Sparkles, UserPlus
} from 'lucide-react'

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
type ViewStyle = 'grid' | 'list'

export default function DataRoomManager({ listingId, listingName }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataRoom, setDataRoom] = useState<DataRoomInfo | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [invites, setInvites] = useState<Invite[]>([])

  const [activeTab, setActiveTab] = useState<Tab>('documents')
  const [viewStyle, setViewStyle] = useState<ViewStyle>('list')
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

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(Math.round(((i + 0.5) / files.length) * 100))

        const urlRes = await fetch('/api/dataroom/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataRoomId: dataRoom.id,
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

        const { url } = await urlRes.json()

        await fetch(url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })

        setUploadProgress(Math.round(((i + 1) / files.length) * 100))
      }

      await loadDocuments(dataRoom.id)
    } catch (err: any) {
      console.error('Upload error:', err)
      alert(err.message || 'Uppladdning misslyckades')
    } finally {
      setUploading(false)
      setUploadProgress(0)
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

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return 'text-gray-400'
    if (mimeType.includes('pdf')) return 'text-red-500'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'text-green-600'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'text-blue-600'
    if (mimeType.includes('image')) return 'text-purple-500'
    return 'text-gray-400'
  }

  const filteredDocs = documents
    .filter((d) => !selectedFolder || d.folder?.id === selectedFolder)
    .filter((d) =>
      !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.currentVersion?.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const acceptedInvites = invites.filter((i) => i.status === 'ACCEPTED')
  const pendingInvites = invites.filter((i) => i.status === 'PENDING')

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy/10 to-coral/10 flex items-center justify-center mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-navy" />
        </div>
        <p className="text-gray-500">Laddar datarum...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-gray-900 font-medium mb-2">Något gick fel</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm text-navy hover:bg-navy/5 rounded-lg transition-colors"
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
        <div className="flex gap-1 p-1 bg-gray-100/80 rounded-xl">
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'documents'
                ? 'bg-white text-navy shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Dokument
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'documents' ? 'bg-navy/10 text-navy' : 'bg-gray-200 text-gray-600'
            }`}>
              {documents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sharing')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'sharing'
                ? 'bg-white text-navy shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Delning
            {pendingInvites.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
            )}
          </button>
        </div>

        {activeTab === 'documents' && permissions?.canUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90 transition-all hover:shadow-lg hover:shadow-navy/20"
          >
            <Upload className="w-4 h-4" />
            Ladda upp
          </button>
        )}
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Folders */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Mappar
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between group ${
                    !selectedFolder
                      ? 'bg-navy text-white'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className={`w-4 h-4 ${!selectedFolder ? 'text-white/70' : 'text-gray-400'}`} />
                    Alla
                  </span>
                  <span className={`text-xs font-medium ${!selectedFolder ? 'text-white/60' : 'text-gray-400'}`}>
                    {documents.length}
                  </span>
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between ${
                      selectedFolder === folder.id
                        ? 'bg-navy text-white'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FolderOpen className={`w-4 h-4 flex-shrink-0 ${selectedFolder === folder.id ? 'text-white/70' : 'text-gray-400'}`} />
                      <span className="truncate">{folder.name}</span>
                    </span>
                    <span className={`text-xs font-medium ${selectedFolder === folder.id ? 'text-white/60' : 'text-gray-400'}`}>
                      {folder.documentCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-gradient-to-br from-mint/20 to-mint/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Status</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Filer</span>
                  <span className="font-semibold text-gray-900">{documents.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delat med</span>
                  <span className="font-semibold text-gray-900">{acceptedInvites.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-4">
            {/* Search & View toggle */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sök dokument..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 transition-all"
                />
              </div>
              <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl">
                <button
                  onClick={() => setViewStyle('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewStyle === 'list' ? 'bg-gray-100 text-navy' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewStyle('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewStyle === 'grid' ? 'bg-gray-100 text-navy' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drop zone / Document list */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`bg-white rounded-2xl border-2 transition-all ${
                isDragging
                  ? 'border-navy border-dashed bg-navy/5'
                  : 'border-gray-100'
              }`}
            >
              {isDragging ? (
                <div className="p-16 text-center">
                  <Upload className="w-10 h-10 text-navy mx-auto mb-3 animate-bounce" />
                  <p className="text-navy font-medium">Släpp filer här</p>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 mb-1">
                    {searchQuery ? 'Inga dokument matchade sökningen' : 'Inga dokument ännu'}
                  </p>
                  <p className="text-gray-400 text-sm mb-6">Dra och släpp filer hit</p>
                  {permissions?.canUpload && !searchQuery && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90 transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      Välj filer
                    </button>
                  )}
                </div>
              ) : viewStyle === 'list' ? (
                <div className="divide-y divide-gray-50">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 hover:bg-gray-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${getFileIcon(doc.currentVersion?.mimeType)}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                            {doc.versions && doc.versions.length > 1 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                v{doc.currentVersion?.version}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-sm text-gray-400">{doc.currentVersion?.fileName}</span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-sm text-gray-400">{formatFileSize(doc.currentVersion?.size || 0)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {doc.versions && doc.versions.length > 1 && (
                            <button
                              onClick={() => {
                                setSelectedDoc(doc)
                                setShowVersions(true)
                              }}
                              className="p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-lg transition-colors"
                              title="Versioner"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloading === doc.id}
                            className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy/90 transition-all disabled:opacity-50"
                          >
                            {downloading === doc.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors group cursor-pointer"
                      onClick={() => handleDownload(doc)}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-3 ${getFileIcon(doc.currentVersion?.mimeType)}`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm truncate mb-1">{doc.title}</h3>
                      <p className="text-xs text-gray-400">{formatFileSize(doc.currentVersion?.size || 0)}</p>
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
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral/20 to-coral/5 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-coral" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Bjud in</h3>
                  <p className="text-sm text-gray-500">Dela datarum med köpare eller rådgivare</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="namn@företag.se"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 transition-all"
                  />
                </div>
                <div className="flex gap-1 p-1 bg-gray-50 rounded-xl">
                  <button
                    onClick={() => setInviteRole('VIEWER')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inviteRole === 'VIEWER'
                        ? 'bg-white text-navy shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setInviteRole('EDITOR')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inviteRole === 'EDITOR'
                        ? 'bg-white text-navy shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail}
                  className="px-5 py-3 bg-navy text-white rounded-xl font-medium hover:bg-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Inbjudna måste godkänna NDA innan åtkomst
              </p>
            </div>
          )}

          {/* Invites list */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900">Inbjudna ({invites.length})</h3>
            </div>

            {invites.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-500 text-sm">Inga inbjudningar ännu</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {invites.map((inv) => (
                  <div key={inv.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-sm font-medium text-gray-600">
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
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full">
                          <Clock className="w-3 h-3" />
                          Väntande
                        </span>
                      )}
                      {inv.status === 'ACCEPTED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Accepterad
                        </span>
                      )}
                      {inv.status === 'EXPIRED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
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
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Ladda upp</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-navy bg-navy/5'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-gray-400" />
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
                    className="h-full bg-gradient-to-r from-navy to-coral transition-all duration-300 rounded-full"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
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
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedDoc.versions?.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                    v.id === selectedDoc.currentVersion?.id
                      ? 'bg-navy/5 border border-navy/20'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
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
                    className="p-2 text-gray-400 hover:text-navy hover:bg-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
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
