'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Link from 'next/link'
import { Building, Eye, Shield, MessageSquare, Edit, Pause, Play, TrendingUp, Bookmark, Trash2, CheckCircle, XCircle, Plus, Sparkles, MoreHorizontal } from 'lucide-react'
import { mockObjects } from '@/data/mockObjects'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

type ListingStatus = 'active' | 'paused' | 'draft'
type ListingPackage = 'pro' | 'pro_plus' | 'basic'

interface ListingRow {
  id: string
  title: string
  status: ListingStatus
  package: ListingPackage
  publishedAt: string | null
  expiresAt: string | null
  views: number
  viewsToday: number
  ndaRequests: number
  messages: number
  saves: number
  priceRange: string
  lastActivity: string
}

interface NDARequest {
  id: string
  buyer: { id: string; name: string; email: string; avatarUrl?: string }
  listing: { id: string; anonymousTitle: string }
  createdAt: string
  status: string
}

export default function ListingsPage() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const pathname = usePathname()
  const isDemo = Boolean(pathname?.includes('/demo/'))
  const [filter, setFilter] = useState('all')
  const [processing, setProcessing] = useState<string | null>(null)
  const [listings, setListings] = useState<ListingRow[]>([])
  const [ndaRequests, setNdaRequests] = useState<NDARequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showNDAPanel, setShowNDAPanel] = useState(false)

  const userId = user?.id
  
  useEffect(() => {
    if (!userId) return
    
    const fetchListings = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/seller/listings', { credentials: 'include' })

        if (response.ok) {
          const data = await response.json()
          setListings(data.listings)
          setNdaRequests(data.ndaRequests)
        } else {
          const obj = mockObjects[0]
          setListings([{
            id: obj.id,
            title: obj.anonymousTitle || obj.title || 'Företag till salu',
            status: 'active',
            package: 'pro',
            publishedAt: new Date(obj.createdAt).toISOString().split('T')[0],
            expiresAt: null,
            views: obj.views || 247,
            viewsToday: 12,
            ndaRequests: 8,
            messages: 12,
            saves: 23,
            priceRange: `${(obj.priceMin / 1_000_000).toFixed(0)}-${(obj.priceMax / 1_000_000).toFixed(0)} MSEK`,
            lastActivity: '2 timmar sedan'
          }])
        }
      } catch (error) {
        console.error('Error fetching listings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [userId])

  const handleListingAction = async (listingId: string, action: 'pause' | 'resume' | 'delete') => {
    if (!user) return
    setProcessing(listingId)
    try {
      if (isDemo) {
        if (action === 'delete') {
          setListings(listings.filter(l => l.id !== listingId))
          success('Annons borttagen (demo)')
        } else {
          const newStatus = action === 'pause' ? 'paused' : 'active'
          setListings(listings.map(l => l.id === listingId ? { ...l, status: newStatus } : l))
          success(action === 'pause' ? 'Annons pausad (demo)' : 'Annons aktiv igen (demo)')
        }
        return
      }

      const response = await fetch(`/api/listings/${listingId}/status?action=${action}`, {
        method: 'PATCH',
        credentials: 'include'
      })

      if (response.ok) {
        if (action === 'delete') {
          setListings(listings.filter(l => l.id !== listingId))
          success('Annons borttagen')
        } else {
          const newStatus = action === 'pause' ? 'paused' : 'active'
          setListings(listings.map(l => l.id === listingId ? { ...l, status: newStatus } : l))
          success(action === 'pause' ? 'Annons pausad' : 'Annons aktiv igen')
        }
      }
    } catch (error) {
      showError('Kunde inte uppdatera annons')
    } finally {
      setProcessing(null)
    }
  }

  const handleNDAAction = async (ndaId: string, action: 'approve' | 'reject') => {
    try {
      if (isDemo) {
        success(action === 'approve' ? 'NDA godkänd (demo)' : 'NDA avslagen (demo)')
        setNdaRequests(ndaRequests.filter(n => n.id !== ndaId))
        return
      }

      const response = await fetch('/api/admin/nda-tracking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ndaId, status: action === 'approve' ? 'approved' : 'rejected' })
      })

      if (response.ok) {
        success(action === 'approve' ? 'NDA godkänd' : 'NDA avslagen')
        setNdaRequests(ndaRequests.filter(n => n.id !== ndaId))
      }
    } catch (error) {
      showError('Något gick fel')
    }
  }

  const tabs = [
    { value: 'all', label: 'Alla', count: listings.length },
    { value: 'active', label: 'Aktiva', count: listings.filter(l => l.status === 'active').length },
    { value: 'paused', label: 'Pausade', count: listings.filter(l => l.status === 'paused').length },
    { value: 'draft', label: 'Utkast', count: listings.filter(l => l.status === 'draft').length }
  ]

  const filteredListings = listings.filter(l => filter === 'all' || l.status === filter)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">Mina annonser</h1>
            <p className="text-graphite/70 mt-1">Hantera och följ upp dina annonser</p>
          </div>
          <Link 
            href="/salja/start"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-full font-medium hover:bg-navy/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Ny annons
          </Link>
        </div>

        {/* NDA Requests Alert */}
        {ndaRequests.length > 0 && (
          <div className="bg-gradient-to-r from-butter/30 to-coral/20 border border-butter rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-coral" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy">{ndaRequests.length} nya NDA-förfrågningar</h3>
                  <p className="text-sm text-graphite/70">Väntar på din godkännande</p>
                </div>
              </div>
              <button
                onClick={() => setShowNDAPanel(!showNDAPanel)}
                className="text-sm text-navy font-medium hover:underline"
              >
                {showNDAPanel ? 'Dölj' : 'Visa alla'}
              </button>
            </div>

            {showNDAPanel && (
              <div className="space-y-3 mt-4">
                {ndaRequests.map((nda) => (
                  <div key={nda.id} className="bg-white rounded-xl p-4 border border-sand/50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose to-coral flex items-center justify-center text-navy font-bold">
                          {nda.buyer.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium text-navy">{nda.buyer.name}</h4>
                          <p className="text-xs text-graphite/60">{nda.listing.anonymousTitle}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleNDAAction(nda.id, 'approve')}
                          className="p-2 bg-mint text-navy rounded-lg hover:bg-mint/80 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleNDAAction(nda.id, 'reject')}
                          className="p-2 bg-sand/50 text-graphite rounded-lg hover:bg-coral/30 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-sand/50 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                filter === tab.value
                  ? 'bg-navy text-white'
                  : 'text-graphite hover:bg-sand/30'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Listings */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-sand/50 p-12 text-center">
              <div className="w-12 h-12 bg-sand/30 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Sparkles className="w-6 h-6 text-graphite/40" />
              </div>
              <p className="text-graphite/60">Laddar annonser...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-sand/50 p-12 text-center">
              <div className="w-16 h-16 bg-sand/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-graphite/40" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">Inga annonser</h3>
              <p className="text-graphite/60 mb-6">Skapa din första annons för att komma igång</p>
              <Link href="/salja/start" className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-full font-medium">
                <Plus className="w-4 h-4" />
                Skapa annons
              </Link>
            </div>
          ) : (
            filteredListings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-2xl border border-sand/50 p-6 hover:shadow-lg hover:border-navy/10 transition-all">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-navy">{listing.title}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        listing.status === 'active' ? 'bg-mint/30 text-navy' :
                        listing.status === 'paused' ? 'bg-butter/50 text-navy' : 'bg-sand/50 text-graphite'
                      }`}>
                        {listing.status === 'active' ? 'Aktiv' : listing.status === 'paused' ? 'Pausad' : 'Utkast'}
                      </span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        listing.package === 'pro_plus' ? 'bg-navy/10 text-navy' :
                        listing.package === 'pro' ? 'bg-rose/30 text-navy' : 'bg-sand/50 text-graphite'
                      }`}>
                        {listing.package === 'pro_plus' ? 'Pro+' : listing.package === 'pro' ? 'Pro' : 'Basic'}
                      </span>
                    </div>
                    <p className="text-sm text-graphite/60">
                      Publicerad {listing.publishedAt} • Senast: {listing.lastActivity}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-navy">{listing.priceRange}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
                  <div className="bg-sand/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-sky" />
                      <span className="text-xs text-graphite/60">Visningar</span>
                    </div>
                    <p className="text-lg font-bold text-navy">{listing.views}</p>
                  </div>
                  <div className="bg-sand/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-mint" />
                      <span className="text-xs text-graphite/60">NDA</span>
                    </div>
                    <p className="text-lg font-bold text-navy">{listing.ndaRequests}</p>
                  </div>
                  <div className="bg-sand/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-rose" />
                      <span className="text-xs text-graphite/60">Meddelanden</span>
                    </div>
                    <p className="text-lg font-bold text-navy">{listing.messages}</p>
                  </div>
                  <div className="bg-sand/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Bookmark className="w-4 h-4 text-coral" />
                      <span className="text-xs text-graphite/60">Sparningar</span>
                    </div>
                    <p className="text-lg font-bold text-navy">{listing.saves}</p>
                  </div>
                  <div className="bg-sand/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-navy" />
                      <span className="text-xs text-graphite/60">Konvertering</span>
                    </div>
                    <p className="text-lg font-bold text-navy">
                      {listing.views > 0 ? ((listing.ndaRequests / listing.views) * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-sand/30">
                  <div className="flex items-center gap-2">
                    <Link href={`/objekt/${listing.id}`} className="p-2 hover:bg-sand/30 rounded-lg transition-colors" title="Visa">
                      <Eye className="w-5 h-5 text-graphite" />
                    </Link>
                    <Link href={`/salja/redigera/${listing.id}`} className="p-2 hover:bg-sand/30 rounded-lg transition-colors" title="Redigera">
                      <Edit className="w-5 h-5 text-graphite" />
                    </Link>
                    <Link href="../analytics" className="p-2 hover:bg-sand/30 rounded-lg transition-colors" title="Analytics">
                      <TrendingUp className="w-5 h-5 text-graphite" />
                    </Link>
                    {listing.status === 'active' ? (
                      <button onClick={() => handleListingAction(listing.id, 'pause')} disabled={processing === listing.id} className="p-2 hover:bg-butter/30 rounded-lg transition-colors" title="Pausa">
                        <Pause className="w-5 h-5 text-graphite" />
                      </button>
                    ) : listing.status === 'paused' ? (
                      <button onClick={() => handleListingAction(listing.id, 'resume')} disabled={processing === listing.id} className="p-2 hover:bg-mint/30 rounded-lg transition-colors" title="Aktivera">
                        <Play className="w-5 h-5 text-mint" />
                      </button>
                    ) : null}
                    <button onClick={() => confirm('Är du säker?') && handleListingAction(listing.id, 'delete')} disabled={processing === listing.id} className="p-2 hover:bg-coral/30 rounded-lg transition-colors" title="Ta bort">
                      <Trash2 className="w-5 h-5 text-coral" />
                    </button>
                  </div>
                  {listing.messages > 0 && (
                    <Link href={`/salja/chat?listingId=${listing.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm rounded-full hover:bg-navy/90 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      {listing.messages} meddelanden
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
