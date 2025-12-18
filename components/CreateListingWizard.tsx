'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { X, ArrowRight, ArrowLeft, Mail, Building, TrendingUp, Users, Target, FileText, Lightbulb, Sparkles, AlertCircle, CheckCircle, Eye, Zap, Package, ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useTranslations, useLocale } from 'next-intl'
import FormField from './FormField'
import FormTextarea from './FormTextarea'
import CustomSelect from './CustomSelect'
import FormFieldCurrency from './FormFieldCurrency'
import FormFieldPercent from './FormFieldPercent'
import Image from 'next/image'
import Link from 'next/link'

interface ListingData {
  // Step 1: Grunduppgifter
  email: string
  companyName: string
  website: string
  orgNumber: string
  industry: string
  
  // Step 2: Företagsdata (Allmänt)
  companyAge: string
  revenue: string
  revenueYear1: string  // För 3 år sedan
  revenueYear2: string  // För 2 år sedan
  revenueYear3: string  // Förra året
  profitMargin: string
  employees: string
  grossMargin?: string
  customerConcentrationRisk?: string
  totalDebt?: string
  regulatoryLicenses?: string
  paymentTerms?: string
  exactRevenue?: string
  operatingCosts?: string
  cogs?: string
  salaries?: string
  marketingCosts?: string
  rentCosts?: string
  
  // Step 4: Annonsinformation
  anonymousTitle: string
  description: string
  strengths: string[]
  risks: string[]
  whySelling: string
  priceMin: string
  priceMax: string
  abstainPriceMin: boolean
  abstainPriceMax: boolean
  location: string
  region: string
  
  // Step 5: Bilder
  images: string[]
  
  // Step 6: Paketval
  packageType: 'basic' | 'pro' | 'enterprise'
  
  // Step 3: Branschspecifika frågor (dynamic)
  [key: string]: any
}

interface WizardProps {
  onClose?: () => void
}

// Industries, regions och industryQuestions kommer från translations
// Se messages/sv.json och messages/en.json under "createListing"

