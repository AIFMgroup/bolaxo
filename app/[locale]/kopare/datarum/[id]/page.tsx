'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FolderOpen, FileText, Download, Lock, Shield, 
  ChevronRight, AlertCircle, CheckCircle, Loader2,
  ArrowLeft, Building, Clock, User, Eye
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from 'next-intl'

interface Document {
  id: string
  name: string
  category: string | null
  requirementId: string | null
  folder: { id: string; name: string } | null
  currentVersion: {
    id: string
    versionNumber: number
    fileName: string
    fileSize: number
    mimeType: string
    uploadedAt: string
  } | null
  uploadedBy: string
  createdAt: string
}

interface Folder {
  id: string
  name: string
  parentId: string | null
  documentCount: number
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

export default function BuyerDataRoomPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const { user } = useAuth()
  const dataRoomId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ndaRequired, setNdaRequired] = useState(false)
  const [ndaAccepted, setNdaAccepted] = useState(false)
  const [acceptingNda, setAcceptingNda] = useState(false)
  
  const [dataRoom, setDataRoom] = useState<DataRoomInfo | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  // Check NDA status first
  useEffect(() => {
    const checkNdaStatus = async () => {
      try {
        const res = await fetch(`/api/dataroom/nda/accept?dataRoomId=${dataRoomId}`)
        const data = await res.json()
        
        if (res.ok) {
          setNdaRequired(data.required)
          setNdaAccepted(data.accepted)
          
          if (!data.required || data.accepted) {
            // Can proceed to load documents
            await loadDocuments()
          }
        } else if (res.status === 403) {
          setError('Du har inte åtkomst till detta datarum')
        }
      } catch (err) {
        console.error('Error checking NDA status:', err)
        setError('Kunde inte kontrollera NDA-status')
      } finally {
        setLoading(false)
      }
    }

    if (dataRoomId) {
      checkNdaStatus()
    }
  }, [dataRoomId])

  const loadDocuments = async () => {
    try {
      const res = await fetch(`/api/dataroom/${dataRoomId}/documents`)
      const data = await res.json()
      
      if (res.ok) {
        setDataRoom(data.dataRoom)
        setFolders(data.folders)
        setDocuments(data.documents)
        setPermissions(data.permissions)
      } else if (data.ndaRequired) {
        setNdaRequired(true)
        setNdaAccepted(false)
      } else {
        setError(data.error || 'Kunde inte ladda dokument')
      }
    } catch (err) {
      console.error('Error loading documents:', err)
      setError('Kunde inte ladda dokument')
    }
  }

  const handleAcceptNda = async () => {
    setAcceptingNda(true)
    try {
      const res = await fetch('/api/dataroom/nda/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataRoomId }),
      })
      
      if (res.ok) {
        setNdaAccepted(true)
        await loadDocuments()
      } else {
        const data = await res.json()
        setError(data.error || 'Kunde inte acceptera NDA')
      }
    } catch (err) {
      console.error('Error accepting NDA:', err)
      setError('Kunde inte acceptera NDA')
    } finally {
      setAcceptingNda(false)
    }
  }

  const handleDownload = async (documentId: string, versionId: string, fileName: string) => {
    setDownloading(documentId)
    try {
      const res = await fetch(`/api/dataroom/download-url?documentId=${documentId}&versionId=${versionId}`)
      const data = await res.json()
      
      if (res.ok && data.downloadUrl) {
        // Open download in new tab
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = fileName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert(data.error || 'Kunde inte ladda ner fil')
      }
    } catch (err) {
      console.error('Error downloading:', err)
      alert('Kunde inte ladda ner fil')
    } finally {
      setDownloading(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const filteredDocuments = selectedFolder
    ? documents.filter((d) => d.folder?.id === selectedFolder)
    : documents

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy mx-auto mb-3" />
          <p className="text-gray-600">Laddar datarum...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Åtkomst nekad</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till dashboard
          </Link>
        </div>
      </div>
    )
  }

  // NDA Gate
  if (ndaRequired && !ndaAccepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-navy" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sekretessavtal krävs</h1>
            <p className="text-gray-600">
              För att få åtkomst till detta datarum måste du godkänna vårt sekretessavtal (NDA).
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-700 space-y-3">
            <p><strong>Genom att godkänna förbinder du dig att:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Behandla all information i datarummet som konfidentiell</li>
              <li>Inte dela informationen med tredje part utan skriftligt tillstånd</li>
              <li>Endast använda informationen för utvärdering av investeringsmöjligheten</li>
              <li>Radera all information om affären inte genomförs</li>
            </ul>
          </div>

          <button
            onClick={handleAcceptNda}
            disabled={acceptingNda}
            className="w-full py-3 bg-navy text-white rounded-xl font-medium hover:bg-navy/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {acceptingNda ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Godkänner...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Jag godkänner sekretessavtalet
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Din accept loggas med tidsstämpel och IP-adress.
          </p>
        </div>
      </div>
    )
  }

  // Main dataroom view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/dashboard`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-navy" />
                  <h1 className="text-lg font-semibold text-gray-900">
                    {dataRoom?.listingName || 'Datarum'}
                  </h1>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    Läsläge
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock className="w-4 h-4" />
                    Konfidentiellt
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user?.name || user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Confidentiality banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Konfidentiell information</p>
            <p className="text-sm text-amber-700">
              All information i detta datarum är konfidentiell och skyddad av NDA. 
              Nedladdningar loggas och vattenmärks.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Folder sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-gray-500" />
                Mappar
              </h2>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !selectedFolder
                      ? 'bg-navy text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  Alla dokument ({documents.length})
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
                    <span className={`text-xs ${
                      selectedFolder === folder.id ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      {folder.documentCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Documents list */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">
                  {selectedFolder
                    ? folders.find((f) => f.id === selectedFolder)?.name
                    : 'Alla dokument'}
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredDocuments.length} dokument
                </p>
              </div>

              {filteredDocuments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Inga dokument i denna mapp</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <h3 className="font-medium text-gray-900 truncate">
                              {doc.name}
                            </h3>
                          </div>
                          {doc.currentVersion && (
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{doc.currentVersion.fileName}</span>
                              <span>{formatFileSize(doc.currentVersion.fileSize)}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(doc.currentVersion.uploadedAt).toLocaleDateString('sv-SE')}
                              </span>
                            </div>
                          )}
                          {doc.category && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {doc.category}
                            </span>
                          )}
                        </div>

                        {doc.currentVersion && (
                          <button
                            onClick={() =>
                              handleDownload(
                                doc.id,
                                doc.currentVersion!.id,
                                doc.currentVersion!.fileName
                              )
                            }
                            disabled={downloading === doc.id}
                            className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors disabled:opacity-50 text-sm"
                          >
                            {downloading === doc.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            Ladda ner
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

