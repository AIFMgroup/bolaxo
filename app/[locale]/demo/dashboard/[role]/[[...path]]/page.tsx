'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

// Reuse existing dashboard pages (same UI) and let DashboardLayout auto-detect demo mode via URL.
import AnalyticsPage from '../../../../dashboard/analytics/page'
import CalendarPage from '../../../../dashboard/calendar/page'
import ClientsPage from '../../../../dashboard/clients/page'
import ComparePage from '../../../../dashboard/compare/page'
import DataRoomPage from '../../../../dashboard/datarum/page'
import DealChecklistPage from '../../../../dashboard/deal-checklist/page'
import DealPipelinePage from '../../../../dashboard/deal-pipeline/page'
import DealsPage from '../../../../dashboard/deals/page'
import DocumentsPage from '../../../../dashboard/documents/page'
import InvestorProfilePage from '../../../../dashboard/investor-profile/page'
import ListingsPage from '../../../../dashboard/listings/page'
import LoisPage from '../../../../dashboard/lois/page'
import MatchesPage from '../../../../dashboard/matches/page'
import MessagesPage from '../../../../dashboard/messages/page'
import NdaStatusPage from '../../../../dashboard/nda-status/page'
import NdasPage from '../../../../dashboard/ndas/page'
import PipelinePage from '../../../../dashboard/pipeline/page'
import SavedPage from '../../../../dashboard/saved/page'
import SearchProfilePage from '../../../../dashboard/search-profile/page'
import SalesPage from '../../../../dashboard/sales/page'
import SellerProfilePage from '../../../../dashboard/seller-profile/page'
import SettingsPage from '../../../../dashboard/settings/page'
import TeamPage from '../../../../dashboard/team/page'

type RouteKey =
  | 'analytics'
  | 'calendar'
  | 'clients'
  | 'compare'
  | 'datarum'
  | 'deal-checklist'
  | 'deal-pipeline'
  | 'deals'
  | 'documents'
  | 'investor-profile'
  | 'listings'
  | 'lois'
  | 'matches'
  | 'messages'
  | 'nda-status'
  | 'ndas'
  | 'pipeline'
  | 'saved'
  | 'search-profile'
  | 'sales'
  | 'seller-profile'
  | 'settings'
  | 'team'

const ROUTES: Record<RouteKey, React.ComponentType> = {
  analytics: AnalyticsPage,
  calendar: CalendarPage,
  clients: ClientsPage,
  compare: ComparePage,
  datarum: DataRoomPage,
  'deal-checklist': DealChecklistPage,
  'deal-pipeline': DealPipelinePage,
  deals: DealsPage,
  documents: DocumentsPage,
  'investor-profile': InvestorProfilePage,
  listings: ListingsPage,
  lois: LoisPage,
  matches: MatchesPage,
  messages: MessagesPage,
  'nda-status': NdaStatusPage,
  ndas: NdasPage,
  pipeline: PipelinePage,
  saved: SavedPage,
  'search-profile': SearchProfilePage,
  sales: SalesPage,
  'seller-profile': SellerProfilePage,
  settings: SettingsPage,
  team: TeamPage,
}

export default function DemoDashboardRoleCatchAllPage() {
  const params = useParams<{ role: string; path?: string[] }>()
  const role = (params?.role || '') as 'buyer' | 'seller'
  const path = (params?.path || []) as string[]

  const key = (path[0] || '') as RouteKey
  const Page = useMemo(() => ROUTES[key], [key])

  if (!Page) {
    return (
      <DashboardLayout demoRole={role}>
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 text-sm text-yellow-800 text-center mb-6 rounded-lg">
          Detta är en <strong>demo-version</strong>. Ingen data sparas.
        </div>
        <div className="bg-white rounded-2xl border border-sand/50 p-10 text-center">
          <h2 className="text-lg font-semibold text-navy">Sidan finns inte</h2>
          <p className="text-graphite/60 mt-1">Kontrollera länken eller använd menyn till vänster.</p>
        </div>
      </DashboardLayout>
    )
  }

  return <Page />
}


