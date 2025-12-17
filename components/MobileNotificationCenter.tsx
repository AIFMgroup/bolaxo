'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, ChevronRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslations } from 'next-intl'
import { useNotificationUpdates } from '@/lib/hooks/useRealTimeUpdates'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface Notification {
  id: string
  subject: string
  content: string
  createdAt: string
  read: boolean
  listingId?: string
}

export default function MobileNotificationCenter() {
  const { user } = useAuth()
  const t = useTranslations('notifications')
  const locale = useLocale()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [expanded, setExpanded] = useState(false)

  // Fetch notifications function
  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/notifications?userId=${user.id}&unreadOnly=false`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [user])

  // Use smart polling hook
  useNotificationUpdates(fetchNotifications, !!user)

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, notificationIds })
      })

      if (response.ok) {
        setNotifications(notifications.map(n => 
          notificationIds.includes(n.id) ? { ...n, read: true } : n
        ))
        setUnreadCount(Math.max(0, unreadCount - notificationIds.length))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  if (!user) return null

  const recentNotifications = notifications.slice(0, 3)

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      {/* Header */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-navy text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="font-medium text-gray-900">{t('title')}</span>
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 space-y-3">
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">{t('noNotifications')}</p>
          ) : (
            <>
              {recentNotifications.map((notification) => {
                const meta = getNotificationMeta(notification.subject)
                return (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg ${!notification.read ? 'bg-white border-l-4 border-primary-navy' : 'bg-white/50'}`}
                    onClick={() => !notification.read && markAsRead([notification.id])}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{meta.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{notification.content}</p>
                      </div>
                      {!notification.read && (
                        <CheckCircle2 className="w-4 h-4 text-primary-navy flex-shrink-0" />
                      )}
                    </div>
                  </div>
                )
              })}
              
              {/* View all link */}
              <Link
                href={`/${locale}/dashboard/messages`}
                className="block text-center text-sm text-primary-navy font-medium py-2 hover:underline"
              >
                Visa alla notifikationer →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const notificationBadges = {
  match: { label: 'Matchning', bg: '#E0F2FE', color: '#0369A1' },
  nda: { label: 'NDA', bg: '#DCFCE7', color: '#15803D' },
  message: { label: 'Meddelande', bg: '#FCE7F3', color: '#9D174D' },
  system: { label: 'Notifiering', bg: '#E5E7EB', color: '#374151' }
}

function getNotificationMeta(subject?: string | null) {
  const match = subject?.match(/^\[(.*?)\]\s*(.*)$/)
  const type = match?.[1]?.toLowerCase() as keyof typeof notificationBadges | undefined
  const title = match?.[2] || subject || ''
  const badge = (type && notificationBadges[type]) || notificationBadges.system
  return { ...badge, title }
}

