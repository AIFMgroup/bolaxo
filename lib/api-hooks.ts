import { useState, useCallback } from 'react'

export const useAdminUsers = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async (params: {
    page?: number
    limit?: number
    role?: string
    search?: string
    verified?: boolean
    bankIdVerified?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.role) queryParams.append('role', params.role)
      if (params.search) queryParams.append('search', params.search)
      if (params.verified !== undefined) queryParams.append('verified', params.verified.toString())
      if (params.bankIdVerified !== undefined) queryParams.append('bankIdVerified', params.bankIdVerified.toString())
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const response = await fetch(`/api/admin/users?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized - please login again')
        throw new Error('Failed to fetch users')
      }
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateUser = useCallback(async (userId: string, data: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, ...data })
      })
      if (!response.ok) throw new Error('Failed to update user')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteUser = useCallback(async (userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      })
      if (!response.ok) throw new Error('Failed to delete user')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getReferralTree = useCallback(async (userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/users/referral-tree?userId=${userId}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch referral tree')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      })
      if (!response.ok) throw new Error('Failed to reset password')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkAction = useCallback(async (userIds: string[], action: string, data?: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/users/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userIds, action, data })
      })
      if (!response.ok) throw new Error('Failed to execute bulk action')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchUsers,
    updateUser,
    deleteUser,
    getReferralTree,
    resetPassword,
    bulkAction,
    loading,
    error,
  }
}

export const useAdminListings = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchListings = useCallback(async (params: {
    page?: number
    limit?: number
    status?: string
    industry?: string
    location?: string
    packageType?: string
    search?: string
    minPrice?: number
    maxPrice?: number
    verified?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.status) queryParams.append('status', params.status)
      if (params.industry) queryParams.append('industry', params.industry)
      if (params.location) queryParams.append('location', params.location)
      if (params.packageType) queryParams.append('packageType', params.packageType)
      if (params.search) queryParams.append('search', params.search)
      if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString())
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString())
      if (params.verified !== undefined) queryParams.append('verified', params.verified.toString())
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const response = await fetch(`/api/admin/listings?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch listings')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateListing = useCallback(async (listingId: string, data: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listingId, ...data })
      })
      if (!response.ok) throw new Error('Failed to update listing')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteListing = useCallback(async (listingId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/listings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listingId })
      })
      if (!response.ok) throw new Error('Failed to delete listing')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkAction = useCallback(async (listingIds: string[], action: string, data?: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/listings/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listingIds, action, data })
      })
      if (!response.ok) throw new Error('Failed to execute bulk action')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchListings,
    updateListing,
    deleteListing,
    bulkAction,
    loading,
    error,
  }
}

export const useAdminTransactions = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async (params: {
    stage?: string
    search?: string
    minPrice?: number
    maxPrice?: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params.stage) queryParams.append('stage', params.stage)
      if (params.search) queryParams.append('search', params.search)
      if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString())
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString())

      const response = await fetch(`/api/admin/transactions?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch transactions')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTransaction = useCallback(async (transactionId: string, data: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transactionId, ...data })
      })
      if (!response.ok) throw new Error('Failed to update transaction')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchTransactions,
    updateTransaction,
    loading,
    error,
  }
}

export const useAdminPayments = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async (params: {
    page?: number
    limit?: number
    status?: string
    type?: string
    minAmount?: number
    maxAmount?: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.status) queryParams.append('status', params.status)
      if (params.type) queryParams.append('type', params.type)
      if (params.minAmount) queryParams.append('minAmount', params.minAmount.toString())
      if (params.maxAmount) queryParams.append('maxAmount', params.maxAmount.toString())

      const response = await fetch(`/api/admin/payments?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch payments')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePayment = useCallback(async (paymentId: string, data: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentId, ...data })
      })
      if (!response.ok) throw new Error('Failed to update payment')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkUpdateStatus = useCallback(async (paymentIds: string[], status: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentIds, status })
      })
      if (!response.ok) throw new Error('Failed to update payments')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchPayments,
    updatePayment,
    bulkUpdateStatus,
    loading,
    error,
  }
}

