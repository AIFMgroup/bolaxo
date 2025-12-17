'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

export default function CookieConsent() {
  const t = useTranslations('cookieConsent')
  const locale = useLocale()
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  })
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    setMounted(true)
    const consent = localStorage.getItem('afterfounder_cookie_consent')
    if (!consent) {
      setTimeout(() => setShowBanner(true), 800)
    }
  }, [])

  const dismissBanner = (consent: object) => {
    setIsLeaving(true)
    localStorage.setItem('afterfounder_cookie_consent', JSON.stringify(consent))
    setTimeout(() => setShowBanner(false), 300)
  }

  const handleAcceptAll = () => {
    dismissBanner({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    })
  }

  const handleAcceptSelected = () => {
    dismissBanner({
      ...preferences,
      timestamp: new Date().toISOString()
    })
  }

  const handleRejectAll = () => {
    dismissBanner({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    })
  }

  if (!showBanner || !mounted) return null

  return (
    <div 
      className={`fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 transition-all duration-300 ease-out
        ${isLeaving ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      <div className="max-w-lg mx-auto">
        <div 
          className="relative overflow-hidden bg-navy/95 backdrop-blur-xl rounded-2xl shadow-2xl 
            border border-white/10"
          style={{
            boxShadow: '0 -8px 40px rgba(31, 60, 88, 0.4), 0 4px 24px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky/10 via-transparent to-rose/10 pointer-events-none" />
          
          <div className="relative p-5 sm:p-6">
            {!showDetails ? (
              /* ===== COMPACT VIEW ===== */
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  {/* Animated cookie icon */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-rose/20 flex items-center justify-center">
                      <span className="text-xl animate-bounce" style={{ animationDuration: '2s' }}>🍪</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base mb-1">
                      {t('title')}
                    </h3>
                    <p className="text-white/60 text-sm leading-relaxed">
                      {t('description')}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDetails(true)}
                    className="text-white/50 hover:text-white text-xs font-medium transition-colors 
                      px-3 py-2 rounded-full hover:bg-white/5"
                  >
                    {t('customize')}
                  </button>
                  
                  <div className="flex-1" />
                  
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2.5 text-white/70 hover:text-white text-sm font-medium 
                      transition-all duration-200 rounded-full hover:bg-white/10"
                  >
                    {t('rejectAll')}
                  </button>
                  
                  <button
                    onClick={handleAcceptAll}
                    className="group relative px-5 py-2.5 bg-rose text-navy text-sm font-semibold 
                      rounded-full transition-all duration-300 hover:bg-coral hover:scale-105
                      hover:shadow-lg hover:shadow-rose/30 active:scale-95"
                  >
                    <span className="relative z-10">{t('acceptAll')}</span>
                    {/* Subtle pulse effect on the accept button */}
                    <span className="absolute inset-0 rounded-full bg-rose animate-ping opacity-20" 
                      style={{ animationDuration: '2s' }} />
                  </button>
                </div>
              </div>
            ) : (
              /* ===== EXPANDED DETAILS VIEW ===== */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-base flex items-center gap-2">
                    <span>🍪</span>
                    Cookie-inställningar
                  </h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-white/50 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Cookie toggles */}
                <div className="space-y-2">
                  {/* Necessary - always on */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex-1 mr-3">
                      <p className="text-white text-sm font-medium">{t('categories.necessary.title')}</p>
                      <p className="text-white/40 text-xs mt-0.5">{t('categories.necessary.description')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-sky font-medium uppercase tracking-wide">
                        {t('categories.necessary.alwaysActive')}
                      </span>
                      <div className="w-10 h-6 bg-sky/30 rounded-full p-0.5 cursor-not-allowed">
                        <div className="w-5 h-5 bg-sky rounded-full translate-x-4 shadow-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Analytics toggle */}
                  <button
                    onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 
                      border border-white/10 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex-1 mr-3 text-left">
                      <p className="text-white text-sm font-medium">{t('categories.analytics.title')}</p>
                      <p className="text-white/40 text-xs mt-0.5">{t('categories.analytics.description')}</p>
                    </div>
                    <div 
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200
                        ${preferences.analytics ? 'bg-sky/30' : 'bg-white/10'}`}
                    >
                      <div 
                        className={`w-5 h-5 rounded-full shadow-sm transition-all duration-200
                          ${preferences.analytics ? 'bg-sky translate-x-4' : 'bg-white/50 translate-x-0'}`}
                      />
                    </div>
                  </button>

                  {/* Marketing toggle */}
                  <button
                    onClick={() => setPreferences({ ...preferences, marketing: !preferences.marketing })}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 
                      border border-white/10 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex-1 mr-3 text-left">
                      <p className="text-white text-sm font-medium">{t('categories.marketing.title')}</p>
                      <p className="text-white/40 text-xs mt-0.5">{t('categories.marketing.description')}</p>
                    </div>
                    <div 
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200
                        ${preferences.marketing ? 'bg-sky/30' : 'bg-white/10'}`}
                    >
                      <div 
                        className={`w-5 h-5 rounded-full shadow-sm transition-all duration-200
                          ${preferences.marketing ? 'bg-sky translate-x-4' : 'bg-white/50 translate-x-0'}`}
                      />
                    </div>
                  </button>
                </div>

                {/* Links */}
                <p className="text-white/40 text-xs">
                  Läs mer i vår{' '}
                  <Link href={`/${locale}/juridiskt/cookies`} className="text-sky hover:text-white transition-colors underline underline-offset-2">
                    {t('cookiePolicy')}
                  </Link>
                  {' '}och{' '}
                  <Link href={`/${locale}/juridiskt/integritetspolicy`} className="text-sky hover:text-white transition-colors underline underline-offset-2">
                    {t('privacyPolicy')}
                  </Link>
                </p>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2.5 text-white/60 hover:text-white text-sm font-medium 
                      transition-all duration-200 rounded-full hover:bg-white/10"
                  >
                    Neka alla
                  </button>
                  
                  <div className="flex-1" />
                  
                  <button
                    onClick={handleAcceptSelected}
                    className="px-5 py-2.5 bg-rose text-navy text-sm font-semibold rounded-full 
                      transition-all duration-300 hover:bg-coral hover:scale-105 hover:shadow-lg 
                      hover:shadow-rose/30 active:scale-95"
                  >
                    Spara val
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
