'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Clock, ChevronRight, MessageSquare, FileText, CheckCircle, AlertCircle,
  TrendingUp, Calendar, DollarSign, Users, Activity, ArrowRight
} from 'lucide-react'

interface Deal {
  id: string
  listingId: string
  companyName: string
  counterpartyName: string
  counterpartyRole: 'buyer' | 'seller'
  stage: 'nda-pending' | 'nda-signed' | 'dd-review' | 'loi-proposed' | 'spa-review' | 'closing' | 'closed' | 'dead'
  stageLabel: string
  progress: number
  lastActivity: string
  lastActivityTime: string
  pendingItems: string[]
  value?: number
  earnout?: number
  closingDate?: string
  revenue?: number
  ebitda?: number
}

const DEMO_DEALS_SELLER: Deal[] = [
  {
    id: 'deal-1',
    listingId: 'listing-1',
    companyName: 'Frisörsalong Stockholm',
    counterpartyName: 'XYZ Investment AB',
    counterpartyRole: 'buyer',
    stage: 'dd-review',
    stageLabel: 'Buyer reviewing DD',
    progress: 60,
    lastActivity: 'Buyer asked 3 questions about financials',
    lastActivityTime: '2 hours ago',
    pendingItems: ['Respond to Q&A (3 questions)', 'Confirm customer retention'],
    value: 45000000,
    earnout: 5000000,
    closingDate: 'Nov 30, 2024'
  },
  {
    id: 'deal-2',
    listingId: 'listing-2',
    companyName: 'Tech Startup AB',
    counterpartyName: 'Private Equity Partners',
    counterpartyRole: 'buyer',
    stage: 'nda-signed',
    stageLabel: 'NDA signed, awaiting DD access',
    progress: 20,
    lastActivity: 'Buyer signed NDA',
    lastActivityTime: '1 day ago',
    pendingItems: ['Grant dataroom access', 'Prepare financial docs'],
    value: 120000000,
    earnout: 20000000,
    closingDate: 'Dec 15, 2024'
  },
  {
    id: 'deal-3',
    listingId: 'listing-3',
    companyName: 'Consulting Firm',
    counterpartyName: 'Strategic Buyer Inc',
    counterpartyRole: 'buyer',
    stage: 'dead',
    stageLabel: 'Deal stalled',
    progress: 40,
    lastActivity: 'Buyer withdrew - price mismatch',
    lastActivityTime: '3 days ago',
    pendingItems: [],
    value: 25000000
  }
]

const DEMO_DEALS_BUYER: Deal[] = [
  {
    id: 'deal-b1',
    listingId: 'listing-4',
    companyName: 'E-commerce Platform',
    counterpartyName: 'Sarah Nordic AB',
    counterpartyRole: 'seller',
    stage: 'dd-review',
    stageLabel: 'Reviewing DD Report',
    progress: 70,
    lastActivity: 'Seller uploaded updated financials',
    lastActivityTime: '4 hours ago',
    pendingItems: ['Review DD findings', 'Ask clarification Q&A', 'Propose LoI'],
    revenue: 50000000,
    ebitda: 10000000,
    closingDate: 'Dec 1, 2024'
  },
  {
    id: 'deal-b2',
    listingId: 'listing-5',
    companyName: 'Restaurant Chain',
    counterpartyName: "Maria's Restaurants",
    counterpartyRole: 'seller',
    stage: 'loi-proposed',
    stageLabel: 'Waiting for LoI response',
    progress: 50,
    lastActivity: 'We proposed LoI terms',
    lastActivityTime: '5 hours ago',
    pendingItems: ['Seller to review LoI', 'Negotiate terms'],
    revenue: 30000000,
    ebitda: 6000000,
    closingDate: 'Dec 20, 2024'
  },
  {
    id: 'deal-b3',
    listingId: 'listing-6',
    companyName: 'Beauty & Wellness',
    counterpartyName: 'Anna Wellness Group',
    counterpartyRole: 'seller',
    stage: 'spa-review',
    stageLabel: 'SPA under review',
    progress: 85,
    lastActivity: 'Seller sent SPA draft for signature',
    lastActivityTime: '1 day ago',
    pendingItems: ['Legal review SPA', 'Request changes', 'Schedule signing'],
    revenue: 25000000,
    ebitda: 5000000,
    closingDate: 'Nov 25, 2024'
  }
]

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'nda-pending': return 'bg-yellow-100 text-yellow-800'
    case 'nda-signed': return 'bg-blue-100 text-blue-800'
    case 'dd-review': return 'bg-cyan-100 text-cyan-800'
    case 'loi-proposed': return 'bg-purple-100 text-purple-800'
    case 'spa-review': return 'bg-orange-100 text-orange-800'
    case 'closing': return 'bg-green-100 text-green-800'
    case 'closed': return 'bg-emerald-100 text-emerald-800'
    case 'dead': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getProgressColor = (progress: number) => {
  if (progress < 33) return 'bg-red-500'
  if (progress < 66) return 'bg-yellow-500'
  return 'bg-green-500'
}

