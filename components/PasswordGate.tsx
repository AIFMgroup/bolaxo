'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Lock, ArrowRight, Eye, EyeOff, Check } from 'lucide-react'

const CORRECT_PASSWORD = 'afterfounder123%'
const STORAGE_KEY = 'afterfounder_auth'

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const isDemoRoute =
      pathname?.includes('/demo/dashboard/buyer') ||
      pathname?.includes('/demo/dashboard/seller')

    if (isDemoRoute) {
      // Always allow demo dashboards without password
      setIsAuthenticated(true)
      return
    }

    if (stored === 'authenticated') {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }, [pathname])

  useEffect(() => {
    if (isAuthenticated === false && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isAuthenticated])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.toLowerCase() === CORRECT_PASSWORD) {
      setIsSuccess(true)
      setError('')
      
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, 'authenticated')
        setIsAuthenticated(true)
      }, 600)
    } else {
      setError('Fel lösenord')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      setTimeout(() => setError(''), 3000)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center p-4">
      {/* Card */}
      <div 
        className={`
          w-full max-w-sm bg-white rounded-2xl p-8
          shadow-[0_0_60px_-15px_rgba(0,0,0,0.15)]
          animate-pulse-shadow
          ${isShaking ? 'animate-shake' : ''}
        `}
      >
        {/* Lock icon */}
        <div className="flex justify-center mb-6">
          <div 
            className={`
              w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
              ${isSuccess 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-500'
              }
            `}
          >
            {isSuccess ? (
              <Check className="w-7 h-7" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            {isSuccess ? 'Välkommen' : 'Ange lösenord'}
          </h1>
          <p className="text-sm text-gray-500">
            {isSuccess ? 'Omdirigerar...' : 'Fortsätt till Afterfounder'}
          </p>
        </div>

        {/* Form */}
        {!isSuccess && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password input */}
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="Lösenord"
                className={`
                  w-full px-4 py-3 bg-gray-50 border rounded-xl
                  text-gray-900 text-center tracking-wider
                  placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white
                  transition-all duration-200
                  ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                `}
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!password}
              className={`
                w-full py-3 rounded-xl font-medium text-white
                flex items-center justify-center gap-2
                transition-all duration-200
                ${password 
                  ? 'bg-gray-900 hover:bg-gray-800 active:scale-[0.98]' 
                  : 'bg-gray-300 cursor-not-allowed'
                }
              `}
            >
              <span>Fortsätt</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse-shadow {
          0%, 100% {
            box-shadow: 0 0 60px -15px rgba(0, 0, 0, 0.15);
          }
          50% {
            box-shadow: 0 0 80px -10px rgba(0, 0, 0, 0.25);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        
        .animate-pulse-shadow {
          animation: pulse-shadow 3s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  )
}
