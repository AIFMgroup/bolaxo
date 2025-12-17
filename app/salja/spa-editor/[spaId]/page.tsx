'use client'

import { useState, useEffect } from 'react'
import { Download, Send, RotateCcw, Eye, Edit2, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

interface SPAVersion {
  version: number
  date: string
  status: 'draft' | 'proposed' | 'negotiating' | 'signed'
  changedBy: string
  changedByRole: string
  changes: string
}

export default function SPAEditorPage() {
  const params = useParams()
  const spaId = params.spaId as string
  const { user } = useAuth()
  const { success: showSuccess, error: showError } = useToast()
  
  const [spa, setSpa] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [viewMode, setViewMode] = useState<'pdf' | 'edit' | 'history'>('pdf')
  
  // Form state
  const [formData, setFormData] = useState({
    purchasePrice: 0,
    cashAtClosing: 0,
    escrowHoldback: 0,
    escrowPeriod: '18 månader',
    earnoutAmount: 0,
    earnoutPeriod: '3 år',
    earnoutKPI: '',
    nonCompetePeriod: '3 år',
    closingDate: ''
  })

  const [versions, setVersions] = useState<SPAVersion[]>([])

  // Fetch SPA data
  useEffect(() => {
    const fetchSPA = async () => {
      try {
        const response = await fetch(`/api/sme/spa/get?spaId=${spaId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.spa) {
            setSpa(data.spa)
            
            // Parse earn-out structure if it exists
            const earnOut = data.spa.earnOutStructure || {}
            
            setFormData({
              purchasePrice: data.spa.purchasePrice || 0,
              cashAtClosing: data.spa.cashAtClosing || 0,
              escrowHoldback: data.spa.escrowHoldback || 0,
              escrowPeriod: earnOut.escrowPeriod || '18 månader',
              earnoutAmount: earnOut.amount || 0,
              earnoutPeriod: earnOut.period || '3 år',
              earnoutKPI: earnOut.kpi || '',
              nonCompetePeriod: earnOut.nonCompetePeriod || '3 år',
              closingDate: data.spa.closingDate ? new Date(data.spa.closingDate).toISOString().split('T')[0] : ''
            })
            
            // Set versions from revisions
            if (data.spa.revisions) {
              setVersions(data.spa.revisions.map((rev: any) => ({
                version: rev.version,
                date: new Date(rev.createdAt).toISOString().split('T')[0],
                status: data.spa.status,
                changedBy: rev.changedByRole === 'buyer' ? 'Köpare' : 'Säljare',
                changedByRole: rev.changedByRole,
                changes: rev.changes
              })))
            }
          }
        } else {
          showError('Kunde inte hämta SPA-data')
        }
      } catch (error) {
        console.error('Error fetching SPA:', error)
        showError('Ett fel uppstod vid hämtning av SPA')
      } finally {
        setLoading(false)
      }
    }

    if (spaId) {
      fetchSPA()
    }
  }, [spaId])

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveChanges = async () => {
    if (!user) {
      showError('Du måste vara inloggad')
      return
    }
    
    setSaving(true)
    
    try {
      const response = await fetch('/api/sme/spa/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaId,
          userId: user.id,
          userRole: user.role,
          purchasePrice: formData.purchasePrice,
          cashAtClosing: formData.cashAtClosing,
          escrowHoldback: formData.escrowHoldback,
          earnOutStructure: {
            amount: formData.earnoutAmount,
            period: formData.earnoutPeriod,
            kpi: formData.earnoutKPI,
            escrowPeriod: formData.escrowPeriod,
            nonCompetePeriod: formData.nonCompetePeriod
          },
          closingDate: formData.closingDate,
          changes: 'Uppdaterade SPA-termer'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSpa(data.data.spa)
        
        // Add new version to list
        const newVersion: SPAVersion = {
          version: data.data.spa.version,
          date: new Date().toISOString().split('T')[0],
          status: 'negotiating',
          changedBy: 'Säljare',
          changedByRole: 'seller',
          changes: 'Uppdaterade SPA-termer'
        }
        setVersions([...versions, newVersion])
        
        showSuccess('SPA sparad!')
        setViewMode('pdf')
      } else {
        const errorData = await response.json()
        showError(errorData.error || 'Kunde inte spara SPA')
      }
    } catch (error) {
      console.error('Save error:', error)
      showError('Ett fel uppstod vid sparning')
    } finally {
      setSaving(false)
    }
  }

  const handleSendToKöpare = async () => {
    if (!user || !spa) {
      showError('Kunde inte skicka SPA')
      return
    }
    
    setSending(true)
    
    try {
      // Send message to buyer about updated SPA
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          listingId: spa.listingId,
          recipientId: spa.buyerId,
          subject: 'SPA uppdaterad',
          content: `Jag har uppdaterat SPA-dokumentet (version ${spa.version}). Vänligen granska de nya termerna:\n\n` +
            `• Köpeskilling: ${(formData.purchasePrice / 1000000).toFixed(1)} MSEK\n` +
            `• Kontant vid closing: ${(formData.cashAtClosing / 1000000).toFixed(1)} MSEK\n` +
            `• Escrow: ${(formData.escrowHoldback / 1000000).toFixed(1)} MSEK\n` +
            `• Earn-out: ${(formData.earnoutAmount / 1000000).toFixed(1)} MSEK\n\n` +
            `Closing-datum: ${formData.closingDate}\n\n` +
            `Logga in för att granska hela SPA-dokumentet.`
        })
      })
      
      if (response.ok) {
        showSuccess('SPA skickad till köpare!')
      } else {
        // If message fails, still show success since SPA is saved
        showSuccess('SPA sparad! Köparen kan se den i plattformen.')
      }
    } catch (error) {
      console.error('Send error:', error)
      showSuccess('SPA sparad! Meddela köparen manuellt.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-navy" />
      </div>
    )
  }

  if (!spa) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">SPA hittades inte</p>
          <Link href="/salja" className="text-blue-600 hover:underline mt-4 inline-block">
            Tillbaka
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/salja" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
            ← Tillbaka
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📄 SPA Editor - {spa?.listing?.companyName || spa?.listing?.anonymousTitle}</h1>
          <p className="text-gray-600">Version {spa?.version} • Status: {spa?.status}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setViewMode('pdf')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              viewMode === 'pdf'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-blue-400'
            }`}
          >
            <Eye className="w-4 h-4" />
            Visa PDF
          </button>
          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              viewMode === 'edit'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-blue-400'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            Redigera
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              viewMode === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-blue-400'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Historik
          </button>
        </div>

        {/* PDF View */}
        {viewMode === 'pdf' && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-8 mb-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">SPA Version {spa?.version}</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Ladda ner PDF
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">Köpsammanfattning</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Köpeskilling</p>
                  <p className="text-2xl font-bold text-gray-900">{(formData.purchasePrice / 1000000).toFixed(1)} MSEK</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kontant vid closing</p>
                  <p className="text-2xl font-bold text-gray-900">{(formData.cashAtClosing / 1000000).toFixed(1)} MSEK</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Escrow (holdback)</p>
                  <p className="text-2xl font-bold text-gray-900">{(formData.escrowHoldback / 1000000).toFixed(1)} MSEK</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Earn-out potentiell</p>
                  <p className="text-2xl font-bold text-gray-900">{(formData.earnoutAmount / 1000000).toFixed(1)} MSEK</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-600">
                <p className="font-semibold text-gray-900">Earn-out struktur</p>
                <p className="text-sm text-gray-700 mt-1">
                  {(formData.earnoutAmount/1000000).toFixed(1)} MSEK över {formData.earnoutPeriod} baserat på: {formData.earnoutKPI || 'Ej specificerat'}
                </p>
              </div>
              <div className="p-4 bg-amber-50 border-l-4 border-amber-600">
                <p className="font-semibold text-gray-900">Konkurrensförbud</p>
                <p className="text-sm text-gray-700 mt-1">
                  {formData.nonCompetePeriod} från closing
                </p>
              </div>
              {formData.closingDate && (
                <div className="p-4 bg-green-50 border-l-4 border-green-600">
                  <p className="font-semibold text-gray-900">Closing-datum</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {new Date(formData.closingDate).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setViewMode('edit')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                <Edit2 className="w-4 h-4" />
                Redigera termer
              </button>
              <button
                onClick={handleSendToKöpare}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? 'Skickar...' : 'Skicka till köpare'}
              </button>
            </div>
          </div>
        )}

        {/* Edit View */}
        {viewMode === 'edit' && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Redigera SPA-termer</h2>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Köpeskilling (SEK)
                  </label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => handleFieldChange('purchasePrice', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Kontant vid closing (SEK)
                  </label>
                  <input
                    type="number"
                    value={formData.cashAtClosing}
                    onChange={(e) => handleFieldChange('cashAtClosing', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Escrow holdback (SEK)
                  </label>
                  <input
                    type="number"
                    value={formData.escrowHoldback}
                    onChange={(e) => handleFieldChange('escrowHoldback', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Escrow period
                  </label>
                  <input
                    type="text"
                    value={formData.escrowPeriod}
                    onChange={(e) => handleFieldChange('escrowPeriod', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Earn-out belopp (SEK)
                  </label>
                  <input
                    type="number"
                    value={formData.earnoutAmount}
                    onChange={(e) => handleFieldChange('earnoutAmount', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Earn-out period
                  </label>
                  <input
                    type="text"
                    value={formData.earnoutPeriod}
                    onChange={(e) => handleFieldChange('earnoutPeriod', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Earn-out KPI
                  </label>
                  <input
                    type="text"
                    value={formData.earnoutKPI}
                    onChange={(e) => handleFieldChange('earnoutKPI', e.target.value)}
                    placeholder="t.ex. Revenue > 55M SEK"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Konkurrensförbud
                  </label>
                  <input
                    type="text"
                    value={formData.nonCompetePeriod}
                    onChange={(e) => handleFieldChange('nonCompetePeriod', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Closing datum
                  </label>
                  <input
                    type="date"
                    value={formData.closingDate}
                    onChange={(e) => handleFieldChange('closingDate', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {saving ? 'Sparar...' : 'Spara ändringar'}
                </button>
                <button
                  onClick={() => setViewMode('pdf')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History View */}
        {viewMode === 'history' && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Versionshistorik</h2>

            {versions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Ingen versionshistorik ännu</p>
            ) : (
              <div className="space-y-4">
                {versions.map((version, idx) => (
                  <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">v{version.version}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{version.changes}</p>
                          <p className="text-sm text-gray-600">{version.date} • {version.changedBy}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        version.status === 'signed' ? 'bg-green-100 text-green-700' :
                        version.status === 'negotiating' ? 'bg-amber-100 text-amber-700' :
                        version.status === 'proposed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {version.status === 'signed' ? 'Signerad' :
                         version.status === 'negotiating' ? 'Förhandling' :
                         version.status === 'proposed' ? 'Föreslagen' :
                         'Utkast'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
