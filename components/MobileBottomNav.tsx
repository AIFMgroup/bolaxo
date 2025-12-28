'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Home, Search, PlusCircle, User, MessageSquare } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  href: string
  icon: React.ReactNode
  label: string
  requiresAuth?: boolean
  roles?: string[]
}

export default function MobileBottomNav() {
  const pathname = usePathname()
  const locale = useLocale()
  const { user } = useAuth()
  const isDemo = pathname?.includes('/demo/')
  
  // Hide on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }
  
  // Define navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        href: `/${locale}`,
        icon: <Home className="w-5 h-5" />,
        label: 'Hem'
      },
      {
        href: `/${locale}/sok`,
        icon: <Search className="w-5 h-5" />,
        label: 'Sök'
      }
    ]
    
    if (user) {
      if (user.role === 'seller') {
        return [
          ...baseItems,
          {
            href: `/${locale}/salja/skapa-annons`,
            icon: <PlusCircle className="w-5 h-5" />,
            label: 'Skapa',
            requiresAuth: true
          },
          {
            href: `/${locale}/salja/chat`,
            icon: <MessageSquare className="w-5 h-5" />,
            label: 'Chatt',
            requiresAuth: true
          },
          {
            href: isDemo ? `/${locale}/demo/dashboard/seller` : `/${locale}/dashboard`,
            icon: <User className="w-5 h-5" />,
            label: 'Profil',
            requiresAuth: true
          }
        ]
      } else {
        // Buyer or other role
        return [
          ...baseItems,
          {
            href: `/${locale}/kopare/chat`,
            icon: <MessageSquare className="w-5 h-5" />,
            label: 'Chatt',
            requiresAuth: true
          },
          {
            href: isDemo ? `/${locale}/demo/dashboard/buyer` : `/${locale}/dashboard`,
            icon: <User className="w-5 h-5" />,
            label: 'Profil',
            requiresAuth: true
          }
        ]
      }
    }
    
    // Not logged in
    return [
      ...baseItems,
      {
        href: `/${locale}/salja`,
        icon: <PlusCircle className="w-5 h-5" />,
        label: 'Sälj'
      },
      {
        href: `/${locale}/login`,
        icon: <User className="w-5 h-5" />,
        label: 'Logga in'
      }
    ]
  }
  
  const navItems = getNavItems()
  
  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === `/${locale}` || pathname === `/${locale}/`
    }
    return pathname?.startsWith(href)
  }
  
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      <div className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center flex-1 py-2 px-1
                transition-colors duration-200 min-h-[56px]
                ${active 
                  ? 'text-primary-navy' 
                  : 'text-gray-500 hover:text-gray-700 active:text-primary-navy'
                }
              `}
            >
              <div className={`
                p-1.5 rounded-xl transition-colors
                ${active ? 'bg-primary-navy/10' : ''}
              `}>
                {item.icon}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-primary-navy' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

