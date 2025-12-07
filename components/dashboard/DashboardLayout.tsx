'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Building, FileText, MessageSquare, BarChart3, 
  Settings, Users, TrendingUp, Shield, Calendar, FolderOpen,
  LogOut, ChevronLeft, Bell, Search, Plus, Menu, X, UserCircle,
  Sparkles, ClipboardCheck
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslations, useLocale } from 'next-intl'
import { isSeller, isBuyer } from '@/lib/user-roles'

interface MenuItem {
  label: string
  href: string
  icon: any
  badge?: number
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Role-specific menu items
  const getMenuItems = (): MenuItem[] => {
    const userRole = user?.role || ''
    if (isSeller(userRole)) {
      return [
        { label: t('menu.overview'), href: `/${locale}/dashboard`, icon: LayoutDashboard },
        { label: t('menu.sellerProfile'), href: `/${locale}/dashboard/seller-profile`, icon: UserCircle },
        { label: t('menu.myListings'), href: `/${locale}/dashboard/listings`, icon: Building, badge: 3 },
        { label: t('menu.readiness'), href: `/${locale}/dashboard/readiness`, icon: ClipboardCheck },
        { label: t('menu.matchedBuyers'), href: `/${locale}/dashboard/matches`, icon: Users, badge: 12 },
        { label: t('menu.ndaRequests'), href: `/${locale}/dashboard/ndas`, icon: Shield, badge: 5 },
        { label: t('menu.analytics'), href: `/${locale}/dashboard/analytics`, icon: BarChart3 },
        { label: t('menu.documents'), href: `/${locale}/dashboard/documents`, icon: FolderOpen },
        { label: t('menu.mySales'), href: `/${locale}/dashboard/sales`, icon: TrendingUp },
        { label: t('menu.calendar'), href: `/${locale}/dashboard/calendar`, icon: Calendar },
        { label: t('menu.settings'), href: `/${locale}/dashboard/settings`, icon: Settings },
      ]
    } else if (isBuyer(userRole)) {
      return [
        { label: t('menu.overview'), href: `/${locale}/dashboard`, icon: LayoutDashboard },
        { label: t('menu.investorProfile'), href: `/${locale}/dashboard/investor-profile`, icon: UserCircle },
        { label: t('menu.searchProfile'), href: `/${locale}/dashboard/search-profile`, icon: Search },
        { label: t('menu.savedItems'), href: `/${locale}/dashboard/saved`, icon: Building, badge: 12 },
        { label: t('menu.ndaStatus'), href: `/${locale}/dashboard/nda-status`, icon: Shield, badge: 4 },
        { label: t('menu.comparisons'), href: `/${locale}/dashboard/compare`, icon: BarChart3 },
        { label: t('menu.calendar'), href: `/${locale}/dashboard/calendar`, icon: Calendar },
        { label: t('menu.myDeals'), href: `/${locale}/dashboard/deals`, icon: FileText, badge: 0 },
        { label: t('menu.settings'), href: `/${locale}/dashboard/settings`, icon: Settings },
      ]
    } else {
      // Advisor/Broker
      return [
        { label: t('menu.overview'), href: `/${locale}/dashboard`, icon: LayoutDashboard },
        { label: t('menu.pipeline'), href: `/${locale}/dashboard/pipeline`, icon: TrendingUp },
        { label: t('menu.clients'), href: `/${locale}/dashboard/clients`, icon: Users, badge: 24 },
        { label: t('menu.activeDeals'), href: `/${locale}/dashboard/deals`, icon: Building, badge: 8 },
        { label: t('menu.messages'), href: `/${locale}/dashboard/messages`, icon: MessageSquare, badge: 6 },
        { label: t('menu.analytics'), href: `/${locale}/dashboard/analytics`, icon: BarChart3 },
        { label: t('menu.team'), href: `/${locale}/dashboard/team`, icon: Users },
        { label: t('menu.settings'), href: `/${locale}/dashboard/settings`, icon: Settings },
      ]
    }
  }

  const menuItems = getMenuItems()

  return (
    <div className="min-h-screen bg-cream flex relative">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        ${collapsed ? 'w-20' : 'w-72'} 
        bg-white border-r border-sand/50 
        transition-all duration-300 flex flex-col
        fixed lg:relative inset-y-0 left-0 z-50
        transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        shadow-lg lg:shadow-none
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-sand/30">
          <div className="flex items-center justify-between">
            <Link href={`/${locale}/dashboard`} className={`flex items-center gap-2 ${collapsed ? 'hidden' : ''}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-navy to-sky rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-navy tracking-tight">Trestor Group</span>
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 hover:bg-sand/30 rounded-xl transition-colors hidden lg:block"
              >
                <ChevronLeft className={`w-5 h-5 transition-transform text-navy ${collapsed ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-sand/30 rounded-xl transition-colors lg:hidden"
              >
                <X className="w-5 h-5 text-navy" />
              </button>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-sand/30">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-11 h-11 bg-gradient-to-br from-rose to-coral rounded-xl flex items-center justify-center text-navy font-bold text-lg shadow-sm">
              {user?.name?.[0] || user?.email?.[0] || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-navy truncate">
                  {user?.name || user?.email}
                </div>
                <div className="text-xs text-graphite/70 flex items-center gap-1">
                  <span className="w-2 h-2 bg-mint rounded-full"></span>
                  {isSeller(user?.role || '') ? t('roles.seller') : isBuyer(user?.role || '') ? t('roles.buyer') : t('roles.broker')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-navy to-navy/90 text-white shadow-md' 
                        : 'text-graphite hover:bg-sand/40 hover:text-navy'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                    </div>
                    {!collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-rose/50 text-navy'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-sand/30">
          <button
            onClick={logout}
            className={`flex items-center gap-3 px-3 py-2.5 text-graphite hover:text-coral hover:bg-coral/10 rounded-xl transition-all w-full ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-sm font-medium">{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-sand/30 px-4 sm:px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 hover:bg-sand/30 rounded-xl transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5 text-navy" />
              </button>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-navy">
                  {menuItems.find(item => item.href === pathname)?.label || t('defaultTitle')}
                </h1>
                <p className="text-sm text-graphite/60 hidden sm:block">
                  {new Date().toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick actions based on role */}
              {isSeller(user?.role || '') && (
                <Link 
                  href={`/${locale}/salja/start`} 
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-navy to-navy/90 text-white font-medium rounded-full hover:shadow-lg transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('quickActions.newListing')}</span>
                </Link>
              )}
              {isBuyer(user?.role || '') && (
                <Link 
                  href={`/${locale}/sok`} 
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-navy to-navy/90 text-white font-medium rounded-full hover:shadow-lg transition-all text-sm"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('quickActions.searchCompanies')}</span>
                </Link>
              )}
              
              {/* Notifications */}
              <button className="relative p-2.5 hover:bg-sand/30 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-graphite" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-coral rounded-full border-2 border-white"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
