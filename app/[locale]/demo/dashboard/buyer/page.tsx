'use client'

import { useEffect } from 'react'
import BuyerDashboard from '@/components/dashboard/BuyerDashboard'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function DemoBuyerDashboardPage() {
  useEffect(() => {
    // Seed dev auth + cookies so middleware and auth context treat this as logged-in
    const demoUser = {
      id: 'demo-buyer',
      email: 'demo-buyer@afterfounder.com',
      name: 'Demo Köpare',
      role: 'buyer',
      loginTime: new Date().toISOString(),
    }

    localStorage.setItem('dev-auth-user', JSON.stringify(demoUser))
    localStorage.setItem('dev-auth-token', `dev-token-${demoUser.id}-${Date.now()}`)

    document.cookie = `bolaxo_user_id=${demoUser.id}; path=/; max-age=86400`
    document.cookie = `bolaxo_user_role=${demoUser.role}; path=/; max-age=86400`
  }, [])

  return (
    <DashboardLayout demoRole="buyer">
      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 text-sm text-yellow-800 text-center mb-6 rounded-lg">
        Detta är en <strong>demo-version</strong>. Ingen data sparas.
      </div>
      <BuyerDashboard userId="demo-user" />
    </DashboardLayout>
  )
}


