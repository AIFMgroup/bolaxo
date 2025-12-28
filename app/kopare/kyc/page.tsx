'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

type KycStatus = 'UNVERIFIED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export default function BuyerKycPage() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<KycStatus>('UNVERIFIED')
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [docs, setDocs] = useState<Array<{ id: string; kind: string; fileName: string; createdAt: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statusMeta = useMemo(() => {
    switch (status) {
      case 'APPROVED':
        return { label: 'Verifierad', icon: <CheckCircle className="w-5 h-5 text-green-600" /> }
      case 'REJECTED':
        return { label: 'Nekad', icon: <XCircle className="w-5 h-5 text-red-600" /> }
      case 'SUBMITTED':
        return { label: 'Inskickad (väntar på granskning)', icon: <AlertCircle className="w-5 h-5 text-yellow-600" /> }
      default:
        return { label: 'Inte inskickad', icon: <AlertCircle className="w-5 h-5 text-gray-500" /> }
    }
  }, [status])

  const load = async () => {
    setError(null)
    const res = await fetch('/api/kyc/status', { credentials: 'include' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Kunde inte hämta status')
    }
    const data = await res.json()
    const v = data?.verification
    setStatus((v?.status as KycStatus) || 'UNVERIFIED')
    setRejectionReason(v?.rejectionReason || null)
    setDocs(Array.isArray(v?.documents) ? v.documents : [])
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        await load()
      } catch (e: any) {
        setError(e?.message || 'Ett fel uppstod')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleUpload = async (kind: string, file: File) => {
    setError(null)
    setUploading(true)
    try {
      const presignRes = await fetch('/api/kyc/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          kind,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      })
      const presign = await presignRes.json().catch(() => ({}))
      if (!presignRes.ok) throw new Error(presign.error || 'Kunde inte skapa upload-URL')

      const putRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error('Uppladdning misslyckades')

      await load()
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/kyc/submit', { method: 'POST', credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Kunde inte skicka in')
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-navy" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/kopare/settings" className="inline-flex items-center gap-2 text-primary-navy hover:text-primary-blue">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h1 className="text-2xl font-bold text-primary-navy">Verifiering av köpare (KYC)</h1>
          <p className="text-gray-600 mt-2">
            Ladda upp ID/bolagsdokument. Vi granskar manuellt och markerar dig som “Verifierad köpare”.
          </p>

          <div className="mt-4 flex items-center gap-3">
            {statusMeta.icon}
            <span className="font-medium text-gray-900">{statusMeta.label}</span>
          </div>
          {status === 'REJECTED' && rejectionReason && (
            <p className="mt-2 text-sm text-red-700">Orsak: {rejectionReason}</p>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-primary-navy">Dokument</h2>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <Upload className="w-4 h-4" /> Ladda upp ID (PDF/JPG/PNG/WebP)
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,image/*"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload('id', f)
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Max 15MB</p>
            </label>

            <label className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <Upload className="w-4 h-4" /> Ladda upp bolagsdokument (PDF)
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload('company_registration', f)
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Max 15MB</p>
            </label>
          </div>

          {uploading && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Laddar upp…
            </div>
          )}

          <div className="pt-2">
            {docs.length === 0 ? (
              <p className="text-sm text-gray-600">Inga dokument uppladdade ännu.</p>
            ) : (
              <ul className="space-y-2">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.fileName}</p>
                      <p className="text-xs text-gray-500">{d.kind}</p>
                    </div>
                    <a
                      className="text-sm text-primary-navy hover:text-primary-blue"
                      href={`/api/kyc/documents/download-url?documentId=${encodeURIComponent(d.id)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visa
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-4 border-t flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              Tips: skicka in när du är klar. Du kan ladda upp fler dokument senare.
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting || uploading || docs.length === 0}
              className="px-4 py-2 rounded-xl bg-primary-navy text-white text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Skickar…' : 'Skicka in för granskning'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


