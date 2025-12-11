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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-start gap-6 justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">Datarum</h1>
              <p className="text-gray-500 max-w-lg leading-relaxed">
                Säker dokumenthantering för din företagsförsäljning
              </p>
            </div>
            <div className="px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm text-gray-600 animate-pulse-shadow">
              Privat tills du delar
            </div>
          </div>
        </div>

        {/* Listing Tabs */}
        {listings.length > 1 && (
          <div className="flex gap-2 mb-8 p-1 bg-gray-50 rounded-2xl w-fit">
            {listings.map(listing => (
              <button
                key={listing.id}
                onClick={() => setSelectedListing(listing.id)}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedListing === listing.id
                    ? 'bg-white text-gray-900 shadow-sm animate-pulse-shadow'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {listing.anonymousTitle || listing.title}
              </button>
            ))}
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex gap-1 p-1.5 bg-gray-50 rounded-2xl w-fit mb-8">
          <button
            onClick={() => setViewMode('dataroom')}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'dataroom'
                ? 'bg-white text-gray-900 shadow-sm animate-pulse-shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Datarum
          </button>
          <button
            onClick={() => setViewMode('checklist')}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'checklist'
                ? 'bg-white text-gray-900 shadow-sm animate-pulse-shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            DD-checklista
          </button>
        </div>

        {/* Content */}
        {selectedListing && (
          <>
            {viewMode === 'dataroom' ? (
              <DataRoomManager
                listingId={selectedListing}
                listingName={currentListing?.anonymousTitle || currentListing?.title}
              />
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">DD-kravlista</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Strukturerad mall för alla due diligence-kategorier. Ladda upp per krav och följ din status.
                  </p>
                </div>
                <ReadinessChecklist
                  listingId={selectedListing}
                  onComplete={() => alert('Alla obligatoriska dokument är på plats!')}
                />
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse-shadow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.05);
          }
          50% {
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          }
        }
        @keyframes pulse-shadow-navy {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(30, 58, 95, 0.2);
          }
          50% {
            box-shadow: 0 8px 40px rgba(30, 58, 95, 0.3);
          }
        }
        .animate-pulse-shadow {
          animation: pulse-shadow 3s ease-in-out infinite;
        }
        .animate-pulse-shadow-navy {
          animation: pulse-shadow-navy 2s ease-in-out infinite;
        }
      `}</style>
    </ClientDashboardLayout>
  )
}
