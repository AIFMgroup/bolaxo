'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock, Mail, Shield, ChevronRight, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Inloggning misslyckades')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/admin'
      }, 1000)
    } catch (err) {
      setError('Ett fel uppstod vid inloggning. Försök igen senare.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sand/30 rounded-full blur-3xl" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {mounted && Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-navy/10 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <h1 className="text-4xl font-black text-navy mb-2">
              BOLAXO
            </h1>
          </Link>
          <p className="text-graphite/60 text-sm font-medium tracking-wider uppercase">
            Administratörspanel
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-card-hover p-8 border border-sand/50">
          {/* Shield icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-mint/30 border border-mint rounded-xl animate-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-700" />
                <p className="text-green-800 text-sm font-medium">Inloggning lyckades! Omdirigerar...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-rose/30 border border-coral rounded-xl animate-shake">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className={`block text-sm font-medium mb-2 transition-colors ${
                  focusedField === 'email' ? 'text-navy' : 'text-graphite/70'
                }`}
              >
                E-postadress
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                  focusedField === 'email' ? 'text-navy' : 'text-graphite/40'
                }`} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin@bolaxo.com"
                  required
                  disabled={loading || success}
                  className="w-full pl-12 pr-4 py-3.5 bg-cream/50 border border-sand rounded-xl text-graphite placeholder-graphite/40 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className={`block text-sm font-medium mb-2 transition-colors ${
                  focusedField === 'password' ? 'text-navy' : 'text-graphite/70'
                }`}
              >
                Lösenord
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                  focusedField === 'password' ? 'text-navy' : 'text-graphite/40'
                }`} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••••••"
                  required
                  disabled={loading || success}
                  className="w-full pl-12 pr-12 py-3.5 bg-cream/50 border border-sand rounded-xl text-graphite placeholder-graphite/40 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-graphite/40 hover:text-graphite transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-4 bg-navy hover:bg-navy/90 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Loggar in...</span>
                </>
              ) : success ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Inloggning lyckades!</span>
                </>
              ) : (
                <>
                  <span>Logga in</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-sand/50">
            <p className="text-xs text-graphite/50 text-center">
              Denna sida är skyddad med avancerad säkerhet
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-graphite/60 hover:text-navy transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>Tillbaka till startsidan</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
