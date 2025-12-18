'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Menu, X, User, LogOut, MessageSquare, LayoutDashboard, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { LAUNCH_CONFIG } from '@/lib/launch-config'
import LanguageSwitcher from './LanguageSwitcher'
import NotificationCenter from './NotificationCenter'
import MobileNotificationCenter from './MobileNotificationCenter'

interface DropdownItem {
  label: string
  href: string
  description?: string
}

interface NavItem {
  label: string
  href?: string
  dropdown?: DropdownItem[]
}

const getNavigation = (t: (key: string) => string): NavItem[] => {
  const baseNav: NavItem[] = [
    {
      label: 'Marknadsplats',
      dropdown: [
        { label: 'Bolag till salu', href: '/sok' },
        { label: 'Sanitycheck', href: '/sanitycheck' },
        { label: 'Prismodeller', href: '/priser' },
        { label: 'Kunskapsbank', href: '/kunskapsbank' },
      ]
    },
    {
      label: t('header.forSellers'),
      dropdown: [
        { label: t('footer.howItWorks'), href: '/salja' },
        { label: 'Säljarprofil', href: '/saljarprofil' },
        { label: 'Skapa annons', href: '/salja/skapa-annons' },
        { label: 'Värderingskoll', href: '/sanitycheck' },
      ]
    },
    {
      label: t('header.forBuyers'),
      dropdown: [
        { label: t('footer.howItWorks'), href: '/kopare/sa-fungerar-det' },
        { label: 'Investerarprofil', href: '/investerarprofil' },
      ]
    },
  ]

  // Add broker section if enabled in launch config
  if (LAUNCH_CONFIG.NAVIGATION.SHOW_FOR_MAKLARE) {
    baseNav.push({
      label: t('header.forBrokers'),
      href: '/for-maklare'
    })
  }

  baseNav.push({
    label: t('header.about'),
    href: '/om-oss',
    dropdown: [
      { label: t('footer.contact'), href: '/kontakt' },
    ]
  })

  // Add Dashboard section for quick login
  baseNav.push({
    label: 'Dashboard',
    dropdown: [
      { label: 'Köpare (demo)', href: '/demo/dashboard/buyer' },
      { label: 'Säljare (demo)', href: '/demo/dashboard/seller' },
    ]
  })

  // In launch mode with limited features, keep it simple
  if (LAUNCH_CONFIG.LAUNCH_MODE && !LAUNCH_CONFIG.NAVIGATION.SHOW_FOR_INVESTERARE) {
    return baseNav
  }

  // Full navigation when not in launch mode
  return [
    ...baseNav,
    {
      label: t('header.more'),
      dropdown: [
        { label: t('footer.company'), href: '/om-oss' },
        { label: t('footer.successStories'), href: '/success-stories' },
        ...(LAUNCH_CONFIG.NAVIGATION.SHOW_FOR_INVESTERARE ? [{ label: t('footer.investors'), href: '/investor' }] : []),
      ]
    }
  ]
}

