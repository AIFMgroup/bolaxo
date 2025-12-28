'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'

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

export default function BuyerKycVerification() {
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | KycStatus>('SUBMITTED')
  const [items, setItems] = useState<KycRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})

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
      await load()
    } catch (e: any) {
      setError(e?.message || 'Ett fel uppstod')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-navy flex items-center gap-2 mb-2">
            <CheckCircle className="w-6 h-6" /> Buyer KYC (Verifierad köpare)
          </h2>
          <p className="text-gray-600 text-sm">Manuell granskning av ID/bolagsdokument</p>
        </div>
        <button
          onClick={load}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Uppdatera
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-xs text-blue-700 font-semibold mb-1">TOTAL</div>
          <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-xs text-yellow-700 font-semibold mb-1">SUBMITTED</div>
          <div className="text-3xl font-bold text-yellow-900">{stats.submitted}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-xs text-green-700 font-semibold mb-1">APPROVED</div>
          <div className="text-3xl font-bold text-green-900">{stats.approved}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-xs text-red-700 font-semibold mb-1">REJECTED</div>
          <div className="text-3xl font-bold text-red-900">{stats.rejected}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="all">Alla</option>
          <option value="SUBMITTED">Inskickade</option>
          <option value="APPROVED">Godkända</option>
          <option value="REJECTED">Nekade</option>
          <option value="UNVERIFIED">Ej inskickade</option>
        </select>
        {loading && <span className="text-sm text-gray-500">Laddar…</span>}
      </div>

      <div className="space-y-2">
        {items.map((v) => (
          <div key={v.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">
                    {v.user.name || v.user.email}
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {v.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 truncate">{v.user.email}</p>

                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Dokument</p>
                  {v.documents.length === 0 ? (
                    <p className="text-sm text-gray-600">Inga dokument</p>
                  ) : (
                    <ul className="space-y-1">
                      {v.documents.map((d) => (
                        <li key={d.id} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-800 truncate">{d.fileName} <span className="text-xs text-gray-500">({d.kind})</span></span>
                          <a
                            href={`/api/admin/kyc/documents/download-url?documentId=${encodeURIComponent(d.id)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary-navy hover:text-primary-blue inline-flex items-center gap-1"
                          >
                            Visa <ExternalLink className="w-3 h-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {v.status === 'REJECTED' && v.rejectionReason && (
                  <p className="text-xs text-red-700 mt-2">Orsak: {v.rejectionReason}</p>
                )}
              </div>

              {v.status === 'SUBMITTED' && (
                <div className="w-full max-w-xs space-y-2">
                  <textarea
                    placeholder="Orsak vid nekande (valfritt)"
                    value={rejectReason[v.user.id] || ''}
                    onChange={(e) => setRejectReason((prev) => ({ ...prev, [v.user.id]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[72px]"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => decide(v.user.id, 'reject')}
                      className="px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-sm inline-flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Neka
                    </button>
                    <button
                      onClick={() => decide(v.user.id, 'approve')}
                      className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm inline-flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Godkänn
                    </button>
                  </div>
                </div>
              )}

              {v.status !== 'SUBMITTED' && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Endast “SUBMITTED” går att besluta här
                </div>
              )}
            </div>
          </div>
        ))}

        {!loading && items.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-600">
            Inga KYC-ärenden för vald filter.
          </div>
        )}
      </div>
    </div>
  )
}


