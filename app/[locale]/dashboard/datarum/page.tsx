'use client'

import { useEffect, useState } from 'react'
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout'
import DataRoomManager from '@/components/dataroom/DataRoomManager'
import ReadinessChecklist from '@/components/ReadinessChecklist'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface Listing {
  id: string
  title: string
  anonymousTitle?: string
  status: string
  readinessScore?: number
}

type ViewMode = 'dataroom' | 'checklist'

export default function DataRoomPage() {
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListing, setSelectedListing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('dataroom')

  useEffect(() => {
    const fetchListings = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch('/api/seller/listings', {
          headers: { 'x-user-id': user.id }
        })
        if (res.ok) {
          const data = await res.json()
          const fetched = data.listings || []
          if (fetched.length > 0) {
            setListings(fetched)
            setSelectedListing(fetched[0].id)
            return
          }
        }

        // Demo fallback
        if (user.id.startsWith('demo') || user.role === 'seller') {
          const demoListing = {
            id: 'demo-listing-1',
            title: 'Demo Företag AB',
            anonymousTitle: 'Tillväxtbolag inom tjänster',
            status: 'active' as const,
            readinessScore: 82,
          }
          setListings([demoListing])
          setSelectedListing(demoListing.id)
        }
      } catch (err) {
        console.error('Error fetching listings:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchListings()
  }, [user])

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      </ClientDashboardLayout>
    )
  }

  const isDemoSeller = user?.id?.startsWith('demo') || user?.role === 'seller'

  if (listings.length === 0 && !isDemoSeller) {
    return (
      <ClientDashboardLayout>
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center animate-pulse-shadow">
            <span className="text-3xl font-light text-gray-300">+</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Inget datarum än</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Skapa en annons först så sätter vi automatiskt upp ett säkert datarum.
          </p>
          <Link
            href="/salja/start"
            className="inline-flex px-8 py-4 bg-navy text-white rounded-2xl font-medium hover:bg-navy/90 transition-all hover:shadow-xl hover:shadow-navy/20 animate-pulse-shadow-navy"
          >
            Skapa annons
          </Link>
        </div>
      </ClientDashboardLayout>
    )
  }

  const currentListing = listings.find(l => l.id === selectedListing)

  return (
    <ClientDashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Responsive */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">Datarum</h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto leading-relaxed px-4">
            Säker dokumenthantering för din företagsförsäljning
          </p>
          <div className="mt-3 sm:mt-4 inline-flex px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-gray-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-gray-600 animate-pulse-shadow">
            Privat tills du delar
          </div>
        </div>

        {/* Listing Tabs - Horizontal scroll on mobile */}
        {listings.length > 1 && (
          <div className="flex justify-start sm:justify-center mb-6 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
            <div className="flex gap-2 p-1.5 bg-gray-50 rounded-xl sm:rounded-2xl">
              {listings.map(listing => (
                <button
                  key={listing.id}
                  onClick={() => setSelectedListing(listing.id)}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    selectedListing === listing.id
                      ? 'bg-white text-gray-900 shadow-lg animate-pulse-shadow'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                >
                  {listing.anonymousTitle || listing.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View Mode Tabs - Responsive */}
        <div className="flex justify-center mb-6 sm:mb-10">
          <div className="flex gap-1 sm:gap-2 p-1.5 sm:p-2 bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 animate-pulse-shadow-strong w-full sm:w-auto max-w-md">
            <button
              onClick={() => setViewMode('dataroom')}
              className={`flex-1 sm:flex-none px-4 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold transition-all duration-300 ${
                viewMode === 'dataroom'
                  ? 'bg-navy text-white shadow-xl shadow-navy/30'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Datarum
            </button>
            <button
              onClick={() => setViewMode('checklist')}
              className={`flex-1 sm:flex-none px-4 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold transition-all duration-300 ${
                viewMode === 'checklist'
                  ? 'bg-navy text-white shadow-xl shadow-navy/30'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              DD-checklista
            </button>
          </div>
        </div>

        {/* Content with enhanced boxes - Responsive padding */}
        {selectedListing && (
          <div className="animate-fade-in">
            {viewMode === 'dataroom' ? (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-xl animate-pulse-shadow-strong">
                <DataRoomManager
                  listingId={selectedListing}
                  listingName={currentListing?.anonymousTitle || currentListing?.title}
                />
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-xl animate-pulse-shadow-strong">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">DD-kravlista</h3>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                    Strukturerad mall för alla due diligence-kategorier. Ladda upp per krav och följ din status.
                  </p>
                </div>
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-xl animate-pulse-shadow-strong">
                  <ReadinessChecklist
                    listingId={selectedListing}
                    onComplete={() => alert('Alla obligatoriska dokument är på plats!')}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse-shadow {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          }
          50% {
            box-shadow: 0 8px 40px rgba(0, 0, 0, 0.1);
          }
        }
        @keyframes pulse-shadow-strong {
          0%, 100% {
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02);
          }
          50% {
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.03);
          }
        }
        @keyframes pulse-shadow-navy {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(30, 58, 95, 0.2);
          }
          50% {
            box-shadow: 0 12px 50px rgba(30, 58, 95, 0.35);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-pulse-shadow {
          animation: pulse-shadow 3s ease-in-out infinite;
        }
        .animate-pulse-shadow-strong {
          animation: pulse-shadow-strong 4s ease-in-out infinite;
        }
        .animate-pulse-shadow-navy {
          animation: pulse-shadow-navy 2.5s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </ClientDashboardLayout>
  )
}
