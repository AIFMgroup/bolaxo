'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload, CheckCircle, XCircle, Clock, FileText } from 'lucide-react'

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
        return { 
          label: 'Verifierad köpare', 
          description: 'Du är nu verifierad och kan visa en badge på din profil.',
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200'
        }
      case 'REJECTED':
        return { 
          label: 'Nekad', 
          description: 'Din ansökan kunde inte godkännas. Se orsak nedan.',
          icon: <XCircle className="w-5 h-5" />,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200'
        }
      case 'SUBMITTED':
        return { 
          label: 'Väntar på granskning', 
          description: 'Vi granskar dina dokument. Detta tar vanligtvis 1-2 arbetsdagar.',
          icon: <Clock className="w-5 h-5" />,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200'
        }
      default:
        return { 
          label: 'Inte verifierad', 
          description: 'Ladda upp dokument nedan för att bli verifierad.',
          icon: <FileText className="w-5 h-5" />,
          color: 'text-gray-500',
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        }
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/kopare/settings" className="inline-flex items-center gap-2 text-primary-navy hover:text-primary-blue mb-4">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till inställningar
          </Link>
          <h1 className="text-3xl font-bold text-primary-navy">Verifiering (KYC)</h1>
          <p className="text-gray-600 mt-2">
            Verifiera din identitet för att bli en betrodd köpare på plattformen
          </p>
        </div>

        {/* Status Card */}
        <div className={`rounded-lg border ${statusMeta.border} ${statusMeta.bg} p-5 mb-6`}>
          <div className="flex items-start gap-3">
            <div className={statusMeta.color}>{statusMeta.icon}</div>
            <div>
              <p className={`font-semibold ${statusMeta.color}`}>{statusMeta.label}</p>
              <p className="text-sm text-gray-600 mt-0.5">{statusMeta.description}</p>
              {status === 'REJECTED' && rejectionReason && (
                <p className="text-sm text-red-700 mt-2 font-medium">Orsak: {rejectionReason}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-primary-navy mb-4">Ladda upp dokument</h2>
          
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <label className="group relative border-2 border-dashed border-gray-200 rounded-lg p-5 hover:border-primary-navy hover:bg-gray-50 cursor-pointer transition-all">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-navy mx-auto mb-2 transition-colors" />
                <p className="font-medium text-gray-900 text-sm">Giltig ID-handling</p>
                <p className="text-xs text-gray-500 mt-1">Pass, körkort eller nationellt ID</p>
                <p className="text-xs text-gray-400 mt-2">PDF, JPG, PNG • Max 15MB</p>
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
            </label>

            <label className="group relative border-2 border-dashed border-gray-200 rounded-lg p-5 hover:border-primary-navy hover:bg-gray-50 cursor-pointer transition-all">
              <div className="text-center">
                <FileText className="w-8 h-8 text-gray-400 group-hover:text-primary-navy mx-auto mb-2 transition-colors" />
                <p className="font-medium text-gray-900 text-sm">Bolagsdokument</p>
                <p className="text-xs text-gray-500 mt-1">Registreringsbevis eller fullmakt</p>
                <p className="text-xs text-gray-400 mt-2">PDF • Max 15MB</p>
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
            </label>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Laddar upp dokument…
            </div>
          )}

          {/* Uploaded Documents */}
          {docs.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Uppladdade dokument</h3>
              <ul className="space-y-2">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{d.fileName}</p>
                        <p className="text-xs text-gray-500">{d.kind === 'id' ? 'ID-handling' : 'Bolagsdokument'}</p>
                      </div>
                    </div>
                    <a
                      className="text-sm font-medium text-primary-navy hover:underline flex-shrink-0"
                      href={`/api/kyc/documents/download-url?documentId=${encodeURIComponent(d.id)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visa
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {docs.length === 0 && !uploading && (
            <p className="text-sm text-gray-500 text-center py-4">
              Inga dokument uppladdade ännu
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-gray-500 max-w-xs">
            Du kan ladda upp fler dokument även efter att du skickat in.
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading || docs.length === 0 || status === 'SUBMITTED' || status === 'APPROVED'}
            className="px-6 py-2.5 bg-primary-navy text-white rounded-lg text-sm font-medium hover:bg-primary-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Skickar…
              </span>
            ) : status === 'APPROVED' ? (
              'Redan verifierad'
            ) : status === 'SUBMITTED' ? (
              'Inväntar granskning'
            ) : (
              'Skicka in för granskning'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


