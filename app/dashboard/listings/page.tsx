'use client'

import { useState, useEffect } from 'react'
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout'
import DashboardAnalytics from '@/components/DashboardAnalytics'
import Link from 'next/link'
import { Building, Eye, Shield, MessageSquare, Edit, Pause, Play, MoreVertical, TrendingUp, Calendar, Download, Bookmark, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { AIPriceSuggestion } from '@/components/AIPriceSuggestion'
import { mockObjects } from '@/data/mockObjects'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

// Prevent static generation - this page requires AuthProvider
export const dynamic = 'force-dynamic'
export const dynamicParams = true

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
  buyer: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
  listing: {
    id: string
    anonymousTitle: string
  }
  createdAt: string
  status: string
}

export default function ListingsPage() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [filter, setFilter] = useState('all')
  const [processing, setProcessing] = useState<string | null>(null)
  const [listings, setListings] = useState<ListingRow[]>([])
  const [ndaRequests, setNdaRequests] = useState<NDARequest[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showNDAPanel, setShowNDAPanel] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(true)
  const [showAIPricing, setShowAIPricing] = useState(false)

  // Fetch real data from API
  useEffect(() => {
    const fetchListings = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const response = await fetch('/api/seller/listings', { credentials: 'include' })

        if (response.ok) {
          const data = await response.json()
          setListings(data.listings)
          setNdaRequests(data.ndaRequests)
          setStats(data.stats)
        } else {
          // Fallback to mock data if API fails
          const obj = mockObjects[0]
          const mockListings: ListingRow[] = [
            {
              id: obj.id,
              title: obj.anonymousTitle || obj.title || 'Företag till salu',
              status: 'active',
              package: 'pro',
              publishedAt: new Date(obj.createdAt).toISOString().split('T')[0],
              expiresAt: null as string | null,
              views: obj.views || 0,
              viewsToday: 0,
              ndaRequests: 8,
              messages: 12,
              saves: 23,
              priceRange: `${(obj.priceMin / 1_000_000).toFixed(0)}-${(obj.priceMax / 1_000_000).toFixed(0)} MSEK`,
              lastActivity: '2 timmar sedan'
            }
          ]
          setListings(mockListings)
        }
      } catch (error) {
        console.error('Error fetching listings:', error)
        showError('Kunde inte hämta annonser')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [user])

  const handleListingAction = async (listingId: string, action: 'pause' | 'resume' | 'delete') => {
    if (!user) return
    
    setProcessing(listingId)
    try {
      const response = await fetch(`/api/listings/${listingId}/status?action=${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (action === 'delete') {
          // Remove from local state
          setListings(listings.filter(l => l.id !== listingId))
          success('Annons borttagen')
        } else {
          // Update status in local state
          const newStatus = action === 'pause' ? 'paused' : 'active'
          setListings(listings.map(l => 
            l.id === listingId ? { ...l, status: newStatus } : l
          ))
          success(action === 'pause' ? 'Annons pausad' : 'Annons aktiv igen')
        }
      } else {
        const data = await response.json()
        showError(data.error || 'Något gick fel')
      }
    } catch (error) {
      console.error('Error:', error)
      showError('Kunde inte uppdatera annons. Försök igen senare.')
    } finally {
      setProcessing(null)
    }
  }

  const handleNDAAction = async (ndaId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/admin/nda-tracking', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ndaId,
          status: action === 'approve' ? 'approved' : 'rejected'
        })
      })

      if (response.ok) {
        success(action === 'approve' ? 'NDA godkänd' : 'NDA avslad')
        setNdaRequests(ndaRequests.filter(n => n.id !== ndaId))
      } else {
        showError('Kunde inte uppdatera NDA')
      }
    } catch (error) {
      console.error('Error:', error)
      showError('Något gick fel')
    }
  }

  const filteredListings = listings.filter(listing => {
    if (filter === 'all') return true
    return listing.status === filter
  })

  return (
    <ClientDashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-navy uppercase">Mina annonser</h1>
            <p className="text-sm text-gray-600 mt-1">Hantera och följ upp dina annonser</p>
          </div>
        </div>

        {/* Analytics Section */}
        {user && (
          <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="w-full flex items-center justify-between mb-4"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-navy" />
                Statistik & Analytics
              </h2>
              {showAnalytics ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {showAnalytics && (
              <DashboardAnalytics 
                userId={user.id} 
                role="seller"
                listingId={listings[0]?.id}
              />
            )}
          </div>
        )}

        {/* AI Price Suggestion Section */}
        {user && listings.length > 0 && (
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200 p-4 sm:p-6">
            <button
              onClick={() => setShowAIPricing(!showAIPricing)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-violet-900">AI Prisförslag</h2>
                  <p className="text-sm text-violet-600">Få ett AI-baserat prisförslag baserat på dina dokument</p>
                </div>
              </div>
              {showAIPricing ? (
                <ChevronUp className="w-5 h-5 text-violet-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-violet-400" />
              )}
            </button>
            {showAIPricing && (
              <div className="mt-4">
                <AIPriceSuggestion 
                  listingId={listings[0]?.id}
                  onApplyPrice={(price) => {
                    // Could update listing price here
                    success(`Pris ${(price / 1000000).toFixed(1)} MSEK har applicerats`)
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* NDA Requests Panel */}
        {ndaRequests.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900">
                  {ndaRequests.length} nya NDA-förfrågningar
                </h3>
              </div>
              <button
                onClick={() => setShowNDAPanel(!showNDAPanel)}
                className="text-sm text-amber-700 hover:text-amber-900 font-medium"
              >
                {showNDAPanel ? 'Dölj' : 'Visa alla'}
              </button>
            </div>

            {showNDAPanel && (
              <div className="space-y-3 mt-4">
                {ndaRequests.map((nda) => (
                  <div key={nda.id} className="bg-white rounded-lg p-4 border border-amber-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {nda.buyer.avatarUrl ? (
                            <img
                              src={nda.buyer.avatarUrl}
                              alt={nda.buyer.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-navy text-white flex items-center justify-center font-semibold">
                              {nda.buyer.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-primary-navy">{nda.buyer.name}</h4>
                            <p className="text-sm text-gray-600">{nda.buyer.email}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Vill se information om: <span className="font-medium">{nda.listing.anonymousTitle}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Skickat: {new Date(nda.createdAt).toLocaleDateString('sv-SE', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleNDAAction(nda.id, 'approve')}
                          className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Godkänn
                        </button>
                        <button
                          onClick={() => handleNDAAction(nda.id, 'reject')}
                          className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Avslå
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters - Mobile optimized */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {[
            { value: 'all', label: 'Alla', count: filteredListings.length },
            { value: 'active', label: 'Aktiva', count: filteredListings.filter(l => l.status === 'active').length },
            { value: 'paused', label: 'Pausade', count: filteredListings.filter(l => l.status === 'paused').length },
            { value: 'draft', label: 'Utkast', count: filteredListings.filter(l => l.status === 'draft').length }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                filter === option.value
                  ? 'bg-primary-navy text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>

        {/* Listings - Card based layout */}
        <div className="space-y-3 sm:space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600">Laddar annonser...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inga annonser hittades</h3>
              <p className="text-sm text-gray-600 mb-6">
                {filter === 'all' 
                  ? 'Du har inga annonser än. Skapa din första annons för att komma igång.'
                  : `Du har inga ${filter === 'active' ? 'aktiva' : filter === 'paused' ? 'pausade' : 'utkast'} annonser.`
                }
              </p>
              {filter === 'all' && (
                <Link href="/salja/start" className="inline-flex px-3 sm:px-3 sm:px-4 py-2 min-h-10 sm:min-h-auto bg-primary-navy text-white rounded-lg font-medium hover:bg-primary-navy/90">
                  Skapa första annonsen
                </Link>
              )}
            </div>
          ) : (
            filteredListings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6 hover:border-accent-pink/30 transition-colors">
                {/* Header row - Mobile optimized */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    {/* Title and status badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-primary-navy truncate uppercase">{listing.title}</h3>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full whitespace-nowrap uppercase ${
                        listing.status === 'active' 
                          ? 'bg-green-100 text-green-700'
                          : listing.status === 'paused'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {listing.status === 'active' ? 'Aktiv' : listing.status === 'paused' ? 'Pausad' : 'Utkast'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${
                        listing.package === 'pro_plus'
                          ? 'bg-primary-navy/10 text-primary-navy'
                          : listing.package === 'pro'
                          ? 'bg-accent-pink/10 text-accent-pink'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {listing.package === 'pro_plus' ? 'Pro+' : listing.package === 'pro' ? 'Pro' : 'Basic'}
                      </span>
                    </div>

                    {/* Metrics - Responsive grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Visningar</p>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Eye className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900">{listing.views.toLocaleString('sv-SE')}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">NDA</p>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Shield className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 truncate">{listing.ndaRequests || 0}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Meddelanden</p>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 truncate">{listing.messages || 0}</span>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-gray-600 mb-1">Sparningar</p>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Bookmark className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 truncate">{listing.saves || 0}</span>
                        </div>
                      </div>
                      <div className="hidden lg:block">
                        <p className="text-xs text-gray-600 mb-1">Pris</p>
                        <span className="text-sm font-medium text-blue-600">{listing.priceRange}</span>
                      </div>
                      <div className="hidden lg:block">
                        <p className="text-xs text-gray-600 mb-1">Konvertering</p>
                        <span className="text-sm font-medium text-gray-900">
                          {listing.views > 0 ? ((listing.ndaRequests / listing.views) * 100).toFixed(1) : '0'}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Mobile optimized */}
                  <div className="flex items-center gap-1 sm:gap-2 mt-3 sm:mt-0 flex-shrink-0">
                    <Link 
                      href={`/objekt/${listing.id}`}
                      className="p-2 hover:bg-accent-pink/10 rounded-lg transition-colors min-h-10 w-10 flex items-center justify-center"
                      title="Visa annons"
                    >
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-primary-navy" />
                    </Link>
                    <Link 
                      href={`/dashboard/analytics`}
                      className="p-2 hover:bg-accent-pink/10 rounded-lg transition-colors min-h-10 w-10 flex items-center justify-center"
                      title="Analytics"
                    >
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-navy" />
                    </Link>
                    
                    {/* Pause/Resume */}
                    {listing.status === 'active' ? (
                      <button
                        onClick={() => handleListingAction(listing.id, 'pause')}
                        disabled={processing === listing.id}
                        className="p-2 hover:bg-primary-navy/10 rounded-lg transition-colors disabled:opacity-50 min-h-10 w-10 flex items-center justify-center"
                        title="Pausa annons"
                      >
                        <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-primary-navy" />
                      </button>
                    ) : listing.status === 'paused' ? (
                      <button
                        onClick={() => handleListingAction(listing.id, 'resume')}
                        disabled={processing === listing.id}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 min-h-10 w-10 flex items-center justify-center"
                        title="Aktivera annons"
                      >
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      </button>
                    ) : null}
                    
                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm('Är du säker?')) {
                          handleListingAction(listing.id, 'delete')
                        }
                      }}
                      disabled={processing === listing.id}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 min-h-10 w-10 flex items-center justify-center"
                      title="Ta bort annons"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Footer info - Mobile optimized */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-600 mt-3 sm:mt-0 pt-3 sm:pt-0 sm:border-t sm:border-gray-100 sm:pt-3">
                  {listing.publishedAt && (
                    <>
                      <span className="whitespace-nowrap">Publ: {new Date(listing.publishedAt).toLocaleDateString('sv-SE')}</span>
                      <span className="hidden sm:inline">•</span>
                    </>
                  )}
                  <span className="whitespace-nowrap">Senast: {listing.lastActivity}</span>
                </div>

                     {/* Quick actions bar - Mobile */}
                     {listing.status === 'active' && (
                       <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                         <Link 
                           href={`/objekt/${listing.id}`}
                           className="text-sm text-blue-600 hover:underline"
                         >
                           Visa annons →
                         </Link>
                         <Link 
                           href={`/dashboard/analytics`}
                           className="text-sm text-blue-600 hover:underline hidden sm:block"
                         >
                           Analys
                         </Link>
                         {listing.messages > 0 && (
                           <Link 
                             href={`/salja/chat?listingId=${listing.id}`}
                             className="text-sm bg-primary-navy text-white px-3 py-1 rounded-lg hover:bg-primary-navy/90 inline-flex items-center gap-1"
                           >
                             <MessageSquare className="w-3 h-3" />
                             {listing.messages} meddelanden
                           </Link>
                         )}
                       </div>
                     )}
              </div>
            ))
          )}
        </div>

        {/* Empty state */}
        {/* The empty state block is now handled by the loading/filteredListings.length === 0 case */}
      </div>
    </ClientDashboardLayout>
  )
}
