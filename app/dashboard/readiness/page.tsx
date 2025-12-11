'use client'

import { useState, useEffect } from 'react'
import ClientDashboardLayout from '@/components/dashboard/ClientDashboardLayout'
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
            status: 'active',
            readinessScore: 0.65,
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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      </ClientDashboardLayout>
    )
  }

  if (listings.length === 0) {
    return (
      <ClientDashboardLayout>
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center animate-pulse-shadow">
            <span className="text-3xl font-light text-gray-300">?</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Ingen annons att förbereda</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Skapa först en annons för ditt bolag, sedan kan du förbereda dokumentationen för due diligence här.
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

  return (
    <ClientDashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">Säljberedskap</h1>
          <p className="text-gray-500 max-w-xl leading-relaxed">
            Förbered ditt företag för försäljning genom att ladda upp all dokumentation som köpare behöver.
          </p>
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
                {listing.readinessScore !== undefined && (
                  <span className="ml-2 opacity-60">{Math.round(listing.readinessScore * 100)}%</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-white rounded-3xl p-6 mb-8 border border-gray-100 animate-pulse-shadow">
          <h3 className="font-semibold text-gray-900 mb-2">Varför är detta viktigt?</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            En komplett dokumentation snabbar på due diligence-processen avsevärt och ger köpare förtroende. 
            Företag med hög säljberedskap säljs i snitt 40% snabbare och till bättre villkor.
          </p>
        </div>

        {/* Checklist */}
        {selectedListing && (
          <ReadinessChecklist
            listingId={selectedListing}
            onComplete={() => alert('Grattis! Din dokumentation är komplett.')}
          />
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
