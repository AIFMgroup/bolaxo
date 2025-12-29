'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Link from 'next/link'
import { Shield, CheckCircle, XCircle, Clock, MessageSquare, FileText, Sparkles, Eye, ArrowUpRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { listNDARequests, getListingById } from '@/lib/api-client'

export default function NDAStatusPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all')
  const [ndaRequests, setNdaRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const mockRequests = [
    { id: 'nda-001', objectTitle: 'E-handelsföretag inom mode', objectId: 'obj-001', status: 'approved', requestedAt: '2024-06-10', approvedAt: '2024-06-10', message: 'Vi är mycket intresserade av er e-handelsverksamhet.', documentsAvailable: 12 },
    { id: 'nda-002', objectTitle: 'SaaS-bolag inom HR', objectId: 'obj-002', status: 'pending', requestedAt: '2024-06-19', message: 'Ser synergier med vår befintliga SaaS-portfölj.', documentsAvailable: 0 },
    { id: 'nda-003', objectTitle: 'Byggföretag specialiserat på ROT', objectId: 'obj-004', status: 'approved', requestedAt: '2024-05-28', approvedAt: '2024-05-29', message: 'Intresserad av att förvärva och utveckla verksamheten.', documentsAvailable: 8 },
    { id: 'nda-004', objectTitle: 'Restaurang med central läge', objectId: 'obj-005', status: 'rejected', requestedAt: '2024-06-05', rejectedAt: '2024-06-06', message: 'Vill expandera inom restaurangbranschen.', rejectionReason: 'Uppfyller inte finansieringskrav.' }
  ]

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      try {
        const res = await listNDARequests({ buyerId: user.id })
        const withTitles = await Promise.all(res.requests.map(async (r: any) => {
          try {
            const listing = await getListingById(r.listingId)
            return { ...r, objectTitle: listing.anonymousTitle || listing.companyName || 'Objekt', objectId: listing.id, documentsAvailable: 0 }
          } catch { return r }
        }))
        setNdaRequests(withTitles)
      } catch { setNdaRequests(mockRequests) }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  const data = ndaRequests.length ? ndaRequests : mockRequests
  const filteredRequests = data.filter(r => filter === 'all' || r.status === filter)
  
  const tabs = [
    { value: 'all', label: 'Alla', count: data.length },
    { value: 'approved', label: 'Godkända', count: data.filter(r => r.status === 'approved').length },
    { value: 'pending', label: 'Väntande', count: data.filter(r => r.status === 'pending').length },
    { value: 'rejected', label: 'Avslagna', count: data.filter(r => r.status === 'rejected').length }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-mint/30 text-navy"><CheckCircle className="w-3 h-3" />Godkänd</span>
      case 'rejected': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-coral/30 text-navy"><XCircle className="w-3 h-3" />Avslagen</span>
      default: return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-butter/50 text-navy"><Clock className="w-3 h-3" />Väntar</span>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-navy">NDA-status</h1>
          <p className="text-graphite/70 mt-1">Följ upp dina sekretessavtal</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-sand/50 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose/30 to-coral/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5 text-rose" />
              </div>
            </div>
            <p className="text-2xl font-bold text-navy">{data.length}</p>
            <p className="text-sm text-graphite/70">Totala förfrågningar</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-sand/50 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-mint/30 to-sky/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5 text-mint" />
              </div>
            </div>
            <p className="text-2xl font-bold text-navy">{data.filter(r => r.status === 'approved').length}</p>
            <p className="text-sm text-graphite/70">Godkända</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-sand/50 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-butter/50 to-coral/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-navy" />
              </div>
            </div>
            <p className="text-2xl font-bold text-navy">{data.filter(r => r.status === 'pending').length}</p>
            <p className="text-sm text-graphite/70">Väntande</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-sand/50 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky/30 to-mint/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-sky" />
              </div>
            </div>
            <p className="text-2xl font-bold text-navy">{data.reduce((sum, r) => sum + (r.documentsAvailable || 0), 0)}</p>
            <p className="text-sm text-graphite/70">Dokument</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                filter === tab.value ? 'bg-navy text-white' : 'text-graphite hover:bg-sand/30'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* NDA Requests */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-sand/50 p-12 text-center">
            <div className="w-12 h-12 bg-sand/30 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles className="w-6 h-6 text-graphite/40" />
            </div>
            <p className="text-graphite/60">Laddar...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sand/50 p-12 text-center">
            <div className="w-16 h-16 bg-sand/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-graphite/40" />
            </div>
            <h3 className="text-lg font-semibold text-navy mb-2">Inga NDA-förfrågningar</h3>
            <p className="text-graphite/60">Du har inte skickat några NDA-förfrågningar än.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-2xl border border-sand/50 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-navy mb-1">{request.objectTitle}</h3>
                    <p className="text-sm text-graphite/60">Objekt-ID: {request.objectId}</p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="bg-sand/20 rounded-xl p-4 mb-4">
                  <p className="text-sm text-navy italic">"{request.message}"</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-sand/10 rounded-lg p-3">
                    <p className="text-xs text-graphite/60 mb-1">Begärd</p>
                    <p className="text-sm font-medium text-navy">{new Date(request.requestedAt).toLocaleDateString('sv-SE')}</p>
                  </div>
                  {request.approvedAt && (
                    <div className="bg-mint/10 rounded-lg p-3">
                      <p className="text-xs text-graphite/60 mb-1">Godkänd</p>
                      <p className="text-sm font-medium text-navy">{new Date(request.approvedAt).toLocaleDateString('sv-SE')}</p>
                    </div>
                  )}
                  {request.rejectedAt && (
                    <div className="bg-coral/10 rounded-lg p-3">
                      <p className="text-xs text-graphite/60 mb-1">Avslagen</p>
                      <p className="text-sm font-medium text-navy">{new Date(request.rejectedAt).toLocaleDateString('sv-SE')}</p>
                    </div>
                  )}
                  {request.status === 'approved' && (
                    <div className="bg-sky/10 rounded-lg p-3">
                      <p className="text-xs text-graphite/60 mb-1">Dokument</p>
                      <p className="text-sm font-medium text-navy">{request.documentsAvailable} tillgängliga</p>
                    </div>
                  )}
                </div>

                {request.rejectionReason && (
                  <div className="bg-coral/10 rounded-xl p-4 mb-4">
                    <p className="text-sm text-navy"><strong>Avslagsorsak:</strong> {request.rejectionReason}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-sand/30">
                  <Link href={`/objekt/${request.objectId}`} className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm rounded-full hover:bg-navy/90 transition-colors">
                    <Eye className="w-4 h-4" />
                    Visa objekt
                  </Link>
                  {request.status === 'approved' && (
                    <>
                      <Link href={`../documents?object=${request.objectId}`} className="inline-flex items-center gap-2 px-4 py-2 bg-sky/20 text-navy text-sm rounded-full hover:bg-sky/30 transition-colors">
                        <FileText className="w-4 h-4" />
                        Dokument
                      </Link>
                      <button className="inline-flex items-center gap-2 px-4 py-2 text-navy text-sm hover:bg-sand/30 rounded-full transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        Kontakta säljare
                      </button>
                    </>
                  )}
                  {request.status === 'pending' && (
                    <span className="text-sm text-graphite/60 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Väntar på säljarens godkännande...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
