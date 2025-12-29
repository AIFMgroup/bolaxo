'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { TrendingUp, Users, Target, Sparkles, MessageSquare, MapPin, Building2, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface Match {
  id: string
  listingId: string
  buyerId: string
  buyerName: string
  buyerEmail: string
  matchScore: number
  regions: string[]
  industries: string[]
  priceRange: { min: number; max: number }
  revenueRange: { min: number; max: number }
  createdAt: string
}

export default function MatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'score' | 'recent'>('score')

  useEffect(() => {
    if (!user) return
    const fetchMatches = async () => {
      try {
        const response = await fetch(`/api/matches?sellerId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setMatches(data.matches || [])
        }
      } catch (error) {
        console.error('Error fetching matches:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMatches()
  }, [user])

  const sortedMatches = [...matches].sort((a, b) => {
    if (sortBy === 'score') return b.matchScore - a.matchScore
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const tabs = [
    { value: 'score', label: 'Högsta matchning' },
    { value: 'recent', label: 'Senaste' }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Target className="w-6 h-6 text-coral" />
            Matchade köpare
          </h1>
          <p className="text-graphite/70 mt-1">Köpare som matchar din annons</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-mint/30 to-sky/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-mint" />
              </div>
            </div>
            <p className="text-3xl font-bold text-navy mb-1">{matches.filter(m => m.matchScore >= 80).length}</p>
            <p className="text-sm text-graphite/70">Hög matchning (80%+)</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-rose/30 to-coral/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-rose" />
              </div>
            </div>
            <p className="text-3xl font-bold text-navy mb-1">{matches.length}</p>
            <p className="text-sm text-graphite/70">Totala matchningar</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg transition-all group col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-sky/30 to-mint/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-sky" />
              </div>
            </div>
            <p className="text-3xl font-bold text-navy mb-1">
              {matches.length > 0 ? Math.round(matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length) : 0}%
            </p>
            <p className="text-sm text-graphite/70">Genomsnittlig matchning</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSortBy(tab.value as 'score' | 'recent')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                sortBy === tab.value ? 'bg-navy text-white' : 'text-graphite hover:bg-sand/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Matches List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-sand/50 p-12 text-center">
            <div className="w-12 h-12 bg-sand/30 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles className="w-6 h-6 text-graphite/40" />
            </div>
            <p className="text-graphite/60">Laddar matchningar...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sand/50 p-12 text-center">
            <div className="w-16 h-16 bg-sand/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-graphite/40" />
            </div>
            <h3 className="text-lg font-semibold text-navy mb-2">Inga matchningar än</h3>
            <p className="text-graphite/60">Köpare kommer att registrera sig snart</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedMatches.map((match) => {
              const isHighMatch = match.matchScore >= 80
              const isMediumMatch = match.matchScore >= 60 && match.matchScore < 80
              
              return (
                <div
                  key={match.id}
                  className={`bg-white rounded-2xl border p-6 hover:shadow-lg transition-all ${
                    isHighMatch ? 'border-mint/50 bg-mint/5' : isMediumMatch ? 'border-sky/50 bg-sky/5' : 'border-sand/50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-navy mb-1">{match.buyerName || 'Anonym köpare'}</h3>
                          <p className="text-sm text-graphite/60">{match.buyerEmail}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-full font-bold text-lg ${
                          isHighMatch ? 'bg-mint/30 text-navy' : isMediumMatch ? 'bg-sky/30 text-navy' : 'bg-sand/50 text-navy'
                        }`}>
                          {match.matchScore}%
                        </div>
                      </div>

                      {/* Match Score Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-sand/30 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isHighMatch ? 'bg-mint' : isMediumMatch ? 'bg-sky' : 'bg-coral'
                            }`}
                            style={{ width: `${match.matchScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Match Details */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-sand/20 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-sky" />
                            <span className="text-xs text-graphite/60">Regioner</span>
                          </div>
                          <p className="text-sm font-medium text-navy truncate">{match.regions.join(', ') || 'Sverige'}</p>
                        </div>
                        <div className="bg-sand/20 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-rose" />
                            <span className="text-xs text-graphite/60">Branscher</span>
                          </div>
                          <p className="text-sm font-medium text-navy truncate">{match.industries.slice(0, 2).join(', ')}</p>
                        </div>
                        <div className="bg-sand/20 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-mint" />
                            <span className="text-xs text-graphite/60">Pris</span>
                          </div>
                          <p className="text-sm font-medium text-navy">
                            {(match.priceRange.min / 1_000_000).toFixed(0)}-{(match.priceRange.max / 1_000_000).toFixed(0)}M
                          </p>
                        </div>
                        <div className="bg-sand/20 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-coral" />
                            <span className="text-xs text-graphite/60">Omsättning</span>
                          </div>
                          <p className="text-sm font-medium text-navy">
                            {(match.revenueRange.min / 1_000_000).toFixed(0)}-{(match.revenueRange.max / 1_000_000).toFixed(0)}M
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2">
                      <button className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-navy text-white text-sm rounded-full font-medium hover:bg-navy/90 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        Kontakta
                      </button>
                      <Link
                        href={`../listings/${match.listingId}`}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center px-5 py-2.5 bg-sand/30 text-navy text-sm rounded-full font-medium hover:bg-sand/50 transition-colors"
                      >
                        Se annons
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
