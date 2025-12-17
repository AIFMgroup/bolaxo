'use client'

import { useState } from 'react'
import { 
  Sparkles, CheckCircle, AlertTriangle, MapPin, Building2, 
  Banknote, Users, TrendingUp, Briefcase, ChevronDown, ChevronUp,
  Loader2, RefreshCw, Info
} from 'lucide-react'

interface MatchReason {
  type: string
  category: string
  title: string
  description: string
}

interface MatchExplanationData {
  listingId: string
  matchScore: number
  explanation: string
  reasons: MatchReason[]
  highlights: string[]
  concerns: string[]
  recommendation: string
}

interface MatchExplanationProps {
  listingId: string
  initialScore?: number
  compact?: boolean
  onExplanationLoaded?: (data: MatchExplanationData) => void
}

const categoryIcons: Record<string, any> = {
  bransch: Briefcase,
  region: MapPin,
  pris: Banknote,
  storlek: Building2,
  tillväxt: TrendingUp,
  lönsamhet: TrendingUp,
  övrigt: Info,
}

const categoryColors: Record<string, string> = {
  bransch: 'from-sky/30 to-sky/10 text-sky',
  region: 'from-rose/30 to-rose/10 text-rose',
  pris: 'from-mint/30 to-mint/10 text-mint',
  storlek: 'from-coral/30 to-coral/10 text-coral',
  tillväxt: 'from-butter/50 to-butter/20 text-navy',
  lönsamhet: 'from-mint/30 to-mint/10 text-mint',
  övrigt: 'from-sand/50 to-sand/20 text-graphite',
}

export default function MatchExplanation({ 
  listingId, 
  initialScore, 
  compact = false,
  onExplanationLoaded 
}: MatchExplanationProps) {
  const [data, setData] = useState<MatchExplanationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(!compact)

  const fetchExplanation = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/matches/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId })
      })
      
      if (response.ok) {
        const explanationData = await response.json()
        setData(explanationData)
        onExplanationLoaded?.(explanationData)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Kunde inte hämta förklaring')
      }
    } catch (err) {
      console.error('Error fetching match explanation:', err)
      setError('Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  // Compact view - just a button to load explanation
  if (compact && !data && !loading) {
    return (
      <button
        onClick={fetchExplanation}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky hover:text-navy bg-sky/10 hover:bg-sky/20 rounded-full transition-all"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Varför matchar detta?
      </button>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-sand/20 rounded-xl">
        <Loader2 className="w-5 h-5 animate-spin text-navy/50" />
        <span className="text-sm text-graphite/70">Analyserar matchning med AI...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
        <span className="text-sm text-red-700">{error}</span>
        <button
          onClick={fetchExplanation}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Försök igen
        </button>
      </div>
    )
  }

  // No data yet and not compact - show prompt
  if (!data) {
    return (
      <button
        onClick={fetchExplanation}
        className="w-full p-4 bg-gradient-to-r from-sky/10 to-mint/10 border border-sky/30 rounded-xl hover:border-sky/50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-sky" />
          </div>
          <div className="text-left">
            <p className="font-medium text-navy">Varför matchar detta objekt dig?</p>
            <p className="text-xs text-graphite/60">Klicka för AI-analys baserad på din profil</p>
          </div>
        </div>
      </button>
    )
  }

  // Data loaded - show explanation
  return (
    <div className="bg-white border border-sand/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-sand/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky/30 to-mint/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-navy" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-navy">AI Matchningsanalys</p>
            <p className="text-xs text-graphite/60">
              {data.matchScore}% matchning • {data.reasons.length} träffar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            data.matchScore >= 80 ? 'bg-mint/30 text-navy' :
            data.matchScore >= 60 ? 'bg-sky/30 text-navy' :
            data.matchScore >= 40 ? 'bg-butter/50 text-navy' :
            'bg-sand/50 text-graphite'
          }`}>
            {data.matchScore}%
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-graphite/50" />
          ) : (
            <ChevronDown className="w-5 h-5 text-graphite/50" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-sand/30 p-4 space-y-4">
          {/* Summary */}
          <p className="text-sm text-graphite/80 leading-relaxed">
            {data.explanation}
          </p>

          {/* Match reasons */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-navy uppercase tracking-wide">
              Matchningsfaktorer
            </h4>
            <div className="grid gap-2">
              {data.reasons.map((reason, index) => {
                const Icon = categoryIcons[reason.category] || Info
                const colorClass = categoryColors[reason.category] || categoryColors.övrigt
                
                return (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 bg-sand/20 rounded-xl"
                  >
                    <div className={`w-8 h-8 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-navy text-sm">{reason.title}</p>
                      <p className="text-xs text-graphite/70 mt-0.5">{reason.description}</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-mint flex-shrink-0 mt-1" />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Highlights */}
          {data.highlights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-navy uppercase tracking-wide">
                Höjdpunkter
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.highlights.map((highlight, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-mint/20 text-navy text-xs font-medium rounded-full"
                  >
                    <CheckCircle className="w-3 h-3" />
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Concerns */}
          {data.concerns.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-navy uppercase tracking-wide">
                Att tänka på
              </h4>
              <div className="space-y-1">
                {data.concerns.map((concern, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-2 text-xs text-amber-700"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{concern}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="p-4 bg-gradient-to-r from-sky/10 to-mint/10 rounded-xl border border-sky/20">
            <h4 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">
              Rekommendation
            </h4>
            <p className="text-sm text-navy">
              {data.recommendation}
            </p>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchExplanation}
            className="flex items-center gap-1.5 text-xs text-graphite/50 hover:text-navy transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Uppdatera analys
          </button>
        </div>
      )}
    </div>
  )
}

// Compact inline version for listing cards
export function MatchBadge({ 
  score, 
  onClick 
}: { 
  score: number
  onClick?: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 ${
        score >= 80 ? 'bg-mint/30 text-navy hover:bg-mint/40' :
        score >= 60 ? 'bg-sky/30 text-navy hover:bg-sky/40' :
        score >= 40 ? 'bg-butter/50 text-navy hover:bg-butter/60' :
        'bg-sand/50 text-graphite hover:bg-sand/60'
      }`}
      title="Klicka för att se varför"
    >
      <Sparkles className="w-3 h-3" />
      {score}% match
    </button>
  )
}

