'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Shield, CheckCircle, XCircle, Clock, MessageSquare, User, Calendar, FileText, AlertCircle } from 'lucide-react'
import { listNDARequests, updateNDAStatus } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthContext'

export default function NDAsPage() {
  const { user } = useAuth()
  const pathname = usePathname()
  const isDemo = Boolean(pathname?.includes('/demo/'))
  const [filter, setFilter] = useState('all')
  const [requests, setRequests] = useState<any[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  
  const mockNDAs = [
    {
      id: 'nda-001',
      listingTitle: 'E-handelsföretag i Stockholm',
      buyerName: 'Investmentbolaget Nord',
      buyerEmail: 'johan.andersson@investnord.se',
      buyerCompany: 'Investment Nord AB',
      buyerType: 'Private Equity',
      status: 'pending',
      requestedAt: '2024-06-20 14:30',
      message: 'Vi är mycket intresserade av er e-handelsverksamhet och har erfarenhet från liknande förvärv. Vi har tidigare förvärvat 3 e-handelsbolag och ser synergier.',
      verificationStatus: 'bankid_verified',
      matchScore: 92,
      previousInteractions: 0
    },
    {
      id: 'nda-002',
      listingTitle: 'SaaS-bolag med ARR 8 MSEK',
      buyerName: 'Anna Lindberg',
      buyerEmail: 'anna@techventures.se',
      buyerCompany: 'Tech Ventures AB',
      buyerType: 'Strategic Buyer',
      status: 'approved',
      requestedAt: '2024-06-19 09:15',
      approvedAt: '2024-06-19 11:30',
      message: 'Ser synergier med vår befintliga SaaS-portfölj.',
      verificationStatus: 'bankid_verified',
      matchScore: 87,
      previousInteractions: 3
    },
    {
      id: 'nda-003',
      listingTitle: 'Konsultbolag inom IT',
      buyerName: 'Erik Svensson',
      buyerEmail: 'erik.s@gmail.com',
      buyerCompany: 'Privatperson',
      buyerType: 'Individual',
      status: 'rejected',
      requestedAt: '2024-06-18 16:45',
      rejectedAt: '2024-06-18 17:30',
      message: 'Intresserad av att ta över och driva vidare.',
      verificationStatus: 'email_only',
      matchScore: 54,
      previousInteractions: 0
    },
    {
      id: 'nda-004',
      listingTitle: 'E-handelsföretag i Stockholm',
      buyerName: 'Maria Eriksson',
      buyerEmail: 'maria@nordiccapital.se',
      buyerCompany: 'Nordic Capital Partners',
      buyerType: 'Private Equity',
      status: 'pending',
      requestedAt: '2024-06-20 10:15',
      message: 'Vi letar aktivt efter e-handelsbolag i Norden med potential för internationell expansion.',
      verificationStatus: 'bankid_verified',
      matchScore: 88,
      previousInteractions: 1
    }
  ]

  const filteredNDAs = (requests.length ? requests : mockNDAs).filter(nda => {
    if (filter === 'all') return true
    return nda.status === filter
  })
  useEffect(() => {
    const load = async () => {
      if (!user) return
      if (isDemo) {
        setRequests(mockNDAs)
        return
      }
      try {
        const res = await listNDARequests({ sellerId: user.id })
        setRequests(res.requests)
      } catch (e) {}
    }
    load()

    // Poll for updates every 10 seconds (skip in demo)
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [user, isDemo])

  const handleApprove = async (ndaId: string, nda: any) => {
    setProcessing(ndaId)
    try {
      if (isDemo) {
        setRequests((prev) => (prev.length ? prev : mockNDAs).map(n => n.id === ndaId ? { ...n, status: 'approved', approvedAt: new Date().toISOString() } : n))
        return
      }
      // Uppdatera NDA-status (API:et skapar automatiskt meddelande)
      const response = await fetch(`/api/nda-requests/${ndaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      })

      if (response.ok) {
        // Refresh requests from API
        const res = await listNDARequests({ sellerId: user?.id })
        setRequests(res.requests)
      }
    } catch (error) {
      console.error('Error approving NDA:', error)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (ndaId: string) => {
    setProcessing(ndaId)
    try {
      if (isDemo) {
        setRequests((prev) => (prev.length ? prev : mockNDAs).map(n => n.id === ndaId ? { ...n, status: 'rejected', rejectedAt: new Date().toISOString() } : n))
        return
      }
      const response = await fetch(`/api/nda-requests/${ndaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      })

      if (response.ok) {
        // Refresh requests from API
        const res = await listNDARequests({ sellerId: user?.id })
        setRequests(res.requests)
      }
    } catch (error) {
      console.error('Error rejecting NDA:', error)
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Godkänd
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Avslagen
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3 mr-1" />
            Väntar
          </span>
        )
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-navy uppercase">NDA-FÖRFRÅGNINGAR</h1>
          <p className="text-sm text-gray-600 mt-1">Hantera sekretessavtal</p>
        </div>

        {/* Stats - Mobile optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 hover:border-accent-pink/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-accent-pink" />
              <span className="text-xs text-accent-pink font-semibold hidden sm:block uppercase">Nytt</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary-navy">
              {(requests.length ? requests : mockNDAs).filter((n: any) => n.status === 'pending').length}
            </p>
            <p className="text-xs text-gray-600 font-medium">Väntande</p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 hover:border-accent-pink/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-navy" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary-navy">
              {(requests.length ? requests : mockNDAs).filter((n: any) => n.status === 'approved').length}
            </p>
            <p className="text-xs text-gray-600 font-medium">Godkända</p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 hover:border-accent-pink/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary-navy">
              {(requests.length ? requests : mockNDAs).filter((n: any) => n.status === 'rejected').length}
            </p>
            <p className="text-xs text-gray-600 font-medium">Avslagna</p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 hover:border-accent-pink/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-accent-pink" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary-navy">
              {(requests.length ? requests : mockNDAs).length}
            </p>
            <p className="text-xs text-gray-600 font-medium">Totalt</p>
          </div>
        </div>

        {/* Filters - Mobile responsive */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {[
            { value: 'all', label: 'Alla' },
            { value: 'pending', label: 'Väntande' },
            { value: 'approved', label: 'Godkända' },
            { value: 'rejected', label: 'Avslagna' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 text-sm rounded-lg font-semibold transition-all ${
                filter === option.value
                  ? 'bg-primary-navy text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* NDA Requests - Card based */}
        <div className="space-y-3 sm:space-y-4">
          {filteredNDAs.map((nda) => (
            <div key={nda.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-primary-navy mb-1 truncate">
                        {nda.status === 'approved' || nda.status === 'signed' 
                          ? (nda.buyerName || nda.buyerEmail || 'Okänd köpare')
                          : 'Anonym köpare'}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {nda.status === 'approved' || nda.status === 'signed'
                          ? (nda.buyerCompany || nda.buyerRegion || 'Köpare')
                          : (nda.buyerType || 'Köparprofil')}
                      </p>
                    </div>
                    {getStatusBadge(nda.status)}
                  </div>

                  {/* Message */}
                  <div className="bg-neutral-white rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-primary-navy italic line-clamp-2">"{nda.message}"</p>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600 mb-1">Annons</p>
                      <p className="text-xs sm:text-sm font-medium text-primary-navy truncate">{nda.listingTitle}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600 mb-1">Typ</p>
                      <p className="text-xs sm:text-sm font-medium text-primary-navy truncate">
                        {nda.buyerType || (nda.buyerCompany ? 'Företag' : 'Privatperson')}
                      </p>
                    </div>
                    {(nda.status === 'approved' || nda.status === 'signed') && nda.buyerEmail && (
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600 mb-1">Email</p>
                        <p className="text-xs sm:text-sm font-medium text-primary-navy truncate">{nda.buyerEmail}</p>
                      </div>
                    )}
                    {(nda.status === 'approved' || nda.status === 'signed') && nda.buyerPhone && (
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600 mb-1">Telefon</p>
                        <p className="text-xs sm:text-sm font-medium text-primary-navy truncate">{nda.buyerPhone}</p>
                      </div>
                    )}
                    <div className="hidden sm:block min-w-0">
                      <p className="text-xs text-gray-600 mb-1">Verifiering</p>
                      <p className="text-xs sm:text-sm font-medium text-primary-navy">
                        {nda.buyerBankIdVerified || nda.buyerVerified ? (
                          <span className="text-accent-pink flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> BankID
                          </span>
                        ) : (
                          <span className="text-gray-600">E-post</span>
                        )}
                      </p>
                    </div>
                    {nda.buyerRegion && (
                      <div className="hidden lg:block min-w-0">
                        <p className="text-xs text-gray-600 mb-1">Region</p>
                        <p className="text-xs sm:text-sm font-medium text-primary-navy truncate">{nda.buyerRegion}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="text-xs text-gray-600">
                    Begärd: {new Date(nda.createdAt || nda.requestedAt).toLocaleDateString('sv-SE')}
                    {nda.approvedAt && (
                      <span className="ml-3 text-green-600">
                        Godkänd: {new Date(nda.approvedAt).toLocaleDateString('sv-SE')}
                      </span>
                    )}
                    {nda.rejectedAt && (
                      <span className="ml-3 text-red-600">
                        Avslagen: {new Date(nda.rejectedAt).toLocaleDateString('sv-SE')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                  {nda.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(nda.id, nda)}
                        disabled={processing === nda.id}
                        className="flex-1 sm:flex-none px-3 sm:px-3 sm:px-3 sm:px-4 py-2 min-h-10 sm:min-h-auto bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors text-xs sm:text-sm min-h-10 sm:min-h-auto"
                      >
                        Godkänn
                      </button>
                      <button
                        onClick={() => handleReject(nda.id)}
                        disabled={processing === nda.id}
                        className="flex-1 sm:flex-none px-3 sm:px-3 sm:px-3 sm:px-4 py-2 min-h-10 sm:min-h-auto bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors text-xs sm:text-sm min-h-10 sm:min-h-auto"
                      >
                        Avslå
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
