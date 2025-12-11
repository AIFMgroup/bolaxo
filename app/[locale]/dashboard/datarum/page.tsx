'use client'

import { useEffect, useState } from 'react'
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout'
import ReadinessChecklist from '@/components/ReadinessChecklist'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Building, Sparkles, ShieldCheck, Bell, Plus } from 'lucide-react'
import Link from 'next/link'

// Prevent static generation - this page requires AuthProvider
export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface Listing {
  id: string
  title: string
  anonymousTitle?: string
  status: string
  readinessScore?: number
}

export default function DataRoomPage() {
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListing, setSelectedListing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <ClientDashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-7 h-7 text-coral" />
                <h1 className="text-2xl font-bold text-navy">Datarum</h1>
              </div>
              <p className="text-gray-600 max-w-2xl">
                Ett samlat, säkert datarum för din företagsförsäljning. Ladda upp alla obligatoriska dokument,
                få koll på status och dela med köpare när du är redo.
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

        {/* Listing selector */}
        {listings.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Välj bolag/datarum
            </label>
            <select
              value={selectedListing || ''}
              onChange={(e) => setSelectedListing(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              {listings.map(listing => (
                <option key={listing.id} value={listing.id}>
                  {listing.anonymousTitle || listing.title}
                  {listing.readinessScore !== undefined && ` (${Math.round(listing.readinessScore * 100)}% redo)`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Datarum checklist (re-uses readiness engine) */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center">
                <FolderOpenIcon />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-navy">Mall för due diligence</h3>
                <p className="text-sm text-gray-600">
                  Vi använder vår DD-mall (finans, skatt, juridik, HR, kommersiellt, IT, operation/ESG)
                  så att du vet exakt vilka filer som krävs. Ladda upp per rad, se status och ladda ner gap-rapporten.
                </p>
              </div>
            </div>
          </div>

          {selectedListing && (
            <ReadinessChecklist
              listingId={selectedListing}
              onComplete={() => {
                alert('Klart! Alla obligatoriska dokument är på plats.')
              }}
            />
          )}
        </div>
      </div>
    </ClientDashboardLayout>
  )
}

function FolderOpenIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7h4l2 3h12" />
    <path d="M5 7V5h4l2 2h8a2 2 0 0 1 2 2v2" />
    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10" />
  </svg>
}