function DealCard({ deal, userRole }: { deal: Deal; userRole: 'buyer' | 'seller' }) {
  const isDead = deal.stage === 'dead'
  
  return (
    <Link href={`/objekt/${deal.listingId}`}>
      <div className={`bg-white rounded-lg border-2 p-6 hover:shadow-lg transition-all cursor-pointer ${
        isDead ? 'border-gray-300 opacity-75' : 'border-primary-navy hover:border-primary-navy'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-primary-navy mb-1">{deal.companyName}</h3>
            <p className="text-sm text-gray-600">
              {userRole === 'buyer' ? '🛒 Seller:' : '💼 Buyer:'} {deal.counterpartyName}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStageColor(deal.stage)}`}>
            {deal.stageLabel}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-600">Progress</span>
            <span className="text-sm font-bold text-primary-navy">{deal.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(deal.progress)}`}
              style={{ width: `${deal.progress}%` }}
            />
          </div>
        </div>

        {/* Deal Terms */}
        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
          {deal.value && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Deal Value</p>
              <p className="font-bold text-primary-navy">{(deal.value / 1000000).toFixed(0)} MSEK</p>
            </div>
          )}
          {deal.revenue && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Annual Revenue</p>
              <p className="font-bold text-primary-navy">{(deal.revenue / 1000000).toFixed(0)} MSEK</p>
            </div>
          )}
          {deal.earnout && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Earnout</p>
              <p className="font-bold text-green-600">{(deal.earnout / 1000000).toFixed(0)} MSEK</p>
            </div>
          )}
          {deal.ebitda && (
            <div>
              <p className="text-xs text-gray-500 mb-1">EBITDA</p>
              <p className="font-bold text-primary-navy">{(deal.ebitda / 1000000).toFixed(0)} MSEK</p>
            </div>
          )}
          {deal.closingDate && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Est. Closing</p>
              <p className="font-bold text-primary-navy">{deal.closingDate}</p>
            </div>
          )}
        </div>

        {/* Last Activity */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">{deal.lastActivity}</p>
              <p className="text-xs text-gray-500 mt-1">{deal.lastActivityTime}</p>
            </div>
          </div>
        </div>

        {/* Pending Items */}
        {deal.pendingItems.length > 0 && !isDead && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Your Action Items:</p>
            <ul className="space-y-1">
              {deal.pendingItems.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-navy mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isDead && (
          <p className="text-sm font-medium text-gray-500 italic">This deal is no longer active</p>
        )}

        {/* CTA */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <span className="text-sm font-medium text-primary-navy">View full details</span>
          <ChevronRight className="w-5 h-5 text-primary-navy" />
        </div>
      </div>
    </Link>
  )
}

function StatsCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-gradient-to-br from-primary-navy to-primary-navy/80 text-white rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-50" />
      </div>
    </div>
  )
}

export default function DealPipelinePage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [activeDeals, setActiveDeals] = useState(0)
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    // In production, fetch from API
    // For demo, use local storage or default to seller
    const role = (localStorage.getItem('userRole') as 'buyer' | 'seller') || 'seller'
    setUserRole(role)

    const dealList = role === 'seller' ? DEMO_DEALS_SELLER : DEMO_DEALS_BUYER
    setDeals(dealList)

    const active = dealList.filter(d => d.stage !== 'dead' && d.stage !== 'closed').length
    setActiveDeals(active)

    const total = dealList
      .filter(d => d.stage !== 'dead')
      .reduce((sum, d) => sum + (d.value || d.revenue || 0), 0)
    setTotalValue(total)
  }, [])

  if (!userRole) return <div className="text-center py-20">Loading...</div>

  const closedDeals = deals.filter(d => d.stage === 'closed').length
  const deadDeals = deals.filter(d => d.stage === 'dead').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary-navy mb-2">
            {userRole === 'seller' ? '💼 My Sales' : '🛒 My Deals'}
          </h1>
          <p className="text-gray-600">
            {userRole === 'seller' 
              ? 'Track all active buyer interest and deal progression'
              : 'Manage all your active acquisitions from NDA to closing'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatsCard 
            icon={TrendingUp} 
            label="Active Deals" 
            value={activeDeals.toString()} 
          />
          <StatsCard 
            icon={DollarSign} 
            label={userRole === 'seller' ? 'Pipeline Value' : 'Capital Deployed'} 
            value={`${(totalValue / 1000000).toFixed(0)}M`} 
          />
          <StatsCard 
            icon={CheckCircle} 
            label="Closed" 
            value={closedDeals.toString()} 
          />
          <StatsCard 
            icon={AlertCircle} 
            label="Stalled" 
            value={deadDeals.toString()} 
          />
        </div>

        {/* Tabs/Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8 border-b-2 border-primary-navy">
          <div className="flex gap-2 overflow-x-auto">
            <button className="px-4 py-2 bg-primary-navy text-white rounded-lg font-medium whitespace-nowrap">
              ✓ Active Deals ({activeDeals})
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 whitespace-nowrap">
              🏁 Closed ({closedDeals})
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 whitespace-nowrap">
              ⚠️ Stalled ({deadDeals})
            </button>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            deal.stage !== 'dead' && deal.stage !== 'closed' && (
              <DealCard key={deal.id} deal={deal} userRole={userRole} />
            )
          ))}
        </div>

        {/* Empty State */}
        {activeDeals === 0 && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No active deals yet</h2>
            <p className="text-gray-500 mb-6">
              {userRole === 'seller' 
                ? 'Create a listing to attract buyers'
                : 'Search for businesses to acquire'}
            </p>
            <Link href={userRole === 'seller' ? '/salja' : '/sok'}>
              <button className="bg-primary-navy text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90">
                {userRole === 'seller' ? 'Create Listing' : 'Browse Listings'}
              </button>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8 border-l-4 border-primary-navy">
          <h2 className="text-2xl font-bold text-primary-navy mb-4">💡 Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="../messages">
              <button className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-primary-navy" />
                  <div>
                    <p className="font-semibold text-primary-navy">View All Messages</p>
                    <p className="text-sm text-gray-600">Check updates from counterparties</p>
                  </div>
                </div>
              </button>
            </Link>
            
            <Link href={userRole === 'seller' ? '/salja/sme-kit' : '/sok'}>
              <button className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700">
                      {userRole === 'seller' ? 'Update SME Kit' : 'Search Deals'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {userRole === 'seller' 
                        ? 'Add more company information'
                        : 'Find new investment opportunities'}
                    </p>
                  </div>
                </div>
              </button>
            </Link>

            <Link href="..">
              <button className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-semibold text-purple-700">Dashboard</p>
                    <p className="text-sm text-gray-600">Back to main dashboard</p>
                  </div>
                </div>
              </button>
            </Link>

            <Link href="/faq">
              <button className="w-full text-left p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-700">Help & FAQ</p>
                    <p className="text-sm text-gray-600">Get answers to common questions</p>
                  </div>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
