import { NextIntlClientProvider } from 'next-intl'
import '../globals.css'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CookieConsent from '@/components/CookieConsent'
import ChatWidget from '@/components/ChatWidget'
import ErrorBoundary from '@/components/ErrorBoundary'
import AuthProviderWrapper from '@/components/AuthProviderWrapper'
import ToastProviderWrapper from '@/components/ToastProviderWrapper'
import PasswordGateWrapper from '@/components/PasswordGateWrapper'
import MobileBottomNav from '@/components/MobileBottomNav'

// Ensure dynamic rendering for locale routes
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    console.error('❌ [Layout] Invalid locale:', locale)
    notFound()
  }

  // Load messages for the locale
  // Important: Pass locale explicitly to getMessages() so it can be used in getRequestConfig
  let messages
  try {
    messages = await getMessages({ locale })
  } catch (error) {
    console.error('❌ [Layout] Error loading messages:', error)
    throw error
  }

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <PasswordGateWrapper>
            <AuthProviderWrapper>
              <ToastProviderWrapper>
                <ErrorBoundary>
                  <Header />
                  <main className="pb-20 lg:pb-0">{children}</main>
                  <Footer />
                  <MobileBottomNav />
                  <CookieConsent />
                  <ChatWidget />
                </ErrorBoundary>
              </ToastProviderWrapper>
            </AuthProviderWrapper>
          </PasswordGateWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}