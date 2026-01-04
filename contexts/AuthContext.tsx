'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  verified: boolean
  bankIdVerified: boolean
  phone: string | null
  companyName: string | null
  orgNumber: string | null
  region: string | null
  referralCode: string | null
  referredBy: string | null
  createdAt: string
  lastLoginAt: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, role: string, acceptedPrivacy: boolean, referralCode?: string) => Promise<{ success: boolean; message?: string; magicLink?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  const fetchUser = async (force = false) => {
    // If already loading and not a forced refresh, don't start another fetch
    if (loading && !force && user) return

    try {
      // Demo dashboards: derive a demo user from the URL (no real session needed).
      // This keeps demo isolated and avoids relying on cookies/localStorage hacks in production.
      if (typeof window !== 'undefined' && pathname?.includes('/demo/')) {
        const isDemoBuyer = pathname.includes('/demo/dashboard/buyer')
        const isDemoSeller = pathname.includes('/demo/dashboard/seller')
        if (isDemoBuyer || isDemoSeller) {
          const demoUser = {
            id: isDemoSeller ? 'demo-seller' : 'demo-buyer',
            email: isDemoSeller ? 'demo-seller@bolaxo.com' : 'demo-buyer@bolaxo.com',
            name: isDemoSeller ? 'Demo Säljare' : 'Demo Köpare',
            role: isDemoSeller ? 'seller' : 'buyer',
            loginTime: new Date().toISOString(),
          }

          setUser({
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role,
            verified: true,
            bankIdVerified: true,
            phone: null,
            companyName: null,
            orgNumber: null,
            region: null,
            referralCode: null,
            referredBy: null,
            createdAt: demoUser.loginTime,
            lastLoginAt: demoUser.loginTime,
          })
          setLoading(false)
          return
        }
      }

      // Check for dev login first (localStorage)
      if (typeof window !== 'undefined') {
        // Only allow dev-auth outside production OR on dev-login routes.
        // Prevents localStorage spoofing from granting "auth" on real pages in production.
        const allowDevAuth = process.env.NODE_ENV !== 'production' || pathname?.includes('/dev-login')

        if (allowDevAuth) {
          const devUserStr = localStorage.getItem('dev-auth-user')
          if (devUserStr) {
            try {
              const devUser = JSON.parse(devUserStr)
              setUser({
                id: devUser.id,
                email: devUser.email,
                name: devUser.name,
                role: devUser.role,
                verified: true,
                bankIdVerified: true,
                phone: null,
                companyName: null,
                orgNumber: null,
                region: null,
                referralCode: null,
                referredBy: null,
                createdAt: devUser.loginTime,
                lastLoginAt: devUser.loginTime
              })
              setLoading(false)
              return
            } catch (e) {
              console.log('Dev user parse error:', e)
            }
          }
        }
      }
      
      // Fall back to regular auth API (checks session cookie)
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Important: include cookies
        cache: 'no-store', // Don't cache auth check
      })
      
      console.log('🔍 [AUTH] /api/auth/me response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 [AUTH] User data:', data.user ? { email: data.user.email, role: data.user.role } : 'null')
        setUser(data.user)
      } else {
        console.log('❌ [AUTH] /api/auth/me failed:', response.status)
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
    
    // Refresh user when window gains focus (helps catch cookies after redirect)
    const handleFocus = () => {
      // Small delay to ensure cookies are available
      fetchUser(true)
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [pathname])
  
  // Also refresh after a short delay to catch cookies set during redirect
  // but only if we haven't found a user yet
  useEffect(() => {
    if (user) return

    const timer = setTimeout(() => {
      if (!user) {
        console.log('🔄 [AUTH] No user found after delay, refreshing once...')
        fetchUser(true)
      }
    }, 3000) 
    return () => clearTimeout(timer)
  }, [user])
  
  // Check if we're on a page that just did magic link verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check URL params for magic link success
      const urlParams = new URLSearchParams(window.location.search)
      const fromMagicLink = sessionStorage.getItem('from_magic_link')
      
      if (fromMagicLink === 'true' || urlParams.get('logged_in') === 'true') {
        console.log('🔄 [AUTH] Detected magic link redirect, refreshing auth...')
        setTimeout(() => {
          fetchUser()
          sessionStorage.removeItem('from_magic_link')
        }, 1000) // Increased delay
      }
    }
  }, [])

  const login = async (email: string, role: string, acceptedPrivacy: boolean, referralCode?: string) => {
    try {
      const response = await fetch('/api/auth/magic-link/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, acceptedPrivacy, referralCode })
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, message: data.error }
      }

      return { 
        success: true, 
        message: data.message,
        magicLink: data.magicLink // Endast i development
      }
    } catch (error) {
      return { success: false, message: 'Något gick fel' }
    }
  }

  const logout = async () => {
    try {
      // Clear dev auth
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dev-auth-user')
        localStorage.removeItem('dev-auth-token')
      }
      
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

