'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, Eye, Users, CheckCircle, XCircle, Clock, Edit, 
  MessageSquare, BarChart3, HelpCircle, FileText, Target, 
  Building2, MapPin, Calendar, Briefcase, 
  ArrowRight, Settings, PauseCircle, PlayCircle, ChevronRight,
  UserCheck, FileSignature, Shield, Sparkles
} from 'lucide-react'
import { DEMO_DEALS, DEMO_QA_QUESTIONS, DEMO_ENGAGEMENT_DATA } from '@/lib/demo-data'
import { useLocale, useTranslations } from 'next-intl'

const DEMO_MODE = true // Set to true to show demo data

interface SellerDashboardProps {
  userId: string
}

// Single company data for demo
const DEMO_COMPANY = {
  id: 'listing-1',
  companyName: 'CloudTech Solutions AB',
  anonymousTitle: 'IT-konsultbolag - Växande SaaS-företag',
  status: 'active',
  views: 247,
  uniqueVisitors: 89,
  ndaRequests: 12,
  approvedNdas: 8,
  region: 'Stockholm',
  industry: 'Teknologi / SaaS',
  revenueRange: '25-30 MSEK',
  askingPrice: '50-65 MSEK',
  ebitdaMargin: '20%',
  employees: 12,
  foundedYear: 2015,
  description: 'Molnbaserad bokföringsplattform för småföretag med stark tillväxt och låg churn.',
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
}

