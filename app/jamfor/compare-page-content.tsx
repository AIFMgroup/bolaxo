'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useBuyerStore } from '@/store/buyerStore'
import { useAuth } from '@/contexts/AuthContext'
import { Scale, Plus, ArrowRight } from 'lucide-react'
import { ListingComparison } from '@/components/ListingComparison'

export default function ComparePageContent() {
  const { compareList, toggleCompare, clearCompare, loadFromLocalStorage } = useBuyerStore()
  const { user } = useAuth()
  const [objects, setObjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFromLocalStorage()
  }, [loadFromLocalStorage])

  // Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      if (compareList.length === 0) {
        setObjects([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const promises = compareList.map(id => 
          fetch(`/api/listings/${id}`, { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        )
        
        const results = await Promise.all(promises)
        setObjects(results.filter(Boolean))
      } catch (error) {
        console.error('Error fetching listings:', error)
        setObjects([])
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [compareList, user?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
      </div>
    )
  }

  if (objects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-light-blue/20 flex items-center justify-center py-6 sm:py-8 md:py-12 px-3 sm:px-4">
        <div className="max-w-2xl w-full card text-center">
          <div className="w-20 h-20 bg-primary-navy/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Scale className="w-10 h-10 text-primary-navy" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-dark mb-4">
            Jämför bolag sida vid sida
          </h1>
          <p className="text-text-gray mb-8 max-w-md mx-auto">
            Välj 2-3 bolag från sökresultaten genom att klicka på jämför-ikonen (⚖️) för att se dem sida vid sida här.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sok" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Sök företag
            </Link>
            <Link href="/dashboard/saved" className="btn-secondary inline-flex items-center gap-2">
              Mina sparade
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-10 p-6 bg-gray-50 rounded-2xl">
            <h3 className="font-semibold text-gray-900 mb-3">Så fungerar det:</h3>
            <ol className="text-sm text-gray-600 text-left space-y-2">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary-navy text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <span>Gå till sök och hitta intressanta bolag</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary-navy text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <span>Klicka på jämför-ikonen (⚖️) på kortet</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary-navy text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <span>Återkom hit för att se detaljerad jämförelse</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-light-blue/20 py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-dark mb-2 uppercase">
              Jämför bolag
            </h1>
            <p className="text-text-gray">
              {objects.length} av 3 bolag i jämförelse
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={clearCompare} className="btn-ghost">
              Rensa alla
            </button>
            <Link href="/sok" className="btn-secondary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Lägg till fler
            </Link>
          </div>
        </div>

        {/* Use the new ListingComparison component */}
        <ListingComparison 
          listingIds={compareList}
          onRemove={toggleCompare}
        />

        {/* Quick tips */}
        {objects.length < 3 && (
          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
            <p className="text-sm text-blue-700">
              Lägg till {3 - objects.length} till bolag för att få en mer komplett jämförelse. 
              Gå till <Link href="/sok" className="underline font-medium">sök</Link> och klicka på jämför-ikonen (⚖️) på de kort du vill jämföra.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

