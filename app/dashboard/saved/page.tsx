'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Link from 'next/link'
import { Building, MapPin, TrendingUp, Calendar, Bookmark, Eye, MessageSquare, MoreVertical, Filter } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getSavedListings } from '@/lib/api-client'

export default function SavedListingsPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all')
  const [saved, setSaved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  // Fetch real data from API
  useEffect(() => {
    const fetchSavedListings = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const response = await fetch('/api/buyer/saved', { credentials: 'include' })

        if (response.ok) {
          const data = await response.json()
          setSaved(data.savedListings)
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Error fetching saved listings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSavedListings()
  }, [user])
  
  const savedListings = [
    {
      id: 'obj-001',
      title: 'E-handelsföretag inom mode',
      description: 'Lönsamt e-handelsföretag med stark tillväxt',
      category: 'E-handel',
      location: 'Stockholm',
      revenue: '15-20 MSEK',
      employees: '10-15',
      price: '18-25 MSEK',
      matchScore: 92,
      savedAt: '2024-06-15',
      ndaStatus: 'approved',
      lastViewed: '2024-06-19',
      notes: 'Mycket intressant. Väntar på Q2-siffror.',
      hasNewActivity: true,
      sellerId: 'seller-001'
    },
    {
      id: 'obj-002',
      title: 'SaaS-bolag inom HR',
      description: 'Växande SaaS med ARR 8 MSEK',
      category: 'Teknologi',
      location: 'Göteborg',
      revenue: '8-12 MSEK',
      employees: '15-20',
      price: '35-45 MSEK',
      matchScore: 87,
      savedAt: '2024-06-10',
      ndaStatus: 'pending',
      lastViewed: '2024-06-17',
      notes: 'Väntar på NDA-godkännande.',
      hasNewActivity: false,
      sellerId: 'seller-002'
    },
    {
      id: 'obj-003',
      title: 'Konsultföretag inom IT',
      description: 'Etablerat konsultbolag med stora kunder',
      category: 'Tjänster',
      location: 'Malmö',
      revenue: '20-30 MSEK',
      employees: '25-30',
      price: '15-20 MSEK',
      matchScore: 78,
      savedAt: '2024-06-05',
      ndaStatus: 'none',
      lastViewed: '2024-06-12',
      notes: '',
      hasNewActivity: false,
      sellerId: 'seller-003'
    },
    {
      id: 'obj-004',
      title: 'Byggföretag specialiserat på ROT',
      description: 'Lönsamt byggföretag med stark orderbok',
      category: 'Bygg',
      location: 'Uppsala',
      revenue: '30-40 MSEK',
      employees: '20-25',
      price: '25-35 MSEK',
      matchScore: 72,
      savedAt: '2024-05-28',
      ndaStatus: 'approved',
      lastViewed: '2024-06-08',
      notes: 'Intressant men osäker på marknaden.',
      hasNewActivity: true,
      sellerId: 'seller-004'
    }
  ]

  const data = saved.length ? saved.map(s => ({
    id: s.listing.id,
    title: s.listing.companyName || s.listing.anonymousTitle,
    description: s.listing.anonymousTitle,
    category: s.listing.industry,
    location: s.listing.location,
    revenue: s.listing.revenueRange || `${(s.listing.revenue / 1_000_000).toFixed(1)} MSEK`,
    employees: `${s.listing.employees}`,
    price: s.listing.priceMin && s.listing.priceMax
      ? `${(s.listing.priceMin / 1_000_000).toFixed(1)}-${(s.listing.priceMax / 1_000_000).toFixed(1)} MSEK`
      : 'Ej angiven',
    matchScore: 0, // TODO: Calculate match score
    savedAt: new Date(s.savedAt).toISOString().split('T')[0],
    ndaStatus: s.ndaStatus || 'none',
    lastViewed: new Date().toISOString(),
    notes: s.notes || '',
    hasNewActivity: false,
    canContact: s.canContact,
    sellerId: s.listing.user.id,
    sellerName: s.listing.user.name
  })) : savedListings

  const filteredListings = data.filter(listing => {
    if (filter === 'all') return true
    if (filter === 'nda_approved') return listing.ndaStatus === 'approved'
    if (filter === 'high_match') return listing.matchScore >= 85
    if (filter === 'new_activity') return listing.hasNewActivity
    return true
  })
  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        const res = await getSavedListings()
        setSaved(res.saved)
      } catch (e) {}
    }
    load()
  }, [user])

  const getNDABadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-50 text-emerald-600">NDA godkänd</span>
      case 'pending':
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-50 text-amber-600">NDA väntar</span>
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary-navy">Sparade objekt</h1>
            <p className="text-sm text-gray-500 mt-0.5">Objekt du följer och är intresserad av</p>
          </div>
          <Link href="/sok" className="px-3 py-2 text-sm font-medium text-primary-navy border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Hitta fler objekt
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-primary-navy/5 rounded-lg flex items-center justify-center">
                <Bookmark className="w-4 h-4 text-primary-navy" />
              </div>
              <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">+2</span>
            </div>
            <p className="text-xl font-bold text-primary-navy">{savedListings.length}</p>
            <p className="text-[11px] text-gray-500">Sparade objekt</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-primary-navy">
              {savedListings.filter(l => l.ndaStatus === 'approved').length}
            </p>
            <p className="text-[11px] text-gray-500">Med godkänd NDA</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-primary-navy">
              {savedListings.filter(l => l.matchScore >= 85).length}
            </p>
            <p className="text-[11px] text-gray-500">Hög matchning (85%+)</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-rose-600" />
              </div>
              {savedListings.filter(l => l.hasNewActivity).length > 0 && (
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
              )}
            </div>
            <p className="text-xl font-bold text-primary-navy">
              {savedListings.filter(l => l.hasNewActivity).length}
            </p>
            <p className="text-[11px] text-gray-500">Ny aktivitet</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: 'all', label: 'Alla' },
            { value: 'nda_approved', label: 'NDA godkänd' },
            { value: 'high_match', label: 'Hög matchning' },
            { value: 'new_activity', label: 'Ny aktivitet' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === option.value
                  ? 'bg-primary-navy text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Saved listings */}
        <div className="space-y-3">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 sm:p-5 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-primary-navy truncate">{listing.title}</h3>
                        {listing.hasNewActivity && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-rose-50 text-rose-600">
                            Ny aktivitet
                          </span>
                        )}
                        {getNDABadge(listing.ndaStatus)}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{listing.description}</p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="flex items-center sm:justify-end gap-1.5 mb-0.5">
                        <span className="text-[11px] text-gray-500">Match</span>
                        <span className={`text-sm font-bold ${listing.matchScore >= 80 ? 'text-emerald-600' : listing.matchScore >= 60 ? 'text-blue-600' : 'text-gray-600'}`}>
                          {listing.matchScore}%
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400">Sparad {new Date(listing.savedAt).toLocaleDateString('sv-SE')}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5">Bransch</p>
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-700">{listing.category}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5">Plats</p>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-700">{listing.location}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5">Omsättning</p>
                      <span className="text-xs font-medium text-gray-700">{listing.revenue}</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5">Anställda</p>
                      <span className="text-xs font-medium text-gray-700">{listing.employees}</span>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-[10px] text-gray-400 mb-0.5">Prisintervall</p>
                      <span className="text-xs font-medium text-primary-navy">{listing.price}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {listing.notes && (
                    <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-2.5 mb-3">
                      <p className="text-xs text-amber-800">
                        <span className="font-medium">Anteckningar:</span> {listing.notes}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Eye className="w-3 h-3" />
                      <span>Senast visad {new Date(listing.lastViewed).toLocaleDateString('sv-SE')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/objekt/${listing.id}`}
                        className="px-3 py-1.5 text-xs font-medium bg-primary-navy text-white rounded-lg hover:bg-primary-navy/90 transition-colors"
                      >
                        Visa objekt
                      </Link>
                      {listing.ndaStatus === 'approved' && (
                        <Link
                          href={`/kopare/chat?peerId=${listing.sellerId}&listingId=${listing.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-primary-navy border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Chatta
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions menu */}
                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredListings.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-primary-navy mb-1">Inga sparade objekt</h3>
            <p className="text-sm text-gray-500 mb-5">
              {filter === 'all' 
                ? 'Du har inte sparat några objekt än.'
                : 'Inga objekt matchar ditt filter.'
              }
            </p>
            <Link href="/sok" className="inline-flex px-4 py-2 text-sm font-medium bg-primary-navy text-white rounded-lg hover:bg-primary-navy/90 transition-colors">
              Sök objekt
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
