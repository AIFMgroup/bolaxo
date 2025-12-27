'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { BusinessObject } from '@/data/mockObjects'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import ObjectCard from '@/components/ObjectCard'
import MultiSelect from '@/components/MultiSelect'
import PriceRangeSlider from '@/components/PriceRangeSlider'
import AdvancedFilterDropdown from '@/components/AdvancedFilterDropdown'
import { Search, SlidersHorizontal, ChevronDown, X, TrendingUp, AlertCircle, MapPin, Briefcase, DollarSign, Users, Calendar, Shield, BarChart3, Filter, Zap, HelpCircle } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export default function SearchPageContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { error: showError, info } = useToast()
  const t = useTranslations('search')
  const locale = useLocale()
  const getLocalizedPath = (path: string) => `/${locale}${path}`
  
  const [profileChecked, setProfileChecked] = useState(false)
  const [allObjects, setAllObjects] = useState<BusinessObject[]>([])
  const [filteredObjects, setFilteredObjects] = useState<BusinessObject[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter states
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, 150000000] as [number, number],
    revenueRange: '',
    locations: [] as string[],
    employees: [] as string[], // Changed to array for multi-select
    whySelling: [] as string[], // New filter for reason for sale
    sortBy: 'newest',
    verified: 'all',
    broker: 'all'
  })

  // Check buyer profile on mount
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        // Allow non-logged-in users to browse
        setProfileChecked(true)
        return
      }

      try {
        const response = await fetch(`/api/buyer-profile`, {
          credentials: 'include'
        })
        if (!response.ok) {
          info(t('completeProfile'))
          router.push(getLocalizedPath('/kopare/start'))
          return
        }
        setProfileChecked(true)
      } catch (error) {
        console.error('Error checking profile:', error)
        setProfileChecked(true) // Allow anyway
      }
    }

    checkProfile()
  }, [user, router, info])

  // Active filter count
  const activeFilterCount = 
    (filters.categories.length > 0 ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 150000000 ? 1 : 0) +
    (filters.revenueRange ? 1 : 0) +
    (filters.locations.length > 0 ? 1 : 0) +
    (filters.employees.length > 0 ? 1 : 0) +
    (filters.whySelling.length > 0 ? 1 : 0) +
    (filters.verified !== 'all' ? 1 : 0) +
    (filters.broker !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0)

  // Initialize with listings from database on mount
  useEffect(() => {
    if (!profileChecked) return

    const fetchListings = async () => {
      try {
        const response = await fetch('/api/listings?status=active', {
          credentials: 'include'
        })
        if (!response.ok) throw new Error('Failed to fetch listings')

        const listings = await response.json()
        
        // Transform API listings to BusinessObject format
        const transformedListings: BusinessObject[] = listings.map((listing: any) => ({
          id: listing.id,
          title: listing.companyName,
          anonymousTitle: listing.anonymousTitle,
          type: listing.type || listing.category,
          category: listing.category,
          description: listing.description || '',
          region: listing.region || '',
          location: listing.location || '',
          revenue: listing.revenue || 0,
          revenueRange: listing.revenueRange || '',
          priceMin: listing.priceMin || 0,
          priceMax: listing.priceMax || 0,
          abstainPriceMin: listing.abstainPriceMin || false,
          abstainPriceMax: listing.abstainPriceMax || false,
          employees: listing.employees?.toString() || '0',
          image: listing.image,
          verified: listing.verified,
          isNew: listing.isNew,
          broker: listing.broker,
          views: listing.views || 0,
          createdAt: new Date(listing.createdAt),
          ebitda: listing.ebitda || 0,
          ownerRole: '',
          strengths: listing.strengths || [],
          risks: listing.risks || [],
          whySelling: listing.whySelling || '',
          companyName: listing.companyName,
          orgNumber: listing.orgNumber || '',
          address: listing.address || '',
          detailedFinancials: {},
          customers: [],
          ndaRequired: listing.ndaRequired ?? true,
          matchScore: listing.matchScore,
          matchReasons: listing.matchReasons
        }))
        
        setAllObjects(transformedListings)
        setFilteredObjects(transformedListings)
      } catch (error) {
        console.error('Error fetching listings:', error)
        setAllObjects([])
        setFilteredObjects([])
        showError?.(t('loadError'))
      } finally {
        setLoading(false)
      }
    }

    // Load saved filter preferences if user is logged in
    const loadSavedFilters = async () => {
      if (!user?.id) return

      try {
        const response = await fetch(`/api/buyer-profile`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          const profile = data.profile

          if (profile) {
            setFilters(prev => ({
              ...prev,
              categories: profile.preferredIndustries || [],
              locations: profile.preferredRegions || [],
              employees: profile.preferredEmployeeRanges || [],
              whySelling: profile.preferredWhySelling || [],
              priceRange: [
                profile.priceMin || 0,
                profile.priceMax || 150000000
              ] as [number, number]
            }))
          }
        }
      } catch (error) {
        console.error('Error loading saved filters:', error)
      }
    }

    fetchListings()
    // Removed loadSavedFilters() - start with no filters so all companies are visible
  }, [profileChecked, user?.id])

  const applyFilters = () => {
    setLoading(true)
    
    setTimeout(() => {
      let filtered = [...allObjects]

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        filtered = filtered.filter(obj => 
          (obj.title || obj.anonymousTitle || '').toLowerCase().includes(searchLower) ||
          obj.description.toLowerCase().includes(searchLower) ||
          obj.type.toLowerCase().includes(searchLower)
        )
      }

      // Categories filter (multi-select)
      if (filters.categories.length > 0) {
        filtered = filtered.filter(obj => filters.categories.includes(obj.type))
      }

      // Price range filter - only apply if user has changed from defaults
      const [minPrice, maxPrice] = filters.priceRange
      const isPriceFilterActive = minPrice > 0 || maxPrice < 150000000
      if (isPriceFilterActive) {
        filtered = filtered.filter(obj => {
          const price = obj.price || obj.priceMin || 0
          // If price is 0 or undefined, don't filter out
          if (!price && price !== 0) return true
          return price >= minPrice && price <= maxPrice
        })
      }

      // Revenue range filter
      if (filters.revenueRange) {
        const [min, max] = filters.revenueRange.split('-').map(v => v === '+' ? Infinity : parseInt(v))
        filtered = filtered.filter(obj => {
          const revenueInMSEK = obj.revenue / 1000000
          if (max === Infinity) return revenueInMSEK >= min
          return revenueInMSEK >= min && revenueInMSEK <= max
        })
      }

      // Locations filter (multi-select)
      if (filters.locations.length > 0) {
        filtered = filtered.filter(obj => {
          // Map region values to match listings
          const regionMapping: Record<string, string[]> = {
            'stockholm-malardalen': ['Stockholm', 'Stockholm & Mälardalen'],
            'vastsverige': ['Göteborg', 'Västsverige'],
            'syd': ['Malmö', 'Syd'],
            'ostra-smaland': ['Östra & Småland'],
            'norr-mitt': ['Norr & Mitt']
          }
          const mappedRegions = filters.locations.flatMap(loc => regionMapping[loc] || [loc])
          return mappedRegions.some(region => obj.region === region || obj.location === region)
        })
      }

      // Employees filter (multi-select)
      if (filters.employees.length > 0) {
        filtered = filtered.filter(obj => {
          const employeeRange = obj.employees
          return filters.employees.some(filter => {
            if (filter === '1-5') return employeeRange === '1-5' || employeeRange === '1' || employeeRange === '2-5'
            if (filter === '6-10') return employeeRange === '6-10'
            if (filter === '11-25') return employeeRange === '11-25'
            if (filter === '26-50') return employeeRange === '26-50'
            return false
          })
        })
      }

      // Why selling filter (multi-select)
      if (filters.whySelling.length > 0) {
        filtered = filtered.filter(obj => {
          const whySelling = obj.whySelling || ''
          return filters.whySelling.some(filter => {
            // Map filter values to whySelling text patterns
            const filterPatterns: Record<string, string[]> = {
              'pension': ['pension', 'generationsskifte', 'kliva av'],
              'fokus': ['fokus', 'tid', 'annat bolag'],
              'tillväxt': ['tillväxt', 'kapital', 'skala'],
              'strategisk': ['strategisk', 'avyttring', 'renodla'],
              'flytt': ['flytt', 'livssituation', 'stad'],
              'kompetens': ['kompetens', 'nästa fas'],
              'sjukdom': ['sjukdom', 'utbrändhet', 'tid saknas'],
              'marknad': ['marknad', 'regel', 'nätverk']
            }
            const patterns = filterPatterns[filter] || []
            return patterns.some(pattern => whySelling.toLowerCase().includes(pattern))
          })
        })
      }

      // Verified filter
      if (filters.verified !== 'all') {
        filtered = filtered.filter(obj => obj.verified === (filters.verified === 'verified'))
      }

      // Broker filter
      if (filters.broker !== 'all') {
        filtered = filtered.filter(obj => obj.broker === (filters.broker === 'broker'))
      }

      // Sort
      switch (filters.sortBy) {
        case 'price-low':
          filtered.sort((a, b) => (a.price || a.priceMin) - (b.price || b.priceMin))
          break
        case 'price-high':
          filtered.sort((a, b) => (b.price || b.priceMin) - (a.price || a.priceMin))
          break
        case 'revenue-high':
          filtered.sort((a, b) => b.revenue - a.revenue)
          break
        case 'most-viewed':
          filtered.sort((a, b) => b.views - a.views)
          break
        case 'newest':
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          break
        default:
          break
      }

      setFilteredObjects(filtered)
      setLoading(false)
    }, 300)
  }

  // Apply filters on change
  useEffect(() => {
    applyFilters()
  }, [searchQuery, filters])

  // Save filter preferences to database when user is logged in
  useEffect(() => {
    if (!user?.id || !profileChecked) return

    const saveFilters = async () => {
      try {
        // Debounce: Only save after 1 second of no changes
        const timeoutId = setTimeout(async () => {
          await fetch('/api/buyer-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              userId: user.id,
              preferredRegions: filters.locations,
              preferredIndustries: filters.categories,
              preferredEmployeeRanges: filters.employees,
              preferredWhySelling: filters.whySelling,
              priceMin: filters.priceRange[0] > 0 ? filters.priceRange[0] : null,
              priceMax: filters.priceRange[1] < 150000000 ? filters.priceRange[1] : null
            })
          })
        }, 1000)

        return () => clearTimeout(timeoutId)
      } catch (error) {
        console.error('Error saving filter preferences:', error)
      }
    }

    saveFilters()
  }, [filters, user?.id, profileChecked])

  const clearAllFilters = () => {
    setSearchQuery('')
    setFilters({
      categories: [],
      priceRange: [0, 150000000],
      revenueRange: '',
      locations: [],
      employees: [],
      whySelling: [],
      sortBy: 'newest',
      verified: 'all',
      broker: 'all'
    })
  }

  return (
    <div className="min-h-screen bg-white pt-24 md:pt-20 lg:pt-16">
      {/* Header Section */}
      <div className="bg-background-off-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-2xl sm:text-3xl md:text-4xl font-bold text-text-dark text-center uppercase">
            {t('title', { count: allObjects.length })}
          </h1>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="sticky top-16 sm:top-20 md:top-24 z-20 bg-gradient-to-b from-white to-gray-50/50 backdrop-blur-md border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search and Filter Toggle Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
              {/* Enhanced Search Input */}
              <div className="flex-1">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-blue/20 to-primary-dark/20 rounded-button blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-gray group-focus-within:text-primary-blue transition-colors z-10" />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="relative w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-white border-2 border-gray-200 rounded-button text-sm sm:text-base text-text-dark placeholder-text-gray
                      focus:border-primary-blue focus:outline-none focus:shadow-lg focus:shadow-primary-blue/10
                      transition-all duration-300"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-gray hover:text-error transition-colors z-10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Enhanced Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                  relative px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg font-medium text-sm sm:text-base
                  transition-all duration-300 transform
                  flex items-center justify-center gap-2 whitespace-nowrap
                  ${showFilters 
                    ? 'bg-primary-navy text-white shadow-xl scale-105' 
                    : 'bg-white text-primary-navy border-2 border-primary-navy/30 hover:border-primary-navy hover:shadow-lg hover:bg-primary-navy/5'
                  }
                `}
              >
                <Filter className={`w-4 sm:w-5 h-4 sm:h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                <span className="hidden sm:inline">{t('advancedFilters')}</span>
                <span className="sm:hidden">{t('filters')}</span>
                {activeFilterCount > 0 && (
                  <span className={`
                    px-1.5 sm:px-2 py-0.5 rounded-full text-xs sm:text-sm font-bold
                    ${showFilters ? 'bg-white text-primary-navy' : 'bg-primary-navy text-white'}
                    animate-pulse
                  `}>
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`w-4 sm:w-5 h-4 sm:h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Enhanced Collapsible Filters */}
            {showFilters && (
              <div className="animate-slide-down">
                <div className="bg-white rounded-button border border-gray-200 p-4 sm:p-6 shadow-inner">
                  {/* Primary Filters Row - All equal width */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {/* Industries Multi-Select */}
                    <div>
                      <MultiSelect
                        label={t('selectIndustries')}
                        icon={<Briefcase className="w-4 h-4" />}
                        options={[
                          { value: 'it-konsult-utveckling', label: 'IT-konsult & utveckling' },
                          { value: 'ehandel-d2c', label: 'E-handel/D2C' },
                          { value: 'saas-licensmjukvara', label: 'SaaS & licensmjukvara' },
                          { value: 'bygg-anlaggning', label: 'Bygg & anläggning' },
                          { value: 'el-vvs-installation', label: 'El, VVS & installation' },
                          { value: 'stad-facility-services', label: 'Städ & facility services' },
                          { value: 'lager-logistik-3pl', label: 'Lager, logistik & 3PL' },
                          { value: 'restaurang-cafe', label: 'Restaurang & café' },
                          { value: 'detaljhandel-fysisk', label: 'Detaljhandel (fysisk)' },
                          { value: 'grossist-partihandel', label: 'Grossist/partihandel' },
                          { value: 'latt-tillverkning-verkstad', label: 'Lätt tillverkning/verkstad' },
                          { value: 'fastighetsservice-forvaltning', label: 'Fastighetsservice & förvaltning' },
                          { value: 'marknadsforing-kommunikation-pr', label: 'Marknadsföring, kommunikation & PR' },
                          { value: 'ekonomitjanster-redovisning', label: 'Ekonomitjänster & redovisning' },
                          { value: 'halsa-skönhet', label: 'Hälsa/skönhet (salonger, kliniker, spa)' },
                          { value: 'gym-fitness-wellness', label: 'Gym, fitness & wellness' },
                          { value: 'event-konferens-upplevelser', label: 'Event, konferens & upplevelser' },
                          { value: 'utbildning-kurser-edtech', label: 'Utbildning, kurser & edtech småskaligt' },
                          { value: 'bilverkstad-fordonsservice', label: 'Bilverkstad & fordonsservice' },
                          { value: 'jord-skog-tradgard-gronyteskotsel', label: 'Jord/skog, trädgård & grönyteskötsel' }
                        ]}
                        value={filters.categories}
                        onChange={(value) => setFilters({...filters, categories: value})}
                        placeholder={t('selectIndustries')}
                      />
                    </div>

                    {/* Locations Multi-Select */}
                    <div>
                      <MultiSelect
                        label={t('selectLocations')}
                        icon={<MapPin className="w-4 h-4" />}
                        options={[
                          { value: 'stockholm-malardalen', label: t('locations.stockholm') },
                          { value: 'vastsverige', label: t('locations.west') },
                          { value: 'syd', label: t('locations.south') },
                          { value: 'ostra-smaland', label: t('locations.east') },
                          { value: 'norr-mitt', label: t('locations.north') }
                        ]}
                        value={filters.locations}
                        onChange={(value) => setFilters({...filters, locations: value})}
                        placeholder={t('selectLocations')}
                      />
                    </div>

                    {/* Revenue Range */}
                    <div>
                      <AdvancedFilterDropdown
                        label={t('revenueRange')}
                        icon={<BarChart3 className="w-4 h-4" />}
                        options={[
                          { value: '', label: t('revenueOptions.all'), description: t('revenueOptions.showAll') },
                          { value: '0-1', label: t('revenueOptions.0-1'), description: t('revenueOptions.0-1Desc') },
                          { value: '1-5', label: t('revenueOptions.1-5'), description: t('revenueOptions.1-5Desc') },
                          { value: '5-10', label: t('revenueOptions.5-10'), description: t('revenueOptions.5-10Desc') },
                          { value: '10-25', label: t('revenueOptions.10-25'), description: t('revenueOptions.10-25Desc') },
                          { value: '25-50', label: t('revenueOptions.25-50'), description: t('revenueOptions.25-50Desc') },
                          { value: '50+', label: t('revenueOptions.50+'), description: t('revenueOptions.50+Desc') }
                        ]}
                        value={filters.revenueRange}
                        onChange={(value) => setFilters({...filters, revenueRange: value})}
                      />
                    </div>

                    {/* Sort Options */}
                    <div>
                      <AdvancedFilterDropdown
                        label={t('sortBy')}
                        icon={<TrendingUp className="w-4 h-4" />}
                        options={[
                          { value: 'newest', label: t('sortOptions.newest'), icon: <Calendar className="w-4 h-4" /> },
                          { value: 'price-low', label: t('sortOptions.priceLow'), icon: <DollarSign className="w-4 h-4" /> },
                          { value: 'price-high', label: t('sortOptions.priceHigh'), icon: <DollarSign className="w-4 h-4" /> },
                          { value: 'revenue-high', label: t('sortOptions.revenueHigh'), icon: <BarChart3 className="w-4 h-4" /> },
                          { value: 'most-viewed', label: t('sortOptions.mostViewed'), icon: <TrendingUp className="w-4 h-4" /> }
                        ]}
                        value={filters.sortBy}
                        onChange={(value) => setFilters({...filters, sortBy: value})}
                      />
                    </div>
                  </div>

                  {/* Price Range Slider - Compact */}
                  <div className="mb-4 sm:mb-6">
                    <div className="text-xs font-medium text-gray-700 mb-2">{t('priceRange')}</div>
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                      <PriceRangeSlider
                        min={0}
                        max={150000000}
                        value={filters.priceRange}
                        onChange={(value) => setFilters({...filters, priceRange: value})}
                        step={500000}
                        className=""
                      />
                    </div>
                  </div>

                  {/* Secondary Filters Row - All equal width */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Employees - Multi-Select */}
                    <div>
                      <MultiSelect
                        label={t('employees')}
                        icon={<Users className="w-4 h-4" />}
                        options={[
                          { value: '1-5', label: t('employeeOptions.1-5') },
                          { value: '6-10', label: t('employeeOptions.6-10') },
                          { value: '11-25', label: t('employeeOptions.11-25') },
                          { value: '26-50', label: t('employeeOptions.26-50') }
                        ]}
                        value={filters.employees}
                        onChange={(value) => setFilters({...filters, employees: value})}
                        placeholder={t('employees')}
                      />
                    </div>

                    {/* Verified Status */}
                    <AdvancedFilterDropdown
                      label={t('verification')}
                      icon={<Shield className="w-4 h-4" />}
                      options={[
                        { value: 'all', label: t('verificationOptions.all') },
                        { value: 'verified', label: t('verificationOptions.verified'), icon: <Shield className="w-4 h-4 text-success" /> },
                        { value: 'unverified', label: t('verificationOptions.unverified') }
                      ]}
                      value={filters.verified}
                      onChange={(value) => setFilters({...filters, verified: value})}
                    />

                    {/* Broker Status */}
                    <AdvancedFilterDropdown
                      label={t('broker')}
                      icon={<Briefcase className="w-4 h-4" />}
                      options={[
                        { value: 'all', label: t('brokerOptions.all') },
                        { value: 'broker', label: t('brokerOptions.broker'), icon: <Briefcase className="w-4 h-4" /> },
                        { value: 'owner', label: t('brokerOptions.owner') }
                      ]}
                      value={filters.broker}
                      onChange={(value) => setFilters({...filters, broker: value})}
                    />

                    {/* Why Selling - Multi-Select */}
                    <div>
                      <MultiSelect
                        label={t('whySelling')}
                        icon={<HelpCircle className="w-4 h-4" />}
                        options={[
                          { value: 'pension', label: t('whySellingOptions.pension') },
                          { value: 'fokus', label: t('whySellingOptions.fokus') },
                          { value: 'tillväxt', label: t('whySellingOptions.tillväxt') },
                          { value: 'strategisk', label: t('whySellingOptions.strategisk') },
                          { value: 'flytt', label: t('whySellingOptions.flytt') },
                          { value: 'kompetens', label: t('whySellingOptions.kompetens') },
                          { value: 'sjukdom', label: t('whySellingOptions.sjukdom') },
                          { value: 'marknad', label: t('whySellingOptions.marknad') }
                        ]}
                        value={filters.whySelling}
                        onChange={(value) => setFilters({...filters, whySelling: value})}
                        placeholder={t('whySelling')}
                      />
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {activeFilterCount > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-text-gray">
                        <Zap className="w-4 h-4 text-primary-blue" />
                        <span>{t('activeFilters', { count: activeFilterCount })}</span>
                        <span className="text-primary-blue font-medium">• {filteredObjects.length} {t('results')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-text-dark">
            {t('companiesFound', { 
              count: filteredObjects.length, 
              matched: activeFilterCount > 0 ? t('matched') : '' 
            })}
          </h2>
          {!loading && filteredObjects.length > 0 && (
            <p className="text-xs sm:text-sm text-text-gray hidden lg:block">
              {t('allVerified')}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card animate-pulse p-4 sm:p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3 sm:mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full md:w-2/3" />
                <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="h-8 bg-gray-200 rounded" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Grid */}
        {!loading && filteredObjects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {filteredObjects.map((object) => (
              <ObjectCard key={object.id} object={object} matchScore={object.matchScore} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredObjects.length === 0 && (
          <div className="card text-center py-6 sm:py-8 md:py-12 max-w-md mx-auto">
            <AlertCircle className="w-12 sm:w-16 h-12 sm:h-16 text-text-gray/50 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-text-dark mb-2">
              {t('noResults')}
            </h3>
            <p className="text-sm sm:text-base text-text-gray mb-4 sm:mb-6 px-4">
              {t('adjustFilters')}
            </p>
            <button 
              onClick={clearAllFilters}
              className="btn-secondary mx-auto text-sm sm:text-base"
            >
              {t('clearFilters')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}