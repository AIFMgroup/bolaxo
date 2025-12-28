'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import BuyerDashboard from '@/components/dashboard/BuyerDashboard'
import SellerDashboard from '@/components/dashboard/SellerDashboard'

export default function DemoDashboardRoleRootPage() {
  const params = useParams<{ role: string }>()
  const role = (params?.role || '') as 'buyer' | 'seller'

  const userId = useMemo(() => (role === 'seller' ? 'demo-seller' : 'demo-buyer'), [role])

  return (
    <DashboardLayout demoRole={role}>
      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 text-sm text-yellow-800 text-center mb-6 rounded-lg">
        Detta är en <strong>demo-version</strong>. Ingen data sparas.
      </div>
      {role === 'seller' ? <SellerDashboard userId={userId} /> : <BuyerDashboard userId={userId} />}
    </DashboardLayout>
  )
}


