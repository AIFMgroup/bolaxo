'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  CheckCircle, 
  MapPin, 
  Building2, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Briefcase,
  Clock,
  Award,
  ArrowLeft
} from 'lucide-react'
import VerifiedBuyerBadge from '@/components/VerifiedBuyerBadge'

interface BuyerProfile {
  id: string
  name: string
  verified: boolean
  bankIdVerified?: boolean
  buyerKycStatus?: 'UNVERIFIED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  trustScore: number
  trustFactors: Array<{ factor: string; points: number }>
  buyerType: string | null
  investmentExperience: string | null
  financingReady: boolean
  preferredRegions: string[]
  preferredIndustries: string[]
  priceRange: { min: string; max: string } | null
  revenueRange: { min: string; max: string } | null
  completedDeals: Array<{
    industry: string | null
    location: string | null
    completedAt: string
  }>
  memberSince: string
  lastActive: string
}

export default function BuyerProfilePage() {
  const params = useParams()
  const buyerId = params.id as string
  const [profile, setProfile] = useState<BuyerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profil/${buyerId}`)
        if (!response.ok) {
          throw new Error('Kunde inte hämta profil')
        }
        const data = await response.json()
        setProfile(data.profile)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ett fel uppstod')
      } finally {
        setLoading(false)
      }
    }

    if (buyerId) {
      fetchProfile()
    }
  }, [buyerId])

  if (loading) {
    return (
      <main className="bg-neutral-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <p className="text-gray-600">Laddar profil...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className="bg-neutral-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary-navy mb-4">Profil hittades inte</h1>
            <p className="text-gray-600 mb-6">{error || 'Denna köparprofil kunde inte hittas.'}</p>
            <Link href="/sok" className="inline-flex items-center gap-2 text-primary-navy hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Tillbaka till sök
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getBuyerTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      individual: 'Privatperson',
      company: 'Företag',
      private_equity: 'Private Equity',
      strategic: 'Strategisk köpare'
    }
    return labels[type || ''] || 'Ej angiven'
  }

  const getExperienceLabel = (exp: string | null) => {
    const labels: Record<string, string> = {
      first_time: 'Första köpet',
      experienced: 'Erfaren köpare',
      professional: 'Professionell köpare'
    }
    return labels[exp || ''] || 'Ej angiven'
  }

  return (
    <main className="bg-neutral-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-navy/10 to-accent-pink/10 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/sok" className="inline-flex items-center gap-2 text-primary-navy hover:underline mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till sök
          </Link>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar/Initials */}
            <div className="w-20 h-20 bg-primary-navy text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-primary-navy">{profile.name}</h1>
                
                {/* KYC Verified Badge (prominent) */}
                <VerifiedBuyerBadge 
                  verified={profile.buyerKycStatus === 'APPROVED'} 
                  size="lg" 
                />
                
                {/* Email verified badge */}
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                    <CheckCircle className="w-3.5 h-3.5" />
                    E-post
                  </span>
                )}
                
                {/* BankID badge */}
                {profile.bankIdVerified && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                    <Shield className="w-3.5 h-3.5" />
                    BankID
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{getBuyerTypeLabel(profile.buyerType)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <span>{getExperienceLabel(profile.investmentExperience)}</span>
                </div>
                {profile.financingReady && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Finansiering klar</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Score */}
            <div className={`px-6 py-4 rounded-xl ${getTrustScoreColor(profile.trustScore)}`}>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{profile.trustScore}</div>
                <div className="text-xs font-semibold uppercase">Trust Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Trust Factors */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-primary-navy mb-4">Trust Indicators</h2>
              <div className="space-y-3">
                {profile.trustFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{factor.factor}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary-navy">+{factor.points}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Preferences */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-primary-navy mb-4">Sökkriterier</h2>
              
              {profile.preferredRegions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-primary-navy" />
                    <h3 className="font-semibold text-gray-900">Platser</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferredRegions.map((region, idx) => (
                      <span key={idx} className="px-3 py-1 bg-primary-navy/10 text-primary-navy rounded-lg text-sm">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.preferredIndustries.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-primary-navy" />
                    <h3 className="font-semibold text-gray-900">Branscher</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferredIndustries.slice(0, 8).map((industry, idx) => (
                      <span key={idx} className="px-3 py-1 bg-accent-pink/10 text-primary-navy rounded-lg text-sm">
                        {industry}
                      </span>
                    ))}
                    {profile.preferredIndustries.length > 8 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                        +{profile.preferredIndustries.length - 8} fler
                      </span>
                    )}
                  </div>
                </div>
              )}

              {profile.priceRange && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-primary-navy" />
                    <h3 className="font-semibold text-gray-900">Prisområde</h3>
                  </div>
                  <p className="text-gray-700">
                    {profile.priceRange.min} - {profile.priceRange.max}
                  </p>
                </div>
              )}

              {profile.revenueRange && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-primary-navy" />
                    <h3 className="font-semibold text-gray-900">Omsättningsområde</h3>
                  </div>
                  <p className="text-gray-700">
                    {profile.revenueRange.min} - {profile.revenueRange.max}
                  </p>
                </div>
              )}
            </section>

            {/* Completed Deals */}
            {profile.completedDeals.length > 0 && (
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-primary-navy mb-4">Genomförda affärer</h2>
                <div className="space-y-4">
                  {profile.completedDeals.map((deal, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-navy/10 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-primary-navy" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {deal.industry || 'Ej angiven bransch'}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {deal.location || 'Ej angiven plats'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Avslutad</div>
                        <div className="text-sm font-semibold text-primary-navy">
                          {new Date(deal.completedAt).toLocaleDateString('sv-SE', { 
                            year: 'numeric', 
                            month: 'short' 
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  * Information är anonymiserad för integritet
                </p>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Member Info */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Medlemsinformation</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Medlem sedan</span>
                  <span className="ml-auto font-semibold text-gray-900">
                    {new Date(profile.memberSince).toLocaleDateString('sv-SE', { 
                      year: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Senast aktiv</span>
                  <span className="ml-auto font-semibold text-gray-900">
                    {new Date(profile.lastActive).toLocaleDateString('sv-SE', { 
                      year: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-br from-primary-navy to-primary-navy/90 rounded-xl p-6 text-white">
              <h3 className="font-bold text-lg mb-2">Intresserad av denna köpare?</h3>
              <p className="text-sm text-white/80 mb-4">
                Denna köpare är verifierad och har visat seriositet genom sina tidigare affärer.
              </p>
              <Link
                href={`/objekt?buyer=${profile.id}`}
                className="block w-full text-center px-4 py-2 bg-white text-primary-navy font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Se objekt för denna köpare
              </Link>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