export default function CreateListingWizard({ onClose }: WizardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { success, error } = useToast()
  const t = useTranslations('createListing')
  const locale = useLocale()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  
  // Get translated industries and regions
  const industries = useMemo(() => {
    const data = t.raw('industries')
    return Array.isArray(data) ? data : []
  }, [t])
  const regions = useMemo(() => {
    const data = t.raw('regions')
    return Array.isArray(data) ? data : []
  }, [t])
  const industryQuestions = useMemo(() => {
    const data = t.raw('industryQuestions')
    return data && typeof data === 'object' ? data : {}
  }, [t])
  
  const [data, setData] = useState<ListingData>({
    email: user?.email || '',
    companyName: '',
    website: '',
    orgNumber: '',
    industry: '',
    companyAge: '',
    revenue: '',
    revenueYear1: '',
    revenueYear2: '',
    revenueYear3: '',
    profitMargin: '',
    employees: '',
    anonymousTitle: '',
    description: '',
    strengths: ['', '', ''],
    risks: ['', '', ''],
    whySelling: '',
    priceMin: '',
    priceMax: '',
    abstainPriceMin: false,
    abstainPriceMax: false,
    location: '',
    region: '',
    images: [],
    packageType: 'pro' as const
  })

  const totalSteps = 7 // Added preview step
  const progress = (step / totalSteps) * 100

  // Auto-generate anonymous title
  useEffect(() => {
    if (data.industry && data.region) {
      const industryLabel = industries.find((i: any) => i.value === data.industry)?.label || t('defaultCompany')
      const regionLabel = regions.find((r: any) => r.value === data.region)?.label || t('defaultCountry')
      setData(prev => ({
        ...prev,
        anonymousTitle: t('anonymousTitleTemplate', { industry: industryLabel, region: regionLabel })
      }))
    }
  }, [data.industry, data.region, industries, regions, t])

  // Auto-scroll to top on step change
  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [step])

  const updateField = (field: keyof ListingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.email && data.companyName && data.industry
      case 2:
        return data.companyAge && data.revenue && data.employees && data.revenueYear1 && data.revenueYear2 && data.revenueYear3
      case 3:
        return true // Branschspecifika frågor är valfria
      case 4:
        // Price fields are optional if "abstain" is checked
        const priceMinValid = data.abstainPriceMin || data.priceMin
        const priceMaxValid = data.abstainPriceMax || data.priceMax
        return data.description && priceMinValid && priceMaxValid && data.location && data.region
      case 5:
        return true // Bilder är valfria
      case 6:
        return true // Förhandsvisning
      case 7:
        return true // Bekräftelse
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canProceed() && step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const handlePublish = async () => {
    setLoading(true)
    try {
      // Skapa annonsen via API
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          ...data,
          status: 'active',
          autoPublish: true
        })
      })

      if (response.ok) {
        const listing = await response.json()
        router.push(`/${locale}/dashboard/listings?success=published&id=${listing.id}`)
        success(t('navigation.publishedSuccess'))
      } else {
        console.error('Failed to publish listing')
        error(t('errors.publishFailed'))
      }
    } catch (err) {
      console.error('Error publishing listing:', err)
      error(t('errors.publishError'))
    } finally {
      setLoading(false)
    }
  }

  // Hämta branschspecifika frågor för aktuell bransch
  // Mappning av nya branscher till befintliga frågor
  const industryMapping: Record<string, string> = {
    'it-konsult-utveckling': 'consulting',
    'ehandel-d2c': 'ecommerce',
    'saas-licensmjukvara': 'tech',
    'bygg-anlaggning': 'construction',
    'restaurang-cafe': 'restaurant',
    'detaljhandel-fysisk': 'retail',
    'grossist-partihandel': 'retail',
    'latt-tillverkning-verkstad': 'manufacturing',
    'ekonomitjanster-redovisning': 'services',
    'marknadsforing-kommunikation-pr': 'services',
    'halsa-skönhet': 'healthcare',
    'gym-fitness-wellness': 'healthcare',
    'stad-facility-services': 'services',
    'lager-logistik-3pl': 'services',
    'el-vvs-installation': 'services',
    'fastighetsservice-forvaltning': 'services',
    'event-konferens-upplevelser': 'services',
    'utbildning-kurser-edtech': 'services',
    'bilverkstad-fordonsservice': 'services',
    'jord-skog-tradgard-gronyteskotsel': 'services',
  }

  const mappedIndustry = data.industry ? industryMapping[data.industry] || data.industry : ''
  const currentIndustryQuestions = mappedIndustry && industryQuestions ? (industryQuestions[mappedIndustry] || []) : []

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-0 sm:px-4 text-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl sm:rounded-3xl min-h-screen sm:min-h-0" ref={formRef}>
          {/* Header med progress */}
          <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-2xl font-black text-navy uppercase tracking-tight">
                  {t('title')}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-all"
                >
                  <X className="w-5 sm:w-6 h-5 sm:h-6 text-gray-400" />
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                    <div
                      className="bg-navy h-2 sm:h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                  {t('stepProgress', { current: step, total: totalSteps })}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 md:p-8">
            {/* Step 1: Grunduppgifter */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3">
                    <Building className="w-8 h-8 text-navy" />
                  </div>
                  <h3 className="text-2xl font-bold text-navy mb-2">{t('step1.title')}</h3>
                  <p className="text-gray-600">{t('step1.subtitle')}</p>
                </div>

                <div className="space-y-4">
                  <FormField
                    label={t('step1.emailLabel')}
                    type="email"
                    value={data.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder={t('step1.emailPlaceholder')}
                    required
                  />

                  <FormField
                    label={t('step1.companyNameLabel')}
                    value={data.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    placeholder={t('step1.companyNamePlaceholder')}
                    required
                  />

                  <FormField
                    label={t('step1.websiteLabel')}
                    value={data.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder={t('step1.websitePlaceholder')}
                  />

                  <CustomSelect
                    label={t('step1.industryLabel')}
                    value={data.industry}
                    onChange={(value) => updateField('industry', value)}
                    options={industries}
                    placeholder={t('step1.industryPlaceholder')}
                    required
                  />

                  <FormField
                    label={t('step1.orgNumberLabel')}
                    value={data.orgNumber}
                    onChange={(e) => updateField('orgNumber', e.target.value)}
                    placeholder={t('step1.orgNumberPlaceholder')}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Företagsdata */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transform -rotate-3">
                    <TrendingUp className="w-8 h-8 text-navy" />
                  </div>
                  <h3 className="text-2xl font-bold text-navy mb-2">{t('step2.title')}</h3>
                  <p className="text-gray-600">{t('step2.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomSelect
                    label={t('step2.companyAgeLabel')}
                    value={data.companyAge}
                    onChange={(value) => updateField('companyAge', value)}
                    options={[
                      { value: '0-2', label: t('step2.companyAge0to2') },
                      { value: '3-5', label: t('step2.companyAge3to5') },
                      { value: '6-10', label: t('step2.companyAge6to10') },
                      { value: '11-20', label: t('step2.companyAge11to20') },
                      { value: '20+', label: t('step2.companyAge20plus') }
                    ]}
                    required
                  />

                  <CustomSelect
                    label={t('step2.employeesLabel')}
                    value={data.employees}
                    onChange={(value) => updateField('employees', value)}
                    options={[
                      { value: '1', label: t('step2.employees1') },
                      { value: '2-5', label: t('step2.employees2to5') },
                      { value: '6-10', label: t('step2.employees6to10') },
                      { value: '11-25', label: t('step2.employees11to25') },
                      { value: '26-50', label: t('step2.employees26to50') },
                      { value: '50+', label: t('step2.employees50plus') }
                    ]}
                    required
                  />
                </div>

                <FormFieldCurrency
                  label={t('step2.revenueLabel')}
                  value={data.revenue}
                  onChange={(value) => updateField('revenue', value)}
                  placeholder={t('step2.revenuePlaceholder')}
                  tooltip={t('step2.revenueTooltip')}
                  required
                />

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">{t('step2.revenueDevelopmentTitle')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormFieldCurrency
                      label={t('step2.revenueYear1Label', { year: new Date().getFullYear() - 3 })}
                      value={data.revenueYear1}
                      onChange={(value) => updateField('revenueYear1', value)}
                      placeholder={t('step2.revenueYearPlaceholder')}
                      tooltip={t('step2.revenueYear1Tooltip')}
                      required
                    />
                    <FormFieldCurrency
                      label={t('step2.revenueYear2Label', { year: new Date().getFullYear() - 2 })}
                      value={data.revenueYear2}
                      onChange={(value) => updateField('revenueYear2', value)}
                      placeholder={t('step2.revenueYearPlaceholder')}
                      tooltip={t('step2.revenueYear2Tooltip')}
                      required
                    />
                    <FormFieldCurrency
                      label={t('step2.revenueYear3Label', { year: new Date().getFullYear() - 1 })}
                      value={data.revenueYear3}
                      onChange={(value) => updateField('revenueYear3', value)}
                      placeholder={t('step2.revenueYearPlaceholder')}
                      tooltip={t('step2.revenueYear3Tooltip')}
                      required
                    />
                  </div>
                </div>

                <FormFieldPercent
                  label={t('step2.profitMarginLabel')}
                  value={data.profitMargin}
                  onChange={(value) => updateField('profitMargin', value)}
                  placeholder={t('step2.profitMarginPlaceholder')}
                  tooltip={t('step2.profitMarginTooltip')}
                  required
                />
              </div>
            )}

            {/* Step 3: Branschspecifika frågor */}
            {step === 3 && currentIndustryQuestions.length > 0 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-6">
                    <Target className="w-8 h-8 text-navy" />
                  </div>
                  <h3 className="text-2xl font-bold text-navy mb-2">{t('step3.title')}</h3>
                  <p className="text-gray-600">{t('step3.subtitle', { industry: industries.find((i: any) => i.value === data.industry)?.label })}</p>
                </div>

                <div className="space-y-4">
                  {currentIndustryQuestions.slice(0, 4).map((question: any) => {
                    if (question.type === 'select' && question.options) {
                      return (
                        <CustomSelect
                          key={question.key}
                          label={question.label}
                          value={data[question.key] as string || ''}
                          onChange={(value) => updateField(question.key as keyof ListingData, value)}
                          options={question.options}
                        />
                      )
                    } else if (question.fieldType === 'currency') {
                      return (
                        <FormFieldCurrency
                          key={question.key}
                          label={question.label}
                          value={data[question.key] as string || ''}
                          onChange={(value) => updateField(question.key as keyof ListingData, value)}
                        />
                      )
                    } else if (question.fieldType === 'percent') {
                      return (
                        <FormFieldPercent
                          key={question.key}
                          label={question.label}
                          value={data[question.key] as string || ''}
                          onChange={(value) => updateField(question.key as keyof ListingData, value)}
                        />
                      )
                    } else if (question.type === 'textarea') {
                      return (
                        <FormTextarea
                          key={question.key}
                          label={question.label}
                          value={data[question.key] as string || ''}
                          onChange={(e) => updateField(question.key as keyof ListingData, e.target.value)}
                          rows={3}
                        />
                      )
                    } else {
                      return (
                        <FormField
                          key={question.key}
                          label={question.label}
                          value={data[question.key] as string || ''}
                          onChange={(e) => updateField(question.key as keyof ListingData, e.target.value)}
                        />
                      )
                    }
                  })}
                </div>
              </div>
            )}

            {/* Om ingen branschspecifika frågor, hoppa direkt till steg 4 */}
            {step === 3 && currentIndustryQuestions.length === 0 && (
              <>
                {setStep(4)}
              </>
            )}

            {/* Step 4: Annonsinformation */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transform -rotate-3">
                    <FileText className="w-8 h-8 text-navy" />
                  </div>
                  <h3 className="text-2xl font-bold text-navy mb-2">{t('step4.title')}</h3>
                  <p className="text-gray-600">{t('step4.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label={t('step4.locationLabel')}
                    value={data.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder={t('step4.locationPlaceholder')}
                    required
                  />

                  <CustomSelect
                    label={t('step4.regionLabel')}
                    value={data.region}
                    onChange={(value) => updateField('region', value)}
                    options={regions}
                    required
                  />
                </div>

                <FormTextarea
                  label={t('step4.descriptionLabel')}
                  value={data.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  placeholder={t('step4.descriptionPlaceholder')}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('step4.strengthsLabel')}
                  </label>
                  {data.strengths.map((strength, index) => (
                    <FormField
                      key={index}
                      label={t('step4.strengthLabel', { index: index + 1 })}
                      value={strength}
                      onChange={(e) => {
                        const newStrengths = [...data.strengths]
                        newStrengths[index] = e.target.value
                        updateField('strengths', newStrengths)
                      }}
                      placeholder={t('step4.strengthPlaceholder')}
                      className="mb-2"
                    />
                  ))}
                </div>

                <FormTextarea
                  label={t('step4.whySellingLabel')}
                  value={data.whySelling}
                  onChange={(e) => updateField('whySelling', e.target.value)}
                  rows={3}
                  placeholder={t('step4.whySellingPlaceholder')}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <FormFieldCurrency
                        label={t('step4.priceMinLabel')}
                        value={data.priceMin}
                        onChange={(value) => updateField('priceMin', value)}
                        placeholder={t('step4.priceMinPlaceholder')}
                        required={!data.abstainPriceMin}
                        disabled={data.abstainPriceMin}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2 pt-8">
                        <input
                          type="checkbox"
                          id="abstainPriceMin"
                          checked={data.abstainPriceMin}
                          onChange={(e) => {
                            updateField('abstainPriceMin', e.target.checked)
                            if (e.target.checked) {
                              updateField('priceMin', '')
                            }
                          }}
                          className="w-5 h-5 border-2 border-gray-300 rounded text-primary-blue focus:ring-primary-blue focus:ring-2"
                        />
                        <label htmlFor="abstainPriceMin" className="text-sm text-gray-700 cursor-pointer">
                          {t('step4.abstain')}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <FormFieldCurrency
                        label={t('step4.priceMaxLabel')}
                        value={data.priceMax}
                        onChange={(value) => updateField('priceMax', value)}
                        placeholder={t('step4.priceMaxPlaceholder')}
                        required={!data.abstainPriceMax}
                        disabled={data.abstainPriceMax}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2 pt-8">
                        <input
                          type="checkbox"
                          id="abstainPriceMax"
                          checked={data.abstainPriceMax}
                          onChange={(e) => {
                            updateField('abstainPriceMax', e.target.checked)
                            if (e.target.checked) {
                              updateField('priceMax', '')
                            }
                          }}
                          className="w-5 h-5 border-2 border-gray-300 rounded text-primary-blue focus:ring-primary-blue focus:ring-2"
                        />
                        <label htmlFor="abstainPriceMax" className="text-sm text-gray-700 cursor-pointer">
                          {t('step4.abstain')}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Bilder */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3">
                    <ImageIcon className="w-8 h-8 text-navy" />
                  </div>
                  <h3 className="text-2xl font-bold text-navy mb-2">{t('step5.title')}</h3>
                  <p className="text-gray-600">{t('step5.subtitle')}</p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">{t('step5.dragDrop')}</p>
                  <p className="text-sm text-gray-500">{t('step5.fileTypes')}</p>
                  <button className="mt-4 px-6 py-2 bg-accent-pink text-navy font-medium rounded-full hover:bg-opacity-90 transition-all">
                    {t('step5.selectImages')}
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">{t('step5.imageTipsTitle')}</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>{t('step5.imageTip1')}</li>
                        <li>{t('step5.imageTip2')}</li>
                        <li>{t('step5.imageTip3')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Förhandsvisning */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transform -rotate-6">
                    <Eye className="w-8 h-8 text-navy" />
                  </div>
                  <h3 className="text-2xl font-bold text-navy mb-2">{t('step6.title')}</h3>
                  <p className="text-gray-600">{t('step6.subtitle')}</p>
                </div>

                {/* Annonsförhandsvisning - detaljerad som objektsidan */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  {/* Hero Image Section */}
                  <div className="relative h-64 sm:h-80 md:h-96 bg-primary-navy">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Building className="w-20 h-20 text-white/30 mb-4" />
                        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{data.anonymousTitle}</h1>
                        <p className="text-xl text-white/80">{data.location}</p>
                      </div>
                    </div>
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full">{t('step6.newBadge')}</span>
                      <span className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full">{t('step6.proBadge')}</span>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-4 sm:p-6 md:p-8">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition-colors duration-200 cursor-default">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs sm:text-sm">{t('step6.revenue')}</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-navy">
                          {data.revenue ? `${parseInt(data.revenue).toLocaleString('sv-SE')} kr` : t('step6.notSpecified')}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition-colors duration-200 cursor-default">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Users className="w-4 h-4" />
                          <span className="text-xs sm:text-sm">{t('step6.employees')}</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-navy">{data.employees || t('step6.notSpecified')}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition-colors duration-200 cursor-default">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Target className="w-4 h-4" />
                          <span className="text-xs sm:text-sm">{t('step6.margin')}</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-navy">
                          {data.profitMargin ? `${data.profitMargin}%` : t('step6.notSpecified')}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition-colors duration-200 cursor-default">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Package className="w-4 h-4" />
                          <span className="text-xs sm:text-sm">{t('step6.priceRange')}</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-accent-pink">
                          {data.abstainPriceMin && data.abstainPriceMax ? 
                            t('step6.priceNotSpecified') :
                          data.abstainPriceMin ? 
                            t('step6.fromPrice', { price: parseInt(data.priceMax).toLocaleString('sv-SE') }) :
                          data.abstainPriceMax ?
                            t('step6.upToPrice', { price: parseInt(data.priceMin).toLocaleString('sv-SE') }) :
                          data.priceMin && data.priceMax ? 
                            t('step6.priceRangeFormat', { min: parseInt(data.priceMin).toLocaleString('sv-SE'), max: parseInt(data.priceMax).toLocaleString('sv-SE') }) 
                            : t('step6.notSpecified')}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-navy mb-3">Om företaget</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {data.description || 'Ingen beskrivning angiven'}
                      </p>
                    </div>

                    {/* Strengths & Risks */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <h3 className="text-lg font-bold text-navy mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          Styrkor
                        </h3>
                        <ul className="space-y-2">
                          {data.strengths.filter(s => s).map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <h3 className="text-lg font-bold text-navy mb-3 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                          Risker & utmaningar
                        </h3>
                        <ul className="space-y-2">
                          {data.risks.filter(r => r).map((risk, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Why Selling */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-navy mb-2">Anledning till försäljning</h3>
                      <p className="text-gray-700">{data.whySelling || 'Ej angiven'}</p>
                    </div>
                  </div>
                </div>

                {/* Paketval CTA */}
                <div className="mt-8 space-y-6">
                  <h3 className="text-xl font-bold text-navy text-center">{t('step7.title')}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Basic Paket */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary-blue transition-all duration-200 cursor-pointer group">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{t('step7.basicName')}</h4>
                      <p className="text-3xl font-bold text-primary-blue mb-1">{t('step7.basicPrice')}</p>
                      <p className="text-sm text-gray-600 mb-4">{t('step7.basicPeriod')}</p>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{t('step7.basicFeature1')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{t('step7.basicFeature2')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{t('step7.basicFeature3')}</span>
                        </li>
                      </ul>
                      <button 
                        onClick={() => {
                          updateField('packageType', 'basic')
                          setStep(7)
                        }}
                        className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium group-hover:bg-primary-blue group-hover:text-white transition-all duration-200">
                        {t('step7.basicSelect')}
                      </button>
                    </div>

                    {/* Pro Paket */}
                    <div className="bg-white rounded-xl border-2 border-primary-blue p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group relative">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary-blue text-white text-xs font-bold px-3 py-1 rounded-full">{t('step7.proBadge')}</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{t('step7.proName')}</h4>
                      <p className="text-3xl font-bold text-primary-blue mb-1">{t('step7.proPrice')}</p>
                      <p className="text-sm text-gray-600 mb-4">{t('step7.proPeriod')}</p>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{t('step7.proFeature1')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{t('step7.proFeature2')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{t('step7.proFeature3')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{t('step7.proFeature4')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{t('step7.proFeature5')}</span>
                        </li>
                      </ul>
                      <button 
                        onClick={() => {
                          updateField('packageType', 'pro')
                          setStep(7)
                        }}
                        className="w-full py-2 px-4 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-dark transition-all duration-200">
                        {t('step7.proSelect')}
                      </button>
                    </div>

                    {/* Enterprise Paket */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary-blue transition-all duration-200 cursor-pointer group">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{t('step7.premiumName')}</h4>
                      <p className="text-3xl font-bold text-primary-blue mb-1">{t('step7.premiumPrice')}</p>
                      <p className="text-sm text-gray-600 mb-4">{t('step7.premiumPeriod')}</p>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{t('step7.premiumFeature1')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{t('step7.premiumFeature2')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{t('step7.premiumFeature3')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{t('step7.premiumFeature4')}</span>
                        </li>
                      </ul>
                      <button 
                        onClick={() => {
                          updateField('packageType', 'enterprise')
                          setStep(7)
                        }}
                        className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium group-hover:bg-primary-blue group-hover:text-white transition-all duration-200">
                        {t('step7.premiumSelect')}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-center text-sm text-gray-600">
                    {t('navigation.allPackagesIncludeVAT')}
                  </p>
                </div>
              </div>
            )}

            {/* Step 7: Bekräftelse och publicering */}
            {step === 7 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3">
                    <Sparkles className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-navy mb-2">{t('navigation.readyToPublish')}</h3>
                  <p className="text-gray-600">{t('navigation.readyToPublishDesc')}</p>
                </div>

                {/* Paketval */}
                <div className="bg-gradient-to-br from-accent-pink/10 to-navy/10 rounded-2xl p-6">
                  <h4 className="text-lg font-bold text-navy mb-4">{t('navigation.selectedPackage')} {data.packageType === 'basic' ? t('step7.basicName') : data.packageType === 'enterprise' ? t('step7.premiumName') : t('step7.proName')}</h4>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{t('step7.proFeature2')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{t('step7.proFeature3')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{t('step7.proFeature4')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{t('step7.proFeature5')}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-navy">
                        {data.packageType === 'basic' ? t('step7.basicPrice') : data.packageType === 'enterprise' ? t('step7.premiumPrice') : t('step7.proPrice')}
                      </p>
                      <p className="text-sm text-gray-600">{t('navigation.oneTimeCost')}</p>
                    </div>
                    <button 
                      onClick={() => setStep(6)}
                      className="text-accent-pink hover:underline text-sm"
                    >
                      {t('navigation.changePackage')}
                    </button>
                  </div>
                  </div>
                  
                {/* Sammanfattning */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-bold text-navy mb-3">{t('navigation.summary')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('navigation.companyNameLabel')}</span>
                      <span className="font-medium">{data.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('navigation.industryLabel')}</span>
                      <span className="font-medium">{industries.find((i: any) => i.value === data.industry)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('navigation.locationLabel')}</span>
                      <span className="font-medium">{data.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('navigation.priceRangeLabel')}</span>
                      <span className="font-medium">
                        {data.abstainPriceMin && data.abstainPriceMax ? 
                          t('step6.priceNotSpecified') :
                        data.abstainPriceMin ? 
                          t('step6.fromPrice', { price: parseInt(data.priceMax).toLocaleString('sv-SE') }) :
                        data.abstainPriceMax ?
                          t('step6.upToPrice', { price: parseInt(data.priceMin).toLocaleString('sv-SE') }) :
                        data.priceMin && data.priceMax ?
                          t('step6.priceRangeFormat', { min: parseInt(data.priceMin).toLocaleString('sv-SE'), max: parseInt(data.priceMax).toLocaleString('sv-SE') })
                          : t('step6.notSpecified')}
                      </span>
                    </div>
                    </div>
                  </div>

                {/* Villkor */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 mb-1">{t('navigation.importantInfo')}</p>
                      <p className="text-yellow-700">
                        {t('navigation.importantInfoDesc').split('{termsLink}')[0]}
                        <Link href={`/${locale}/juridiskt/anvandarvillkor`} className="underline">
                          {t('navigation.termsLink')}
                        </Link>
                        {t('navigation.importantInfoDesc').split('{termsLink}')[1]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer med knappar */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4 pb-[calc(0.75rem+var(--sab))] sm:pb-4">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handlePrev}
                disabled={step === 1}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 font-medium rounded-full transition-all text-sm sm:text-base ${
                  step === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-navy hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="hidden sm:inline">{t('navigation.back')}</span>
                <span className="sm:hidden">Tillbaka</span>
              </button>

              {step < totalSteps - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`flex items-center gap-1 sm:gap-2 px-4 sm:px-8 py-2.5 sm:py-3 font-medium rounded-full transition-all text-sm sm:text-base ${
                    canProceed()
                      ? 'bg-navy text-white hover:shadow-lg active:scale-95'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="hidden sm:inline">{step === 6 ? t('navigation.goToPublish') : t('navigation.nextButton')}</span>
                  <span className="sm:hidden">Nästa</span>
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
                </button>
              ) : step === totalSteps - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 sm:gap-2 px-4 sm:px-8 py-2.5 sm:py-3 bg-green-600 text-white font-medium rounded-full hover:shadow-lg active:scale-95 transition-all text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">{t('navigation.goToPublish')}</span>
                  <span className="sm:hidden">Publicera</span>
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
                </button>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="flex items-center gap-1 sm:gap-2 px-4 sm:px-8 py-2.5 sm:py-3 bg-green-600 text-white font-medium rounded-full hover:shadow-lg active:scale-95 transition-all text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <div className="w-4 sm:w-5 h-4 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">{t('navigation.publishing')}</span>
                      <span className="sm:hidden">Skapar...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 sm:w-5 h-4 sm:h-5" />
                      <span className="hidden sm:inline">{t('navigation.create')}</span>
                      <span className="sm:hidden">Skapa</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
