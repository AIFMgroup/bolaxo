'use client'

import { useEffect, useState } from 'react'
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout'
import DataRoomManager from '@/components/dataroom/DataRoomManager'
import ReadinessChecklist from '@/components/ReadinessChecklist'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Building, Lock, ArrowRight, FolderOpen, ClipboardCheck } from 'lucide-react'
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

        // Demo fallback: ensure a mock listing exists
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy/10 to-coral/10 flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 animate-spin text-navy" />
          </div>
          <p className="text-gray-500">Laddar...</p>
        </div>
      </ClientDashboardLayout>
    )
  }

  const isDemoSeller = user?.id?.startsWith('demo') || user?.role === 'seller'

  if (listings.length === 0 && !isDemoSeller) {
    return (
      <ClientDashboardLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-navy/10 to-navy/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Building className="w-10 h-10 text-navy/60" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Inget datarum än</h1>
          <p className="text-gray-500 mb-8">
            Skapa en annons först så sätter vi automatiskt upp ett säkert datarum.
          </p>
          <Link
            href="/salja/start"
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-xl font-medium hover:bg-navy/90 transition-all hover:shadow-lg hover:shadow-navy/20"
          >
            Skapa annons
            <ArrowRight className="w-4 h-4" />
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
        <div className="mb-8">
          <div className="flex flex-wrap items-start gap-6 justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Datarum</h1>
              <p className="text-gray-500 max-w-lg">
                Säker dokumenthantering för din företagsförsäljning
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-mint/10 border border-mint/30 rounded-full text-sm text-emerald-700">
              <Lock className="w-4 h-4" />
              <span>Privat tills du delar</span>
            </div>
          </div>
        </div>

        {/* Listing pills (if multiple) */}
        {listings.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {listings.map(listing => (
              <button
                key={listing.id}
                onClick={() => setSelectedListing(listing.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedListing === listing.id
                    ? 'bg-navy text-white shadow-lg shadow-navy/20'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {listing.anonymousTitle || listing.title}
              </button>
            ))}
          </div>
        )}

        {/* View toggle */}
        <div className="flex gap-1 p-1 bg-gray-100/80 rounded-xl w-fit mb-6">
          <button
            onClick={() => setViewMode('dataroom')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'dataroom'
                ? 'bg-white text-navy shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Datarum
          </button>
          <button
            onClick={() => setViewMode('checklist')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'checklist'
                ? 'bg-white text-navy shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
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
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/20 to-coral/5 flex items-center justify-center flex-shrink-0">
                      <ClipboardCheck className="w-6 h-6 text-coral" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">DD-kravlista</h3>
                      <p className="text-sm text-gray-500">
                        Strukturerad mall för alla due diligence-kategorier. Ladda upp per krav och följ din status.
                      </p>
                    </div>
                  </div>
                </div>
                <ReadinessChecklist
                  listingId={selectedListing}
                  onComplete={() => {
                    alert('Alla obligatoriska dokument är på plats!')
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </ClientDashboardLayout>
  )
}
