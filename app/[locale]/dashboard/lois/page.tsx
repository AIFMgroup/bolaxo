'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Clock, CheckCircle2, XCircle, FileText, DollarSign, ArrowRight } from 'lucide-react'

interface LOI {
  id: string
  listingId: string
  listing: {
    id: string
    anonymousTitle: string
    companyName?: string
  }
  buyer: {
    id: string
    name: string
    email: string
  }
  proposedPrice: number
  status: string
  createdAt: string
  revisions: Array<{
    version: number
    changedBy: string
    changedByRole: string
    changes: string
    createdAt: string
  }>
}

export default function LOIListingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
      </div>
    }>
      <LOIListingsContent />
    </Suspense>
  )
}

function LOIListingsContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [lois, setLois] = useState<LOI[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('status') || 'all')

  useEffect(() => {
    const fetchLOIs = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const url = `/api/loi?sellerId=${user.id}${filterStatus !== 'all' ? `&status=${filterStatus}` : ''}`
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          setLois(data.lois || [])
        } else {
          console.error('Failed to fetch LOIs')
        }
      } catch (error) {
        console.error('Error fetching LOIs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLOIs()
  }, [user?.id, filterStatus])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proposed':
        return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 flex items-center"><Clock className="w-4 h-4 mr-2" /> Väntar på svar</span>
      case 'signed':
        return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> Godkänd</span>
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 flex items-center"><XCircle className="w-4 h-4 mr-2" /> Avslagen</span>
      default:
        return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">Utkast</span>
    }
  }

  const formatCurrency = (amount: number) => {
    return `${(amount / 1000000).toFixed(1)} MSEK`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar LOIs...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Indikativa bud (LOI)</h1>
          <p className="text-gray-600">Hantera LOIs från köpare för dina objekt</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alla ({lois.length})
            </button>
            <button
              onClick={() => setFilterStatus('proposed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'proposed'
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Väntar på svar ({lois.filter(l => l.status === 'proposed').length})
            </button>
            <button
              onClick={() => setFilterStatus('signed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'signed'
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Godkända ({lois.filter(l => l.status === 'signed').length})
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'rejected'
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Avslagna ({lois.filter(l => l.status === 'rejected').length})
            </button>
          </div>
        </div>

        {/* LOI List */}
        {lois.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Inga LOIs ännu</h2>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'all' 
                ? 'Du har inga indikativa bud från köpare ännu.'
                : `Du har inga LOIs med status "${filterStatus}".`}
            </p>
            <Link href="../listings" className="text-primary-blue hover:underline">
              Gå till dina objekt →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {lois
              .filter(loi => filterStatus === 'all' || loi.status === filterStatus)
              .map((loi) => (
                <div key={loi.id} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                            {loi.listing.companyName || loi.listing.anonymousTitle}
                          </h3>
                          <p className="text-sm text-gray-600">Från: {loi.buyer.name || loi.buyer.email}</p>
                        </div>
                        {getStatusBadge(loi.status)}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Föreslaget pris</p>
                          <p className="text-lg font-bold text-primary-blue">{formatCurrency(loi.proposedPrice)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Skapad</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(loi.createdAt).toLocaleDateString('sv-SE')}
                          </p>
                        </div>
                        {loi.revisions.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Versioner</p>
                            <p className="text-sm font-medium text-gray-900">{loi.revisions.length} revisioner</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:ml-4">
                      <Link
                        href={`/loi/${loi.id}`}
                        className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium text-center flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Se detaljer
                      </Link>
                      {loi.status === 'proposed' && (
                        <Link
                          href={`/loi/${loi.id}`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium text-center flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Hantera
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </main>
  )
}

