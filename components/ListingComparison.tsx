'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Listing {
  id: string
  anonymousTitle: string
  companyName?: string
  industry: string
  region: string
  askingPrice: number
  revenue: number
  profit?: number
  employees: number
  establishedYear?: number
  description?: string
  highlights?: string[]
}

interface Props {
  listingIds?: string[]
  onRemove?: (id: string) => void
  onClose?: () => void
}

export function ListingComparison({ listingIds = [], onRemove, onClose }: Props) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (listingIds.length > 0) {
      loadListings()
    }
  }, [listingIds])

  const loadListings = async () => {
    setLoading(true)
    try {
      const results = await Promise.all(
        listingIds.map(async (id) => {
          const res = await fetch(`/api/listings/${id}`)
          if (res.ok) {
            const data = await res.json()
            return data.listing
          }
          return null
        })
      )
      setListings(results.filter(Boolean))
    } catch (error) {
      console.error('Error loading listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} MSEK`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)} TSEK`
    }
    return `${value} SEK`
  }

  const calculateMultiple = (price: number, revenue: number) => {
    if (!revenue || revenue === 0) return '-'
    return `${(price / revenue).toFixed(1)}x`
  }

  const getComparisonClass = (values: number[], index: number, higherIsBetter: boolean = true) => {
    if (values.length < 2) return ''
    const max = Math.max(...values.filter(v => v > 0))
    const min = Math.min(...values.filter(v => v > 0))
    const value = values[index]
    
    if (value === 0) return 'text-gray-400'
    if (higherIsBetter) {
      if (value === max) return 'text-emerald-600 font-semibold'
      if (value === min) return 'text-amber-600'
    } else {
      if (value === min) return 'text-emerald-600 font-semibold'
      if (value === max) return 'text-amber-600'
    }
    return ''
  }

  if (listings.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚖️</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Jämför bolag</h3>
        <p className="text-gray-500 text-sm mb-4">
          Lägg till 2-3 bolag för att jämföra dem sida vid sida
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const askingPrices = listings.map(l => l.askingPrice || 0)
  const revenues = listings.map(l => l.revenue || 0)
  const profits = listings.map(l => l.profit || 0)
  const employees = listings.map(l => l.employees || 0)

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-navy text-white">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚖️</span>
          <h2 className="font-semibold">Jämförelse</h2>
          <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
            {listings.length} bolag
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Company Headers */}
      <div className="grid" style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}>
        <div className="p-4 bg-gray-50 font-medium text-gray-500 text-sm">Nyckeltal</div>
        {listings.map((listing, idx) => (
          <div key={listing.id} className="p-4 border-l border-gray-100 bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {listing.anonymousTitle || listing.companyName}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{listing.industry}</p>
              </div>
              {onRemove && (
                <button
                  onClick={() => onRemove(listing.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Rows */}
      <div className="divide-y divide-gray-50">
        {/* Asking Price */}
        <div className="grid" style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}>
          <div className="p-4 text-sm text-gray-600">💰 Pris</div>
          {listings.map((listing, idx) => (
            <div key={listing.id} className={`p-4 border-l border-gray-100 text-sm ${getComparisonClass(askingPrices, idx, false)}`}>
              {listing.askingPrice ? formatCurrency(listing.askingPrice) : '-'}
            </div>
          ))}
        </div>

        {/* Revenue */}
        <div className="grid" style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}>
          <div className="p-4 text-sm text-gray-600">📊 Omsättning</div>
          {listings.map((listing, idx) => (
            <div key={listing.id} className={`p-4 border-l border-gray-100 text-sm ${getComparisonClass(revenues, idx)}`}>
              {listing.revenue ? formatCurrency(listing.revenue) : '-'}
            </div>
          ))}
        </div>

        {/* Profit */}
        <div className="grid" style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}>
          <div className="p-4 text-sm text-gray-600">💵 Vinst</div>
          {listings.map((listing, idx) => (
            <div key={listing.id} className={`p-4 border-l border-gray-100 text-sm ${getComparisonClass(profits, idx)}`}>
              {listing.profit ? formatCurrency(listing.profit) : '-'}
            </div>
          ))}
        </div>

        {/* Multiple */}
        <div className="grid" style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}>
          <div className="p-4 text-sm text-gray-600">📈 Multipel (P/S)</div>
          {listings.map((listing) => (
            <div key={listing.id} className="p-4 border-l border-gray-100 text-sm text-gray-900">
              {calculateMultiple(listing.askingPrice || 0, listing.revenue || 0)}
            </div>
          ))}
        </div>

        {/* Employees */}
        <div className="grid" style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}>
          <div className="p-4 text-sm text-gray-600">👥 Anställda</div>
          {listings.map((listing, idx) => (
            <div key={listing.id} className={`p-4 border-l border-gray-100 text-sm ${getComparisonClass(employees, idx)}`}>
              {listing.employees || '-'}
            </div>
          ))}
        </div>

        {/* Revenue per Employee */}
        <div className="grid" style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}>
          <div className="p-4 text-sm text-gray-600">📊 Oms./anställd</div>
          {listings.map((listing) => {
            const perEmployee = listing.revenue && listing.employees 
              ? listing.revenue / listing.employees 
              : 0
            return (
              <div key={listing.id} className="p-4 border-l border-gray-100 text-sm text-gray-900">
                {perEmployee ? formatCurrency(perEmployee) : '-'}
              </div>
            )
          })}
        </div>

        {/* Region */}
        <div className="grid" style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}>
          <div className="p-4 text-sm text-gray-600">📍 Region</div>
          {listings.map((listing) => (
            <div key={listing.id} className="p-4 border-l border-gray-100 text-sm text-gray-900">
              {listing.region || '-'}
            </div>
          ))}
        </div>

        {/* Year Established */}
        <div className="grid" style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}>
          <div className="p-4 text-sm text-gray-600">📅 Etablerad</div>
          {listings.map((listing) => (
            <div key={listing.id} className="p-4 border-l border-gray-100 text-sm text-gray-900">
              {listing.establishedYear || '-'}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="grid gap-3" style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}>
          <div></div>
          {listings.map((listing) => (
            <div key={listing.id} className="flex gap-2">
              <Link
                href={`/marknadsplats/${listing.id}`}
                className="flex-1 px-4 py-2 bg-navy text-white text-sm font-medium rounded-xl text-center hover:bg-navy/90 transition-colors"
              >
                Visa detaljer
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Hook for managing comparison state
export function useListingComparison(maxItems: number = 3) {
  const [comparisonIds, setComparisonIds] = useState<string[]>([])

  const addToComparison = (id: string) => {
    if (comparisonIds.length >= maxItems) {
      alert(`Max ${maxItems} bolag kan jämföras samtidigt`)
      return false
    }
    if (comparisonIds.includes(id)) {
      return false
    }
    setComparisonIds(prev => [...prev, id])
    return true
  }

  const removeFromComparison = (id: string) => {
    setComparisonIds(prev => prev.filter(i => i !== id))
  }

  const clearComparison = () => {
    setComparisonIds([])
  }

  const isInComparison = (id: string) => comparisonIds.includes(id)

  return {
    comparisonIds,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    canAdd: comparisonIds.length < maxItems,
  }
}

