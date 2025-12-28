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
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">NDA godkänd</span>
      case 'pending':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">NDA väntar</span>
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary-navy">Sparade objekt</h1>
            <p className="text-sm text-gray-600 mt-1">Objekt du följer och är intresserad av</p>
          </div>
          <Link href="/sok" className="btn-secondary">
            Hitta fler objekt
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-navy" />
              <span className="text-xs text-navy font-medium">+2</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary-navy">{savedListings.length}</p>
            <p className="text-xs text-gray-600">Sparade objekt</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-navy" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary-navy">
              {savedListings.filter(l => l.ndaStatus === 'approved').length}
            </p>
            <p className="text-xs text-gray-600">Med godkänd NDA</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-navy" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary-navy">
              {savedListings.filter(l => l.matchScore >= 85).length}
            </p>
            <p className="text-xs text-gray-600">Hög matchning (85%+)</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-navy" />
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary-navy">
              {savedListings.filter(l => l.hasNewActivity).length}
            </p>
            <p className="text-xs text-gray-600">Ny aktivitet</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {[
            { value: 'all', label: 'Alla' },
            { value: 'nda_approved', label: 'NDA godkänd' },
            { value: 'high_match', label: 'Hög matchning' },
            { value: 'new_activity', label: 'Ny aktivitet' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 sm:px-3 sm:px-4 py-2 min-h-10 sm:min-h-auto text-sm rounded-lg transition-colors ${
                filter === option.value
                  ? 'bg-primary-navy text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Saved listings */}
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-primary-navy">{listing.title}</h3>
                        {listing.hasNewActivity && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                            Ny aktivitet
                          </span>
                        )}
                        {getNDABadge(listing.ndaStatus)}
                      </div>
                      <p className="text-sm text-gray-600">{listing.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <span className="text-sm text-gray-600">Match:</span>
                        <span className="text-lg font-semibold text-navy">{listing.matchScore}%</span>
                      </div>
                      <p className="text-xs text-gray-600">Sparad {new Date(listing.savedAt).toLocaleDateString('sv-SE')}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Bransch</p>
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-primary-navy">{listing.category}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Plats</p>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-primary-navy">{listing.location}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Omsättning</p>
                      <span className="text-sm font-medium text-primary-navy">{listing.revenue}</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Anställda</p>
                      <span className="text-sm font-medium text-primary-navy">{listing.employees}</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Prisintervall</p>
                      <span className="text-sm font-medium text-navy">{listing.price}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {listing.notes && (
                    <div className="bg-amber-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-amber-900">
                        <strong>Dina anteckningar:</strong> {listing.notes}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Senast visad {new Date(listing.lastViewed).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/objekt/${listing.id}`}
                        className="btn-primary text-sm"
                      >
                        Visa objekt
                      </Link>
                      {listing.ndaStatus === 'approved' && (
                        <Link
                          href={`/kopare/chat?peerId=${listing.sellerId}&listingId=${listing.id}`}
                          className="px-3 py-1.5 text-sm bg-primary-navy text-white hover:bg-primary-navy/90 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Chatta med säljare
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions menu */}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-4">
                  <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredListings.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary-navy mb-2">Inga sparade objekt</h3>
            <p className="text-sm text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Du har inte sparat några objekt än.'
                : 'Inga objekt matchar ditt filter.'
              }
            </p>
            <Link href="/sok" className="btn-primary inline-flex items-center">
              Sök objekt
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
