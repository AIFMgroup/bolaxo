'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface UseCacheOptions {
  /** Time to live in milliseconds (default: 5 minutes) */
  ttl?: number
  /** Whether to refetch on mount if cache exists but is stale (default: true) */
  refetchOnStale?: boolean
  /** Whether to use stale data while refetching (default: true) */
  staleWhileRevalidate?: boolean
}

// In-memory cache store
const cacheStore = new Map<string, CacheItem<any>>()

/**
 * Cache hook for API responses with TTL support
 */
export function useCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseCacheOptions = {}
): {
  data: T | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  isCached: boolean
  isStale: boolean
} {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    refetchOnStale = true,
    staleWhileRevalidate = true
  } = options

  const [data, setData] = useState<T | null>(() => {
    const cached = cacheStore.get(key)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data
    }
    return null
  })
  const [loading, setLoading] = useState(!data)
  const [error, setError] = useState<Error | null>(null)
  const [isCached, setIsCached] = useState(!!data)
  const [isStale, setIsStale] = useState(false)
  
  const fetchRef = useRef(fetchFn)
  fetchRef.current = fetchFn
  
  const isMountedRef = useRef(true)

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading && !staleWhileRevalidate) {
      setLoading(true)
    }
    
    try {
      const result = await fetchRef.current()
      
      if (!isMountedRef.current) return
      
      // Store in cache
      const cacheItem: CacheItem<T> = {
        data: result,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      }
      cacheStore.set(key, cacheItem)
      
      setData(result)
      setError(null)
      setIsCached(true)
      setIsStale(false)
    } catch (err) {
      if (!isMountedRef.current) return
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [key, ttl, staleWhileRevalidate])

  // Initial fetch or cache check
  useEffect(() => {
    isMountedRef.current = true
    
    const cached = cacheStore.get(key)
    const now = Date.now()
    
    if (cached) {
      // Cache exists
      if (now < cached.expiresAt) {
        // Cache is fresh
        setData(cached.data)
        setLoading(false)
        setIsCached(true)
        setIsStale(false)
      } else {
        // Cache is stale
        setIsStale(true)
        if (staleWhileRevalidate) {
          setData(cached.data) // Show stale data
          setLoading(false)
        }
        if (refetchOnStale) {
          fetchData(false) // Refetch in background
        }
      }
    } else {
      // No cache, fetch fresh
      fetchData()
    }
    
    return () => {
      isMountedRef.current = false
    }
  }, [key, fetchData, refetchOnStale, staleWhileRevalidate])

  const refresh = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  return { data, loading, error, refresh, isCached, isStale }
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  cacheStore.clear()
}

/**
 * Clear specific cache key
 */
export function clearCacheKey(key: string): boolean {
  return cacheStore.delete(key)
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number
  keys: string[]
  totalSizeEstimate: number
} {
  const keys = Array.from(cacheStore.keys())
  let totalSize = 0
  
  cacheStore.forEach((value) => {
    totalSize += JSON.stringify(value).length
  })
  
  return {
    size: cacheStore.size,
    keys,
    totalSizeEstimate: totalSize
  }
}

export default useCache

