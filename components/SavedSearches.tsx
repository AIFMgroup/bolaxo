'use client'

import { useState, useEffect } from 'react'

interface SavedSearch {
  id: string
  name: string
  filters: {
    industries?: string[]
    regions?: string[]
    priceMin?: number
    priceMax?: number
    revenueMin?: number
    revenueMax?: number
  }
  notifyOnNew: boolean
  notifyEmail: boolean
  notifyInApp: boolean
  lastMatchCount: number
  lastNotifiedAt: string
  createdAt: string
}

interface Props {
  currentFilters?: any
  onLoadSearch?: (filters: any) => void
}

export function SavedSearches({ currentFilters, onLoadSearch }: Props) {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [notifyOnNew, setNotifyOnNew] = useState(true)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [newMatches, setNewMatches] = useState<Record<string, number>>({})

  useEffect(() => {
    loadSearches()
  }, [])

  const loadSearches = async () => {
    try {
      const res = await fetch('/api/saved-searches')
      if (res.ok) {
        const data = await res.json()
        setSearches(data.savedSearches || [])
        
        // Check for new matches
        for (const search of data.savedSearches || []) {
          checkNewMatches(search.id)
        }
      }
    } catch (error) {
      console.error('Error loading saved searches:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkNewMatches = async (searchId: string) => {
    try {
      const res = await fetch(`/api/saved-searches/${searchId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.newMatchCount > 0) {
          setNewMatches(prev => ({ ...prev, [searchId]: data.newMatchCount }))
        }
      }
    } catch (error) {
      console.error('Error checking matches:', error)
    }
  }

  const saveSearch = async () => {
    if (!searchName.trim() || !currentFilters) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: searchName,
          filters: currentFilters,
          notifyOnNew,
          notifyEmail,
          notifyInApp: true,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSearches(prev => [data.savedSearch, ...prev])
        setShowSaveModal(false)
        setSearchName('')
      }
    } catch (error) {
      console.error('Error saving search:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteSearch = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-searches/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSearches(prev => prev.filter(s => s.id !== id))
      }
    } catch (error) {
      console.error('Error deleting search:', error)
    }
  }

  const loadSearch = async (search: SavedSearch) => {
    if (onLoadSearch) {
      onLoadSearch(search.filters)
    }
    
    // Mark as seen
    if (newMatches[search.id]) {
      await fetch(`/api/saved-searches/${search.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAsSeen: true }),
      })
      setNewMatches(prev => {
        const copy = { ...prev }
        delete copy[search.id]
        return copy
      })
    }
  }

  const formatFilters = (filters: SavedSearch['filters']) => {
    const parts: string[] = []
    
    if (filters.industries?.length) {
      parts.push(`${filters.industries.length} bransch${filters.industries.length > 1 ? 'er' : ''}`)
    }
    if (filters.regions?.length) {
      parts.push(`${filters.regions.length} region${filters.regions.length > 1 ? 'er' : ''}`)
    }
    if (filters.priceMin || filters.priceMax) {
      const min = filters.priceMin ? `${(filters.priceMin / 1000000).toFixed(1)}M` : '0'
      const max = filters.priceMax ? `${(filters.priceMax / 1000000).toFixed(1)}M` : '∞'
      parts.push(`${min} - ${max} kr`)
    }
    
    return parts.join(' • ') || 'Alla'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Sparade sökningar</h3>
        {currentFilters && (
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-4 py-2 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy/90 transition-colors"
          >
            + Spara sökning
          </button>
        )}
      </div>

      {searches.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🔍</span>
          </div>
          <p className="text-gray-500 text-sm">Inga sparade sökningar</p>
          <p className="text-gray-400 text-xs mt-1">Spara din sökning för att få notiser om nya träffar</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {searches.map((search) => (
            <div
              key={search.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
              onClick={() => loadSearch(search)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 truncate">{search.name}</h4>
                    {newMatches[search.id] && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                        +{newMatches[search.id]} nya
                      </span>
                    )}
                    {search.notifyOnNew && (
                      <span className="text-blue-500 text-xs">🔔</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{formatFilters(search.filters)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Ta bort denna sparade sökning?')) {
                      deleteSearch(search.id)
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto pb-[calc(1.25rem+var(--sab))] sm:pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Spara sökning</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Namn på sökning
                </label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="T.ex. IT-bolag i Stockholm"
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notifyOnNew"
                  checked={notifyOnNew}
                  onChange={(e) => setNotifyOnNew(e.target.checked)}
                  className="w-4 h-4 text-navy rounded"
                />
                <label htmlFor="notifyOnNew" className="text-sm text-gray-700">
                  Notifiera mig när nya objekt matchar
                </label>
              </div>

              {notifyOnNew && (
                <div className="flex items-center gap-3 ml-7">
                  <input
                    type="checkbox"
                    id="notifyEmail"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="w-4 h-4 text-navy rounded"
                  />
                  <label htmlFor="notifyEmail" className="text-sm text-gray-700">
                    Skicka även e-post
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-3.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={saveSearch}
                disabled={saving || !searchName.trim()}
                className="flex-1 px-4 py-3.5 sm:py-3 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90 active:bg-navy/80 transition-colors disabled:opacity-50"
              >
                {saving ? 'Sparar...' : 'Spara'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