export const useFinancialDashboard = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFinancialData = useCallback(async (params?: {
    period?: string
    months?: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.period) queryParams.append('period', params.period)
      if (params?.months) queryParams.append('months', params.months.toString())

      const response = await fetch(`/api/admin/financial-dashboard?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch financial data')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchFinancialData,
    loading,
    error,
  }
}

export const useContentModeration = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModerationQueue = useCallback(async (params?: {
    page?: number
    limit?: number
    itemType?: string
    severity?: string
    status?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.itemType) queryParams.append('itemType', params.itemType)
      if (params?.severity) queryParams.append('severity', params.severity)
      if (params?.status) queryParams.append('status', params.status)

      const response = await fetch(`/api/admin/moderation/queue?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch moderation queue')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const moderateItem = useCallback(async (itemType: string, itemId: string, action: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/moderation/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemType, itemId, action })
      })
      if (!response.ok) throw new Error('Failed to moderate item')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkModerate = useCallback(async (items: Array<any>, action: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/moderation/queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items, action })
      })
      if (!response.ok) throw new Error('Failed to moderate items')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchModerationQueue,
    moderateItem,
    bulkModerate,
    loading,
    error,
  }
}

export const useAuditTrail = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAuditTrail = useCallback(async (params?: {
    page?: number
    limit?: number
    adminId?: string
    action?: string
    resourceType?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.adminId) queryParams.append('adminId', params.adminId)
      if (params?.action) queryParams.append('action', params.action)
      if (params?.resourceType) queryParams.append('resourceType', params.resourceType)
      if (params?.status) queryParams.append('status', params.status)
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo)

      const response = await fetch(`/api/admin/audit-trail?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch audit trail')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logAction = useCallback(async (action: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/audit-trail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(action)
      })
      if (!response.ok) throw new Error('Failed to log action')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchAuditTrail,
    logAction,
    loading,
    error,
  }
}

export const useAdvancedAnalytics = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAdvancedAnalytics = useCallback(async (params?: {
    metric?: string // cohort, funnel, retention, all
    dateRange?: string // days
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.metric) queryParams.append('metric', params.metric)
      if (params?.dateRange) queryParams.append('dateRange', params.dateRange)

      const response = await fetch(`/api/admin/analytics/advanced?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch advanced analytics')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchAdvancedAnalytics,
    loading,
    error,
  }
}

export const useSellerManagement = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSellerAnalytics = useCallback(async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.status) queryParams.append('status', params.status)
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const response = await fetch(`/api/admin/sellers/analytics?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized - please login again')
        throw new Error('Failed to fetch seller analytics')
      }
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchSellerAnalytics,
    loading,
    error,
  }
}

export const useBuyerAnalytics = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBuyerProfiles = useCallback(async (params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const response = await fetch(`/api/admin/buyers/analytics?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch buyer profiles')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchBuyerProfiles,
    loading,
    error,
  }
}

export const useFraudDetection = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFraudAlerts = useCallback(async (params?: {
    page?: number
    limit?: number
    riskLevel?: string
    type?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.riskLevel) queryParams.append('riskLevel', params.riskLevel)
      if (params?.type) queryParams.append('type', params.type)

      const response = await fetch(`/api/admin/fraud-detection?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch fraud alerts')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const takeAction = useCallback(async (userId: string, action: string, notes?: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/fraud-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, action, notes })
      })
      if (!response.ok) throw new Error('Failed to take action')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchFraudAlerts,
    takeAction,
    loading,
    error,
  }
}

export const useNdaTracking = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNdas = useCallback(async (params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.status) queryParams.append('status', params.status)
      if (params?.search) queryParams.append('search', params.search)
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const response = await fetch(`/api/admin/nda-tracking?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch NDAs')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateNdaStatus = useCallback(async (ndaId: string, status: string, notes?: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/nda-tracking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ndaId, status, notes })
      })
      if (!response.ok) throw new Error('Failed to update NDA')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const performNdaAction = useCallback(async (ndaId: string, action: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/nda-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ndaId, action })
      })
      if (!response.ok) throw new Error('Failed to perform action')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchNdas,
    updateNdaStatus,
    performNdaAction,
    loading,
    error,
  }
}

