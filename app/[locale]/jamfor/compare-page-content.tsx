'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useBuyerStore } from '@/store/buyerStore'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useLocale, useTranslations } from 'next-intl'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import type { Listing } from '@/types/listing'

export default function ComparePageContent() {
  const { compareList, toggleCompare, clearCompare, loadFromLocalStorage } = useBuyerStore()
  const { user } = useAuth()
  const { error: showError } = useToast()
  const locale = useLocale()
  const t = useTranslations('compare')
  const [objects, setObjects] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [failedIds, setFailedIds] = useState<string[]>([])

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
        setFailedIds([])
        
        const promises = compareList.map(async (id) => {
          try {
            const res = await fetch(`/api/listings/${id}`, { credentials: 'include' })
            if (res.ok) {
              return await res.json()
            } else {
              console.error(`Failed to fetch listing ${id}: ${res.status}`)
              return null
            }
          } catch (err) {
            console.error(`Error fetching listing ${id}:`, err)
            return null
          }
        })
        
        const results = await Promise.all(promises)
        const validListings = results.filter(Boolean) as Listing[]
        const failed = compareList.filter((id, index) => !results[index])
        
        setObjects(validListings)
        setFailedIds(failed)
        
        // Show error if some listings failed to load
        if (failed.length > 0) {
          showError(t('loadError', { count: failed.length, total: compareList.length }))
        }
      } catch (error) {
        console.error('Error fetching listings:', error)
        showError(t('generalError'))
        setObjects([])
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [compareList, user?.id, showError, t])

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
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-dark mb-4">
            {t('noComparison')}
          </h1>
          <p className="text-text-gray mb-8">
            {t('addFromSearch')}
          </p>
          <Link href={`/${locale}/sok`} className="btn-primary inline-block">
            {t('startSearching')}
          </Link>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-text-dark mb-2">
              {t('title')}
            </h1>
            <p className="text-text-gray">
              {objects.length} {t('of4Objects')}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={clearCompare} className="btn-ghost">
              {t('clearAll')}
            </button>
            <Link href={`/${locale}/sok`} className="btn-secondary">
              {t('addMore')}
            </Link>
          </div>
        </div>

        {/* Desktop Comparison Table */}
        <div className="hidden lg:block overflow-x-auto">
          <div className="card min-w-full">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-3 sm:px-4 font-semibold text-text-dark w-48">
                    Fält
                  </th>
                  {objects.map(obj => (
                    <th key={obj.id} className="py-4 px-3 sm:px-4 text-left">
                      <div>
                        <Link href={`/${locale}/objekt/${obj.id}`} className="font-semibold text-primary-blue hover:underline">
                          {obj.anonymousTitle || obj.companyName || 'Företag'}
                        </Link>
                        <div className="flex gap-2 mt-2">
                          {obj.verified && (
                            <span className="text-xs bg-success text-white px-2 py-1 rounded-full">
                              Verifierad
                            </span>
                          )}
                          {obj.isNew && (
                            <span className="text-xs bg-primary-blue text-white px-2 py-1 rounded-full">
                              Ny
                            </span>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Type */}
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-3 sm:px-4 text-sm font-medium text-text-gray">Typ</td>
                  {objects.map(obj => (
                    <td key={obj.id} className="py-3 px-3 sm:px-4 text-sm">{obj.type || obj.category || 'N/A'}</td>
                  ))}
                </tr>

                {/* Region */}
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-3 sm:px-4 text-sm font-medium text-text-gray">Region</td>
                  {objects.map(obj => (
                    <td key={obj.id} className="py-3 px-3 sm:px-4 text-sm">{obj.region || obj.location || 'N/A'}</td>
                  ))}
                </tr>

                {/* Revenue */}
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-3 sm:px-4 text-sm font-medium text-text-gray">Omsättning</td>
                  {objects.map(obj => (
                    <td key={obj.id} className="py-3 px-3 sm:px-4 text-sm">{obj.revenueRange || `${(obj.revenue || 0) / 1000000} MSEK`}</td>
                  ))}
                </tr>

                {/* Employees */}
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-3 sm:px-4 text-sm font-medium text-text-gray">Anställda</td>
                  {objects.map(obj => (
                    <td key={obj.id} className="py-3 px-3 sm:px-4 text-sm">{obj.employees || 'N/A'}</td>
                  ))}
                </tr>

                {/* Price */}
                <tr className="border-b border-gray-100 bg-light-blue/50">
                  <td className="py-3 px-3 sm:px-4 text-sm font-medium text-text-gray">Prisidé</td>
                  {objects.map(obj => (
                    <td key={obj.id} className="py-3 px-3 sm:px-4 text-sm font-semibold text-primary-blue">
                      {obj.priceMin && obj.priceMax 
                        ? `${(obj.priceMin / 1000000).toFixed(1)}-${(obj.priceMax / 1000000).toFixed(1)} MSEK`
                        : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Strengths */}
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-3 sm:px-4 text-sm font-medium text-text-gray align-top">Styrkor</td>
                  {objects.map(obj => (
                    <td key={obj.id} className="py-3 px-3 sm:px-4 text-xs">
                      <ul className="space-y-1">
                        {(obj.strengths || []).slice(0, 2).map((strength: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0 mt-0.5" />
                            <span>{strength}</span>
                          </li>
                        ))}
                        {(!obj.strengths || obj.strengths.length === 0) && (
                          <li className="text-gray-400">Inga styrkor angivna</li>
                        )}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* Risks */}
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-3 sm:px-4 text-sm font-medium text-text-gray align-top">Risker</td>
                  {objects.map(obj => (
                    <td key={obj.id} className="py-3 px-3 sm:px-4 text-xs">
                      <ul className="space-y-1">
                        {(obj.risks || []).slice(0, 2).map((risk: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <AlertTriangle className="w-4 h-4 text-warning mr-2 flex-shrink-0 mt-0.5" />
                            <span>{risk}</span>
                          </li>
                        ))}
                        {(!obj.risks || obj.risks.length === 0) && (
                          <li className="text-gray-400">Inga risker angivna</li>
                        )}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* Views */}
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-3 sm:px-4 text-sm font-medium text-text-gray">Visningar</td>
                  {objects.map(obj => (
                    <td key={obj.id} className="py-3 px-3 sm:px-4 text-sm">{obj.views || 0}</td>
                  ))}
                </tr>

                {/* Actions */}
                <tr>
                  <td className="py-4 px-3 sm:px-4 text-sm font-medium text-text-gray">Åtgärder</td>
                  {objects.map(obj => (
                    <td key={obj.id} className="py-4 px-3 sm:px-4">
                      <div className="space-y-2">
                        <Link href={`/objekt/${obj.id}`} className="block btn-primary text-center text-sm py-2">
                          Se detaljer
                        </Link>
                        <Link href={`/nda/${obj.id}`} className="block btn-secondary text-center text-sm py-2">
                          Be om NDA
                        </Link>
                        <button
                          onClick={() => toggleCompare(obj.id)}
                          className="w-full btn-ghost text-sm py-2"
                        >
                          Ta bort
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4">
          {objects.map(obj => (
            <div key={obj.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <Link href={`/objekt/${obj.id}`} className="font-semibold text-lg text-primary-blue hover:underline">
                  {obj.anonymousTitle || obj.companyName || 'Företag'}
                </Link>
                <button
                  onClick={() => toggleCompare(obj.id)}
                  className="text-text-gray hover:text-red-500"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-text-gray">Typ:</span>
                  <span className="font-medium">{obj.type || obj.category || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-gray">Region:</span>
                  <span className="font-medium">{obj.region || obj.location || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-gray">Omsättning:</span>
                  <span className="font-medium">{obj.revenueRange || `${(obj.revenue || 0) / 1000000} MSEK`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-gray">Prisidé:</span>
                  <span className="font-semibold text-primary-blue">
                    {obj.priceMin && obj.priceMax 
                      ? `${(obj.priceMin / 1000000).toFixed(1)}-${(obj.priceMax / 1000000).toFixed(1)} MSEK`
                      : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/objekt/${obj.id}`} className="btn-primary flex-1 text-center text-sm">
                  Detaljer
                </Link>
                <Link href={`/nda/${obj.id}`} className="btn-secondary flex-1 text-center text-sm">
                  NDA
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

