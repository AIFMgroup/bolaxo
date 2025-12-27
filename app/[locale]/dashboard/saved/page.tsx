'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Link from 'next/link'
import { Building, MapPin, TrendingUp, Calendar, Bookmark, Eye, MessageSquare, MoreVertical, Filter, Sparkles, Heart, ArrowUpRight, ChevronRight, Users, DollarSign } from 'lucide-react'
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
        const response = await fetch('/api/buyer/saved', {
          headers: {
            'x-user-id': user.id
          }
        })

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
        return <span className="px-3 py-1 text-xs rounded-full bg-mint/30 text-navy font-medium">NDA godkänd</span>
      case 'pending':
        return <span className="px-3 py-1 text-xs rounded-full bg-butter/50 text-navy font-medium">NDA väntar</span>
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative bg-navy rounded-3xl p-8 md:p-10 text-white overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-sm mb-4">
                <Heart className="w-4 h-4 text-rose" />
                Dina favoriter
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Sparade objekt</h1>
              <p className="text-white/70">Objekt du följer och är intresserad av</p>
            </div>
            <Link 
              href="/sok" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-navy font-semibold rounded-full hover:bg-rose hover:shadow-lg transition-all group"
            >
              Hitta fler objekt
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-rose/30 to-coral/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bookmark className="w-6 h-6 text-rose" />
              </div>
              <span className="text-xs font-medium text-mint bg-mint/20 px-2 py-1 rounded-full">+2</span>
            </div>
            <p className="text-3xl font-bold text-navy">{savedListings.length}</p>
            <p className="text-sm text-graphite/70">Sparade objekt</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-mint/30 to-sky/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Eye className="w-6 h-6 text-mint" />
              </div>
            </div>
            <p className="text-3xl font-bold text-navy">
              {savedListings.filter(l => l.ndaStatus === 'approved').length}
            </p>
            <p className="text-sm text-graphite/70">Med godkänd NDA</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-sky/30 to-mint/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-sky" />
              </div>
            </div>
            <p className="text-3xl font-bold text-navy">
              {savedListings.filter(l => l.matchScore >= 85).length}
            </p>
            <p className="text-sm text-graphite/70">Hög matchning (85%+)</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-coral/30 to-rose/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-coral" />
              </div>
              <span className="w-2.5 h-2.5 bg-coral rounded-full animate-pulse"></span>
            </div>
            <p className="text-3xl font-bold text-navy">
              {savedListings.filter(l => l.hasNewActivity).length}
            </p>
            <p className="text-sm text-graphite/70">Ny aktivitet</p>
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
              className={`px-4 py-2.5 text-sm rounded-full font-medium transition-all ${
                filter === option.value
                  ? 'bg-navy text-white shadow-md'
                  : 'bg-white text-graphite border border-sand/50 hover:border-navy/20 hover:bg-sand/20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Saved listings */}
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-2xl border border-sand/50 p-6 hover:shadow-lg hover:border-navy/10 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-navy">{listing.title}</h3>
                        {listing.hasNewActivity && (
                          <span className="px-3 py-1 text-xs rounded-full bg-coral/30 text-navy font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-coral rounded-full animate-pulse"></span>
                            Ny aktivitet
                          </span>
                        )}
                        {getNDABadge(listing.ndaStatus)}
                      </div>
                      <p className="text-sm text-graphite/70">{listing.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <span className="text-sm text-graphite/70">Match:</span>
                        <span className={`text-lg font-bold ${
                          listing.matchScore >= 85 ? 'text-mint' : listing.matchScore >= 70 ? 'text-sky' : 'text-graphite'
                        }`}>{listing.matchScore}%</span>
                      </div>
                      <p className="text-xs text-graphite/50">Sparad {new Date(listing.savedAt).toLocaleDateString('sv-SE')}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="bg-sand/20 rounded-xl p-3">
                      <p className="text-xs text-graphite/60 mb-1">Bransch</p>
                      <div className="flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-navy" />
                        <span className="text-sm font-medium text-navy">{listing.category}</span>
                      </div>
                    </div>
                    <div className="bg-sand/20 rounded-xl p-3">
                      <p className="text-xs text-graphite/60 mb-1">Plats</p>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-navy" />
                        <span className="text-sm font-medium text-navy">{listing.location}</span>
                      </div>
                    </div>
                    <div className="bg-sand/20 rounded-xl p-3">
                      <p className="text-xs text-graphite/60 mb-1">Omsättning</p>
                      <span className="text-sm font-medium text-navy">{listing.revenue}</span>
                    </div>
                    <div className="bg-sand/20 rounded-xl p-3">
                      <p className="text-xs text-graphite/60 mb-1">Anställda</p>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-navy" />
                        <span className="text-sm font-medium text-navy">{listing.employees}</span>
                      </div>
                    </div>
                    <div className="bg-rose/20 rounded-xl p-3">
                      <p className="text-xs text-graphite/60 mb-1">Prisintervall</p>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-rose" />
                        <span className="text-sm font-bold text-navy">{listing.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {listing.notes && (
                    <div className="bg-butter/30 rounded-xl p-4 mb-4">
                      <p className="text-sm text-navy">
                        <span className="font-semibold">Dina anteckningar:</span> {listing.notes}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-sand/30">
                    <div className="flex items-center gap-4 text-xs text-graphite/60">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Senast visad {new Date(listing.lastViewed).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/objekt/${listing.id}`}
                        className="px-5 py-2.5 text-sm bg-navy text-white rounded-full font-medium hover:bg-navy/90 transition-colors"
                      >
                        Visa objekt
                      </Link>
                      {listing.ndaStatus === 'approved' && (
                        <Link
                          href={`/kopare/chat?peerId=${listing.sellerId}&listingId=${listing.id}`}
                          className="px-5 py-2.5 text-sm bg-sky/20 text-navy rounded-full font-medium hover:bg-sky/30 transition-colors flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Chatta med säljare
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions menu */}
                <button className="p-2.5 hover:bg-sand/30 rounded-xl transition-colors ml-4 hidden md:block">
                  <MoreVertical className="w-5 h-5 text-graphite/50" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredListings.length === 0 && (
          <div className="bg-white rounded-2xl border border-sand/50 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-sand to-rose/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Bookmark className="w-10 h-10 text-navy/30" />
            </div>
            <h3 className="text-xl font-bold text-navy mb-2">Inga sparade objekt</h3>
            <p className="text-graphite/70 mb-6 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Du har inte sparat några objekt än. Utforska vår marknadsplats för att hitta spännande möjligheter.'
                : 'Inga objekt matchar ditt filter. Prova att ändra filtret för att se fler resultat.'
              }
            </p>
            <Link href="/sok" className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-full font-medium hover:shadow-lg transition-all group">
              <Sparkles className="w-4 h-4" />
              Sök objekt
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

