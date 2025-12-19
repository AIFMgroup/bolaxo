'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifySuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams?.get('redirect') || '/dashboard'

  useEffect(() => {
    // Check if cookies are set
    const checkCookies = () => {
      const cookies = document.cookie
      const hasUserId = cookies.includes('bolaxo_user_id=')
      const hasUserRole = cookies.includes('bolaxo_user_role=')
      
      console.log('🍪 [VERIFY SUCCESS] Checking cookies:', {
        cookies: cookies.substring(0, 200),
        hasUserId,
        hasUserRole
      })
      
      return hasUserId && hasUserRole
    }

    // Wait a moment to ensure cookies are set, then redirect
    const timer = setTimeout(() => {
      const cookiesSet = checkCookies()
      
      if (cookiesSet) {
        console.log('✅ [VERIFY SUCCESS] Cookies found, redirecting to:', redirectUrl)
        // Force full page reload to ensure cookies are read
        window.location.href = redirectUrl
      } else {
        console.warn('⚠️ [VERIFY SUCCESS] Cookies not found, retrying...')
        // Retry after another delay
        setTimeout(() => {
          window.location.href = redirectUrl
        }, 1000)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [redirectUrl])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loggar in...</p>
      </div>
    </div>
  )
}

export default function VerifySuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    }>
      <VerifySuccessContent />
    </Suspense>
  )
}

