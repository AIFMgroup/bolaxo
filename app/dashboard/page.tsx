'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Redirect based on user type
    const checkUserProfile = async () => {
      try {
        // Buyers: check if they have profile
        if (user.role === 'buyer') {
          const response = await fetch(`/api/buyer-profile`, {
            credentials: 'include'
          })
          if (!response.ok) {
            // No profile exists, redirect to registration
            router.push('/kopare/start')
          }
        }
        // Sellers: check if they have listings
        else if (user.role === 'seller') {
          const response = await fetch(`/api/listings`, {
            credentials: 'include'
          })
          if (!response.ok || response.status === 204) {
            // No listings exist, show onboarding
            router.push('/salja/onboarding')
          } else {
            // Has listings, go to dashboard
            router.push('/dashboard/listings')
          }
        }
      } catch (error) {
        console.error('Error checking profile:', error)
      }
    }

    checkUserProfile()
  }, [user, router])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
