'use client'

import { useState, useEffect } from 'react'
import { Shield, ArrowRight, Mail } from 'lucide-react'

interface PasswordProtectionProps {
  children: React.ReactNode
}

export default function PasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Check if already authenticated
  useEffect(() => {
    const auth = sessionStorage.getItem('site-authenticated')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // You can change this password
    if (password === 'Bolaxo1%') {
      sessionStorage.setItem('site-authenticated', 'true')
      setIsAuthenticated(true)
    } else {
      setError('Fel lösenord. Försök igen.')
      setPassword('')
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      // Save email to database/send to API
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (response.ok) {
        setEmailSubmitted(true)
        setEmail('')
        // Reset after 3 seconds
        setTimeout(() => {
          setEmailSubmitted(false)
          setShowEmailForm(false)
        }, 3000)
      }
    } catch (err) {
      // For now, just show success (since API doesn't exist yet)
      setEmailSubmitted(true)
      setEmail('')
      setTimeout(() => {
        setEmailSubmitted(false)
        setShowEmailForm(false)
      }, 3000)
    }
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Don't render children until authenticated to avoid framing issues */}
      
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
      
      {/* Password popup */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#003366] rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-[#003366] mb-2">
            Välkommen till Afterfounder
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Denna sida är lösenordsskyddad
          </p>
          
          {!showEmailForm ? (
            <>
              {/* Password form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-[#003366] mb-2">
                    Lösenord <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-5 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FF69B4]/20 transition-all placeholder-gray-400 bg-gray-50 shadow-sm text-lg"
                      placeholder="••••••••"
                      autoFocus
                    />
                  </div>
                </div>
                
                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}
                
                <button
                  type="submit"
                  className="w-full bg-[#003366] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#002244] transition-colors flex items-center justify-center gap-2"
                >
                  Logga in
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              
              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">eller</span>
                </div>
              </div>
              
              {/* Interest button */}
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center"
              >
                <span className="text-[#003366] font-semibold">Snart kommer Sveriges smartaste företagsförmedling.</span>
                <br />
                <span className="text-sm">Intresserad? Klicka här för information →</span>
              </button>
            </>
          ) : (
            <>
              {/* Email collection form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Bli först med att få veta!
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Vi lanserar snart Sveriges smartaste plattform för företagsförmedling. 
                    Lämna din e-post så kontaktar vi dig.
                  </p>
                  <label className="block text-sm font-semibold text-[#003366] mb-2">
                    E-postadress <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FF69B4]/20 transition-all placeholder-gray-400 bg-gray-50 shadow-sm text-lg"
                      placeholder="din@epost.se"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                
                {emailSubmitted ? (
                  <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center">
                    ✓ Tack! Vi hör av oss snart.
                  </div>
                ) : (
                  <>
                    <button
                      type="submit"
                      className="w-full bg-[#003366] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#002244] transition-colors"
                    >
                      Skicka information
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(false)}
                      className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
                    >
                      ← Tillbaka
                    </button>
                  </>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
