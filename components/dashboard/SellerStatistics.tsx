'use client'

import { useState, useEffect } from 'react'
import { 
  Eye, Users, TrendingUp, TrendingDown, Minus, 
  BarChart3, ArrowUpRight, ArrowDownRight, Shield,
  MessageSquare, Clock, CheckCircle, Loader2
} from 'lucide-react'

interface StatisticsData {
  listings: any[]
  totals: {
    views: number
    viewsChange: number
    ndaRequests: number
    ndaRequestsChange: number
    conversionRate: number
    conversionRateChange: number
    messages: number
    messagesChange: number
    pendingNdas: number
    approvedNdas: number
  }
  dailyViews: { date: string; views: number }[]
  comparison: {
    industry: string
    yourViews: number
    avgViews: number
    viewsVsAvg: number
    yourNdaRequests: number
    avgNdaRequests: number
    yourConversionRate: number
    avgConversionRate: number
    sampleSize: number
  } | null
  period: string
  periodLabel: string
}

export default function SellerStatistics() {
  const [data, setData] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/seller/statistics?period=${period}`)
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

  if (!data || data.listings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-sand/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-sky" />
          <h3 className="font-semibold text-navy">Statistik</h3>
        </div>
        <p className="text-graphite/60 text-sm">
          Statistik visas när du har aktiva annonser.
        </p>
      </div>
    )
  }

  const { totals, comparison } = data

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    change, 
    suffix = '' 
  }: { 
    icon: any
    label: string
    value: number | string
    change?: number
    suffix?: string
  }) => (
    <div className="bg-gradient-to-br from-white to-sand/20 rounded-xl p-4 border border-sand/30">
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 bg-sky/20 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-sky" />
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
              <h3 className="font-semibold text-navy">Annonsstatistik</h3>
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
            icon={Eye} 
            label="Visningar" 
            value={totals.views}
            change={totals.viewsChange}
          />
          <StatCard 
            icon={Shield} 
            label="NDA-förfrågningar" 
            value={totals.ndaRequests}
            change={totals.ndaRequestsChange}
          />
          <StatCard 
            icon={TrendingUp} 
            label="Konvertering" 
            value={totals.conversionRate}
            suffix="%"
          />
          <StatCard 
            icon={MessageSquare} 
            label="Meddelanden" 
            value={totals.messages}
            change={totals.messagesChange}
          />
        </div>

        {/* NDA breakdown */}
        <div className="mt-6 pt-6 border-t border-sand/30">
          <h4 className="text-sm font-medium text-navy mb-3">NDA-status</h4>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-400 rounded-full" />
              <span className="text-sm text-graphite/80">
                {totals.pendingNdas} väntande
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-graphite/80">
                {totals.approvedNdas} godkända
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Industry comparison */}
      {comparison && (
        <div className="bg-white rounded-2xl border border-sand/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-rose/30 to-coral/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h3 className="font-semibold text-navy">Jämförelse med branschen</h3>
              <p className="text-xs text-graphite/60">
                {comparison.industry} • Baserat på {comparison.sampleSize} objekt
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Views comparison */}
            <div className="bg-sand/20 rounded-xl p-4">
              <p className="text-xs text-graphite/60 mb-1">Visningar</p>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-navy">{comparison.yourViews}</span>
                <span className="text-sm text-graphite/60">vs {comparison.avgViews} snitt</span>
              </div>
              <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                comparison.viewsVsAvg >= 0 ? 'text-green-600' : 'text-red-500'
              }`}>
                {comparison.viewsVsAvg >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {comparison.viewsVsAvg >= 0 ? '+' : ''}{comparison.viewsVsAvg}% mot snittet
              </div>
            </div>

            {/* NDA comparison */}
            <div className="bg-sand/20 rounded-xl p-4">
              <p className="text-xs text-graphite/60 mb-1">NDA-förfrågningar</p>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-navy">{comparison.yourNdaRequests}</span>
                <span className="text-sm text-graphite/60">vs {comparison.avgNdaRequests} snitt</span>
              </div>
              {comparison.yourNdaRequests > comparison.avgNdaRequests ? (
                <p className="text-sm text-green-600 mt-2">Över genomsnittet! 🎉</p>
              ) : comparison.yourNdaRequests < comparison.avgNdaRequests ? (
                <p className="text-sm text-amber-600 mt-2">Under genomsnittet</p>
              ) : (
                <p className="text-sm text-graphite/60 mt-2">På genomsnittet</p>
              )}
            </div>

            {/* Conversion comparison */}
            <div className="bg-sand/20 rounded-xl p-4">
              <p className="text-xs text-graphite/60 mb-1">Konverteringsgrad</p>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-navy">{comparison.yourConversionRate}%</span>
                <span className="text-sm text-graphite/60">vs {comparison.avgConversionRate}% snitt</span>
              </div>
              {comparison.yourConversionRate > comparison.avgConversionRate ? (
                <p className="text-sm text-green-600 mt-2">Bättre än snittet!</p>
              ) : comparison.yourConversionRate < comparison.avgConversionRate ? (
                <p className="text-sm text-amber-600 mt-2">Kan förbättras</p>
              ) : (
                <p className="text-sm text-graphite/60 mt-2">På genomsnittet</p>
              )}
            </div>
          </div>

          {/* Tips */}
          {comparison.yourConversionRate < comparison.avgConversionRate && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="font-medium text-amber-800 mb-2">💡 Tips för högre konvertering</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Lägg till fler bilder på företaget</li>
                <li>• Uppdatera beskrivningen med konkreta styrkor</li>
                <li>• Se till att nyckeltal är uppdaterade</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Per-listing stats */}
      {data.listings.length > 1 && (
        <div className="bg-white rounded-2xl border border-sand/50 p-6">
          <h3 className="font-semibold text-navy mb-4">Per annons</h3>
          <div className="space-y-3">
            {data.listings.map((listing) => (
              <div 
                key={listing.id}
                className="flex items-center justify-between p-3 bg-sand/20 rounded-xl"
              >
                <div className="flex-1">
                  <p className="font-medium text-navy text-sm">{listing.title}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-graphite/60">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {listing.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {listing.ndaRequests}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {listing.conversionRate}%
                    </span>
                  </div>
                </div>
                <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                  listing.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {listing.status === 'active' ? 'Aktiv' : listing.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

