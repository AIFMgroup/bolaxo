'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface UseRealTimeUpdatesOptions {
  /**
   * Base polling interval in milliseconds (default: 5000ms = 5 seconds)
   */
  baseInterval?: number
  /**
   * Fast polling interval when activity is detected (default: 2000ms = 2 seconds)
   */
  fastInterval?: number
  /**
   * Slow polling interval when user is idle (default: 30000ms = 30 seconds)
   */
  slowInterval?: number
  /**
   * Time in ms before switching to slow polling (default: 60000ms = 1 minute)
   */
  idleTimeout?: number
  /**
   * Whether to enable polling (default: true)
   */
  enabled?: boolean
  /**
   * Callback when new data is detected
   */
  onNewData?: () => void
}

interface UseRealTimeUpdatesReturn {
  /**
   * Trigger an immediate refresh
   */
  refresh: () => void
  /**
   * Mark that there's activity (speeds up polling temporarily)
   */
  markActivity: () => void
  /**
   * Current polling interval
   */
  currentInterval: number
  /**
   * Whether currently in fast mode
   */
  isFastMode: boolean
}

/**
 * Smart polling hook that adjusts frequency based on user activity
 * - Fast polling when user is active or new data detected
 * - Slow polling when user is idle
 * - Immediate refresh capability
 */
export function useRealTimeUpdates(
  fetchFn: () => Promise<void>,
  options: UseRealTimeUpdatesOptions = {}
): UseRealTimeUpdatesReturn {
  const {
    baseInterval = 5000,
    fastInterval = 2000,
    slowInterval = 30000,
    idleTimeout = 60000,
    enabled = true,
    onNewData
  } = options

  const [currentInterval, setCurrentInterval] = useState(baseInterval)
  const [isFastMode, setIsFastMode] = useState(false)
  const lastActivityRef = useRef(Date.now())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const fastModeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Mark user activity
  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    
    // Switch to fast mode temporarily
    setIsFastMode(true)
    setCurrentInterval(fastInterval)
    
    // Clear previous fast mode timeout
    if (fastModeTimeoutRef.current) {
      clearTimeout(fastModeTimeoutRef.current)
    }
    
    // Return to base interval after 10 seconds of fast mode
    fastModeTimeoutRef.current = setTimeout(() => {
      setIsFastMode(false)
      setCurrentInterval(baseInterval)
    }, 10000)
  }, [fastInterval, baseInterval])

  // Trigger immediate refresh
  const refresh = useCallback(() => {
    markActivity()
    fetchFn()
  }, [fetchFn, markActivity])

  // Check if user is idle and adjust polling
  const checkIdleAndAdjust = useCallback(() => {
    const now = Date.now()
    const timeSinceActivity = now - lastActivityRef.current
    
    if (timeSinceActivity > idleTimeout && !isFastMode) {
      setCurrentInterval(slowInterval)
    }
  }, [idleTimeout, slowInterval, isFastMode])

  // Main polling effect
  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchFn()

    // Set up polling
    intervalRef.current = setInterval(() => {
      fetchFn()
      checkIdleAndAdjust()
    }, currentInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, currentInterval, fetchFn, checkIdleAndAdjust])

  // Listen for user activity events
  useEffect(() => {
    if (!enabled) return

    const handleActivity = () => {
      const now = Date.now()
      // Only mark activity if it's been more than 1 second since last activity
      if (now - lastActivityRef.current > 1000) {
        lastActivityRef.current = now
        // Don't trigger fast mode on every activity, only reset idle timer
        if (currentInterval === slowInterval) {
          setCurrentInterval(baseInterval)
        }
      }
    }

    // Listen for various activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'focus']
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Also listen for visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleActivity()
        // Trigger immediate refresh when tab becomes visible
        fetchFn()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      if (fastModeTimeoutRef.current) {
        clearTimeout(fastModeTimeoutRef.current)
      }
    }
  }, [enabled, currentInterval, slowInterval, baseInterval, fetchFn])

  return {
    refresh,
    markActivity,
    currentInterval,
    isFastMode
  }
}

/**
 * Hook specifically for notifications with optimized settings
 */
export function useNotificationUpdates(
  fetchFn: () => Promise<void>,
  enabled: boolean = true
) {
  return useRealTimeUpdates(fetchFn, {
    baseInterval: 10000,    // 10 seconds base
    fastInterval: 3000,     // 3 seconds when active
    slowInterval: 60000,    // 1 minute when idle
    idleTimeout: 120000,    // 2 minutes before idle
    enabled
  })
}

/**
 * Hook specifically for chat messages with faster polling
 */
export function useChatUpdates(
  fetchFn: () => Promise<void>,
  enabled: boolean = true
) {
  return useRealTimeUpdates(fetchFn, {
    baseInterval: 3000,     // 3 seconds base
    fastInterval: 1000,     // 1 second when typing/active
    slowInterval: 15000,    // 15 seconds when idle
    idleTimeout: 60000,     // 1 minute before idle
    enabled
  })
}

export default useRealTimeUpdates