export default function Header() {
  const t = useTranslations()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const locale = useLocale()
  const isAdminPage = pathname?.startsWith('/admin')
  
  // Build navigation with translations
  const navigation = useMemo(() => getNavigation(t), [t])

  // Helper function to add locale prefix to paths
  const getLocalizedPath = (path: string) => {
    if (path.startsWith('/admin') || path.startsWith('/api')) {
      return path
    }
    return `/${locale}${path}`
  }
  
  // Hide header on admin pages
  if (isAdminPage) {
    return null
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial scroll position
    return () => window.removeEventListener('scroll', handleScroll)
  }, [mounted])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      // Save current scroll position
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      return () => {
        // Restore scroll position when menu closes
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isMenuOpen])

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
    }
    setOpenDropdown(label)
  }

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
    }, 150)
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-md border-b border-gray-100' : 'bg-white'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24 md:h-20 lg:h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center">
<img 
              src="/Logo/afterfounder.png" 
              alt="Afterfounder"
              className="h-44 md:h-40 lg:h-36 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.dropdown && handleMouseEnter(item.label)}
                onMouseLeave={handleMouseLeave}
              >
                {item.href ? (
                  <div className="relative group">
                    <Link
                      href={getLocalizedPath(item.href || '/')}
                      className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-primary-navy transition-colors duration-200"
                    >
                      <span>{item.label}</span>
                      {item.dropdown && (
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${
                          openDropdown === item.label ? 'rotate-180' : ''
                        }`} />
                      )}
                    </Link>
                    {/* Dropdown Menu */}
                    {item.dropdown && openDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg overflow-hidden transform origin-top transition-all duration-200 ease-out scale-100 opacity-100">
                        <div className="py-2">
                          {item.dropdown.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.href}
                              href={getLocalizedPath(dropdownItem.href)}
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-navy transition-colors"
                            >
                              {dropdownItem.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-primary-navy transition-colors duration-200">
                    <span>{item.label}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${
                      openDropdown === item.label ? 'rotate-180' : ''
                    }`} />
                  </button>
                )}

                {/* Dropdown Menu */}
                {item.dropdown && openDropdown === item.label && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg overflow-hidden transform origin-top transition-all duration-200 ease-out scale-100 opacity-100">
                    <div className="py-2">
                      {item.dropdown.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.href}
                          href={getLocalizedPath(dropdownItem.href)}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-navy transition-colors"
                        >
                          {dropdownItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {user ? (
              <>
                {/* Desktop user menu */}
                <div className="hidden lg:flex items-center space-x-1">
                  {/* Notifications */}
                  <NotificationCenter />
                  
                  {/* Chat link */}
                  {(user.role === 'buyer' || user.role === 'seller') && (
                    <Link
                      href={getLocalizedPath(user.role === 'buyer' ? '/kopare/chat' : '/salja/chat')}
                      className="p-2 rounded-lg text-gray-600 hover:text-primary-navy hover:bg-gray-50 transition-all duration-200"
                      title={t('header.messages')}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </Link>
                  )}
                  
                  {/* Dashboard link */}
                  <Link
                    href={getLocalizedPath('/dashboard')}
                    className="p-2 rounded-lg text-gray-600 hover:text-primary-navy hover:bg-gray-50 transition-all duration-200"
                    title={t('header.dashboard')}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                  
                  {/* Profile menu */}
                  <div 
                    className="relative"
                    onMouseEnter={() => handleMouseEnter('profile')}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button className="p-2 rounded-lg text-gray-600 hover:text-primary-navy hover:bg-gray-50 transition-all duration-200">
                      <User className="w-5 h-5" />
                    </button>
                    
                    {openDropdown === 'profile' && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="py-2">
                          <Link
                            href={getLocalizedPath(user.role === 'buyer' ? '/kopare/settings' : '/salja/settings')}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-navy transition-colors"
                          >
                            {t('header.profile')}
                          </Link>
                          <button
                            onClick={logout}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-navy transition-colors"
                          >
                            {t('common.logout')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  href={getLocalizedPath('/login')}
                  className="hidden lg:block text-sm font-medium text-gray-700 hover:text-primary-navy transition-colors duration-200"
                >
                  {t('common.login')}
                </Link>
                <Link
                  href={getLocalizedPath('/registrera')}
                  className="hidden lg:block px-4 py-2 bg-primary-navy text-white rounded-lg font-medium text-sm hover:bg-primary-navy/90 transition-all duration-200 hover:shadow-md"
                >
                  {t('header.getStarted')}
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors active:bg-gray-200"
              aria-label={t('common.openMenu')}
            >
              {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div 
        className={`lg:hidden fixed inset-0 z-[100] ${
          isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999
        }}
      >
        {/* Overlay */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`} 
          onClick={() => setIsMenuOpen(false)}
          style={{ position: 'fixed', inset: 0 }}
        />
        
        {/* Menu Panel */}
        <div 
          className={`absolute top-0 left-0 w-full max-w-sm h-full bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            backgroundColor: '#ffffff',
            zIndex: 10000,
            overflow: 'visible',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header Section - Fixed */}
          <div 
            className="bg-white border-b border-gray-200 px-6 py-5 flex-shrink-0"
            style={{ position: 'relative', zIndex: 1 }}
          >
            <div className="flex justify-between items-center">
              <img src="/Logo/afterfounder.png" alt="Afterfounder" className="h-36 w-auto" />
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label={t('common.closeMenu')}
              >
                <X className="w-7 h-7 text-gray-700" />
              </button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div 
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >
            <div className="px-6 pt-6 pb-32 space-y-1">
              {/* Mobile navigation */}
              {navigation.map((item, index) => (
                <div key={item.label}>
                  {item.href ? (
                    <div className="space-y-1">
                      <Link
                        href={getLocalizedPath(item.href || '/')}
                        className="block text-lg font-semibold text-gray-900 hover:text-primary-navy transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                      {item.dropdown && (
                        <div className="space-y-1 pl-2">
                          {item.dropdown.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.href}
                              href={getLocalizedPath(dropdownItem.href)}
                              className="block text-base text-gray-600 hover:text-primary-navy transition-colors py-2.5 px-6 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {dropdownItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-lg font-semibold text-gray-900 px-4 py-3">{item.label}</div>
                      {item.dropdown && (
                        <div className="space-y-1 pl-2">
                          {item.dropdown.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.href}
                              href={getLocalizedPath(dropdownItem.href)}
                              className="block text-base text-gray-600 hover:text-primary-navy transition-colors py-2.5 px-6 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {dropdownItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {index < navigation.length - 1 && (
                    <div className="border-b border-gray-100 my-2 mx-4"></div>
                  )}
                </div>
              ))}
              
              {/* Mobile user menu */}
              <div className="pt-6 mt-6 border-t border-gray-200">
                {user ? (
                  <div className="space-y-1">
                    {/* Mobile Notifications */}
                    <div className="px-4 py-3">
                      <MobileNotificationCenter />
                    </div>
                    
                    {(user.role === 'buyer' || user.role === 'seller') && (
                      <>
                        <Link
                          href={getLocalizedPath(user.role === 'buyer' ? '/kopare/chat' : '/salja/chat')}
                          className="flex items-center space-x-3 text-base font-medium text-gray-900 hover:text-primary-navy transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <MessageSquare className="w-5 h-5" />
                          <span>{t('header.messages')}</span>
                        </Link>
                        <Link
                          href={getLocalizedPath(user.role === 'buyer' ? '/kopare/settings' : '/salja/settings')}
                          className="flex items-center space-x-3 text-base font-medium text-gray-900 hover:text-primary-navy transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <User className="w-5 h-5" />
                          <span>{t('header.profile')}</span>
                        </Link>
                      </>
                    )}
                    <Link
                      href={getLocalizedPath('/dashboard')}
                      className="flex items-center space-x-3 text-base font-medium text-gray-900 hover:text-primary-navy transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span>{t('header.dashboard')}</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center space-x-3 text-base font-medium text-red-600 hover:text-red-700 transition-colors w-full py-3 px-4 rounded-lg hover:bg-red-50 active:bg-red-100 text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>{t('common.logout')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href={getLocalizedPath('/login')}
                      className="block text-lg font-semibold text-gray-900 hover:text-primary-navy transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('common.login')}
                    </Link>
                    <Link
                      href={getLocalizedPath('/registrera')}
                      className="block w-full text-center px-6 py-4 bg-primary-navy text-white rounded-lg font-semibold text-base hover:bg-primary-navy/90 active:bg-primary-navy/80 transition-all shadow-md active:shadow-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('header.getStarted')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}