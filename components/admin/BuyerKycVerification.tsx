'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, ExternalLink, RefreshCw, Search, Clock, FileText, User, Calendar } from 'lucide-react'

type KycStatus = 'UNVERIFIED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

interface KycDoc {
  id: string
  kind: string
  fileName: string
  fileSize: number
  mimeType: string
  createdAt: string
}

interface KycRequest {
  id: string
  status: KycStatus
  submittedAt: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  rejectionReason: string | null
  user: { id: string; email: string; name: string | null; role: string; createdAt: string }
  documents: KycDoc[]
}

const REJECTION_TEMPLATES = [
  { label: 'Oläsligt dokument', text: 'Det uppladdade dokumentet är oläsligt eller av för låg kvalitet. Vänligen ladda upp en tydligare bild.' },
  { label: 'Felaktig dokumenttyp', text: 'Dokumentet uppfyller inte kraven. Vänligen ladda upp giltig ID-handling (pass, körkort eller nationellt ID).' },
  { label: 'Utgånget dokument', text: 'ID-handlingen har gått ut. Vänligen ladda upp en giltig, ej utgången ID-handling.' },
  { label: 'Bolagsdokument saknas', text: 'Registreringsbevis eller bolagsverifikat saknas. Vänligen ladda upp dokumentation för bolaget.' },
  { label: 'Annan orsak', text: '' }
]

export default function BuyerKycVerification() {
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | KycStatus>('SUBMITTED')
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<KycRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [previewDoc, setPreviewDoc] = useState<KycDoc | null>(null)

  const stats = useMemo(() => {
    const counts = { total: items.length, submitted: 0, approved: 0, rejected: 0, unverified: 0 }
    for (const i of items) {
      if (i.status === 'SUBMITTED') counts.submitted += 1
      else if (i.status === 'APPROVED') counts.approved += 1
      else if (i.status === 'REJECTED') counts.rejected += 1
      else counts.unverified += 1
    }
    return counts
  }, [items])

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase()
    return items.filter(i =>
      i.user.name?.toLowerCase().includes(q) ||
      i.user.email.toLowerCase().includes(q)
    )
  }, [items, searchQuery])

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const url = new URL('/api/admin/kyc/requests', window.location.origin)
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter)
      const res = await fetch(url.toString(), { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Kunde inte hämta KYC')
      setItems(Array.isArray(data.requests) ? data.requests : [])
    } catch (e: any) {
      setError(e?.message || 'Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const decide = async (userId: string, decision: 'approve' | 'reject') => {
    setError(null)
    setProcessingIds(prev => new Set(prev).add(userId))
    try {
      const res = await fetch('/api/admin/kyc/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          decision,
          rejectionReason: decision === 'reject' ? rejectReason[userId] : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Kunde inte uppdatera')
      // Clear rejection reason after successful action
      setRejectReason(prev => {
        const copy = { ...prev }
        delete copy[userId]
        return copy
      })
      await load()
    } catch (e: any) {
      setError(e?.message || 'Ett fel uppstod')
    } finally {
      setProcessingIds(prev => {
        const copy = new Set(prev)
        copy.delete(userId)
        return copy
      })
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('sv-SE', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const getKindLabel = (kind: string) => {
    const labels: Record<string, string> = {
      id: 'ID-handling',
      company_registration: 'Bolagsdokument',
      other: 'Övrigt'
    }
    return labels[kind] || kind
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary-navy mb-1">Köparverifiering (KYC)</h2>
          <p className="text-gray-600 text-sm">Granska uppladdade dokument och godkänn/neka köpare</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Uppdatera
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('SUBMITTED')}
          className={`rounded-lg p-4 text-left transition-colors ${
            statusFilter === 'SUBMITTED' ? 'bg-amber-100 border-2 border-amber-400' : 'bg-amber-50 border border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-amber-700 font-semibold">KÖ</span>
          </div>
          <div className="text-2xl font-bold text-amber-900">{stats.submitted}</div>
        </button>
        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`rounded-lg p-4 text-left transition-colors ${
            statusFilter === 'APPROVED' ? 'bg-emerald-100 border-2 border-emerald-400' : 'bg-emerald-50 border border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-emerald-700 font-semibold">GODKÄNDA</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900">{stats.approved}</div>
        </button>
        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`rounded-lg p-4 text-left transition-colors ${
            statusFilter === 'REJECTED' ? 'bg-red-100 border-2 border-red-400' : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs text-red-700 font-semibold">NEKADE</span>
          </div>
          <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`rounded-lg p-4 text-left transition-colors ${
            statusFilter === 'all' ? 'bg-gray-200 border-2 border-gray-400' : 'bg-gray-50 border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-xs text-gray-700 font-semibold">ALLA</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Sök på namn eller e-post..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-navy/20"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            Laddar ärenden...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
            {searchQuery ? 'Inga ärenden matchar sökningen' : 'Inga KYC-ärenden för vald status'}
          </div>
        ) : (
          filteredItems.map((v) => {
            const isProcessing = processingIds.has(v.user.id)
            return (
              <div key={v.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Header row */}
                <div className="flex items-center justify-between gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                      {(v.user.name || v.user.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{v.user.name || v.user.email}</p>
                      <p className="text-xs text-gray-500">{v.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Inskickad: {formatDate(v.submittedAt)}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      v.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' :
                      v.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      v.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {v.status === 'SUBMITTED' ? 'Väntar' :
                       v.status === 'APPROVED' ? 'Godkänd' :
                       v.status === 'REJECTED' ? 'Nekad' : 'Ej inskickad'}
                    </span>
                  </div>
                </div>

                {/* Documents */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700">Dokument ({v.documents.length})</span>
                  </div>

                  {v.documents.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Inga dokument uppladdade</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {v.documents.map((d) => (
                        <div key={d.id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{d.fileName}</p>
                            <p className="text-xs text-gray-500">{getKindLabel(d.kind)}</p>
                          </div>
                          <a
                            href={`/api/admin/kyc/documents/download-url?documentId=${encodeURIComponent(d.id)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 text-xs font-medium text-primary-navy hover:bg-gray-100 rounded transition-colors inline-flex items-center gap-1"
                          >
                            Visa <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {v.status === 'REJECTED' && v.rejectionReason && (
                    <div className="mt-3 p-2 bg-red-50 rounded-lg">
                      <p className="text-xs font-medium text-red-700">Orsak till nekande:</p>
                      <p className="text-sm text-red-800 mt-0.5">{v.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Actions (only for SUBMITTED) */}
                {v.status === 'SUBMITTED' && (
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-600">Malltext vid nekande:</span>
                          <select
                            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                            onChange={(e) => {
                              const template = REJECTION_TEMPLATES.find(t => t.label === e.target.value)
                              if (template) {
                                setRejectReason(prev => ({ ...prev, [v.user.id]: template.text }))
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>Välj mall...</option>
                            {REJECTION_TEMPLATES.map(t => (
                              <option key={t.label} value={t.label}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          placeholder="Orsak vid nekande (visas för köparen)"
                          value={rejectReason[v.user.id] || ''}
                          onChange={(e) => setRejectReason(prev => ({ ...prev, [v.user.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[60px] resize-none"
                        />
                      </div>
                      <div className="flex sm:flex-col gap-2 sm:justify-end">
                        <button
                          onClick={() => decide(v.user.id, 'reject')}
                          disabled={isProcessing}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Neka
                        </button>
                        <button
                          onClick={() => decide(v.user.id, 'approve')}
                          disabled={isProcessing}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Godkänn
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}


