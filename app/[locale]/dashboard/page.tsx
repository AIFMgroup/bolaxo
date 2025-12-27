'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import SellerDashboard from '@/components/dashboard/SellerDashboard'
import BuyerDashboard from '@/components/dashboard/BuyerDashboard'
import { useTranslations, useLocale } from 'next-intl'
import { isSeller, isBuyer } from '@/lib/user-roles'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const [loading, setLoading] = useState(true)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) {
      return
    }
    
    if (!user) {
      router.push(`/${locale}/login`)
      return
    }

    // Check user profile and listings
    const checkUserProfile = async () => {
      try {
        // Buyers: check if they have profile
        if (isBuyer(user.role)) {
          const response = await fetch(`/api/buyer-profile`, {
            credentials: 'include'
          })
          if (!response.ok) {
            // No profile exists, redirect to registration
            setRedirectPath(`/${locale}/kopare/start`)
            setShouldRedirect(true)
            return
          }
        }
        // Sellers: check if they have listings - but don't redirect, show overview instead
        if (isSeller(user.role)) {
          const response = await fetch(`/api/listings`, {
            credentials: 'include'
          })
          if (!response.ok || response.status === 204) {
            // No listings exist, redirect to onboarding
            setRedirectPath(`/${locale}/salja/onboarding`)
            setShouldRedirect(true)
            return
          }
        }
        setLoading(false)
      } catch (error) {
        console.error('Error checking profile:', error)
        setLoading(false)
      }
    }

    checkUserProfile()
  }, [user, authLoading, router, locale])

  // Redirect if needed
  useEffect(() => {
    if (shouldRedirect && redirectPath) {
      router.push(redirectPath)
    }
  }, [shouldRedirect, redirectPath, router])

  if (authLoading || loading || shouldRedirect) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {isSeller(user?.role || '') && user && <SellerDashboard userId={user.id} />}
      {isBuyer(user?.role || '') && user && <BuyerDashboard userId={user.id} />}
      {!isSeller(user?.role || '') && !isBuyer(user?.role || '') && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
