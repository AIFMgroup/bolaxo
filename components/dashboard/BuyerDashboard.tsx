'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Bookmark, Shield, MapPin, TrendingUp, Clock, CheckCircle, Eye, 
  XCircle, MessageSquare, FileText, ClipboardCheck, Scale, 
  Building2, Users, Briefcase, Calendar, ChevronRight, Search,
  Heart, Bell, BarChart3, Sparkles, ArrowUpRight
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import BuyerStatistics from './BuyerStatistics'

interface BuyerDashboardProps {
  userId: string
}

// Demo data for buyer dashboard
const DEMO_SAVED_LISTINGS = [
  {
    id: 'listing-1',
    anonymousTitle: 'IT-konsultbolag - Växande SaaS-företag',
    region: 'Stockholm',
    industry: 'Teknologi / SaaS',
    revenue: 28000000,
    priceMin: 50000000,
    priceMax: 65000000,
    employees: 12,
    matchScore: 92,
    isNew: true,
    hasNDA: true,
    ndaStatus: 'approved'
  },
  {
    id: 'listing-2',
    anonymousTitle: 'E-handelsbolag - D2C varumärke',
    region: 'Göteborg',
    industry: 'E-handel',
    revenue: 45000000,
    priceMin: 80000000,
    priceMax: 120000000,
    employees: 8,
    matchScore: 85,
    isNew: false,
    hasNDA: true,
    ndaStatus: 'pending'
  },
  {
    id: 'listing-3',
    anonymousTitle: 'Redovisningsbyrå - Stabil kundbas',
    region: 'Malmö',
    industry: 'Ekonomitjänster',
    revenue: 12000000,
    priceMin: 20000000,
    priceMax: 30000000,
    employees: 6,
    matchScore: 78,
    isNew: true,
    hasNDA: false,
    ndaStatus: null
  }
]