export default function SellerDashboard({ userId }: SellerDashboardProps) {
  const locale = useLocale()
  const t = useTranslations('sellerDashboard')
  const [company, setCompany] = useState<typeof DEMO_COMPANY | null>(null)
  const [ndaRequests, setNdaRequests] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSellerData()
  }, [userId])

  const fetchSellerData = async () => {
    try {
      if (DEMO_MODE) {
        setCompany(DEMO_COMPANY)
        setNdaRequests(DEMO_DEALS.map(deal => ({
          ...deal,
          buyerName: deal.id === 'deal-1' ? 'Industrikapital Partners' : 
                     deal.id === 'deal-2' ? 'Nordic Capital AB' : 'Ratos Förvärv',
          buyerType: 'PE-fond',
          status: deal.id === 'deal-1' ? 'pending' : 'approved'
        })))
        setMessages(DEMO_QA_QUESTIONS.map(q => ({
          id: q.id,
          subject: q.question,
          content: q.question,
          createdAt: q.createdAt,
          read: q.status === 'answered',
          buyerName: 'Intresserad köpare'
        })))
      } else {
        const listingsRes = await fetch(`/api/listings?userId=${userId}`)
        if (listingsRes.ok) {
          const data = await listingsRes.json()
          if (data.length > 0) {
            setCompany(data[0])
          }
        }

        const ndaRes = await fetch(`/api/nda-requests?userId=${userId}&role=seller`)
        if (ndaRes.ok) {
          const data = await ndaRes.json()
          setNdaRequests(data.requests || [])
        }

        const msgRes = await fetch(`/api/messages?userId=${userId}`)
        if (msgRes.ok) {
          const data = await msgRes.json()
          setMessages(data.messages || [])
        }
      }
    } catch (error) {
      console.error('Error fetching seller data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!company) return
    const newStatus = company.status === 'active' ? 'paused' : 'active'
    
    try {
      const response = await fetch(`/api/listings/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        setCompany({ ...company, status: newStatus })
      }
    } catch (error) {
      console.error('Error toggling listing status:', error)
    }
  }

  const handleNDAResponse = async (ndaId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/nda-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ndaId, status })
      })
      
      if (response.ok) {
        fetchSellerData()
      }
    } catch (error) {
      console.error('Error updating NDA:', error)
    }
  }

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

  // No company registered yet
  if (!company) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-sand to-rose/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-10 h-10 text-navy" />
        </div>
        <h2 className="text-2xl font-bold text-navy mb-4">Lägg till ditt företag</h2>
        <p className="text-graphite/70 mb-8 text-lg">
          Du har inte registrerat något företag för försäljning ännu. 
          Kom igång genom att skapa din första annons.
        </p>
        <Link 
          href={`/${locale}/salja/start`} 
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-navy to-navy/90 text-white rounded-full font-semibold hover:shadow-lg transition-all group"
        >
          Skapa annons
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    )
  }

  const pendingNDAs = ndaRequests.filter(n => n.status === 'pending')
  const unreadMessages = messages.filter(m => !m.read)

  return (
    <div className="space-y-8">
      {/* Company Header Card */}
      <div className="relative bg-gradient-to-br from-navy via-navy/95 to-sky/30 rounded-3xl p-8 md:p-10 text-white overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${
                company.status === 'active' 
                  ? 'bg-mint/20 text-mint border border-mint/30' 
                  : 'bg-butter/20 text-butter border border-butter/30'
              }`}>
                {company.status === 'active' ? (
                  <>
                    <span className="w-2 h-2 bg-mint rounded-full mr-2 animate-pulse"></span>
                    Aktiv annons
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-4 h-4 mr-1.5" />
                    Pausad
                  </>
                )}
              </span>
              <span className="text-white/50 text-sm">
                Publicerad {new Date(company.createdAt).toLocaleDateString('sv-SE')}
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-white">{company.anonymousTitle}</h1>
            <p className="text-white/70 mb-5 max-w-2xl text-lg">{company.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <MapPin className="w-4 h-4" />
                {company.region}
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <Briefcase className="w-4 h-4" />
                {company.industry}
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <Users className="w-4 h-4" />
                {company.employees} anställda
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <Calendar className="w-4 h-4" />
                Grundat {company.foundedYear}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 min-w-[200px]">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 text-center">
              <div className="text-sm text-white/60 mb-1">Prisintervall</div>
              <div className="text-2xl font-bold">{company.askingPrice}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 text-center">
              <div className="text-sm text-white/60 mb-1">Omsättning</div>
              <div className="text-2xl font-bold">{company.revenueRange}</div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="relative flex flex-wrap gap-3 mt-8 pt-6 border-t border-white/20">
          <Link 
            href={`/${locale}/objekt/${company.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-all"
          >
            <Eye className="w-4 h-4" />
            Visa annons
          </Link>
          <Link 
            href={`/${locale}/salja/redigera/${company.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-all"
          >
            <Edit className="w-4 h-4" />
            Redigera
          </Link>
          <button 
            onClick={handleToggleStatus}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-all"
          >
            {company.status === 'active' ? (
              <>
                <PauseCircle className="w-4 h-4" />
                Pausa annons
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                Aktivera annons
              </>
            )}
          </button>
          <Link 
            href={`/${locale}/salja/settings`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-all"
          >
            <Settings className="w-4 h-4" />
            Inställningar
          </Link>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg hover:border-sky/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky/30 to-sky/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6 text-sky" />
            </div>
            <span className="text-xs font-medium text-mint bg-mint/20 px-2 py-1 rounded-full">+18%</span>
          </div>
          <div className="text-3xl font-bold text-navy mb-1">{company.views}</div>
          <div className="text-sm text-graphite/70">Visningar</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg hover:border-rose/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-rose/30 to-coral/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-rose" />
            </div>
            <span className="text-xs font-medium text-mint bg-mint/20 px-2 py-1 rounded-full">+12%</span>
          </div>
          <div className="text-3xl font-bold text-navy mb-1">{company.uniqueVisitors}</div>
          <div className="text-sm text-graphite/70">Unika besökare</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg hover:border-mint/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-mint/30 to-sky/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSignature className="w-6 h-6 text-mint" />
            </div>
          </div>
          <div className="text-3xl font-bold text-navy mb-1">{company.ndaRequests}</div>
          <div className="text-sm text-graphite/70">NDA-förfrågningar</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-sand/50 hover:shadow-lg hover:border-butter/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-butter/50 to-coral/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-navy" />
            </div>
            {(pendingNDAs.length + unreadMessages.length) > 0 && (
              <span className="w-2.5 h-2.5 bg-coral rounded-full animate-pulse"></span>
            )}
          </div>
          <div className="text-3xl font-bold text-navy mb-1">{pendingNDAs.length + unreadMessages.length}</div>
          <div className="text-sm text-graphite/70">Väntande ärenden</div>
        </div>
      </div>

      {/* Quick Tools Grid */}
      <div>
        <h2 className="text-xl font-bold text-navy mb-5 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-coral" />
          Verktyg & Funktioner
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Link 
            href={`/${locale}/salja/sme-kit`} 
            className="bg-gradient-to-br from-sky/20 to-sky/5 border border-sky/30 p-6 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all group"
          >
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow">
              <FileText className="w-7 h-7 text-sky" />
            </div>
            <p className="font-semibold text-navy mb-1">SME Kit</p>
            <p className="text-sm text-graphite/70">Förbered försäljning</p>
            <ChevronRight className="w-5 h-5 text-sky mt-3 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href={`/${locale}/salja/heat-map/${company.id}`} 
            className="bg-gradient-to-br from-rose/20 to-rose/5 border border-rose/30 p-6 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all group"
          >
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow">
              <BarChart3 className="w-7 h-7 text-rose" />
            </div>
            <p className="font-semibold text-navy mb-1">Heat Map</p>
            <p className="text-sm text-graphite/70">Se köparengagemang</p>
            <ChevronRight className="w-5 h-5 text-rose mt-3 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href={`/${locale}/kopare/qa/${company.id}`} 
            className="bg-gradient-to-br from-mint/20 to-mint/5 border border-mint/30 p-6 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all group"
          >
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow">
              <HelpCircle className="w-7 h-7 text-mint" />
            </div>
            <p className="font-semibold text-navy mb-1">Q&A Center</p>
            <p className="text-sm text-graphite/70">Svara på frågor</p>
            <ChevronRight className="w-5 h-5 text-mint mt-3 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href={`/${locale}/salja/earnout/${company.id}`} 
            className="bg-gradient-to-br from-coral/20 to-coral/5 border border-coral/30 p-6 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all group"
          >
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow">
              <Target className="w-7 h-7 text-coral" />
            </div>
            <p className="font-semibold text-navy mb-1">Earnout</p>
            <p className="text-sm text-graphite/70">Spåra KPI</p>
            <ChevronRight className="w-5 h-5 text-coral mt-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending NDA Requests */}
        <div className="bg-white p-6 rounded-2xl border border-sand/50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <Shield className="w-5 h-5 text-mint" />
              NDA-förfrågningar
            </h2>
            <span className="text-sm text-graphite/70 bg-sand/30 px-3 py-1 rounded-full">
              {pendingNDAs.length} väntande
            </span>
          </div>
          
          {pendingNDAs.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-sand/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-graphite/40" />
              </div>
              <p className="text-graphite/60">Inga väntande NDA-förfrågningar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingNDAs.slice(0, 4).map((nda) => (
                <div key={nda.id} className="border border-sand/50 rounded-xl p-4 hover:border-navy/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-navy truncate">
                          {nda.buyerName || 'Intresserad köpare'}
                        </h3>
                        <span className="text-xs px-2.5 py-0.5 bg-sky/20 text-navy rounded-full font-medium">
                          {nda.buyerType || 'Köpare'}
                        </span>
                      </div>
                      {nda.message && (
                        <p className="text-sm text-graphite/70 line-clamp-2 mb-2">"{nda.message}"</p>
                      )}
                      <div className="text-xs text-graphite/50">
                        {new Date(nda.createdAt || nda.approvedAt).toLocaleDateString('sv-SE')}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleNDAResponse(nda.id, 'approved')}
                        className="p-2.5 bg-mint text-navy rounded-xl hover:bg-mint/80 transition-colors"
                        title="Godkänn"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleNDAResponse(nda.id, 'rejected')}
                        className="p-2.5 bg-sand/50 text-graphite rounded-xl hover:bg-coral/30 transition-colors"
                        title="Avslå"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingNDAs.length > 4 && (
                <Link 
                  href={`/${locale}/salja/nda-requests`}
                  className="block text-center text-sm text-sky hover:text-navy font-medium py-2 transition-colors"
                >
                  Visa alla {pendingNDAs.length} förfrågningar →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recent Questions */}
        <div className="bg-white p-6 rounded-2xl border border-sand/50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky" />
              Senaste frågor
            </h2>
            <span className="text-sm text-graphite/70 bg-sand/30 px-3 py-1 rounded-full">
              {unreadMessages.length} obesvarade
            </span>
          </div>
          
          {messages.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-sand/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-graphite/40" />
              </div>
              <p className="text-graphite/60">Inga frågor ännu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.slice(0, 4).map((msg) => (
                <div 
                  key={msg.id} 
                  className={`border rounded-xl p-4 transition-all ${
                    msg.read 
                      ? 'border-sand/50 bg-white' 
                      : 'border-l-4 border-l-sky border-sand/50 bg-sky/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-navy">
                      {msg.buyerName || 'Köpare'}
                    </span>
                    <span className="text-xs text-graphite/50">
                      {new Date(msg.createdAt).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                  <p className="text-sm text-graphite/70 line-clamp-2">{msg.content}</p>
                </div>
              ))}
              <Link 
                href={`/${locale}/kopare/qa/${company.id}`}
                className="block text-center text-sm text-sky hover:text-navy font-medium py-2 transition-colors"
              >
                Gå till Q&A Center →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Engagement Overview */}
      <div className="bg-white p-6 rounded-2xl border border-sand/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose" />
            Köparengagemang
          </h2>
          <Link 
            href={`/${locale}/salja/heat-map/${company.id}`}
            className="text-sm text-sky hover:text-navy font-medium transition-colors"
          >
            Visa detaljerad analys →
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand/50">
                <th className="text-left text-sm font-medium text-graphite/70 py-3">Dokument</th>
                <th className="text-center text-sm font-medium text-graphite/70 py-3">Visningar</th>
                <th className="text-center text-sm font-medium text-graphite/70 py-3">Tid spenderad</th>
                <th className="text-center text-sm font-medium text-graphite/70 py-3">Nedladdat</th>
                <th className="text-right text-sm font-medium text-graphite/70 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ENGAGEMENT_DATA.slice(0, 4).map((item, index) => (
                <tr key={index} className="border-b border-sand/30 hover:bg-sand/10 transition-colors">
                  <td className="py-4 text-sm font-medium text-navy">{item.document}</td>
                  <td className="py-4 text-center text-sm text-graphite/70">{item.views}</td>
                  <td className="py-4 text-center text-sm text-graphite/70">{item.timeSpentMinutes} min</td>
                  <td className="py-4 text-center">
                    {item.downloaded ? (
                      <CheckCircle className="w-5 h-5 text-mint mx-auto" />
                    ) : (
                      <span className="text-graphite/30">—</span>
                    )}
                  </td>
                  <td className="py-4 text-right text-sm">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      item.engagementScore >= 80 
                        ? 'bg-mint/30 text-navy' 
                        : item.engagementScore >= 50 
                        ? 'bg-butter/50 text-navy'
                        : 'bg-sand/50 text-graphite'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
