'use client'

import SellerDashboard from '@/components/dashboard/SellerDashboard'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function DemoSellerDashboardPage() {
  return (
    <DashboardLayout demoRole="seller">
      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 text-sm text-yellow-800 text-center mb-6 rounded-lg">
        Detta är en <strong>demo-version</strong>. Ingen data sparas.
      </div>
      <SellerDashboard userId="demo-user" />
    </DashboardLayout>
  )
}