export const useEmailTracking = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEmails = useCallback(async (params?: {
    page?: number
    limit?: number
    status?: string
    type?: string
    search?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.status) queryParams.append('status', params.status)
      if (params?.type) queryParams.append('type', params.type)
      if (params?.search) queryParams.append('search', params.search)
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const response = await fetch(`/api/admin/email-tracking?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch emails')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const performEmailAction = useCallback(async (emailId: string, action: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/email-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emailId, action })
      })
      if (!response.ok) throw new Error('Failed to perform action')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchEmails,
    performEmailAction,
    loading,
    error,
  }
}

export const useIntegrationLogs = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async (params?: {
    page?: number
    limit?: number
    type?: string
    service?: string
    status?: string
    search?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.type) queryParams.append('type', params.type)
      if (params?.service) queryParams.append('service', params.service)
      if (params?.status) queryParams.append('status', params.status)
      if (params?.search) queryParams.append('search', params.search)
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const response = await fetch(`/api/admin/integration-logs?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch logs')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearOldLogs = useCallback(async (olderThanDays: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/integration-logs?olderThanDays=${olderThanDays}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to clear logs')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchLogs,
    clearOldLogs,
    loading,
    error,
  }
}

export const useMessageModeration = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async (params?: {
    page?: number
    limit?: number
    status?: string
    sentiment?: string
    search?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.status) queryParams.append('status', params.status)
      if (params?.sentiment) queryParams.append('sentiment', params.sentiment)
      if (params?.search) queryParams.append('search', params.search)
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const response = await fetch(`/api/admin/message-moderation?${queryParams.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch messages')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const moderateMessage = useCallback(async (messageId: string, action: string, reason?: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/message-moderation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messageId, action, reason })
      })
      if (!response.ok) throw new Error('Failed to moderate message')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const blockUser = useCallback(async (userId: string, reason: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/message-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'block_user', userId, reason })
      })
      if (!response.ok) throw new Error('Failed to block user')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchMessages,
    moderateMessage,
    blockUser,
    loading,
    error,
  }
}

export const useSupportTickets = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = useCallback(async (params?: any) => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      Object.entries(params || {}).forEach(([k, v]) => {
        if (v) queryParams.append(k, String(v))
      })
      const response = await fetch(`/api/admin/support-tickets?${queryParams}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized - please login again')
        throw new Error('Failed to fetch')
      }
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchTickets, loading, error }
}

export const useReports = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async (params?: any) => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      Object.entries(params || {}).forEach(([k, v]) => {
        if (v) queryParams.append(k, String(v))
      })
      const response = await fetch(`/api/admin/reports?${queryParams}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized - please login again')
        throw new Error('Failed to fetch')
      }
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const generateReport = useCallback(async (reportType: string, format: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reportType, format })
      })
      if (!response.ok) throw new Error('Failed to generate')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchReports, generateReport, loading, error }
}

export const useAdminManagement = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAdmins = useCallback(async (params?: any) => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      Object.entries(params || {}).forEach(([k, v]) => {
        if (v) queryParams.append(k, String(v))
      })
      const response = await fetch(`/api/admin/admins?${queryParams}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized - please login again')
        throw new Error('Failed to fetch')
      }
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateAdmin = useCallback(async (adminId: string, updates: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/admins`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminId, ...updates })
      })
      if (!response.ok) throw new Error('Failed to update')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchAdmins, updateAdmin, loading, error }
}
