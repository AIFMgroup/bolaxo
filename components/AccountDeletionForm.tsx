'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldX, AlertTriangle, CheckCircle2, Download, Trash2, ArrowLeft } from 'lucide-react'

type Props = {
  locale?: string
  backHref?: string
}

// Simple GDPR-compliant account deletion UI that calls the existing API route.
export default function AccountDeletionForm({ locale = 'sv', backHref = '/' }: Props) {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleDelete = async () => {
    setError(null)
    setSuccess(null)

    if (confirmText.trim() !== 'DELETE_MY_ACCOUNT') {
      setError('Skriv exakt: DELETE_MY_ACCOUNT')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE_MY_ACCOUNT' })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || 'Kunde inte radera kontot. Kontrollera att du är inloggad och att du pausar/avpublicerar aktiva annonser.')
        return
      }

      setSuccess(data?.message || 'Kontot är raderat och persondata anonymiserad.')
      // Ge användaren 1s och skicka sedan hem
      setTimeout(() => router.push(`/${locale}`), 1000)
    } catch (e) {
      setError('Nätverksfel. Försök igen eller kontakta privacy@bolaxo.com')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href={backHref} className="inline-flex items-center text-primary-blue hover:text-blue-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Link>

        <div className="card-static">
          <div className="flex items-center mb-6">
            <ShieldX className="w-8 h-8 text-primary-blue mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-text-dark">Radera konto & GDPR</h1>
              <p className="text-text-gray text-sm mt-1">
                Utför radering eller be om manuell hjälp. Aktiva annonser måste pausas först.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Steps & rights */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-4 border border-gray-200 rounded-xl">
                <h2 className="text-lg font-semibold text-text-dark mb-2">Dina GDPR-rättigheter</h2>
                <ul className="list-disc ml-5 text-text-gray space-y-2 text-sm">
                  <li>Få ut en kopia av dina data (export)</li>
                  <li>Radera konto (persondata anonymiseras, lagkrav för bokföring sparas separerat)</li>
                  <li>Rätta felaktiga uppgifter eller invända mot behandling</li>
                </ul>
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 mt-3 p-3 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Exportera din data innan radering om du behöver en kopia.</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href="/api/user/export-data"
                    className="btn-secondary inline-flex items-center gap-2 text-sm"
                    prefetch={false}
                  >
                    <Download className="w-4 h-4" />
                    Ladda ner min data (JSON)
                  </Link>
                  <Link
                    href={`/${locale}/juridiskt/integritetspolicy`}
                    className="text-primary-blue text-sm underline"
                  >
                    Läs integritetspolicy
                  </Link>
                  <Link
                    href={`/${locale}/juridiskt/anvandarvillkor`}
                    className="text-primary-blue text-sm underline"
                  >
                    Läs användarvillkor
                  </Link>
                </div>
              </div>

              <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-700 mt-0.5" />
                  <div className="space-y-2 text-sm text-text-gray">
                    <p><strong>Viktigt:</strong> Har du aktiva annonser måste de pausas eller tas bort innan radering.</p>
                    <p>Raderingen anonymiserar ditt konto (mjukt borttag) för att bevara nödvändiga loggar och transaktionshistorik enligt lag.</p>
                    <p>Om raderingen misslyckas, maila <a href="mailto:privacy@bolaxo.com" className="underline text-primary-blue">privacy@bolaxo.com</a> med den e-postadress du registrerat.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-xl space-y-3">
                <h2 className="text-lg font-semibold text-text-dark">Radera mitt konto</h2>
                <p className="text-sm text-text-gray">
                  Skriv <code className="bg-gray-100 px-1 py-0.5 rounded">DELETE_MY_ACCOUNT</code> för att bekräfta.
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE_MY_ACCOUNT"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="btn-primary inline-flex items-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {loading ? 'Raderar...' : 'Radera konto'}
                </button>

                {error && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">
                    {success}
                  </div>
                )}
              </div>
            </div>

            {/* Manual help */}
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3">
              <h3 className="text-lg font-semibold text-text-dark">Behöver du hjälp?</h3>
              <p className="text-sm text-text-gray">
                Om du föredrar manuell hantering eller behöver stöd, kontakta vårt dataskyddsteam.
              </p>
              <div className="text-sm space-y-1">
                <p><span className="font-semibold">E-post:</span> <a className="underline text-primary-blue" href="mailto:privacy@bolaxo.com">privacy@bolaxo.com</a></p>
                <p><span className="font-semibold">Telefon:</span> 08-123 456 78</p>
              </div>
              <div className="text-xs text-text-gray">
                Vi svarar normalt inom 48 timmar. Glöm inte att ange den e-postadress som är kopplad till ditt konto.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

