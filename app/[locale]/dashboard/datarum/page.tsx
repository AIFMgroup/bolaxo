'use client'

import { useEffect, useState } from 'react'
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout'
import DataRoomManager from '@/components/dataroom/DataRoomManager'
import ReadinessChecklist from '@/components/ReadinessChecklist'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Building, Sparkles, ShieldCheck, Bell, Plus, FolderOpen, ClipboardCheck } from 'lucide-react'
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
          setListings(data.listings || [])
          if (data.listings?.length > 0) {
            setSelectedListing(data.listings[0].id)
          }
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
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-navy" />
        </div>
      </ClientDashboardLayout>
    )
  }

  if (listings.length === 0) {
    return (
      <ClientDashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-20 h-20 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building className="w-10 h-10 text-navy" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-4">Inget datarum än</h1>
          <p className="text-gray-600 mb-8">
            Skapa först en annons så sätter vi upp ett datarum med alla dokument du behöver inför due diligence.
          </p>
          <Link
            href="/salja/start"
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-xl font-medium hover:bg-navy/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
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
        <div className="mb-8">
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-7 h-7 text-coral" />
                <h1 className="text-2xl font-bold text-navy">Datarum</h1>
              </div>
              <p className="text-gray-600 max-w-2xl">
                Ett samlat, säkert datarum för din företagsförsäljning. Ladda upp dokument,
                bjud in köpare och håll koll på due diligence-status.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-mint/15 border border-mint rounded-xl text-sm text-navy">
                <ShieldCheck className="w-4 h-4" />
                Privat tills du bjuder in
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-sand/50 rounded-xl text-sm text-graphite/80">
                <Bell className="w-4 h-4" />
                Påminnelser när något saknas
              </div>
            </div>
          </div>
        </div>

        {/* Listing selector & View toggle */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {listings.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Välj bolag
              </label>
              <select
                value={selectedListing || ''}
                onChange={(e) => setSelectedListing(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {listings.map(listing => (
                  <option key={listing.id} value={listing.id}>
                    {listing.anonymousTitle || listing.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('dataroom')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'dataroom'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Datarum
            </button>
            <button
              onClick={() => setViewMode('checklist')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'checklist'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              DD-checklista
            </button>
          </div>
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
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5 text-navy" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-navy">DD-kravlista</h3>
                      <p className="text-sm text-gray-600">
                        Vår mall täcker alla kategorier: finans, skatt, juridik, HR, kommersiellt, IT och ESG.
                        Ladda upp per krav och se din status i realtid.
                      </p>
                    </div>
                  </div>
                </div>
                <ReadinessChecklist
                  listingId={selectedListing}
                  onComplete={() => {
                    alert('Klart! Alla obligatoriska dokument är på plats.')
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
