'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FolderOpen, FileText, Upload, Download, Trash2, MoreVertical,
  Plus, Users, Share2, ChevronRight, ChevronDown, Clock, Eye,
  CheckCircle, AlertCircle, Loader2, X, History, Shield, Mail,
  Lock, Unlock, RefreshCw
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

export default function DataRoomManager({ listingId, listingName }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataRoom, setDataRoom] = useState<DataRoomInfo | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [invites, setInvites] = useState<Invite[]>([])

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [showVersions, setShowVersions] = useState(false)
  const [showSharing, setShowSharing] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Initialize dataroom
  useEffect(() => {
    const initDataRoom = async () => {
      try {
        setLoading(true)
        // First try to init (creates if not exists)
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
        const dataRoomId = initData.dataRoom.id

        // Now fetch documents
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

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(Math.round(((i + 0.5) / files.length) * 100))

        // Get presigned URL
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

        // Upload to S3
        await fetch(url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })

        setUploadProgress(Math.round(((i + 1) / files.length) * 100))
      }

      // Reload documents
      await loadDocuments(dataRoom.id)
      setShowUpload(false)
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
      if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files)
      }
    },
    [dataRoom, selectedFolder]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const filteredDocs = selectedFolder
    ? documents.filter((d) => d.folder?.id === selectedFolder)
    : documents

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
        <span className="ml-3 text-gray-600">Laddar datarum...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-red-800">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Försök igen
        </button>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Sidebar: Folders + Actions */}
      <div className="lg:col-span-1 space-y-4">
        {/* Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          {permissions?.canUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Ladda upp dokument
            </button>
          )}
          {permissions?.canInvite && (
            <button
              onClick={() => setShowSharing(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              Dela datarum
            </button>
          )}
        </div>

        {/* Folders */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-gray-500" />
            Mappar
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                !selectedFolder
                  ? 'bg-navy text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span>Alla dokument</span>
              <span
                className={`text-xs ${
                  !selectedFolder ? 'text-white/70' : 'text-gray-400'
                }`}
              >
                {documents.length}
              </span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  selectedFolder === folder.id
                    ? 'bg-navy text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="truncate">{folder.name}</span>
                <span
                  className={`text-xs ${
                    selectedFolder === folder.id ? 'text-white/70' : 'text-gray-400'
                  }`}
                >
                  {folder.documentCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Dokument</span>
              <span className="font-medium text-gray-900">{documents.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Inbjudna</span>
              <span className="font-medium text-gray-900">
                {invites.filter((i) => i.status === 'ACCEPTED').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Väntande</span>
              <span className="font-medium text-gray-900">
                {invites.filter((i) => i.status === 'PENDING').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main: Document list */}
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="lg:col-span-3"
      >
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {selectedFolder
                  ? folders.find((f) => f.id === selectedFolder)?.name
                  : 'Alla dokument'}
              </h2>
              <p className="text-sm text-gray-500">{filteredDocs.length} filer</p>
            </div>
            {permissions?.canUpload && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-navy hover:bg-navy/5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Lägg till
              </button>
            )}
          </div>

          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Inga dokument ännu</p>
              {permissions?.canUpload && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Ladda upp
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <h3 className="font-medium text-gray-900 truncate">
                          {doc.title}
                        </h3>
                        {doc.versions && doc.versions.length > 1 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            v{doc.currentVersion?.version}
                          </span>
                        )}
                      </div>
                      {doc.currentVersion && (
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{doc.currentVersion.fileName}</span>
                          <span>{formatFileSize(doc.currentVersion.size)}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(doc.currentVersion.uploadedAt).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.versions && doc.versions.length > 1 && (
                        <button
                          onClick={() => {
                            setSelectedDoc(doc)
                            setShowVersions(true)
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Versionshistorik"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(doc)}
                        disabled={downloading === doc.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors text-sm disabled:opacity-50"
                      >
                        {downloading === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Ladda ner
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Ladda upp dokument</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-navy hover:bg-navy/5 transition-colors"
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-1">
                Dra och släpp filer här, eller klicka för att välja
              </p>
              <p className="text-sm text-gray-400">PDF, Excel, Word, bilder (max 50 MB)</p>
            </div>

            {uploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Laddar upp...</span>
                  <span className="text-gray-900 font-medium">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-navy transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
          </div>
        </div>
      )}

      {/* Versions Modal */}
      {showVersions && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Versionshistorik</h2>
              <button
                onClick={() => {
                  setShowVersions(false)
                  setSelectedDoc(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">{selectedDoc.title}</p>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedDoc.versions?.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    v.id === selectedDoc.currentVersion?.id
                      ? 'border-navy bg-navy/5'
                      : 'border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">v{v.version}</span>
                      {v.id === selectedDoc.currentVersion?.id && (
                        <span className="px-1.5 py-0.5 bg-navy text-white text-xs rounded">
                          Aktuell
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {v.fileName} · {formatFileSize(v.size)} ·{' '}
                      {new Date(v.createdAt).toLocaleDateString('sv-SE')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(selectedDoc, v.id)}
                    className="p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sharing Modal */}
      {showSharing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Dela datarum</h2>
              <button
                onClick={() => setShowSharing(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Invite form */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bjud in via e-post
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="namn@företag.se"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  <option value="VIEWER">Läsare</option>
                  <option value="EDITOR">Redigerare</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail}
                  className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors disabled:opacity-50"
                >
                  {inviting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Inbjudna måste godkänna NDA innan de får tillgång.
              </p>
            </div>

            {/* Invite list */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Inbjudna</h3>
              {invites.length === 0 ? (
                <p className="text-sm text-gray-500">Inga inbjudningar ännu</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {invites.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{inv.email}</div>
                        <div className="text-sm text-gray-500">
                          {inv.role === 'VIEWER' ? 'Läsare' : 'Redigerare'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {inv.status === 'PENDING' && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                            Väntande
                          </span>
                        )}
                        {inv.status === 'ACCEPTED' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Accepterad
                          </span>
                        )}
                        {inv.status === 'EXPIRED' && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
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