const DEMO_NDA_REQUESTS = [
  {
    id: 'nda-1',
    listingId: 'listing-1',
    listing: { anonymousTitle: 'IT-konsultbolag - Växande SaaS-företag' },
    status: 'approved',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'nda-2',
    listingId: 'listing-2',
    listing: { anonymousTitle: 'E-handelsbolag - D2C varumärke' },
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'nda-3',
    listingId: 'listing-4',
    listing: { anonymousTitle: 'Byggföretag - Renovering & nybyggnation' },
    status: 'approved',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export default function BuyerDashboard({ userId }: BuyerDashboardProps) {
  const t = useTranslations('buyerDashboard')
  const locale = useLocale()
  const isDemoUser = userId?.startsWith('demo-')
  const [savedListings, setSavedListings] = useState<any[]>([])
  const [ndaRequests, setNdaRequests] = useState<any[]>([])
  const [matchedListings, setMatchedListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading and use demo data
    setTimeout(() => {
      setSavedListings(DEMO_SAVED_LISTINGS)
      setNdaRequests(DEMO_NDA_REQUESTS)
      setMatchedListings(DEMO_SAVED_LISTINGS)
      setLoading(false)
    }, 500)
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-rose to-coral rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-navy" />
          </div>
          <p className="text-graphite">Laddar dashboard...</p>
        </div>
      </div>
    )
  }

  const approvedNDAs = ndaRequests.filter(n => n.status === 'approved')
  const pendingNDAs = ndaRequests.filter(n => n.status === 'pending')

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative bg-navy rounded-3xl p-8 md:p-10 text-white overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-sm mb-4">
              <span className="w-2 h-2 bg-mint rounded-full animate-pulse"></span>
              Köpare Dashboard
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">Välkommen tillbaka! 👋</h1>
            <p className="text-white/70 max-w-xl text-lg">
              Här hittar du dina sparade objekt, NDA-status och rekommenderade företag baserat på dina preferenser.
            </p>
          </div>
          <Link 
            href={`/${locale}/sok`}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-navy font-semibold rounded-full hover:bg-rose hover:shadow-lg transition-all group"
          >
            <Search className="w-5 h-5" />
            Sök företag
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg hover:border-rose/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-rose/30 to-coral/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bookmark className="w-6 h-6 text-navy" />
            </div>
            <span className="text-xs font-medium text-mint bg-mint/20 px-2 py-1 rounded-full">+2</span>
          </div>
          <div className="text-3xl font-bold text-navy mb-1">{savedListings.length}</div>
          <div className="text-sm text-graphite/70">Sparade objekt</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg hover:border-mint/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-mint/30 to-sky/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-navy" />
            </div>
          </div>
          <div className="text-3xl font-bold text-navy mb-1">{approvedNDAs.length}</div>
          <div className="text-sm text-graphite/70">Godkända NDA</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg hover:border-butter/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-butter/50 to-coral/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-navy" />
            </div>
          </div>
          <div className="text-3xl font-bold text-navy mb-1">{pendingNDAs.length}</div>
          <div className="text-sm text-graphite/70">Väntande NDA</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg hover:border-sky/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky/30 to-mint/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-navy" />
            </div>
            <span className="w-2.5 h-2.5 bg-coral rounded-full animate-pulse"></span>
          </div>
          <div className="text-3xl font-bold text-navy mb-1">{matchedListings.filter(m => m.isNew).length}</div>
          <div className="text-sm text-graphite/70">Nya matchningar</div>
        </div>
      </div>

      {/* Detailed Statistics with Comparison */}
      <BuyerStatistics />

      {/* Quick Tools */}
      <div id="verktyg">
        <h2 className="text-xl font-bold text-navy mb-5 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-coral" />
          Verktyg & Funktioner
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href={`/${locale}/sok`}
            className="bg-gradient-to-br from-sky/20 to-sky/5 border border-sky/30 p-6 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all group"
          >
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow">
              <Search className="w-7 h-7 text-sky" />
            </div>
            <p className="font-semibold text-navy mb-1">Sök företag</p>
            <p className="text-sm text-graphite/70">Hitta nya möjligheter</p>
            <ChevronRight className="w-5 h-5 text-sky mt-3 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href={isDemoUser ? `/${locale}/investerarprofil` : `/${locale}/dashboard/search-profile`}
            className="bg-gradient-to-br from-mint/20 to-mint/5 border border-mint/30 p-6 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all group"
          >
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow">
              <Users className="w-7 h-7 text-mint" />
            </div>
            <p className="font-semibold text-navy mb-1">Sökprofil</p>
            <p className="text-sm text-graphite/70">Uppdatera preferenser</p>
            <ChevronRight className="w-5 h-5 text-mint mt-3 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href={isDemoUser ? `/${locale}/jamfor` : `/${locale}/dashboard/compare`}
            className="bg-gradient-to-br from-rose/20 to-rose/5 border border-rose/30 p-6 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all group"
          >
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow">
              <BarChart3 className="w-7 h-7 text-rose" />
            </div>
            <p className="font-semibold text-navy mb-1">Jämför</p>
            <p className="text-sm text-graphite/70">Analysera objekt</p>
            <ChevronRight className="w-5 h-5 text-rose mt-3 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href={isDemoUser ? `/${locale}/sok` : `/${locale}/dashboard/saved`}
            className="bg-gradient-to-br from-coral/20 to-coral/5 border border-coral/30 p-6 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all group"
          >
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow">
              <Heart className="w-7 h-7 text-coral" />
            </div>
            <p className="font-semibold text-navy mb-1">Favoriter</p>
            <p className="text-sm text-graphite/70">Sparade objekt</p>
            <ChevronRight className="w-5 h-5 text-coral mt-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recommended Listings */}
        <div className="bg-white p-6 rounded-2xl border border-sand/50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-coral" />
              Rekommenderat för dig
            </h2>
            <Link href={`/${locale}/sok`} className="text-sm text-sky hover:text-navy font-medium transition-colors">
              Se alla →
            </Link>
          </div>
          
          <div className="space-y-4">
            {matchedListings.slice(0, 3).map((listing) => (
              <div key={listing.id} className="border border-sand/50 rounded-xl p-4 hover:border-navy/20 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-semibold text-navy text-sm">{listing.anonymousTitle}</h3>
                      {listing.isNew && (
                        <span className="text-xs bg-navy text-white px-2 py-0.5 rounded-full font-medium">Ny</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-graphite/70">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {listing.region}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {listing.industry}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    listing.matchScore >= 85 
                      ? 'bg-mint/30 text-navy'
                      : 'bg-sky/30 text-navy'
                  }`}>
                    {listing.matchScore}% match
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-sand/30">
                  <span className="text-sm font-bold text-navy">
                    {(listing.priceMin / 1000000).toFixed(0)}-{(listing.priceMax / 1000000).toFixed(0)} MSEK
                  </span>
                  <Link
                    href={`/${locale}/objekt/${listing.id}`}
                    className="text-xs bg-navy text-white px-4 py-2 rounded-full hover:bg-navy/90 transition-colors font-medium"
                  >
                    Visa detaljer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NDA Status */}
        <div className="bg-white p-6 rounded-2xl border border-sand/50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <Shield className="w-5 h-5 text-mint" />
              NDA-status
            </h2>
            <span className="text-sm text-graphite/70 bg-sand/30 px-3 py-1 rounded-full">
              {approvedNDAs.length} godkända
            </span>
          </div>
          
          <div className="space-y-4">
            {ndaRequests.map((nda) => (
              <div key={nda.id} className="border border-sand/50 rounded-xl p-4 hover:border-navy/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-navy mb-1.5">
                      {nda.listing?.anonymousTitle || 'Företag'}
                    </h3>
                    <div className="text-xs text-graphite/70 mb-3">
                      Skickat {new Date(nda.createdAt).toLocaleDateString('sv-SE')}
                    </div>
                    <span className={`inline-flex items-center text-xs px-3 py-1.5 rounded-full font-medium ${
                      nda.status === 'approved' 
                        ? 'bg-mint/30 text-navy' 
                        : nda.status === 'rejected'
                        ? 'bg-coral/30 text-navy'
                        : 'bg-butter/50 text-navy'
                    }`}>
                      {nda.status === 'approved' ? (
                        <><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Godkänd</>
                      ) : nda.status === 'rejected' ? (
                        <><XCircle className="w-3.5 h-3.5 mr-1.5" /> Avslagen</>
                      ) : (
                        <><Clock className="w-3.5 h-3.5 mr-1.5" /> Väntar på svar</>
                      )}
                    </span>
                  </div>
                  {nda.status === 'approved' && (
                    <Link
                      href={`/${locale}/objekt/${nda.listingId}`}
                      className="text-xs text-sky hover:text-navy font-medium transition-colors"
                    >
                      Visa detaljer →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions for Approved NDAs */}
      {approvedNDAs.length > 0 && (
        <div className="bg-gradient-to-br from-sand/30 to-rose/10 p-6 rounded-2xl border border-sand/50">
          <h2 className="text-lg font-bold text-navy mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-coral" />
            Hantera dina affärer
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {approvedNDAs.map((nda) => (
              <div key={nda.id} className="bg-white border border-sand/50 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-navy mb-4 truncate">
                  {nda.listing?.anonymousTitle || 'Objekt'}
                </h3>
                <div className="space-y-2.5">
                  <Link href={`/${locale}/kopare/qa/${nda.listingId}`} className="flex items-center gap-2.5 text-sm text-graphite/80 hover:text-navy transition-colors group">
                    <div className="w-8 h-8 bg-sky/20 rounded-lg flex items-center justify-center group-hover:bg-sky/30 transition-colors">
                      <MessageSquare className="w-4 h-4 text-sky" />
                    </div>
                    Q&A Center
                  </Link>
                  <Link href={`/${locale}/kopare/loi/${nda.listingId}`} className="flex items-center gap-2.5 text-sm text-graphite/80 hover:text-navy transition-colors group">
                    <div className="w-8 h-8 bg-rose/20 rounded-lg flex items-center justify-center group-hover:bg-rose/30 transition-colors">
                      <FileText className="w-4 h-4 text-rose" />
                    </div>
                    LoI Editor
                  </Link>
                  <Link href={`/${locale}/kopare/dd/${nda.listingId}`} className="flex items-center gap-2.5 text-sm text-graphite/80 hover:text-navy transition-colors group">
                    <div className="w-8 h-8 bg-mint/20 rounded-lg flex items-center justify-center group-hover:bg-mint/30 transition-colors">
                      <ClipboardCheck className="w-4 h-4 text-mint" />
                    </div>
                    DD Manager
                  </Link>
                  <Link href={`/${locale}/kopare/spa/${nda.listingId}`} className="flex items-center gap-2.5 text-sm text-graphite/80 hover:text-navy transition-colors group">
                    <div className="w-8 h-8 bg-butter/30 rounded-lg flex items-center justify-center group-hover:bg-butter/50 transition-colors">
                      <Scale className="w-4 h-4 text-navy" />
                    </div>
                    SPA Editor
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
