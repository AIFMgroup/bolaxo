'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Check, Loader2 } from 'lucide-react'
import AvatarUpload from '@/components/AvatarUpload'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

export default function BuyerSettingsPage() {
  const { user: authUser } = useAuth()
  const { success: showSuccess, error: showError } = useToast()
  
  const [currentUser, setCurrentUser] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    companyName: '',
    avatarUrl: null as string | null
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setCurrentUser({
              id: data.user.id || '',
              name: data.user.name || '',
              email: data.user.email || '',
              phone: data.user.phone || '',
              companyName: data.user.companyName || '',
              avatarUrl: data.user.avatarUrl || null
            })
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (authUser) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [authUser])

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    
    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentUser({ ...currentUser, avatarUrl: data.url })
        
        // Also save to profile
        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: data.url })
        })
        
        showSuccess('Profilbild uppdaterad!')
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      showError('Kunde inte ladda upp bilden')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentUser.name,
          phone: currentUser.phone,
          companyName: currentUser.companyName
        })
      })
      
      if (response.ok) {
        setSaved(true)
        showSuccess('Profilen har sparats!')
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await response.json()
        showError(data.error || 'Kunde inte spara profilen')
      }
    } catch (error) {
      console.error('Save error:', error)
      showError('Ett fel uppstod vid sparning')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-navy" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/kopare/start" className="inline-flex items-center gap-2 text-primary-navy hover:text-primary-blue mb-4">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </Link>
          <h1 className="text-3xl font-bold text-primary-navy">Profilinställningar</h1>
          <p className="text-gray-600 mt-2">Uppdatera din profil och kontaktuppgifter</p>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <AvatarUpload
              currentAvatar={currentUser.avatarUrl || undefined}
              userName={currentUser.name}
              onUpload={handleAvatarUpload}
            />
            <div>
              <h3 className="font-medium text-primary-navy">Profilbild</h3>
              <p className="text-sm text-gray-500">Ladda upp en bild som representerar dig</p>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Namn
              </label>
              <input
                type="text"
                id="name"
                value={currentUser.name}
                onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-navy"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-postadress
              </label>
              <input
                type="email"
                id="email"
                value={currentUser.email}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">E-postadress kan inte ändras</p>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefonnummer
              </label>
              <input
                type="tel"
                id="phone"
                value={currentUser.phone}
                onChange={(e) => setCurrentUser({ ...currentUser, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-navy"
              />
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                Företag
              </label>
              <input
                type="text"
                id="company"
                value={currentUser.companyName}
                onChange={(e) => setCurrentUser({ ...currentUser, companyName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-navy"
                placeholder="Ditt företag (valfritt)"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-4">
              <Link
                href="/kopare/chat"
                className="text-primary-navy hover:text-primary-blue font-medium"
              >
                Gå till meddelanden
              </Link>
              <Link
                href="/kopare/kyc"
                className="text-primary-navy hover:text-primary-blue font-medium"
              >
                Verifiera köpare (KYC)
              </Link>
            </div>
            
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary-navy text-white rounded-lg hover:bg-primary-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Sparad!
                </>
              ) : saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sparar...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Spara ändringar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
