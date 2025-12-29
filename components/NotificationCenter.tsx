'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, CheckCircle2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslations } from 'next-intl'
import { useNotificationUpdates } from '@/lib/hooks/useRealTimeUpdates'

interface Notification {
  id: string
  subject: string
  content: string
  createdAt: string
  read: boolean
  listingId?: string
}

export default function NotificationCenter() {
  const { user } = useAuth()
  const t = useTranslations('notifications')
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0)

  // Fetch notifications function
  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/notifications?unreadOnly=false`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const newNotifications = data.notifications || []
        const newUnreadCount = data.unreadCount || 0
        
        // Check if there are new notifications
        if (newUnreadCount > previousUnreadCount && previousUnreadCount > 0) {
          // Play notification sound or show visual indicator
          playNotificationSound()
        }
        
        setNotifications(newNotifications)
        setUnreadCount(newUnreadCount)
        setPreviousUnreadCount(newUnreadCount)
      } else if (response.status === 401) {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [user, previousUnreadCount])

  // Use smart polling hook - faster when panel is open
  const { refresh, markActivity, isFastMode } = useNotificationUpdates(
    fetchNotifications,
    !!user
  )

  // Speed up polling when notification panel is open
  useEffect(() => {
    if (open) {
      markActivity()
    }
  }, [open, markActivity])

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationIds })
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

  return (
    <>
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-primary-navy hover:bg-gray-50 transition-colors rounded-lg"
        aria-label={t('ariaLabel')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-primary-navy text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="fixed top-16 sm:top-20 right-0 sm:right-4 left-0 sm:left-auto z-50 w-full sm:w-96 max-h-[calc(100vh-4rem)] sm:max-h-[80vh] bg-white sm:rounded-xl shadow-lg border-t sm:border border-gray-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-primary-navy text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {t('title')}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="hover:bg-primary-navy/80 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{t('noNotifications')}</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const meta = getNotificationMeta(notification.subject)
                  return (
                  <div
                    key={notification.id}
                    className={`px-4 sm:px-6 py-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => !notification.read && markAsRead([notification.id])}
                  >
                    <div className="flex items-start gap-3">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary-navy rounded-full mt-2 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full`}
                            style={{ backgroundColor: meta.bg, color: meta.color }}
                          >
                            {meta.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.createdAt, t)}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {meta.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                      </div>
                      {!notification.read && (
                        <CheckCircle2 className="w-4 h-4 text-primary-navy flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                )})
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                <button
                  onClick={() => markAsRead(notifications.filter(n => !n.read).map(n => n.id))}
                  className="text-sm text-primary-navy font-medium hover:underline flex items-center gap-1"
                >
                  {t('markAllRead')}
                </button>
                <button
                  onClick={refresh}
                  className="p-1.5 text-gray-400 hover:text-primary-navy hover:bg-gray-100 rounded-lg transition-colors"
                  title="Uppdatera"
                >
                  <RefreshCw className={`w-4 h-4 ${isFastMode ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

// Play a subtle notification sound
function playNotificationSound() {
  try {
    // Create a subtle notification sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch (e) {
    // Audio not supported or blocked
  }
}

function formatTime(dateString: string, t: (key: string) => string): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return ''
  }
  
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return t('time.justNow')
  if (diffMins < 60) return `${diffMins} ${t('time.minutesAgo')}`
  if (diffHours < 24) return `${diffHours} ${t('time.hoursAgo')}`
  if (diffDays < 7) return `${diffDays} ${t('time.daysAgo')}`
  
  return date.toLocaleDateString('sv-SE')
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
