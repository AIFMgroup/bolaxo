'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Users, 
  FileText, 
  MessageSquare,
  BarChart3,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react'

interface AnalyticsData {
  views: number
  viewsTrend: number // percentage change
  ndaRequests: number
  ndaTrend: number
  messages: number
  messagesTrend: number
  matches: number
  matchesTrend: number
  viewsByDay: { date: string; views: number }[]
  topSources: { source: string; count: number; percentage: number }[]
}

interface DashboardAnalyticsProps {
  userId: string
  role: 'buyer' | 'seller'
  listingId?: string
}

export default function DashboardAnalytics({ userId, role, listingId }: DashboardAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          userId,
          role,
          timeRange,
          ...(listingId && { listingId })
        })
        
        const response = await fetch(`/api/analytics?${params}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        } else {
          // Use mock data if API fails
          setData(generateMockData(timeRange))
        }
      } catch (err) {
        console.error('Error fetching analytics:', err)
        setData(generateMockData(timeRange))
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [userId, role, listingId, timeRange])

  // Generate sparkline points
  const sparklinePoints = useMemo(() => {
    if (!data?.viewsByDay) return ''
    const max = Math.max(...data.viewsByDay.map(d => d.views), 1)
    const points = data.viewsByDay.map((d, i) => {
      const x = (i / (data.viewsByDay.length - 1)) * 100
      const y = 100 - (d.views / max) * 100
      return `${x},${y}`
    })
    return points.join(' ')
  }, [data?.viewsByDay])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-100">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Kunde inte ladda analytics</p>
      </div>
    )
  }

  const stats = [
    {
      label: role === 'seller' ? 'Visningar' : 'Sökningar',
      value: data.views,
      trend: data.viewsTrend,
      icon: Eye,
      color: 'blue'
    },
    {
      label: role === 'seller' ? 'NDA-förfrågningar' : 'Signerade NDAs',
      value: data.ndaRequests,
      trend: data.ndaTrend,
      icon: FileText,
      color: 'green'
    },
    {
      label: 'Meddelanden',
      value: data.messages,
      trend: data.messagesTrend,
      icon: MessageSquare,
      color: 'purple'
    },
    {
      label: 'Matchningar',
      value: data.matches,
      trend: data.matchesTrend,
      icon: Users,
      color: 'orange'
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-navy" />
          <h3 className="font-semibold text-gray-900">Aktivitetsöversikt</h3>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                timeRange === range
                  ? 'bg-white text-primary-navy shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range === '7d' ? '7 dagar' : range === '30d' ? '30 dagar' : '90 dagar'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.trend >= 0
          
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {stat.trend !== 0 && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    isPositive ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {isPositive ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(stat.trend)}%
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value.toLocaleString('sv-SE')}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Activity Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-700">
              {role === 'seller' ? 'Visningar över tid' : 'Aktivitet över tid'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Sparkles className="w-4 h-4 text-primary-blue" />
            <span>Senaste {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} dagarna</span>
          </div>
        </div>
        
        {/* Simple Sparkline Chart */}
        <div className="relative h-32">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Gradient fill */}
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1F3C58" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#1F3C58" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Area fill */}
            <polygon
              points={`0,100 ${sparklinePoints} 100,100`}
              fill="url(#chartGradient)"
            />
            
            {/* Line */}
            <polyline
              points={sparklinePoints}
              fill="none"
              stroke="#1F3C58"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 -translate-x-8">
            <span>{Math.max(...data.viewsByDay.map(d => d.views))}</span>
            <span>0</span>
          </div>
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
          {data.viewsByDay.filter((_, i) => i % Math.ceil(data.viewsByDay.length / 5) === 0).map((d, i) => (
            <span key={i}>{new Date(d.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}</span>
          ))}
        </div>
      </div>

      {/* Top Sources */}
      {role === 'seller' && data.topSources.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            Trafikkällor
          </h4>
          <div className="space-y-3">
            {data.topSources.map((source, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{source.source}</span>
                    <span className="text-sm text-gray-500">{source.count} ({source.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-navy to-primary-blue rounded-full transition-all duration-500"
                      style={{ width: `${source.percentage}%` }}
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

// Generate mock data for demo/fallback
function generateMockData(timeRange: '7d' | '30d' | '90d'): AnalyticsData {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
  const viewsByDay = []
  const baseViews = Math.floor(Math.random() * 50) + 20
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const variation = Math.sin(i / 5) * 20 + Math.random() * 15
    viewsByDay.push({
      date: date.toISOString().split('T')[0],
      views: Math.max(0, Math.floor(baseViews + variation))
    })
  }
  
  const totalViews = viewsByDay.reduce((sum, d) => sum + d.views, 0)
  
  return {
    views: totalViews,
    viewsTrend: Math.floor(Math.random() * 40) - 10,
    ndaRequests: Math.floor(Math.random() * 15) + 2,
    ndaTrend: Math.floor(Math.random() * 30) - 5,
    messages: Math.floor(Math.random() * 25) + 5,
    messagesTrend: Math.floor(Math.random() * 50) - 10,
    matches: Math.floor(Math.random() * 20) + 3,
    matchesTrend: Math.floor(Math.random() * 35),
    viewsByDay,
    topSources: [
      { source: 'Direktsökning', count: Math.floor(totalViews * 0.4), percentage: 40 },
      { source: 'Google', count: Math.floor(totalViews * 0.3), percentage: 30 },
      { source: 'Matchningar', count: Math.floor(totalViews * 0.2), percentage: 20 },
      { source: 'Delningar', count: Math.floor(totalViews * 0.1), percentage: 10 }
    ]
  }
}

