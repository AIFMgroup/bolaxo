'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowLeft, MapPin, TrendingUp, Users, Eye, Bookmark, Shield, AlertCircle, Calendar, FileText, BarChart, CheckCircle } from 'lucide-react'
import { useBuyerStore } from '@/stores/buyerStore'
import { useAuth } from '@/contexts/AuthContext'
import InfoPopup from '@/components/InfoPopup'
import { ListingStructuredData } from '@/components/ListingStructuredData'
import { formatCurrency } from '@/utils/currency'

export default function ObjectDetailPage() {
  const params = useParams()
  const objectId = params.id as string
  const locale = useLocale()
  const t = useTranslations('objectDetail')
  const { user } = useAuth()
  
  const [object, setObject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isSyncingToDb, setIsSyncingToDb] = useState(false)
  const { savedObjects, toggleSaved, hasNDA } = useBuyerStore()
  const isSaved = savedObjects.includes(objectId)

  // Fetch listing from API
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${objectId}`, { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setObject(data)
        } else {
          console.error('Failed to fetch listing')
        }
      } catch (error) {
        console.error('Error fetching listing:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (objectId) {
      fetchListing()
    }
  }, [objectId, user?.id])
  
  // Sync save to database when it changes
  const handleToggleSaved = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    // Update local state immediately
    toggleSaved(objectId)
    
    // Sync to database
    if (user) {
      setIsSyncingToDb(true)
      try {
        const newIsSaved = savedObjects.includes(objectId)
        
        if (newIsSaved) {
          // Remove from database
          await fetch(`/api/saved-listings?listingId=${objectId}`, {
            method: 'DELETE',
            credentials: 'include'
          })
        } else {
          // Add to database
          await fetch('/api/saved-listings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              listingId: objectId
            })
          })
        }
      } catch (error) {
        console.error('Failed to sync saved listing:', error)
      } finally {
        setIsSyncingToDb(false)
      }
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
      </div>
    )
  }

  if (!object) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-dark mb-2">{t('notFound')}</h1>
          <Link href={`/${locale}/sok`} className="text-primary-blue hover:underline">
            {t('backToSearch')}
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: t('tabs.overview'), icon: FileText },
    { id: 'economics', label: t('tabs.economics'), icon: BarChart },
    { id: 'strengths', label: t('tabs.strengths'), icon: CheckCircle }
  ]

  const calculateEBITDARange = () => {
    if (!object.revenueRange) return 'N/A'
    const margin = 0.15 // Assume 15% EBITDA margin
    const parts = object.revenueRange.split('-')
    if (parts.length < 2) return 'N/A'
    const minRevenue = parseInt(parts[0])
    const maxRevenue = parseInt(parts[1])
    return `${(minRevenue * margin).toFixed(0)}-${(maxRevenue * margin).toFixed(0)} MSEK`
  }
  
  // Use hasNDA from API response or fallback to local store
  const userHasNDA = object?.hasNDA || hasNDA(objectId)

  return (
    <main className="min-h-screen bg-background">
      {/* Structured Data for SEO */}
      {object && (
        <ListingStructuredData 
          listing={{
            id: object.id,
            anonymousTitle: object.anonymousTitle || object.title || 'Företag',
            description: object.description || '',
            priceMin: object.priceMin,
            priceMax: object.priceMax,
            location: object.location,
            region: object.region,
            industry: object.industry,
            type: object.type,
            image: object.image,
            images: object.images,
          }}
        />
      )}
      
      {/* Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link 
              href={`/${locale}/sok`} 
              className="inline-flex items-center text-sm sm:text-base text-text-gray hover:text-text-dark transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('backToSearch')}</span>
              <span className="sm:hidden">{t('back')}</span>
            </Link>
            <button
              onClick={handleToggleSaved}
              className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium transition-all text-sm sm:text-base ${
                isSaved
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-100 text-text-dark hover:bg-gray-200'
              }`}
              disabled={isSyncingToDb}
            >
              <Bookmark className={`w-4 h-4 mr-1 sm:mr-2 ${isSaved ? 'fill-current' : ''}`} />
              {isSyncingToDb ? 'Sparar...' : (isSaved ? 'Sparad' : 'Spara')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Main Content with Image and Info Side by Side */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="lg:w-2/5 bg-white">
              {object.image ? (
                <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-full lg:min-h-[500px] p-4 sm:p-6 md:p-8">
                  {/* Organic shadow shape */}
                  <div 
                    className="absolute inset-4 sm:inset-6 md:inset-8 bg-gray-800/20 blur-xl animate-pulse"
                    style={{
                      borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                      transform: 'rotate(-8deg)'
                    }}
                  />
                  {/* Image with organic border */}
                  <div 
                    className="relative w-full h-full overflow-hidden"
                    style={{
                      borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                      transform: 'rotate(-8deg)'
                    }}
                  >
                    <Image
                      src={object.image}
                      alt={object.anonymousTitle}
                      fill
                      className="object-cover"
                      style={{ transform: 'rotate(8deg) scale(1.2)' }}
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      priority
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 sm:h-80 md:h-96 lg:h-full lg:min-h-[500px] flex items-center justify-center">
                  <div 
                    className="w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 flex items-center justify-center bg-gray-200 text-4xl sm:text-5xl md:text-6xl font-bold text-gray-400"
                    style={{
                      borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%'
                    }}
                  >
                    {object.type.charAt(0)}
                  </div>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="lg:w-3/5 p-4 sm:p-6 md:p-8">
              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                {object.isNew && (
                  <span className="bg-primary-blue text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                    Ny
                  </span>
                )}
                {object.verified && (
                  <span className="bg-success text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                    ✓ Verifierad
                  </span>
                )}
                {object.broker && (
                  <span className="bg-light-blue text-primary-blue text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                    Mäklare
                  </span>
                )}
                {object.matchScore !== undefined && (
                  <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${
                    object.matchScore >= 80 
                      ? 'bg-green-500 text-white'
                      : object.matchScore >= 60
                      ? 'bg-blue-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {object.matchScore}% match
                  </span>
                )}
                <span className="bg-gray-100 text-text-dark text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                  {object.category || object.type}
                </span>
              </div>
              
              {/* Match Reasons */}
              {object.matchReasons && object.matchReasons.length > 0 && (
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1 sm:mb-2">Varför detta objekt matchar dina preferenser:</p>
                  <ul className="text-xs sm:text-sm text-blue-800 space-y-0.5 sm:space-y-1">
                    {object.matchReasons.map((reason: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-500 mr-1.5 sm:mr-2">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Title and Location */}
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-text-dark mb-2 sm:mb-3">
                {hasNDA(objectId) && !object.anonymousTitle ? object.companyName : object.anonymousTitle}
              </h1>
              
              <div className="flex items-center text-text-gray mb-4 sm:mb-6">
                <MapPin className="w-4 sm:w-5 h-4 sm:h-5 mr-1.5 sm:mr-2" />
                <span className="text-sm sm:text-base md:text-lg">
                  {hasNDA(objectId) && object.address ? object.address : `${object.type} • ${object.region}`}
                </span>
              </div>

              {/* Key Metrics Grid - Enhanced */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="flex items-center text-text-gray mb-1 sm:mb-2">
                    <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-1.5" />
                    <span className="text-xs sm:text-sm">Omsättning</span>
                  </div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-text-dark">
                    {object.revenue ? formatCurrency(object.revenue) : object.revenueRange}
                  </div>
                </div>
                {object.ebitda && (
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center text-text-gray mb-1 sm:mb-2">
                      <BarChart className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-1.5" />
                      <span className="text-xs sm:text-sm">EBITDA</span>
                    </div>
                    <div className="text-base sm:text-lg md:text-xl font-bold text-text-dark">
                      {formatCurrency(object.ebitda)}
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="flex items-center text-text-gray mb-1 sm:mb-2">
                    <Users className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-1.5" />
                    <span className="text-xs sm:text-sm">Anställda</span>
                  </div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-text-dark">{object.employees}</div>
                </div>
                <div className="bg-primary-blue/10 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="text-text-gray text-xs sm:text-sm mb-1 sm:mb-2">Begärt pris</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-primary-blue">
                    {object.askingPrice ? 
                      formatCurrency(object.askingPrice) :
                    object.abstainPriceMin && object.abstainPriceMax ? 
                      'Pris ej angivet' :
                    object.abstainPriceMin ? 
                      `Från ${formatCurrency(object.priceMax)}` :
                    object.abstainPriceMax ?
                      `Upp till ${formatCurrency(object.priceMin)}` :
                    object.priceMin && object.priceMax ?
                      `${formatCurrency(object.priceMin)}-${formatCurrency(object.priceMax)}`
                      : 'Ej angivet'}
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="prose prose-gray max-w-none">
                <p className="text-sm sm:text-base text-text-gray leading-relaxed">
                  {object.description}
                </p>
              </div>

              {/* Created Date */}
              <div className="mt-4 sm:mt-6 flex items-center text-xs sm:text-sm text-text-gray">
                <Calendar className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-1.5" />
                <span>Publicerad {new Date(object.createdAt).toLocaleDateString('sv-SE')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 inline-flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-blue text-primary-blue'
                      : 'border-transparent text-text-gray hover:text-text-dark hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 md:p-8">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Company Info */}
                <section>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-dark mb-3 sm:mb-4">Om företaget</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-sm sm:text-base text-text-gray leading-relaxed mb-3 sm:mb-4">
                      {object.description}
                    </p>
                    <p className="text-sm sm:text-base text-text-gray leading-relaxed">
                      Företaget har en etablerad kundbas och goda relationer med leverantörer. Det finns goda möjligheter för tillväxt genom expansion till närliggande marknader eller genom att bredda tjänsteutbudet.
                    </p>
                  </div>
                </section>

                {/* Key Facts */}
                <section>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-dark mb-3 sm:mb-4">Nyckeltal</h2>
                  <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm sm:text-base text-text-gray">Bransch</span>
                        <span className="text-sm sm:text-base text-text-dark font-medium">{object.industry || object.category || object.type}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm sm:text-base text-text-gray">Etablerat</span>
                        <span className="text-sm sm:text-base text-text-dark font-medium">
                          {object.foundedYear || (object.companyAge ? new Date().getFullYear() - object.companyAge : 2024 - Math.floor(Math.random() * 10 + 5))}
                        </span>
                      </div>
                      {object.profitMargin && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm sm:text-base text-text-gray">Vinstmarginal</span>
                          <span className="text-sm sm:text-base text-text-dark font-medium">{object.profitMargin}%</span>
                        </div>
                      )}
                      {object.customerConcentrationRisk && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm sm:text-base text-text-gray">Kundberoende</span>
                          <span className="text-sm sm:text-base text-text-dark font-medium">
                            {object.customerConcentrationRisk === 'low' ? 'Låg' : object.customerConcentrationRisk === 'medium' ? 'Medel' : 'Hög'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {object.revenueGrowthRate !== undefined && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm sm:text-base text-text-gray">Tillväxt</span>
                          <span className="text-sm sm:text-base text-text-dark font-medium text-success">+{object.revenueGrowthRate}%</span>
                        </div>
                      )}
                      {object.grossMargin && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm sm:text-base text-text-gray">Bruttomarginal</span>
                          <span className="text-sm sm:text-base text-text-dark font-medium">{object.grossMargin}%</span>
                        </div>
                      )}
                      {object.regulatoryLicenses && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm sm:text-base text-text-gray">Tillstånd</span>
                          <span className="text-sm sm:text-base text-text-dark font-medium">{object.regulatoryLicenses}</span>
                        </div>
                      )}
                      {object.paymentTerms && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm sm:text-base text-text-gray">Betalningsvillkor</span>
                          <span className="text-sm sm:text-base text-text-dark font-medium">{object.paymentTerms}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
                
                {/* Competitive Advantages */}
                {object.competitiveAdvantages && (
                  <section>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-dark mb-3 sm:mb-4">Konkurrensfördelar</h2>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm sm:text-base text-text-gray leading-relaxed whitespace-pre-wrap">
                        {object.competitiveAdvantages}
                      </p>
                    </div>
                  </section>
                )}
                
                {/* Why Selling */}
                {object.whySelling && (
                  <section>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-dark mb-3 sm:mb-4">Anledning till försäljning</h2>
                    <p className="text-sm sm:text-base text-text-gray leading-relaxed">
                      {object.whySelling}
                    </p>
                  </section>
                )}
                
                {/* Ideal Buyer */}
                {object.idealBuyer && (
                  <section>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-dark mb-3 sm:mb-4">Ideal köpare</h2>
                    <p className="text-sm sm:text-base text-text-gray leading-relaxed">
                      {object.idealBuyer}
                    </p>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'economics' && (
              <div className="space-y-6">
                {!userHasNDA ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <Shield className="w-5 sm:w-6 h-5 sm:h-6 text-amber-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-amber-900">Vissa uppgifter är låsta</h3>
                          <InfoPopup
                            title="Varför är vissa uppgifter låsta?"
                            content="För att få tillgång till detaljerad finansiell information behöver du signera ett NDA (sekretessavtal). Detta skyddar säljarens känsliga affärsinformation och säkerställer att endast seriösa köpare får tillgång. Efter att du signerat NDA:n kommer säljaren att granska din ansökan och om den godkänns får du full tillgång till all information."
                          />
                        </div>
                        <p className="text-sm sm:text-base text-amber-800 mb-3 sm:mb-4">
                          Signera NDA för att se detaljerad finansiell information
                        </p>
                        <Link
                          href={`/${locale}/nda/${objectId}`}
                          className="inline-flex items-center px-3 sm:px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm sm:text-base"
                        >
                          <Shield className="w-3 sm:w-4 h-3 sm:h-4 mr-1.5 sm:mr-2" />
                          Signera NDA
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Financial Overview - Always visible but with ranges */}
                <section>
                  <h3 className="text-lg sm:text-xl font-semibold text-text-dark mb-3 sm:mb-4">Finansiell översikt</h3>
                  <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                      <h4 className="text-text-gray text-xs sm:text-sm mb-1 sm:mb-2">Omsättning</h4>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-text-dark mb-1">{object.revenueRange}</p>
                      <p className="text-xs sm:text-sm text-text-gray">Senaste 12 månaderna</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                      <h4 className="text-text-gray text-xs sm:text-sm mb-1 sm:mb-2">EBITDA (uppskattad)</h4>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-text-dark mb-1">{calculateEBITDARange()}</p>
                      <p className="text-xs sm:text-sm text-text-gray">Baserat på branschsnitt</p>
                    </div>
                  </div>
                </section>

                {hasNDA(objectId) && (
                  <>
                    {/* Detailed Financials */}
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-text-dark mb-4">Detaljerad finansiell information</h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {object.revenue && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-text-gray text-xs sm:text-sm mb-1">Årlig omsättning</h4>
                            <p className="text-lg font-bold text-text-dark">{formatCurrency(object.revenue)}</p>
                          </div>
                        )}
                        {object.ebitda && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-text-gray text-xs sm:text-sm mb-1">EBITDA</h4>
                            <p className="text-lg font-bold text-text-dark">{formatCurrency(object.ebitda)}</p>
                          </div>
                        )}
                        {object.profitMargin && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-text-gray text-xs sm:text-sm mb-1">Vinstmarginal</h4>
                            <p className="text-lg font-bold text-text-dark">{object.profitMargin}%</p>
                          </div>
                        )}
                        {object.grossMargin && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-text-gray text-xs sm:text-sm mb-1">Bruttomarginal</h4>
                            <p className="text-lg font-bold text-text-dark">{object.grossMargin}%</p>
                          </div>
                        )}
                      </div>
                    </section>
                    
                    {/* Balance Sheet */}
                    {(object.totalAssets || object.cash || object.inventory || object.accountsReceivable) && (
                      <section>
                        <h3 className="text-lg sm:text-xl font-semibold text-text-dark mb-4">Balansräkning</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-base font-medium text-text-dark mb-3">Tillgångar</h4>
                            <div className="space-y-2">
                              {object.cash && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-sm text-text-gray">Kassa & Bank</span>
                                  <span className="text-sm font-medium text-text-dark">{formatCurrency(object.cash)}</span>
                                </div>
                              )}
                              {object.accountsReceivable && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-sm text-text-gray">Kundfordringar</span>
                                  <span className="text-sm font-medium text-text-dark">{formatCurrency(object.accountsReceivable)}</span>
                                </div>
                              )}
                              {object.inventory && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-sm text-text-gray">Lager</span>
                                  <span className="text-sm font-medium text-text-dark">{formatCurrency(object.inventory)}</span>
                                </div>
                              )}
                              {object.totalAssets && (
                                <div className="flex justify-between py-2 border-b-2 border-gray-200">
                                  <span className="text-sm font-medium text-text-dark">Totala tillgångar</span>
                                  <span className="text-sm font-bold text-text-dark">{formatCurrency(object.totalAssets)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-base font-medium text-text-dark mb-3">Skulder</h4>
                            <div className="space-y-2">
                              {object.shortTermDebt && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-sm text-text-gray">Kortfristiga skulder</span>
                                  <span className="text-sm font-medium text-text-dark">{formatCurrency(object.shortTermDebt)}</span>
                                </div>
                              )}
                              {object.longTermDebt && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-sm text-text-gray">Långfristiga skulder</span>
                                  <span className="text-sm font-medium text-text-dark">{formatCurrency(object.longTermDebt)}</span>
                                </div>
                              )}
                              {object.totalLiabilities && (
                                <div className="flex justify-between py-2 border-b-2 border-gray-200">
                                  <span className="text-sm font-medium text-text-dark">Totala skulder</span>
                                  <span className="text-sm font-bold text-text-dark">{formatCurrency(object.totalLiabilities)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </section>
                    )}
                    
                    {/* Operating Costs */}
                    {(object.salaries || object.rentCosts || object.marketingCosts) && (
                      <section>
                        <h3 className="text-lg sm:text-xl font-semibold text-text-dark mb-4">Driftskostnader</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {object.salaries && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-text-gray text-xs sm:text-sm mb-1">Lönekostnader</h4>
                              <p className="text-base font-bold text-text-dark">{formatCurrency(object.salaries)}</p>
                              <p className="text-xs text-text-gray">Inkl. sociala avgifter</p>
                            </div>
                          )}
                          {object.rentCosts && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-text-gray text-xs sm:text-sm mb-1">Lokalhyra</h4>
                              <p className="text-base font-bold text-text-dark">{formatCurrency(object.rentCosts)}</p>
                              <p className="text-xs text-text-gray">Årlig kostnad</p>
                            </div>
                          )}
                          {object.marketingCosts && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-text-gray text-xs sm:text-sm mb-1">Marknadsföring</h4>
                              <p className="text-base font-bold text-text-dark">{formatCurrency(object.marketingCosts)}</p>
                              <p className="text-xs text-text-gray">Årlig budget</p>
                            </div>
                          )}
                          {object.otherOperatingCosts && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-text-gray text-xs sm:text-sm mb-1">Övriga driftskostnader</h4>
                              <p className="text-base font-bold text-text-dark">{formatCurrency(object.otherOperatingCosts)}</p>
                              <p className="text-xs text-text-gray">Årlig kostnad</p>
                            </div>
                          )}
                        </div>
                      </section>
                    )}
                    
                    {/* Historical Revenue Table */}
                    {(object.revenueYear1 || object.revenueYear2 || object.revenueYear3) && (
                      <section>
                        <h3 className="text-xl font-semibold text-text-dark mb-4">Historisk utveckling</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-text-gray font-medium">År</th>
                                <th className="text-right py-3 px-4 text-text-gray font-medium">Omsättning</th>
                                <th className="text-right py-3 px-4 text-text-gray font-medium">Tillväxt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {object.revenueYear3 && (
                                <tr className="border-b border-gray-100">
                                  <td className="py-3 px-4 text-text-dark">2023</td>
                                  <td className="text-right py-3 px-4 font-medium">{formatCurrency(object.revenueYear3)}</td>
                                  <td className="text-right py-3 px-4 font-medium text-success">
                                    {object.revenueYear2 ? `+${((object.revenueYear3 - object.revenueYear2) / object.revenueYear2 * 100).toFixed(1)}%` : '-'}
                                  </td>
                                </tr>
                              )}
                              {object.revenueYear2 && (
                                <tr className="border-b border-gray-100">
                                  <td className="py-3 px-4 text-text-dark">2022</td>
                                  <td className="text-right py-3 px-4">{formatCurrency(object.revenueYear2)}</td>
                                  <td className="text-right py-3 px-4">
                                    {object.revenueYear1 ? `+${((object.revenueYear2 - object.revenueYear1) / object.revenueYear1 * 100).toFixed(1)}%` : '-'}
                                  </td>
                                </tr>
                              )}
                              {object.revenueYear1 && (
                                <tr className="border-b border-gray-100">
                                  <td className="py-3 px-4 text-text-dark">2021</td>
                                  <td className="text-right py-3 px-4">{formatCurrency(object.revenueYear1)}</td>
                                  <td className="text-right py-3 px-4">-</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'strengths' && (
              <div className="space-y-4 sm:space-y-6">
                <section>
                  <h3 className="text-lg sm:text-xl font-semibold text-text-dark mb-3 sm:mb-4">Styrkor</h3>
                  <ul className="space-y-2 sm:space-y-3">
                    {(object.strengths || [
                      'Etablerat varumärke på lokal marknad',
                      'Lojal och återkommande kundbas',
                      'Erfaren och driven personalstyrka',
                      'Moderna lokaler med bra läge',
                      'Starka kassaflöden och god lönsamhet'
                    ]).map((strength: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-success flex-shrink-0 mt-0.5 mr-2 sm:mr-3" />
                        <span className="text-sm sm:text-base text-text-gray">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg sm:text-xl font-semibold text-text-dark mb-3 sm:mb-4">Utvecklingsmöjligheter</h3>
                  <ul className="space-y-2 sm:space-y-3">
                    {[
                      'Expansion till närliggande geografiska marknader',
                      'Digitalisering av försäljningskanaler',
                      'Utökning av produkt/tjänsteutbud',
                      'Strategiska partnerskap och samarbeten'
                    ].map((opportunity: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-primary-blue flex-shrink-0 mt-0.5 mr-2 sm:mr-3" />
                        <span className="text-sm sm:text-base text-text-gray">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg sm:text-xl font-semibold text-text-dark mb-3 sm:mb-4">Att beakta</h3>
                  <ul className="space-y-2 sm:space-y-3">
                    {(object.risks || [
                      'Behov av fortsatt marknadsföringssatsningar',
                      'Beroende av nyckelpersoner i organisationen',
                      'Konkurrenssituation på lokal marknad'
                    ]).map((risk: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5 mr-2 sm:mr-3" />
                        <span className="text-sm sm:text-base text-text-gray">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-6 sm:mt-8 bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border-2 border-primary-blue">
          <div className="bg-gradient-to-r from-primary-blue via-primary-blue to-primary-dark p-6 sm:p-8 md:p-10 lg:p-12 relative overflow-hidden">
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary-navy mb-3 sm:mb-4">Intresserad av detta företag?</h2>
              <p className="text-sm sm:text-base md:text-lg text-primary-navy mb-6 sm:mb-8 max-w-2xl">
                {hasNDA(objectId) 
                  ? 'Du har redan signerat NDA för detta objekt. Kontakta säljaren för att gå vidare i processen.'
                  : 'Signera NDA för att få tillgång till all information och komma i kontakt med säljaren.'}
              </p>
              {!hasNDA(objectId) && (
                <Link
                  href={`/nda/${objectId}`}
                  className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-primary-navy text-white rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:bg-primary-navy/90 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Shield className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
                  Signera NDA och fortsätt
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}