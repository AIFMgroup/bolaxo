'use client'

import { useState, useEffect } from 'react'
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout'
import ReadinessChecklist from '@/components/ReadinessChecklist'
import { useAuth } from '@/contexts/AuthContext'
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

export default function ReadinessPage() {
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
        <div className="flex items-center justify-center min-h-[400px] text-gray-700">
          Laddar...
        </div>
      </ClientDashboardLayout>
    )
  }

  if (listings.length === 0) {
    return (
      <ClientDashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-navy mb-4">Ingen annons att förbereda</h1>
          <p className="text-gray-600 mb-8">
            Skapa först en annons för ditt bolag, sedan kan du förbereda dokumentationen för due diligence här.
          </p>
          <Link
            href="/salja/start"
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-xl font-medium hover:bg-navy/90 transition-colors"
          >
            Skapa annons
          </Link>
        </div>
      </ClientDashboardLayout>
    )
  }

  return (
    <ClientDashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy mb-2">Säljberedskap</h1>
          <p className="text-gray-600">
            Förbered ditt företag för försäljning genom att ladda upp all dokumentation som köpare och revisorer behöver för due diligence.
          </p>
        </div>

        {/* Listing selector */}
        {listings.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Välj annons
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

        {/* Info banner */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6 text-sm text-sky-800">
          <p className="font-medium mb-1">Varför är detta viktigt?</p>
          <p>
            En komplett dokumentation snabbar på due diligence-processen avsevärt och ger köpare förtroende. 
            Företag med hög säljberedskap säljs i snitt 40% snabbare och till bättre villkor.
          </p>
        </div>

        {/* Checklist */}
        {selectedListing && (
          <ReadinessChecklist
            listingId={selectedListing}
            onComplete={() => {
              alert('Grattis! Din dokumentation är komplett.')
            }}
          />
        )}
      </div>
    </ClientDashboardLayout>
  )
}


