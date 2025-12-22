'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Users, AlertCircle } from 'lucide-react'

interface TestUser {
  id: string
  name: string
  email: string
  role: 'buyer' | 'seller'
  description: string
}

const TEST_USERS: TestUser[] = [
  {
    id: 'buyer-test-001',
    name: 'Anna Köpare',
    email: 'anna@buyer.se',
    role: 'buyer',
    description: 'Test buyer account'
  },
  {
    id: 'seller-test-001',
    name: 'Bo Säljare',
    email: 'bo@seller.se',
    role: 'seller',
    description: 'Test seller account'
  },
  {
    id: 'buyer-test-002',
    name: 'Carl Investerare',
    email: 'carl@investor.se',
    role: 'buyer',
    description: 'Another test buyer'
  },
  {
    id: 'seller-test-002',
    name: 'Diana Entrepreneur',
    email: 'diana@seller.se',
    role: 'seller',
    description: 'Another test seller'
  }
]

export default function DevLoginPage() {
  const [selectedUser, setSelectedUser] = useState<TestUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if we're in development
    if (process.env.NODE_ENV === 'production') {
      router.push('/')
    }
  }, [router])

  const handleLogin = async (user: TestUser) => {
    setIsLoading(true)
    setError('')

    try {
      // Store user info in localStorage
      localStorage.setItem(
        'dev-auth-user',
        JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          loginTime: new Date().toISOString()
        })
      )

      // Create a dev session token
      const token = `dev-token-${user.id}-${Date.now()}`
      localStorage.setItem('dev-auth-token', token)

      // Redirect based on role
      const redirectUrl = user.role === 'seller' ? '/salja' : '/kopare'
      router.push(redirectUrl)
    } catch (err) {
      setError('Något gick fel vid inloggning')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-primary-navy">
              BOLAXO
            </Link>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
              DEV MODE
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Development Login</h3>
              <p className="text-blue-800 mb-2">
                Välj en test-användare för att logga in och testa plattformen. 
                Det här är endast för utveckling och testning.
              </p>
              <p className="text-sm text-blue-700">
                Du kan wlla mellan olika roller och användare för att testa hela flödet.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-red-700">
            {error}
          </div>
        )}

        {/* Login Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Buyers */}
          <div>
            <h2 className="text-2xl font-bold text-text-dark mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Köpare
            </h2>
            <div className="space-y-4">
              {TEST_USERS.filter(u => u.role === 'buyer').map(user => (
                <button
                  key={user.id}
                  onClick={() => handleLogin(user)}
                  disabled={isLoading}
                  className="w-full text-left p-5 bg-white rounded-lg border-2 border-gray-200 hover:border-primary-blue hover:shadow-lg transition-all hover:bg-primary-blue/5 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text-dark">{user.name}</h3>
                      <p className="text-sm text-text-gray mt-1">{user.email}</p>
                      <p className="text-xs text-text-gray mt-1">{user.id}</p>
                    </div>
                    <LogIn className="w-5 h-5 text-primary-blue flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sellers */}
          <div>
            <h2 className="text-2xl font-bold text-text-dark mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-green-600" />
              Säljare
            </h2>
            <div className="space-y-4">
              {TEST_USERS.filter(u => u.role === 'seller').map(user => (
                <button
                  key={user.id}
                  onClick={() => handleLogin(user)}
                  disabled={isLoading}
                  className="w-full text-left p-5 bg-white rounded-lg border-2 border-gray-200 hover:border-green-600 hover:shadow-lg transition-all hover:bg-green-50 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text-dark">{user.name}</h3>
                      <p className="text-sm text-text-gray mt-1">{user.email}</p>
                      <p className="text-xs text-text-gray mt-1">{user.id}</p>
                    </div>
                    <LogIn className="w-5 h-5 text-green-600 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-text-dark mb-4">Instruktioner för testning</h3>
          <ul className="space-y-3 text-text-gray">
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-blue text-white text-sm font-bold flex-shrink-0">1</span>
              <span>Klicka på en test-användare för att logga in</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-blue text-white text-sm font-bold flex-shrink-0">2</span>
              <span>Du omdirigeras till din dashboard (köpare eller säljare)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-blue text-white text-sm font-bold flex-shrink-0">3</span>
              <span>Logga in som olika användare för att testa flödet mellan köpare och säljare</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-blue text-white text-sm font-bold flex-shrink-0">4</span>
              <span>Logout genom "Logga ut" länken i din dashboard</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
