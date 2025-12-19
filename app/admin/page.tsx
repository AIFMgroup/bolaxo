'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3, Users, TrendingUp, AlertCircle, RefreshCw, Download,
  Eye, Search, ShoppingCart, Flag, Activity, Clock, Zap, Globe, Users2, DollarSign, Mail, MessageCircle, Ticket,
  ChevronRight, ArrowUp, ArrowDown, Sparkles, Database, Shield, Settings, LogOut, Menu, X, ChartBar, PieChart,
  Building2, FileText, Bell, CheckCircle, XCircle, Send
} from 'lucide-react'
import UserManagement from '@/components/admin/UserManagement'
import ListingManagement from '@/components/admin/ListingManagement'
import TransactionPipeline from '@/components/admin/TransactionPipeline'
import PaymentManagement from '@/components/admin/PaymentManagement'
import FinancialDashboard from '@/components/admin/FinancialDashboard'
import ContentModeration from '@/components/admin/ContentModeration'
import AuditTrail from '@/components/admin/AuditTrail'
import AdvancedAnalytics from '@/components/admin/AdvancedAnalytics'
import SellerManagement from '@/components/admin/SellerManagement'
import BuyerAnalytics from '@/components/admin/BuyerAnalytics'
import FraudDetection from '@/components/admin/FraudDetection'
import NdaTracking from '@/components/admin/NdaTracking'
import EmailTracking from '@/components/admin/EmailTracking'
import IntegrationLogs from '@/components/admin/IntegrationLogs'
import MessageModeration from '@/components/admin/MessageModeration'
import SupportTickets from '@/components/admin/SupportTickets'
import ReportGeneration from '@/components/admin/ReportGeneration'
import AdminManagement from '@/components/admin/AdminManagement'
import PermissionsMatrix from '@/components/admin/PermissionsMatrix'
import DataExportImport from '@/components/admin/DataExportImport'
import SellerVerification from '@/components/admin/SellerVerification'
import BuyerOnboarding from '@/components/admin/BuyerOnboarding'
import CustomAlerts from '@/components/admin/CustomAlerts'
import AdvancedReporting from '@/components/admin/AdvancedReporting'

interface DashboardStats {
  totalVisitors: number
  uniqueVisitors: number
  realVsBot: { real: number; bot: number }
  avgSessionDuration: number
  bounceRate: number
  topSearches: Array<{ query: string; count: number }>
  topPages: Array<{ path: string; views: number }>
  revenueToday: number
  activeListings: number
  ndaRequests: number
  messages: number
  conversionRate: number
  deviceBreakdown: { mobile: number; desktop: number; tablet: number }
  trafficSources: Array<{ source: string; count: number }>
  recentActivities: Array<{
    id: string
    type: 'listing' | 'nda' | 'message' | 'payment'
    description: string
    timestamp: string
  }>
}

