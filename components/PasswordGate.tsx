'use client'

import { useState, useEffect, useRef } from 'react'
import { Lock, ArrowRight, Eye, EyeOff, Sparkles, CheckCircle } from 'lucide-react'

const CORRECT_PASSWORD = 'bolaxo'
const STORAGE_KEY = 'bolaxo_auth'

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [focusedField, setFocusedField] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check authentication on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'authenticated') {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }, [])

  // Focus input when component mounts
  useEffect(() => {
    if (isAuthenticated === false && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 500)
    }
  }, [isAuthenticated])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.toLowerCase() === CORRECT_PASSWORD) {
      setIsSuccess(true)
      setError('')
      
      // Animate success then grant access
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, 'authenticated')
        setIsAuthenticated(true)
      }, 800)
    } else {
      setError('Fel lösenord')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      
      // Clear error after delay
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    )
  }

  // Authenticated - show children
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Password screen
  return (
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full opacity-30 blur-3xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
            animationDuration: '4s'
          }}
        />
        <div 
          className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
            animationDuration: '5s',
            animationDelay: '1s'
          }}
        />
        <div 
          className="absolute top-1/4 right-1/4 w-1/2 h-1/2 rounded-full opacity-10 blur-3xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)',
            animationDuration: '6s',
            animationDelay: '2s'
          }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo / Brand */}
        <div 
          className="mb-12 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">Bolaxo</span>
          </div>
        </div>

        {/* Main card */}
        <div 
          className={`
            w-full max-w-md
            opacity-0 animate-fade-in-up
            ${isShaking ? 'animate-shake' : ''}
          `}
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
        >
          <div className="relative">
            {/* Card glow effect */}
            <div 
              className={`
                absolute -inset-1 rounded-3xl blur-xl transition-opacity duration-500
                ${focusedField ? 'opacity-100' : 'opacity-0'}
              `}
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(236, 72, 153, 0.3))'
              }}
            />
            
            {/* Card */}
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              {/* Lock icon */}
              <div className="flex justify-center mb-6">
                <div 
                  className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500
                    ${isSuccess 
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 scale-110' 
                      : 'bg-white/5 border border-white/10'
                    }
                  `}
                >
                  {isSuccess ? (
                    <CheckCircle className="w-8 h-8 text-white animate-scale-in" />
                  ) : (
                    <Lock className="w-8 h-8 text-white/60" />
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-white mb-2">
                  {isSuccess ? 'Välkommen!' : 'Begränsad åtkomst'}
                </h1>
                <p className="text-white/50 text-sm">
                  {isSuccess 
                    ? 'Omdirigerar...' 
                    : 'Ange lösenord för att fortsätta'
                  }
                </p>
              </div>

              {/* Form */}
              {!isSuccess && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Password input */}
                  <div className="relative group">
                    <div 
                      className={`
                        absolute -inset-0.5 rounded-xl blur-sm transition-opacity duration-300
                        ${focusedField ? 'opacity-100' : 'opacity-0'}
                      `}
                      style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(236, 72, 153, 0.5))'
                      }}
                    />
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setError('')
                        }}
                        onFocus={() => setFocusedField(true)}
                        onBlur={() => setFocusedField(false)}
                        onKeyDown={handleKeyDown}
                        placeholder="••••••"
                        className={`
                          w-full px-5 py-4 bg-white/5 border rounded-xl
                          text-white text-center text-lg tracking-widest font-mono
                          placeholder:text-white/20
                          focus:outline-none focus:bg-white/[0.08]
                          transition-all duration-300
                          ${error 
                            ? 'border-red-500/50 bg-red-500/5' 
                            : 'border-white/10 hover:border-white/20'
                          }
                        `}
                        autoComplete="off"
                        spellCheck="false"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <p className="text-red-400 text-sm text-center animate-fade-in">
                      {error}
                    </p>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={!password}
                    className={`
                      w-full py-4 rounded-xl font-medium text-white
                      flex items-center justify-center gap-2
                      transition-all duration-300
                      ${password 
                        ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]' 
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                      }
                    `}
                  >
                    <span>Fortsätt</span>
                    <ArrowRight className={`w-5 h-5 transition-transform ${password ? 'group-hover:translate-x-1' : ''}`} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p 
          className="mt-8 text-white/30 text-sm opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
        >
          © 2025 Bolaxo · Endast för behöriga
        </p>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

