'use client'

import { useState, useEffect } from 'react'
import { 
  Eye, Shield, TrendingUp, TrendingDown, Bookmark,
  BarChart3, ArrowUpRight, ArrowDownRight, MessageSquare,
  Folder, Target, Loader2, Zap, Users, CheckCircle, XCircle, Clock
} from 'lucide-react'

interface StatisticsData {
  overview: {
    totalNdaRequests: number
    ndaRequestsChange: number
    approvedNdas: number
    pendingNdas: number
    rejectedNdas: number
    approvalRate: number
    savedListings: number
    messagesSent: number
    messagesChange: number
    dataRoomAccesses: number
    newMatches: number
    avgMatchScore: number
  }
  comparison: {
    sampleSize: number
    yourNdaRequests: number
    avgNdaRequests: number
    yourApprovalRate: number
    avgApprovalRate: number
    yourSavedListings: number
    avgSavedListings: number
    yourMessages: number
    avgMessages: number
    activityLevel: 'low' | 'average' | 'high' | 'very_high'
  } | null
  activityTimeline: { date: string; ndas: number }[]
  topIndustries: { industry: string; count: number }[]
  ndaBreakdown: {
    approved: number
    pending: number
    rejected: number
  }
  period: string
  periodLabel: string
}

export default function BuyerStatistics() {
  const [data, setData] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/buyer/statistics?period=${period}`)
        if (response.ok) {
          const stats = await response.json()
          setData(stats)
        }
      } catch (error) {
        console.error('Error fetching statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [period])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-sand/50 p-6">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-navy/50" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-sand/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-sky" />
          <h3 className="font-semibold text-navy">Din aktivitet</h3>
        </div>
        <p className="text-graphite/60 text-sm">
          Statistik visas när du börjar utforska objekt.
        </p>
      </div>
    )
  }

  const { overview, comparison, topIndustries, ndaBreakdown } = data

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    change, 
    suffix = '',
    color = 'sky'
  }: { 
    icon: any
    label: string
    value: number | string
    change?: number
    suffix?: string
    color?: string
  }) => {
    const colorClasses = {
      sky: 'from-sky/30 to-sky/10 text-sky',
      mint: 'from-mint/30 to-mint/10 text-mint',
      rose: 'from-rose/30 to-rose/10 text-rose',
      coral: 'from-coral/30 to-coral/10 text-coral',
    }
    
    return (
      <div className="bg-gradient-to-br from-white to-sand/20 rounded-xl p-4 border border-sand/30">
        <div className="flex items-center justify-between mb-2">
          <div className={`w-8 h-8 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.sky} rounded-lg flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
          {change !== undefined && change !== 0 && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              change > 0 ? 'text-green-600' : 'text-red-500'
            }`}>
              {change > 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-navy">{value}{suffix}</p>
        <p className="text-xs text-graphite/60">{label}</p>
      </div>
    )
  }

  const getActivityLevelLabel = (level: string) => {
    switch (level) {
      case 'very_high': return { label: 'Mycket hög', color: 'text-green-600', bg: 'bg-green-100' }
      case 'high': return { label: 'Hög', color: 'text-green-600', bg: 'bg-green-100' }
      case 'average': return { label: 'Genomsnittlig', color: 'text-amber-600', bg: 'bg-amber-100' }
      case 'low': return { label: 'Låg', color: 'text-red-500', bg: 'bg-red-100' }
      default: return { label: 'Okänd', color: 'text-gray-500', bg: 'bg-gray-100' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="bg-white rounded-2xl border border-sand/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky/30 to-mint/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h3 className="font-semibold text-navy">Din köparaktivitet</h3>
              <p className="text-xs text-graphite/60">{data.periodLabel}</p>
            </div>
          </div>
          
          {/* Period selector */}
          <div className="flex gap-1 bg-sand/30 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === p 
                    ? 'bg-white text-navy shadow-sm' 
                    : 'text-graphite/60 hover:text-navy'
                }`}
              >
                {p === '7d' ? '7 dagar' : p === '30d' ? '30 dagar' : '90 dagar'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={Shield} 
            label="NDA-förfrågningar" 
            value={overview.totalNdaRequests}
            change={overview.ndaRequestsChange}
            color="sky"
          />
          <StatCard 
            icon={CheckCircle} 
            label="Godkännandegrad" 
            value={overview.approvalRate}
            suffix="%"
            color="mint"
          />
          <StatCard 
            icon={Bookmark} 
            label="Sparade objekt" 
            value={overview.savedListings}
            color="rose"
          />
          <StatCard 
            icon={MessageSquare} 
            label="Meddelanden" 
            value={overview.messagesSent}
            change={overview.messagesChange}
            color="coral"
          />
        </div>

        {/* NDA Breakdown */}
        <div className="mt-6 pt-6 border-t border-sand/30">
          <h4 className="text-sm font-medium text-navy mb-3">NDA-status fördelning</h4>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-graphite/80">
                {ndaBreakdown.approved} godkända
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-400 rounded-full" />
              <span className="text-sm text-graphite/80">
                {ndaBreakdown.pending} väntande
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
              <span className="text-sm text-graphite/80">
                {ndaBreakdown.rejected} avslagna
              </span>
            </div>
          </div>
          
          {/* Visual bar */}
          {overview.totalNdaRequests > 0 && (
            <div className="mt-3 h-2 bg-sand/30 rounded-full overflow-hidden flex">
              <div 
                className="bg-green-500 h-full transition-all"
                style={{ width: `${(ndaBreakdown.approved / overview.totalNdaRequests) * 100}%` }}
              />
              <div 
                className="bg-amber-400 h-full transition-all"
                style={{ width: `${(ndaBreakdown.pending / overview.totalNdaRequests) * 100}%` }}
              />
              <div 
                className="bg-red-400 h-full transition-all"
                style={{ width: `${(ndaBreakdown.rejected / overview.totalNdaRequests) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Additional stats */}
        <div className="mt-6 pt-6 border-t border-sand/30 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky/20 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-sky" />
            </div>
            <div>
              <p className="text-lg font-bold text-navy">{overview.dataRoomAccesses}</p>
              <p className="text-xs text-graphite/60">Datarumsåtkomst</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mint/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-mint" />
            </div>
            <div>
              <p className="text-lg font-bold text-navy">{overview.newMatches}</p>
              <p className="text-xs text-graphite/60">Nya matchningar</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-rose" />
            </div>
            <div>
              <p className="text-lg font-bold text-navy">{overview.avgMatchScore}%</p>
              <p className="text-xs text-graphite/60">Snitt matchpoäng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison with average buyer */}
      {comparison && (
        <div className="bg-white rounded-2xl border border-sand/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose/30 to-coral/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-navy" />
              </div>
              <div>
                <h3 className="font-semibold text-navy">Jämförelse med andra köpare</h3>
                <p className="text-xs text-graphite/60">
                  Baserat på {comparison.sampleSize} aktiva köpare
                </p>
              </div>
            </div>
            
            {/* Activity level badge */}
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              getActivityLevelLabel(comparison.activityLevel).bg
            } ${getActivityLevelLabel(comparison.activityLevel).color}`}>
              {getActivityLevelLabel(comparison.activityLevel).label} aktivitet
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* NDA Requests comparison */}
            <div className="bg-sand/20 rounded-xl p-4">
              <p className="text-xs text-graphite/60 mb-1">NDA-förfrågningar</p>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-navy">{comparison.yourNdaRequests}</span>
                <span className="text-sm text-graphite/60">vs {comparison.avgNdaRequests} snitt</span>
              </div>
              {comparison.yourNdaRequests > comparison.avgNdaRequests ? (
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  Mer aktiv än snittet
                </div>
              ) : comparison.yourNdaRequests < comparison.avgNdaRequests ? (
                <div className="flex items-center gap-1 mt-2 text-sm text-amber-600">
                  <TrendingDown className="w-4 h-4" />
                  Under snittet
                </div>
              ) : (
                <p className="text-sm text-graphite/60 mt-2">På snittet</p>
              )}
            </div>

            {/* Approval rate comparison */}
            <div className="bg-sand/20 rounded-xl p-4">
              <p className="text-xs text-graphite/60 mb-1">Godkännandegrad</p>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-navy">{comparison.yourApprovalRate}%</span>
                <span className="text-sm text-graphite/60">vs {comparison.avgApprovalRate}% snitt</span>
              </div>
              {comparison.yourApprovalRate > comparison.avgApprovalRate ? (
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Bättre än snittet!
                </div>
              ) : comparison.yourApprovalRate < comparison.avgApprovalRate ? (
                <div className="flex items-center gap-1 mt-2 text-sm text-amber-600">
                  <Clock className="w-4 h-4" />
                  Under snittet
                </div>
              ) : (
                <p className="text-sm text-graphite/60 mt-2">På snittet</p>
              )}
            </div>

            {/* Saved listings comparison */}
            <div className="bg-sand/20 rounded-xl p-4">
              <p className="text-xs text-graphite/60 mb-1">Sparade objekt</p>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-navy">{comparison.yourSavedListings}</span>
                <span className="text-sm text-graphite/60">vs {comparison.avgSavedListings} snitt</span>
              </div>
              {comparison.yourSavedListings > comparison.avgSavedListings ? (
                <p className="text-sm text-green-600 mt-2">Aktiv forskare! 🔍</p>
              ) : (
                <p className="text-sm text-graphite/60 mt-2">Utforska fler objekt</p>
              )}
            </div>

            {/* Messages comparison */}
            <div className="bg-sand/20 rounded-xl p-4">
              <p className="text-xs text-graphite/60 mb-1">Meddelanden</p>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-navy">{comparison.yourMessages}</span>
                <span className="text-sm text-graphite/60">vs {comparison.avgMessages} snitt</span>
              </div>
              {comparison.yourMessages > comparison.avgMessages ? (
                <p className="text-sm text-green-600 mt-2">Aktivt kommunicerande! 💬</p>
              ) : (
                <p className="text-sm text-graphite/60 mt-2">Kommunikation är nyckeln</p>
              )}
            </div>
          </div>

          {/* Tips based on activity level */}
          {comparison.activityLevel === 'low' && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="font-medium text-amber-800 mb-2">💡 Tips för att hitta rätt objekt</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Uppdatera din sökprofil för bättre matchningar</li>
                <li>• Skicka fler NDA-förfrågningar till intressanta objekt</li>
                <li>• Spara objekt för att jämföra senare</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Top industries of interest */}
      {topIndustries.length > 0 && (
        <div className="bg-white rounded-2xl border border-sand/50 p-6">
          <h3 className="font-semibold text-navy mb-4">Dina branschintressen</h3>
          <div className="space-y-3">
            {topIndustries.map((item, index) => (
              <div key={item.industry} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-sky/20 rounded-full flex items-center justify-center text-xs font-bold text-navy">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-navy">{item.industry}</span>
                    <span className="text-xs text-graphite/60">{item.count} NDA</span>
                  </div>
                  <div className="h-1.5 bg-sand/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-sky to-mint rounded-full"
                      style={{ width: `${(item.count / topIndustries[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