type TabType = 'overview' | 'users' | 'listings' | 'transactions' | 'payments' | 'financial' | 'moderation' | 'audit' | 'analytics' | 'sellers' | 'buyers' | 'fraud' | 'ndas' | 'emails' | 'integrations' | 'messages' | 'support' | 'reports' | 'admins' | 'permissions' | 'data' | 'sellerVerification' | 'buyerOnboarding' | 'customAlerts' | 'advancedReporting' | 'emailTest'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalVisitors: 0,
    uniqueVisitors: 0,
    realVsBot: { real: 0, bot: 0 },
    avgSessionDuration: 0,
    bounceRate: 0,
    topSearches: [],
    topPages: [],
    revenueToday: 0,
    activeListings: 0,
    ndaRequests: 0,
    messages: 0,
    conversionRate: 0,
    deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
    trafficSources: [],
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [testEmail, setTestEmail] = useState('')
  const [testEmailType, setTestEmailType] = useState('test')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    setIsAuthorized(true)
    setLoading(false)
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-stats')
        if (response.ok) {
          const data = await response.json()
          setStats(prev => ({
            ...prev,
            ...data,
            realVsBot: {
              real: data?.realVsBot?.real ?? prev.realVsBot.real ?? 0,
              bot: data?.realVsBot?.bot ?? prev.realVsBot.bot ?? 0
            },
            topSearches: Array.isArray(data?.topSearches) ? data.topSearches : prev.topSearches,
            topPages: Array.isArray(data?.topPages) ? data.topPages : prev.topPages,
            deviceBreakdown: {
              mobile: data?.deviceBreakdown?.mobile ?? prev.deviceBreakdown.mobile ?? 0,
              desktop: data?.deviceBreakdown?.desktop ?? prev.deviceBreakdown.desktop ?? 0,
              tablet: data?.deviceBreakdown?.tablet ?? prev.deviceBreakdown.tablet ?? 0
            },
            trafficSources: Array.isArray(data?.trafficSources) ? data.trafficSources : prev.trafficSources,
            recentActivities: Array.isArray(data?.recentActivities) ? data.recentActivities : prev.recentActivities
          }))
          setLastUpdated(new Date())
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 10000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const handleLogout = async () => {
    document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
    setTimeout(() => {
      window.location.href = '/admin/login'
    }, 500)
  }

  const handleSendTestEmail = async () => {
    if (!testEmail) return
    setSendingEmail(true)
    setEmailResult(null)
    
    try {
      const response = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, emailType: testEmailType })
      })
      const data = await response.json()
      setEmailResult({
        success: response.ok,
        message: data.message || data.error || 'Email skickat!'
      })
    } catch (error) {
      setEmailResult({ success: false, message: 'Kunde inte skicka email' })
    } finally {
      setSendingEmail(false)
    }
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-red-600 font-semibold">Obehörig åtkomst</p>
      </div>
    )
  }

  const navGroups = [
    {
      title: 'Dashboard',
      items: [
        { id: 'overview' as TabType, label: 'Översikt', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'analytics' as TabType, label: 'Analys', icon: <ChartBar className="w-4 h-4" /> },
        { id: 'advancedReporting' as TabType, label: 'Rapporter', icon: <PieChart className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Användare',
      items: [
        { id: 'users' as TabType, label: 'Alla användare', icon: <Users className="w-4 h-4" /> },
        { id: 'sellers' as TabType, label: 'Säljare', icon: <Building2 className="w-4 h-4" /> },
        { id: 'buyers' as TabType, label: 'Köpare', icon: <Users2 className="w-4 h-4" /> },
        { id: 'sellerVerification' as TabType, label: 'Verifiering', icon: <Shield className="w-4 h-4" /> },
        { id: 'buyerOnboarding' as TabType, label: 'Onboarding', icon: <Sparkles className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Affärer',
      items: [
        { id: 'listings' as TabType, label: 'Annonser', icon: <FileText className="w-4 h-4" /> },
        { id: 'transactions' as TabType, label: 'Transaktioner', icon: <Activity className="w-4 h-4" /> },
        { id: 'ndas' as TabType, label: 'NDA-spårning', icon: <Flag className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Ekonomi',
      items: [
        { id: 'payments' as TabType, label: 'Betalningar', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'financial' as TabType, label: 'Finansiellt', icon: <TrendingUp className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Kommunikation',
      items: [
        { id: 'messages' as TabType, label: 'Meddelanden', icon: <MessageCircle className="w-4 h-4" /> },
        { id: 'emails' as TabType, label: 'E-post', icon: <Mail className="w-4 h-4" /> },
        { id: 'emailTest' as TabType, label: 'Testa Email', icon: <Send className="w-4 h-4" /> },
        { id: 'support' as TabType, label: 'Support', icon: <Ticket className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Säkerhet',
      items: [
        { id: 'moderation' as TabType, label: 'Moderation', icon: <AlertCircle className="w-4 h-4" /> },
        { id: 'fraud' as TabType, label: 'Bedrägeri', icon: <Shield className="w-4 h-4" /> },
        { id: 'audit' as TabType, label: 'Logg', icon: <Eye className="w-4 h-4" /> },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'integrations' as TabType, label: 'Integrationer', icon: <Globe className="w-4 h-4" /> },
        { id: 'data' as TabType, label: 'Data', icon: <Database className="w-4 h-4" /> },
        { id: 'customAlerts' as TabType, label: 'Varningar', icon: <Bell className="w-4 h-4" /> },
        { id: 'admins' as TabType, label: 'Admins', icon: <Settings className="w-4 h-4" /> },
        { id: 'permissions' as TabType, label: 'Behörigheter', icon: <Shield className="w-4 h-4" /> },
      ]
    },
  ]

  const emailTypes = [
    { value: 'test', label: 'Grundläggande test' },
    { value: 'welcome', label: 'Välkommen-email' },
    { value: 'nda_approval', label: 'NDA godkänd' },
    { value: 'nda_rejection', label: 'NDA avslagen' },
    { value: 'nda_request', label: 'Ny NDA-förfrågan' },
    { value: 'new_message', label: 'Nytt meddelande' },
    { value: 'match_buyer', label: 'Matchning (köpare)' },
    { value: 'match_seller', label: 'Matchning (säljare)' },
    { value: 'payment_confirmation', label: 'Betalningsbekräftelse' },
    { value: 'invoice_reminder', label: 'Fakturapåminnelse' },
    { value: 'weekly_digest', label: 'Veckosammanfattning' },
    { value: 'transaction_milestone', label: 'Transaktions-milstolpe' },
    { value: 'nda_pending_reminder', label: 'NDA-påminnelse' },
  ]

  return (
    <div className="flex h-screen bg-cream">
      {/* Sidebar - Cream/Navy design */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-navy flex flex-col transition-all duration-300 shadow-xl`}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="block hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-3">
              <h1 className={`text-2xl font-black text-white ${!sidebarOpen && 'text-center'}`}>
                {sidebarOpen ? 'BOLAXO' : 'B'}
              </h1>
              {sidebarOpen && (
                <span className="text-xs font-medium text-sky uppercase tracking-wider bg-white/10 px-2 py-1 rounded">
                  Admin
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-8 bg-rose text-navy rounded-full p-1.5 shadow-lg hover:bg-coral transition-all z-10"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-6">
              {sidebarOpen && (
                <h3 className="px-4 text-xs font-semibold text-sky/60 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-200 group ${
                      activeTab === item.id
                        ? 'bg-rose text-navy font-semibold shadow-lg'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className={`${activeTab === item.id ? 'text-navy' : 'text-sky'} transition-colors`}>
                      {item.icon}
                    </div>
                    {sidebarOpen && <span>{item.label}</span>}
                    {!sidebarOpen && (
                      <div className="absolute left-full ml-3 px-3 py-2 bg-navy text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10">
                        {item.label}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-coral/20 hover:bg-coral/30 text-white rounded-xl transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && 'Logga ut'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-sand/50 px-8 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-navy flex items-center gap-3">
                {navGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'Dashboard'}
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-mint/30 text-navy">
                  Live
                </span>
              </h2>
              <p className="text-sm text-graphite/60 mt-1 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Uppdaterad: {lastUpdated.toLocaleTimeString('sv-SE')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                  autoRefresh
                    ? 'bg-navy text-white border-navy shadow-lg'
                    : 'bg-white text-graphite border-sand hover:border-navy'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh && 'animate-spin'}`} />
                Auto {autoRefresh ? 'PÅ' : 'AV'}
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-rose hover:bg-coral text-navy rounded-xl transition-all text-sm font-medium shadow-lg">
                <Download className="w-4 h-4" />
                Exportera
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-cream/50">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl border border-sand/30 p-6 hover:shadow-card-hover hover:border-navy/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-graphite/60 uppercase tracking-wide">Besökare idag</h3>
                    <div className="w-10 h-10 rounded-xl bg-sky/20 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-navy" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-navy">4,247</p>
                  <p className="text-sm text-graphite/60 mt-2 flex items-center gap-1">
                    <ArrowUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 font-medium">12%</span> från igår
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-sand/30 p-6 hover:shadow-card-hover hover:border-navy/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-graphite/60 uppercase tracking-wide">Aktiva annonser</h3>
                    <div className="w-10 h-10 rounded-xl bg-mint/30 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-navy" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-navy">{stats.activeListings || 187}</p>
                  <p className="text-sm text-graphite/60 mt-2">+8 nya denna vecka</p>
                </div>

                <div className="bg-white rounded-2xl border border-sand/30 p-6 hover:shadow-card-hover hover:border-navy/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-graphite/60 uppercase tracking-wide">NDA-förfrågningar</h3>
                    <div className="w-10 h-10 rounded-xl bg-rose/30 flex items-center justify-center">
                      <Flag className="w-5 h-5 text-navy" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-navy">{stats.ndaRequests || 64}</p>
                  <p className="text-sm text-graphite/60 mt-2">12 väntande på svar</p>
                </div>

                <div className="bg-white rounded-2xl border border-sand/30 p-6 hover:shadow-card-hover hover:border-navy/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-graphite/60 uppercase tracking-wide">Intäkter idag</h3>
                    <div className="w-10 h-10 rounded-xl bg-butter/50 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-navy" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-navy">42.5K</p>
                  <p className="text-sm text-graphite/60 mt-2 flex items-center gap-1">
                    <ArrowUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 font-medium">8%</span> från igår
                  </p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Activity Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-sand/30 p-6 shadow-card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-navy">Aktivitet senaste 24h</h3>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-sm text-graphite/60">Realtid</span>
                    </div>
                  </div>
                  
                  <div className="h-64 flex items-end justify-between gap-1.5">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-navy to-sky rounded-t-lg transition-all duration-500 hover:from-navy hover:to-rose cursor-pointer"
                        style={{ height: `${20 + Math.random() * 80}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-xs text-graphite/50">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>Nu</span>
                  </div>
                </div>

                {/* Device Stats */}
                <div className="bg-white rounded-2xl border border-sand/30 p-6 shadow-card">
                  <h3 className="text-lg font-bold text-navy mb-6">Enheter</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-graphite/70">Mobil</span>
                        <span className="text-sm font-bold text-navy">55%</span>
                      </div>
                      <div className="w-full bg-sand/30 rounded-full h-3">
                        <div className="bg-gradient-to-r from-navy to-sky h-3 rounded-full" style={{ width: '55%' }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-graphite/70">Desktop</span>
                        <span className="text-sm font-bold text-navy">35%</span>
                      </div>
                      <div className="w-full bg-sand/30 rounded-full h-3">
                        <div className="bg-gradient-to-r from-rose to-coral h-3 rounded-full" style={{ width: '35%' }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-graphite/70">Surfplatta</span>
                        <span className="text-sm font-bold text-navy">10%</span>
                      </div>
                      <div className="w-full bg-sand/30 rounded-full h-3">
                        <div className="bg-gradient-to-r from-mint to-sky h-3 rounded-full" style={{ width: '10%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-sand/30">
                    <h4 className="text-sm font-semibold text-graphite/60 uppercase tracking-wide mb-4">Populära sökningar</h4>
                    <div className="space-y-2">
                      {(stats.topSearches.length > 0 ? stats.topSearches.slice(0, 4) : [
                        { query: 'IT-konsult', count: 156 },
                        { query: 'E-handel', count: 134 },
                        { query: 'Restaurant', count: 98 },
                        { query: 'SaaS', count: 87 }
                      ]).map((search, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-graphite/70">{search.query}</span>
                          <span className="font-medium text-navy">{search.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl border border-sand/30 p-6 shadow-card">
                <h3 className="text-lg font-bold text-navy mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sky" />
                  Senaste aktiviteter
                </h3>
                <div className="space-y-4">
                  {(stats.recentActivities.length > 0 ? stats.recentActivities : [
                    { id: '1', type: 'listing' as const, description: 'Ny annons publicerad: IT-konsultbolag i Stockholm', timestamp: new Date().toISOString() },
                    { id: '2', type: 'nda' as const, description: 'NDA-förfrågan godkänd för E-handelsbolag', timestamp: new Date(Date.now() - 3600000).toISOString() },
                    { id: '3', type: 'message' as const, description: 'Nytt meddelande mellan säljare och köpare', timestamp: new Date(Date.now() - 7200000).toISOString() },
                    { id: '4', type: 'payment' as const, description: 'Betalning mottagen: PRO-paket (4 990 kr)', timestamp: new Date(Date.now() - 10800000).toISOString() },
                  ]).map((activity, idx) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-cream/50 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'listing' ? 'bg-sky/20' :
                        activity.type === 'nda' ? 'bg-rose/20' :
                        activity.type === 'message' ? 'bg-mint/30' :
                        'bg-butter/50'
                      }`}>
                        {activity.type === 'listing' ? <FileText className="w-5 h-5 text-navy" /> :
                         activity.type === 'nda' ? <Flag className="w-5 h-5 text-navy" /> :
                         activity.type === 'message' ? <MessageCircle className="w-5 h-5 text-navy" /> :
                         <DollarSign className="w-5 h-5 text-navy" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-graphite font-medium">{activity.description}</p>
                        <p className="text-xs text-graphite/50 mt-1">
                          {new Date(activity.timestamp).toLocaleString('sv-SE')}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-graphite/30 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* EMAIL TEST TAB */}
          {activeTab === 'emailTest' && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-2xl border border-sand/30 p-8 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-sky/20 flex items-center justify-center">
                    <Send className="w-6 h-6 text-navy" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-navy">Testa Email-system</h3>
                    <p className="text-sm text-graphite/60">Skicka test-emails för att verifiera att Brevo fungerar</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-graphite mb-2">
                      Mottagare
                    </label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="din@email.com"
                      className="w-full px-4 py-3 border border-sand rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-graphite mb-2">
                      Email-typ
                    </label>
                    <select
                      value={testEmailType}
                      onChange={(e) => setTestEmailType(e.target.value)}
                      className="w-full px-4 py-3 border border-sand rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-all bg-white"
                    >
                      {emailTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleSendTestEmail}
                    disabled={!testEmail || sendingEmail}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-navy hover:bg-navy/90 text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingEmail ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Skickar...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Skicka test-email
                      </>
                    )}
                  </button>

                  {emailResult && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${
                      emailResult.success ? 'bg-mint/30 text-green-800' : 'bg-rose/30 text-red-800'
                    }`}>
                      {emailResult.success ? (
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 flex-shrink-0" />
                      )}
                      <p className="text-sm font-medium">{emailResult.message}</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-sand/30">
                  <h4 className="text-sm font-semibold text-graphite/60 uppercase tracking-wide mb-4">
                    Tillgängliga email-typer
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {emailTypes.map(type => (
                      <div key={type.value} className="flex items-center gap-2 text-sm text-graphite/70">
                        <CheckCircle className="w-4 h-4 text-mint" />
                        {type.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs */}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'listings' && <ListingManagement />}
          {activeTab === 'transactions' && <TransactionPipeline />}
          {activeTab === 'payments' && <PaymentManagement />}
          {activeTab === 'financial' && <FinancialDashboard />}
          {activeTab === 'moderation' && <ContentModeration />}
          {activeTab === 'audit' && <AuditTrail />}
          {activeTab === 'analytics' && <AdvancedAnalytics />}
          {activeTab === 'sellers' && <SellerManagement />}
          {activeTab === 'buyers' && <BuyerAnalytics />}
          {activeTab === 'fraud' && <FraudDetection />}
          {activeTab === 'ndas' && <NdaTracking />}
          {activeTab === 'emails' && <EmailTracking />}
          {activeTab === 'integrations' && <IntegrationLogs />}
          {activeTab === 'messages' && <MessageModeration />}
          {activeTab === 'support' && <SupportTickets />}
          {activeTab === 'reports' && <ReportGeneration />}
          {activeTab === 'admins' && <AdminManagement />}
          {activeTab === 'permissions' && <PermissionsMatrix />}
          {activeTab === 'data' && <DataExportImport />}
          {activeTab === 'sellerVerification' && <SellerVerification />}
          {activeTab === 'buyerOnboarding' && <BuyerOnboarding />}
          {activeTab === 'customAlerts' && <CustomAlerts />}
          {activeTab === 'advancedReporting' && <AdvancedReporting />}
        </div>
      </main>
    </div>
  )
}
