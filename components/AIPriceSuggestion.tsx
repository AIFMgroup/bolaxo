'use client'

import { useState } from 'react'

interface PriceAnalysis {
  priceRange: {
    min: number
    max: number
    recommended: number
  }
  methodology: string
  multiples: {
    revenue?: number
    ebitda?: number
    profit?: number
  }
  keyFinancials: {
    revenue?: number
    ebitda?: number
    profit?: number
    assets?: number
  }
  rationale: string
  confidence: number
  recommendations: string[]
  warnings: string[]
}

interface Props {
  listingId?: string
  dataRoomId?: string
  currentPrice?: number
  onApplyPrice?: (price: number) => void
}

export function AIPriceSuggestion({ listingId, dataRoomId, currentPrice, onApplyPrice }: Props) {
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentsAnalyzed, setDocumentsAnalyzed] = useState(0)

  const generateSuggestion = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/price-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, dataRoomId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kunde inte generera prisförslag')
      }

      const data = await res.json()
      setAnalysis(data.analysis)
      setDocumentsAnalyzed(data.documentsAnalyzed || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} MSEK`
    }
    if (value >= 1000) {
      return `${Math.round(value / 1000)} TSEK`
    }
    return `${value.toLocaleString('sv-SE')} SEK`
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-emerald-100 text-emerald-700'
    if (confidence >= 50) return 'bg-amber-100 text-amber-700'
    return 'bg-rose-100 text-rose-700'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 70) return 'Hög säkerhet'
    if (confidence >= 50) return 'Medel säkerhet'
    return 'Låg säkerhet'
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Prisförslag</h3>
            <p className="text-sm text-gray-500">Baserat på dina uppladdade dokument</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!analysis && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Låt AI analysera dina finansiella dokument och föreslå ett rimligt pris för ditt företag.
            </p>
            <button
              onClick={generateSuggestion}
              className="px-6 py-3 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors"
            >
              ✨ Generera prisförslag
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Analyserar dokument...</p>
            <p className="text-sm text-gray-400 mt-1">Detta kan ta upp till 30 sekunder</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 text-rose-700 p-4 rounded-xl">
            <p>{error}</p>
            <button
              onClick={generateSuggestion}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Försök igen
            </button>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Price Range */}
            <div className="bg-gradient-to-br from-navy to-navy/90 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/70 text-sm">Rekommenderat pris</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(analysis.confidence)}`}>
                  {getConfidenceLabel(analysis.confidence)} ({analysis.confidence}%)
                </span>
              </div>
              
              <div className="text-4xl font-bold mb-2">
                {formatCurrency(analysis.priceRange.recommended)}
              </div>
              
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <span>{formatCurrency(analysis.priceRange.min)}</span>
                <span>—</span>
                <span>{formatCurrency(analysis.priceRange.max)}</span>
              </div>

              {currentPrice && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Ditt nuvarande pris:</span>
                    <span>{formatCurrency(currentPrice)}</span>
                  </div>
                  {Math.abs(currentPrice - analysis.priceRange.recommended) > analysis.priceRange.recommended * 0.1 && (
                    <p className="text-amber-300 text-xs mt-2">
                      ⚠️ Ditt pris avviker mer än 10% från rekommendationen
                    </p>
                  )}
                </div>
              )}

              {onApplyPrice && (
                <button
                  onClick={() => onApplyPrice(analysis.priceRange.recommended)}
                  className="w-full mt-4 px-4 py-3 bg-white text-navy font-medium rounded-xl hover:bg-white/90 transition-colors"
                >
                  Använd detta pris
                </button>
              )}
            </div>

            {/* Methodology */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-2">Värderingsmetod</h4>
              <p className="text-gray-600 text-sm">{analysis.methodology}</p>
            </div>

            {/* Multiples Used */}
            {(analysis.multiples.revenue || analysis.multiples.ebitda || analysis.multiples.profit) && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Använda multiplar</h4>
                <div className="grid grid-cols-3 gap-3">
                  {analysis.multiples.revenue && (
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold text-blue-700">{analysis.multiples.revenue}x</div>
                      <div className="text-xs text-blue-600">Omsättning</div>
                    </div>
                  )}
                  {analysis.multiples.ebitda && (
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold text-emerald-700">{analysis.multiples.ebitda}x</div>
                      <div className="text-xs text-emerald-600">EBITDA</div>
                    </div>
                  )}
                  {analysis.multiples.profit && (
                    <div className="bg-violet-50 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold text-violet-700">{analysis.multiples.profit}x</div>
                      <div className="text-xs text-violet-600">Vinst</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key Financials Found */}
            {(analysis.keyFinancials.revenue || analysis.keyFinancials.ebitda || analysis.keyFinancials.profit) && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Identifierade nyckeltal</h4>
                <div className="space-y-2">
                  {analysis.keyFinancials.revenue && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Omsättning</span>
                      <span className="font-medium">{formatCurrency(analysis.keyFinancials.revenue)}</span>
                    </div>
                  )}
                  {analysis.keyFinancials.ebitda && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">EBITDA</span>
                      <span className="font-medium">{formatCurrency(analysis.keyFinancials.ebitda)}</span>
                    </div>
                  )}
                  {analysis.keyFinancials.profit && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Nettovinst</span>
                      <span className="font-medium">{formatCurrency(analysis.keyFinancials.profit)}</span>
                    </div>
                  )}
                  {analysis.keyFinancials.assets && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tillgångar</span>
                      <span className="font-medium">{formatCurrency(analysis.keyFinancials.assets)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rationale */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Motivering</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{analysis.rationale}</p>
            </div>

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Rekommendationer</h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <span className="text-gray-600">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {analysis.warnings && analysis.warnings.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-4">
                <h4 className="font-medium text-amber-800 mb-2">⚠️ Observera</h4>
                <ul className="space-y-1">
                  {analysis.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-amber-700">{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Baserat på {documentsAnalyzed} analyserade dokument. 
                Detta är endast ett förslag - rådgör med en värderingsexpert för en formell värdering.
              </p>
              <button
                onClick={generateSuggestion}
                className="mt-3 text-sm text-violet-600 hover:underline"
              >
                Kör om analys
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

