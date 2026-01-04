'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBuyerStore } from '@/store/buyerStore'
import { useAuth } from '@/contexts/AuthContext'
import FormField from '@/components/FormField'
import { Handshake, Download, Send, Lightbulb, ArrowRight } from 'lucide-react'

export default function LOIPage() {
  const params = useParams()
  const router = useRouter()
  const { ndaRequestedObjects } = useBuyerStore()
  const { user } = useAuth()
  
  const objectId = params.id as string
  const [object, setObject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const hasNDA = ndaRequestedObjects.includes(objectId)

  // Fetch listing from API
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${objectId}`, { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setObject(data)
        } else {
          console.error('Failed to fetch listing')
        }
      } catch (error) {
        console.error('Error fetching listing:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (objectId) {
      fetchListing()
    }
  }, [objectId, user?.id])
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false)

  const [loiData, setLoiData] = useState({
    priceMin: '',
    priceMax: '',
    transferMethod: 'shares', // shares or assets
    closingDate: '',
    financing: 'own_capital',
    conditions: '',
    ddScope: 'standard',
    timeline: ''
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
      </div>
    )
  }

  if (!object) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-dark mb-2">Objekt hittades inte</h1>
          <Link href="/sok" className="text-primary-blue hover:underline">
            Tillbaka till sök
          </Link>
        </div>
      </div>
    )
  }

  if (!hasNDA) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-light-blue/20 flex items-center justify-center py-6 sm:py-8 md:py-12 px-3 sm:px-4">
        <div className="max-w-2xl w-full card text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-dark mb-4">
            NDA krävs för att lämna LOI
          </h1>
          <p className="text-text-gray mb-8">
            Du behöver signera NDA innan du kan lämna ett indikativt bud.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/objekt/${objectId}`} className="btn-ghost">
              ← Tillbaka
            </Link>
            <Link href={`/nda/${objectId}`} className="btn-primary">
              Be om NDA
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleDownloadPDF = () => {
    alert('LOI-utkast genereras som PDF (funktionalitet kommer i produktion)')
  }


  const handleSendLOI = async () => {
    await handleSubmitLOI()
  }

  const handleSubmitLOI = async () => {
    if (!user || !object) {
      router.push('/login')
      return
    }

    setIsCreatingTransaction(true)

    try {
      // Create LOI first
      const response = await fetch('/api/loi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          listingId: objectId,
          buyerId: user.id,
          sellerId: object.userId,
          priceMin: loiData.priceMin ? parseFloat(loiData.priceMin) * 1000000 : undefined,
          priceMax: loiData.priceMax ? parseFloat(loiData.priceMax) * 1000000 : undefined,
          transferMethod: loiData.transferMethod,
          closingDate: loiData.closingDate || undefined,
          financing: loiData.financing,
          conditions: loiData.conditions || undefined,
          ddScope: loiData.ddScope,
          timeline: loiData.timeline || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        // LOI created successfully, now wait for seller approval
        router.push(`/loi/${data.loi.id}?status=proposed`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Kunde inte skapa LOI')
      }
    } catch (error) {
      console.error('Create LOI error:', error)
      alert('Ett fel uppstod vid skapande av LOI')
    } finally {
      setIsCreatingTransaction(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-light-blue/20 py-8">
      <div className="max-w-3xl mx-auto px-3 sm:px-4">
        <Link href={`/objekt/${objectId}`} className="text-primary-blue hover:underline mb-6 inline-block">
          ← Tillbaka till objektet
        </Link>

        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-dark mb-2">
              Indikativt bud (LOI)
            </h1>
            <p className="text-text-gray">
              {object.companyName || object.anonymousTitle || 'Företag'}
            </p>
          </div>

          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-light-blue p-4 rounded-xl">
              <h3 className="font-semibold mb-2">Vad är ett LOI?</h3>
              <p className="text-sm text-text-gray">
                Ett Letter of Intent (LOI) är en icke-bindande avsiktsförklaring som visar ditt seriösa intresse. Det inkluderar pris, villkor och tidsplan.
              </p>
            </div>

            {/* Price */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Prisförslag</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Minimum (MSEK)"
                  name="priceMin"
                  type="number"
                  placeholder={`Föreslagen: ${object.priceMin && !object.abstainPriceMin ? (object.priceMin / 1000000).toFixed(1) : 'N/A'}`}
                  value={loiData.priceMin}
                  onValueChange={(value) => setLoiData({ ...loiData, priceMin: value })}
                />
                <FormField
                  label="Maximum (MSEK)"
                  name="priceMax"
                  type="number"
                  placeholder={`Föreslagen: ${object.priceMax && !object.abstainPriceMax ? (object.priceMax / 1000000).toFixed(1) : 'N/A'}`}
                  value={loiData.priceMax}
                  onValueChange={(value) => setLoiData({ ...loiData, priceMax: value })}
                />
              </div>
              <p className="text-xs text-text-gray mt-2">
                Säljares prisidé: {
                  object.abstainPriceMin && object.abstainPriceMax ? 
                    'Pris ej angivet' :
                  object.abstainPriceMin ? 
                    `Från ${(object.priceMax / 1000000).toFixed(1)} MSEK` :
                  object.abstainPriceMax ?
                    `Upp till ${(object.priceMin / 1000000).toFixed(1)} MSEK` :
                  object.priceMin && object.priceMax ?
                    `${(object.priceMin / 1000000).toFixed(1)}-${(object.priceMax / 1000000).toFixed(1)} MSEK`
                    : 'Ej angivet'}
              </p>
            </div>

            {/* Transfer Method */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Överlåtelsesätt</h3>
              <div className="space-y-3">
                <div
                  onClick={() => setLoiData({ ...loiData, transferMethod: 'shares' })}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    loiData.transferMethod === 'shares'
                      ? 'border-primary-blue bg-light-blue'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      checked={loiData.transferMethod === 'shares'}
                      onChange={() => setLoiData({ ...loiData, transferMethod: 'shares' })}
                      className="mt-1 w-4 h-4 text-primary-blue"
                    />
                    <div className="ml-3">
                      <div className="font-semibold">Aktieöverlåtelse</div>
                      <p className="text-sm text-text-gray mt-1">
                        Köp av samtliga aktier i bolaget
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setLoiData({ ...loiData, transferMethod: 'assets' })}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    loiData.transferMethod === 'assets'
                      ? 'border-primary-blue bg-light-blue'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      checked={loiData.transferMethod === 'assets'}
                      onChange={() => setLoiData({ ...loiData, transferMethod: 'assets' })}
                      className="mt-1 w-4 h-4 text-primary-blue"
                    />
                    <div className="ml-3">
                      <div className="font-semibold">Inkråmsöverlåtelse</div>
                      <p className="text-sm text-text-gray mt-1">
                        Köp av rörelsen (inkråm) utan bolaget
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <FormField
              label="Önskat tillträde"
              name="closingDate"
              type="text"
              placeholder="Ex. Q2 2025 eller 2025-06-01"
              value={loiData.closingDate}
              onValueChange={(value) => setLoiData({ ...loiData, closingDate: value })}
              tooltip="När vill du genomföra överlåtelsen?"
            />

            {/* Financing */}
            <div>
              <label className="block text-sm font-semibold text-text-dark mb-3">
                Finansiering
              </label>
              <select
                value={loiData.financing}
                onChange={(e) => setLoiData({ ...loiData, financing: e.target.value })}
                className="w-full px-3 sm:px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-blue focus:outline-none"
              >
                <option value="own_capital">Eget kapital</option>
                <option value="bank_loan">Banklån (preliminärt godkänt)</option>
                <option value="mixed">Kombination eget kapital + lån</option>
                <option value="earn_out">Earn-out / avbetalning</option>
              </select>
            </div>

            {/* DD Scope */}
            <div>
              <label className="block text-sm font-semibold text-text-dark mb-3">
                Due Diligence omfattning
              </label>
              <select
                value={loiData.ddScope}
                onChange={(e) => setLoiData({ ...loiData, ddScope: e.target.value })}
                className="w-full px-3 sm:px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-blue focus:outline-none"
              >
                <option value="light">Light DD (2-3 veckor)</option>
                <option value="standard">Standard DD (4-6 veckor)</option>
                <option value="full">Full DD (8-12 veckor)</option>
              </select>
            </div>

            {/* Conditions */}
            <FormField
              label="Villkor & förbehåll"
              name="conditions"
              type="textarea"
              placeholder="Ex. Förbehåll för godkänd DD, styrelsebesked, finansiering..."
              value={loiData.conditions}
              onValueChange={(value) => setLoiData({ ...loiData, conditions: value })}
            />

            {/* Timeline */}
            <FormField
              label="Föreslagen tidsplan"
              name="timeline"
              type="textarea"
              placeholder="Ex. LOI-signering: nu, DD: vecka 1-4, SPA: vecka 6, Tillträde: vecka 8"
              value={loiData.timeline}
              onValueChange={(value) => setLoiData({ ...loiData, timeline: value })}
            />

            {/* Advisory */}
            <div className="card bg-light-blue">
              <h3 className="font-semibold mb-3 flex items-center">
                <Handshake className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-blue" />
                Behöver du rådgivare?
              </h3>
              <p className="text-sm text-text-gray mb-4">
                Vi har partnerskap med jurister och värderingsexperter. Boka kostnadsfri konsultation.
              </p>
              <button className="btn-secondary">
                Boka rådgivare →
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200">
            <button onClick={handleDownloadPDF} className="btn-secondary flex-1 flex items-center justify-center">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Ladda ner utkast (PDF)
            </button>
            <button 
              onClick={handleSendLOI} 
              disabled={isCreatingTransaction || !loiData.priceMax}
              className="btn-primary flex-1 flex items-center justify-center disabled:opacity-50"
            >
              {isCreatingTransaction ? (
                'Skickar LOI...'
              ) : (
                <>
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Skicka LOI till säljaren
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-text-gray text-center mt-4">
            LOI är icke-bindande. Efter att säljaren godkänner LOI skapas transaktionen automatiskt.
          </p>
        </div>
      </div>
    </main>
  )
}

