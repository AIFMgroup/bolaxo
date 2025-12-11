'use client'

import BuyerDashboard from '@/components/dashboard/BuyerDashboard'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function DemoBuyerDashboardPage() {
  return (
    <DashboardLayout demoRole="buyer">
      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 text-sm text-yellow-800 text-center mb-6 rounded-lg">
        Detta är en <strong>demo-version</strong>. Ingen data sparas.
      </div>
      <BuyerDashboard userId="demo-user" />
    </DashboardLayout>
  )
}


