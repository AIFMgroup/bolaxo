'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import FormField from '@/components/FormField'
import { Mail, CheckCircle, AlertCircle, Building, Search, Handshake, ArrowRight, Shield, Zap, Lock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'

function LoginForm() {
  const t = useTranslations('login')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  
  // Helper function to add locale prefix to paths
  const getLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }
  
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<'seller' | 'buyer' | 'broker'>('buyer')
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [magicLink, setMagicLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const urlError = searchParams?.get('error')
  const referralCode = searchParams?.get('ref')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!acceptedPrivacy) {
      setError(t('mustAcceptPrivacy'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    // In development: use direct login (no magic link needed)
    if (process.env.NODE_ENV === 'development') {
      try {
        const response = await fetch('/api/auth/dev-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            role: selectedRole,
            name: email.split('@')[0] // Use email prefix as name if not provided
          })
        })

        if (response.ok) {
          const data = await response.json()
          // Redirect to appropriate dashboard based on role
          window.location.href = selectedRole === 'seller' 
            ? getLocalizedPath('/salja/start') 
            : getLocalizedPath('/kopare/start')
          return
        } else {
          const data = await response.json()
          setError(data.error || t('couldNotLogin'))
        }
      } catch (err) {
        setError(t('connectionError'))
        console.error(err)
      }
      setIsSubmitting(false)
      return
    }

    // Production: use magic link
    const result = await login(email, selectedRole, acceptedPrivacy, referralCode || undefined)

    if (result.success) {
      setLinkSent(true)
      if (result.magicLink) {
        setMagicLink(result.magicLink)
      }
    } else {
      setError(result.message || t('error'))
    }

    setIsSubmitting(false)
  }

  if (linkSent) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-accent-pink/5 via-neutral-white to-primary-navy/5 py-12 sm:py-16 md:py-24 flex items-center justify-center px-4">
        <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-2xl max-w-md w-full text-center border border-gray-100">
          <div className="w-20 h-20 bg-accent-pink/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Mail className="w-10 h-10 text-accent-pink" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-primary-navy mb-2">{t('checkEmail')}</h1>
          <p className="text-lg text-primary-navy mb-6">
            {t('linkSent')} <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-600 mb-8">
            {t('linkValid')}
          </p>
          
          {magicLink && (
            <div className="bg-primary-navy/5 border-2 border-primary-navy/30 p-6 rounded-xl mb-6 animate-fade-in">
              <p className="text-sm font-semibold text-primary-navy mb-3 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Demo-läge – magisk länk genererad
              </p>
              <p className="text-xs text-gray-700 mb-4 text-center">
                I produktion skickas denna länk via email. För demo klickar du bara:
              </p>
              <a 
                href={magicLink}
                className="block w-full bg-accent-pink text-primary-navy py-3 px-6 rounded-xl font-bold text-center hover:shadow-lg transition-all text-base transform hover:scale-105"
              >
                Logga in direkt
              </a>
              <p className="text-xs text-gray-600 mt-3 text-center break-all">
                Full URL: {magicLink}
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setLinkSent(false)
              setEmail('')
            }}
            className="text-primary-navy font-semibold hover:text-primary-navy/80 transition-colors"
          >
            ← {t('resendLink')}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-accent-pink/5 via-neutral-white to-primary-navy/5 py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Login Form */}
          <div className="bg-white p-10 lg:p-12 rounded-2xl shadow-2xl border border-gray-100">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-4xl lg:text-5xl font-black text-primary-navy mb-3 uppercase">{t('subtitle').toUpperCase()}</h1>
              <p className="text-xl text-gray-600">
                {locale === 'sv' ? 'Logga in med säker e-postverifiering' : 'Log in with secure email verification'}
              </p>
            </div>

            {/* Errors */}
            {urlError && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  {urlError === 'invalid_token' && 'Ogiltig eller redan använd inloggningslänk'}
                  {urlError === 'expired_token' && 'Inloggningslänken har gått ut. Begär en ny.'}
                  {urlError === 'server_error' && 'Ett fel uppstod. Försök igen.'}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-bold text-primary-navy mb-4 uppercase tracking-wide">
                  {locale === 'sv' ? 'Jag är' : 'I am'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Seller */}
                  <div
                    onClick={() => setSelectedRole('seller')}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${
                      selectedRole === 'seller'
                        ? 'border-accent-pink bg-accent-pink/10 shadow-lg transform scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <Building className="w-8 h-8 text-primary-navy mx-auto mb-2" />
                    <span className="font-bold text-primary-navy text-sm">{t('seller')}</span>
                  </div>

                  {/* Buyer */}
                  <div
                    onClick={() => setSelectedRole('buyer')}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${
                      selectedRole === 'buyer'
                        ? 'border-accent-pink bg-accent-pink/10 shadow-lg transform scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <Search className="w-8 h-8 text-primary-navy mx-auto mb-2" />
                    <span className="font-bold text-primary-navy text-sm">{t('buyer')}</span>
                  </div>

                  {/* Broker - Hidden for now */}
                  {/* <div
                    onClick={() => setSelectedRole('broker')}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${
                      selectedRole === 'broker'
                        ? 'border-accent-pink bg-accent-pink/10 shadow-lg transform scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <Handshake className="w-8 h-8 text-primary-navy mx-auto mb-2" />
                    <span className="font-bold text-primary-navy text-sm">{t('broker')}</span>
                  </div> */}
                </div>
              </div>

              {/* Email with enhanced styling */}
              <div>
                <label className="block text-sm font-bold text-primary-navy mb-2 uppercase tracking-wide">
                  E-postadress <span className="text-accent-pink">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-accent-pink focus:ring-2 focus:ring-accent-pink/20 transition-all text-lg placeholder-gray-400 bg-gray-50 shadow-sm"
                  />
                </div>
              </div>

              {/* Privacy Policy */}
              <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-accent-pink border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="privacy" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                  {locale === 'sv' ? 'Jag godkänner' : 'I accept'}{' '}
                  <Link href={getLocalizedPath('/juridiskt/integritetspolicy')} className="text-primary-navy hover:underline font-bold" target="_blank">
                    {locale === 'sv' ? 'integritetspolicyn' : 'privacy policy'}
                  </Link>{' '}
                  {locale === 'sv' ? 'och' : 'and'}{' '}
                  <Link href={getLocalizedPath('/juridiskt/anvandarvillkor')} className="text-primary-navy hover:underline font-bold" target="_blank">
                    {locale === 'sv' ? 'användarvillkoren' : 'terms of use'}
                  </Link>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!email || !acceptedPrivacy || isSubmitting}
                className="w-full py-4 px-6 bg-accent-pink text-primary-navy font-black rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3 text-lg transform hover:scale-105 uppercase tracking-wide"
              >
                {isSubmitting ? (locale === 'sv' ? 'Skickar...' : 'Sending...') : t('submit')}
                {!isSubmitting && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                {locale === 'sv' ? 'Ny användare?' : 'New user?'}{' '}
                <Link href={getLocalizedPath('/registrera')} className="text-primary-navy font-bold hover:underline">
                  {locale === 'sv' ? 'Skapa konto här →' : 'Create account here →'}
                </Link>
              </p>
            </div>

            {/* Demo Links */}
            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500 mb-4">
                {locale === 'sv' ? 'Vill du testa plattformen utan konto?' : 'Want to try the platform without an account?'}
              </p>
              <div className="flex justify-center gap-4">
                <Link href={getLocalizedPath('/demo/dashboard/seller')} className="text-sm font-medium text-primary-navy hover:underline flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {locale === 'sv' ? 'Demo: Säljare' : 'Demo: Seller'}
                </Link>
                <span className="text-gray-300">|</span>
                <Link href={getLocalizedPath('/demo/dashboard/buyer')} className="text-sm font-medium text-primary-navy hover:underline flex items-center gap-1">
                  <Search className="w-4 h-4" />
                  {locale === 'sv' ? 'Demo: Köpare' : 'Demo: Buyer'}
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side - Info */}
          <div className="hidden lg:block">
            <div className="space-y-8">
              {/* Security Features */}
              <div>
                <h2 className="text-3xl font-bold text-primary-navy mb-6">Säker inloggning utan lösenord</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent-pink/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-accent-pink" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-navy mb-1">Magic Link</h3>
                      <p className="text-gray-600">Vi skickar en säker inloggningslänk direkt till din e-post</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-navy/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-primary-navy" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-navy mb-1">Ingen lösenord</h3>
                      <p className="text-gray-600">Slipp komma ihåg komplicerade lösenord</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-accent-orange" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-navy mb-1">Snabbt & enkelt</h3>
                      <p className="text-gray-600">Logga in med ett klick från din inkorg</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="bg-primary-navy/5 p-8 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-5 h-5 text-primary-navy" />
                  <h3 className="font-bold text-primary-navy">Bank-nivå säkerhet</h3>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Alla dina uppgifter är krypterade och säkert lagrade. Vi använder samma säkerhetsstandarder som banker och finansiella institutioner.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-accent-pink/5 via-neutral-white to-primary-navy/5 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-accent-pink border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}