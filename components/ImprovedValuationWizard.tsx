'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { 
  X, ArrowRight, ArrowLeft, Mail, Building, TrendingUp, Users, 
  Target, FileText, Lightbulb, Sparkles, AlertCircle, CheckCircle, 
  HelpCircle, DollarSign, Briefcase, Calendar, Globe, Award,
  BarChart3, Shield, Zap, Package, Settings, CreditCard, ChartLine
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import FormField from './FormField'
import FormTextarea from './FormTextarea'
import ModernSelect from './ModernSelect'
import FormFieldCurrency from './FormFieldCurrency'
import FormFieldPercent from './FormFieldPercent'
import { getValuationColor } from '@/utils/quickValuation'
import { useTranslations, useLocale } from 'next-intl'
import ValuationResultModal from './ValuationResultModal'

interface ValuationData {
  // Step 1: Grunduppgifter
  email: string
  companyName: string
  website: string
  orgNumber: string
  industry: string
  
  // Step 2: Finansiell data
  revenue: string
  revenue3Years: string
  profitMargin: string
  ebitda: string
  grossMargin: string
  revenueGrowthRate: string
  recurringRevenuePercentage: string
  
  // Step 3: Kostnadsstruktur
  salaries: string
  rentCosts: string
  marketingCosts: string
  otherOperatingCosts: string
  cogs: string
  
  // Step 4: Tillgångar & Skulder
  totalAssets: string
  totalLiabilities: string
  cash: string
  accountsReceivable: string
  inventory: string
  equipment: string
  realEstate: string
  intangibleAssets: string
  shortTermDebt: string
  longTermDebt: string
  
  // Step 5: Affärsmodell & Kunder
  customerCount: string
  averageCustomerValue: string
  customerChurnRate: string
  customerConcentrationRisk: string
  contractLength: string
  paymentTerms: string
  
  // Step 6: Marknad & Position
  marketSize: string
  marketShare: string
  competitiveAdvantages: string
  mainCompetitors: string
  geographicReach: string
  
  // Step 7: Organisation & Risker
  employees: string
  keyEmployeeDependency: string
  companyAge: string
  ownerInvolvement: string
  majorRisks: string
  regulatoryLicenses: string
  
  // Step 8: Framtidsutsikter
  growthPotential: string
  expansionPlans: string
  investmentNeeds: string
  exitStrategy: string
  
  [key: string]: string | number | undefined
}

interface WizardProps {
  onClose?: () => void
  variant?: 'modal' | 'page'
}

export default function ImprovedValuationWizard({ onClose, variant = 'modal' }: WizardProps) {

const steps = [
  { id: 1, title: 'Grunduppgifter', icon: Building, description: 'Företagets basinfo' },
  { id: 2, title: 'Finansiell data', icon: TrendingUp, description: 'Omsättning & lönsamhet' },
  { id: 3, title: 'Kostnader', icon: CreditCard, description: 'Kostnadsstruktur' },
  { id: 4, title: 'Tillgångar', icon: Package, description: 'Balansräkning' },
  { id: 5, title: 'Kunder', icon: Users, description: 'Kundbas & affärsmodell' },
  { id: 6, title: 'Marknad', icon: Globe, description: 'Position & konkurrens' },
  { id: 7, title: 'Organisation', icon: Shield, description: 'Team & risker' },
  { id: 8, title: 'Framtid', icon: ChartLine, description: 'Tillväxtpotential' }
]

const INDUSTRY_MULTIPLIERS: Record<string, { base: number; spread: number }> = {
  restaurang: { base: 3, spread: 0.25 },
  ehandel: { base: 4, spread: 0.25 },
  webbtjanster: { base: 6, spread: 0.3 },
  konsult: { base: 4.5, spread: 0.2 },
  tillverkning: { base: 5, spread: 0.2 },
  handel: { base: 3.5, spread: 0.25 },
  bygg: { base: 4.2, spread: 0.25 },
  transport: { base: 4, spread: 0.25 },
  it: { base: 6.2, spread: 0.3 },
  halsa: { base: 5.2, spread: 0.2 },
  utbildning: { base: 4.1, spread: 0.2 },
  other: { base: 4.5, spread: 0.25 },
}

type DemoValuationProfile = {
  label: string
  data: Partial<ValuationData>
}

const demoValuationProfiles: DemoValuationProfile[] = [
  {
    label: 'Nimbus Analytics (SaaS)',
    data: {
      email: 'demo+saas@trestorgroup.se',
      companyName: 'Nimbus Analytics AB',
      website: 'https://nimbusanalytics.se',
      orgNumber: '5591234567',
      industry: 'webbtjanster',
      revenue: '42000000',
      revenue3Years: '36000000',
      profitMargin: '18',
      ebitda: '7560000',
      grossMargin: '72',
      revenueGrowthRate: '22',
      recurringRevenuePercentage: '88',
      salaries: '17000000',
      rentCosts: '1200000',
      marketingCosts: '3200000',
      otherOperatingCosts: '2600000',
      cogs: '11800000',
      totalAssets: '22000000',
      totalLiabilities: '8000000',
      cash: '3500000',
      accountsReceivable: '4800000',
      inventory: '0',
      equipment: '2400000',
      realEstate: '0',
      intangibleAssets: '3200000',
      shortTermDebt: '1500000',
      longTermDebt: '5000000',
      customerCount: '120',
      averageCustomerValue: '350000',
      customerChurnRate: '4',
      customerConcentrationRisk: 'medium',
      contractLength: 'multi-year',
      paymentTerms: '30-days',
      marketSize: '1500000000',
      marketShare: '2',
      competitiveAdvantages: 'Egen AI-plattform, ISO 27001 och 98% kundförnyelse.',
      mainCompetitors: 'Planhat, Funnel samt interna BI-team.',
      geographicReach: 'Sverige, Norge och Finland.',
      employees: '32',
      keyEmployeeDependency: 'medium',
      companyAge: '8',
      ownerInvolvement: 'strategic',
      majorRisks: 'Tekniskt beroende av CTO och få enterprise-kunder står för 40% av intäkterna.',
      regulatoryLicenses: 'SOC2 under införande, ISO 27001 certifierad.',
      growthPotential: 'high',
      expansionPlans: 'Lansera i DACH-regionen, bygga partnernätverk och dubbla ARR inom 24 månader.',
      investmentNeeds: '30000000',
      exitStrategy: 'strategic'
    }
  },
  {
    label: 'Nordic Precision Manufacturing',
    data: {
      email: 'demo+manufacturing@trestorgroup.se',
      companyName: 'Nordic Precision Manufacturing AB',
      website: 'https://npm.se',
      orgNumber: '5567788990',
      industry: 'tillverkning',
      revenue: '68000000',
      revenue3Years: '62000000',
      profitMargin: '14',
      ebitda: '9520000',
      grossMargin: '38',
      revenueGrowthRate: '9',
      recurringRevenuePercentage: '35',
      salaries: '24000000',
      rentCosts: '2800000',
      marketingCosts: '1800000',
      otherOperatingCosts: '3200000',
      cogs: '42160000',
      totalAssets: '52000000',
      totalLiabilities: '22000000',
      cash: '4200000',
      accountsReceivable: '8600000',
      inventory: '9000000',
      equipment: '14500000',
      realEstate: '18000000',
      intangibleAssets: '2500000',
      shortTermDebt: '3200000',
      longTermDebt: '14000000',
      customerCount: '48',
      averageCustomerValue: '1400000',
      customerChurnRate: '6',
      customerConcentrationRisk: 'medium',
      contractLength: 'yearly',
      paymentTerms: '60-days',
      marketSize: '2500000000',
      marketShare: '3',
      competitiveAdvantages: 'ISO 9001/14001, robotiserade celler och egen produktutveckling.',
      mainCompetitors: 'Lokala verkstäder och lågkostnadsproducenter i Baltikum.',
      geographicReach: 'Sverige och Norge, export till Tyskland.',
      employees: '68',
      keyEmployeeDependency: 'medium',
      companyAge: '15',
      ownerInvolvement: 'operational',
      majorRisks: 'Stålpris-volatilitet och beroende av två fordonskunder.',
      regulatoryLicenses: 'ISO 9001, 14001 och svetscertifikat enligt EN 1090.',
      growthPotential: 'moderate',
      expansionPlans: 'Automatisera ytterligare två linjer och etablera säljkontor i Danmark.',
      investmentNeeds: '18000000',
      exitStrategy: 'financial'
    }
  },
  {
    label: 'CityCare Kliniken',
    data: {
      email: 'demo+care@trestorgroup.se',
      companyName: 'CityCare Kliniken AB',
      website: 'https://citycarekliniken.se',
      orgNumber: '5561122334',
      industry: 'halsa',
      revenue: '22000000',
      revenue3Years: '19000000',
      profitMargin: '21',
      ebitda: '4620000',
      grossMargin: '58',
      revenueGrowthRate: '11',
      recurringRevenuePercentage: '62',
      salaries: '9800000',
      rentCosts: '2200000',
      marketingCosts: '900000',
      otherOperatingCosts: '1200000',
      cogs: '9240000',
      totalAssets: '18000000',
      totalLiabilities: '6000000',
      cash: '2600000',
      accountsReceivable: '3100000',
      inventory: '450000',
      equipment: '5200000',
      realEstate: '0',
      intangibleAssets: '1300000',
      shortTermDebt: '800000',
      longTermDebt: '4200000',
      customerCount: '6200',
      averageCustomerValue: '3200',
      customerChurnRate: '8',
      customerConcentrationRisk: 'low',
      contractLength: 'yearly',
      paymentTerms: 'advance',
      marketSize: '900000000',
      marketShare: '1',
      competitiveAdvantages: 'Multidisciplinärt team, abonnemangsmodell och korta väntetider.',
      mainCompetitors: 'MinDoktor, Kry och lokala specialistkliniker.',
      geographicReach: 'Stockholm huvudclinic, digital vård nationellt.',
      employees: '22',
      keyEmployeeDependency: 'low',
      companyAge: '9',
      ownerInvolvement: 'strategic',
      majorRisks: 'Behöver säkra fler specialistläkare och hantera regionavtal.',
      regulatoryLicenses: 'IVO-tillstånd, regionavtal och ISO 13485-processer.',
      growthPotential: 'high',
      expansionPlans: 'Öppna satellitklinik i Malmö och lansera digital abonnemangstjänst.',
      investmentNeeds: '12000000',
      exitStrategy: 'strategic'
    }
  }
]

function truncateString(value: string | undefined, maxLength = 500) {
  if (!value || typeof value !== 'string') return value ?? ''
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value
}

function buildSlimEnrichedData(data: any) {
  if (!data || typeof data !== 'object') return null

  const slim: Record<string, any> = {}

  if (data.autoFill) {
    slim.autoFill = data.autoFill
  }

  const rawDataSource = data.rawData || {}
  const whitelistedRawKeys = [
    'bolagsverketData',
    'scbData',
    'proffData',
    'ratsitData',
    'linkedinData',
    'trustpilotData'
  ] as const

  const slimRawData: Record<string, any> = {}

  whitelistedRawKeys.forEach((key) => {
    if (rawDataSource?.[key]) {
      slimRawData[key] = rawDataSource[key]
    }
  })

  if (rawDataSource?.webSearchData) {
    slimRawData.webSearchData = {
      mainWebsite: rawDataSource.webSearchData.mainWebsite ?? null,
      notes: truncateString(rawDataSource.webSearchData.notes, 500),
      notableSources: (rawDataSource.webSearchData.notableSources || []).slice(0, 3)
    }
  }

  if (rawDataSource?.googleMyBusinessData) {
    slimRawData.googleMyBusinessData = {
      rating: rawDataSource.googleMyBusinessData.rating ?? null
    }
  }

  if (Object.keys(slimRawData).length > 0) {
    slim.rawData = slimRawData
  }

  return Object.keys(slim).length > 0 ? slim : null
}

export default function ImprovedValuationWizard({ onClose }: WizardProps) {
  const router = useRouter()
  const { user, login } = useAuth()
  const t = useTranslations('valuationWizard')
  const locale = useLocale()
  const [currentStep, setCurrentStep] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<ValuationData>({
    email: user?.email || '',
    companyName: '',
    website: '',
    orgNumber: '',
    industry: '',
    revenue: '',
    revenue3Years: '',
    profitMargin: '',
    ebitda: '',
    grossMargin: '',
    revenueGrowthRate: '',
    recurringRevenuePercentage: '',
    salaries: '',
    rentCosts: '',
    marketingCosts: '',
    otherOperatingCosts: '',
    cogs: '',
    totalAssets: '',
    totalLiabilities: '',
    cash: '',
    accountsReceivable: '',
    inventory: '',
    equipment: '',
    realEstate: '',
    intangibleAssets: '',
    shortTermDebt: '',
    longTermDebt: '',
    customerCount: '',
    averageCustomerValue: '',
    customerChurnRate: '',
    customerConcentrationRisk: '',
    contractLength: '',
    paymentTerms: '',
    marketSize: '',
    marketShare: '',
    competitiveAdvantages: '',
    mainCompetitors: '',
    geographicReach: '',
    employees: '',
    keyEmployeeDependency: '',
    companyAge: '',
    ownerInvolvement: '',
    majorRisks: '',
    regulatoryLicenses: '',
    growthPotential: '',
    expansionPlans: '',
    investmentNeeds: '',
    exitStrategy: '',
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichmentStatus, setEnrichmentStatus] = useState('')
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [draftValuationId, setDraftValuationId] = useState<string | null>(null)
  const lastEnrichedOrgNumber = useRef<string | null>(null)
  const lastEnrichedCompanyName = useRef<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [valuationResult, setValuationResult] = useState<any>(null)
  const [autoFillMessage, setAutoFillMessage] = useState<string | null>(null)
  
  const progress = (currentStep / steps.length) * 100

  // Save draft valuation data when privacy policy is accepted
  useEffect(() => {
    const saveDraftValuation = async () => {
      // Only save if privacy is accepted and we have required fields
      if (!acceptedPrivacy || !data.email || !data.companyName || !data.industry) {
        return
      }

      try {
        const totalOperatingCosts = 
          Number(data.salaries || 0) + 
          Number(data.rentCosts || 0) + 
          Number(data.marketingCosts || 0) + 
          Number(data.otherOperatingCosts || 0)
        
        const submitData = {
          ...data,
          operatingCosts: totalOperatingCosts.toString(),
          ebitda: data.ebitda || (
            Number(data.revenue || 0) * Number(data.profitMargin || 0) / 100
          ).toString()
        }

        if (draftValuationId) {
          // Update existing draft
          await fetch('/api/valuation/draft', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              valuationId: draftValuationId,
              inputData: submitData
            })
          })
        } else {
          // Create new draft
          const response = await fetch('/api/valuation/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: data.email,
              companyName: data.companyName,
              industry: data.industry,
              inputData: submitData
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            setDraftValuationId(result.valuationId)
          }
        }
      } catch (error) {
        console.error('Error saving draft valuation:', error)
        // Don't show error to user, just log it
      }
    }

    // Debounce save by 2 seconds to avoid too many API calls
    const timer = setTimeout(saveDraftValuation, 2000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedPrivacy, data.email, data.companyName, data.industry, draftValuationId])

  useEffect(() => {
    if (!autoFillMessage) return
    const timer = setTimeout(() => setAutoFillMessage(null), 5000)
    return () => clearTimeout(timer)
  }, [autoFillMessage])

  const updateData = (field: string, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 1:
        if (!data.email) newErrors.email = 'E-post krävs'
        if (!data.companyName) newErrors.companyName = 'Företagsnamn krävs'
        if (!data.industry) newErrors.industry = 'Bransch krävs'
        break
      case 2:
        if (!data.revenue) newErrors.revenue = 'Omsättning krävs'
        if (!data.profitMargin) newErrors.profitMargin = 'Vinstmarginal krävs'
        break
      case 3:
        if (!data.salaries && !data.rentCosts && !data.marketingCosts && !data.otherOperatingCosts) {
          newErrors.costs = 'Minst en kostnadskategori krävs'
        }
        break
      // Övriga steg är valfria för att få en grundläggande värdering
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1)
        scrollRef.current?.scrollTo(0, 0)
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      scrollRef.current?.scrollTo(0, 0)
    }
  }

  const handleEnrichData = async () => {
    const sanitizedOrgNumber = data.orgNumber?.replace(/\D/g, '')
    const normalizedOrgNumber =
      sanitizedOrgNumber && sanitizedOrgNumber.length === 12
        ? sanitizedOrgNumber.slice(-10)
        : sanitizedOrgNumber

    // Vi tillåter enrichment om vi har antingen:
    // - ett giltigt orgnr (10 siffror)
    // - en webbplats
    // - eller ett företagsnamn (minst 3 tecken)
    const hasIdentifier =
      (normalizedOrgNumber && normalizedOrgNumber.length === 10) ||
      !!data.website ||
      !!(data.companyName && data.companyName.trim().length >= 3)

    if (isEnriching || !hasIdentifier) return
    
    setIsEnriching(true)
    setEnrichmentStatus('Hämtar företagsdata...')
    
    try {
      const response = await fetch('/api/enrich-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgNumber: normalizedOrgNumber,
          website: data.website,
          companyName: data.companyName,
          industry: data.industry
        })
      })
      
      if (response.ok) {
        const enrichedData = await response.json()
        
        // Auto-fill fields with enriched data - smart mapping
        const autoFillFields = enrichedData.autoFill || {}
        const newData: Partial<ValuationData> = {}
        
        console.log('Enrichment data received:', {
          companyName: autoFillFields.companyName,
          industry: autoFillFields.industry,
          revenue: autoFillFields.revenue,
          exactRevenue: autoFillFields.exactRevenue,
          revenue2024: autoFillFields.revenue2024,
          revenue2023: autoFillFields.revenue2023,
          revenue2022: autoFillFields.revenue2022,
          profit: autoFillFields.profit,
          employees: autoFillFields.employees,
          companyAge: autoFillFields.companyAge,
          totalAssets: autoFillFields.totalAssets,
          cash: autoFillFields.cash,
          operatingCosts: autoFillFields.operatingCosts,
          allAutoFillFields: Object.keys(autoFillFields),
          allAutoFillValues: autoFillFields,
        })
        
        // Basic info - always fill if available (overwrite existing values)
        // IMPORTANT: Always fill company name from Bolagsverket if available
        if (autoFillFields.companyName) {
          console.log('Filling company name:', autoFillFields.companyName)
          newData.companyName = autoFillFields.companyName
        } else {
          console.warn('No company name in autoFillFields!', { autoFillFields })
        }
        if (autoFillFields.industry) {
          newData.industry = autoFillFields.industry
        }
        if (autoFillFields.address) {
          newData.address = autoFillFields.address
        }
        if (autoFillFields.companyAge) {
          newData.companyAge = autoFillFields.companyAge
        }
        if (autoFillFields.employees) {
          newData.employees = autoFillFields.employees
        }
        
        // Financial data - revenue (prioritize exactRevenue > revenue > revenue2024)
        if (autoFillFields.exactRevenue) {
          newData.revenue = autoFillFields.exactRevenue.toString()
        } else if (autoFillFields.revenue) {
          newData.revenue = autoFillFields.revenue.toString()
        } else if (autoFillFields.revenue2024) {
          newData.revenue = autoFillFields.revenue2024.toString()
        }
        
        // Calculate average revenue from 3 years (always calculate if data available)
        if (autoFillFields.revenue2024 || autoFillFields.revenue2023 || autoFillFields.revenue2022) {
          const revenues = [
            Number(autoFillFields.revenue2024) || 0,
            Number(autoFillFields.revenue2023) || 0,
            Number(autoFillFields.revenue2022) || 0
          ].filter(r => r > 0)
          
          if (revenues.length > 0) {
            const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length
            newData.revenue3Years = Math.round(avgRevenue).toString()
          }
          
          // Calculate revenue growth rate (always calculate if data available)
          if (revenues.length >= 2) {
            const latest = revenues[0]
            const previous = revenues[1]
            if (previous > 0) {
              const growthRate = ((latest - previous) / previous) * 100
              newData.revenueGrowthRate = growthRate.toFixed(1)
            }
          }
        }
        
        // Calculate profit margin from profit and revenue (always calculate if data available)
        if (autoFillFields.profit !== undefined && autoFillFields.profit !== null) {
          const profit = Number(autoFillFields.profit)
          const revenue = Number(autoFillFields.revenue || autoFillFields.exactRevenue || autoFillFields.revenue2024 || 0)
          if (revenue > 0) {
            const profitMargin = (profit / revenue) * 100
            newData.profitMargin = profitMargin.toFixed(1)
            console.log('Calculated profit margin:', profitMargin, 'from profit:', profit, 'revenue:', revenue)
          } else {
            console.warn('Cannot calculate profit margin: revenue is 0 or missing', { revenue, profit })
          }
        } else {
          console.warn('No profit data available for profit margin calculation', { profit: autoFillFields.profit })
        }
        
        // EBITDA - try to calculate or use provided value (always calculate if data available)
        if (autoFillFields.ebitda) {
          newData.ebitda = autoFillFields.ebitda.toString()
        } else if (autoFillFields.profit !== undefined && autoFillFields.profit !== null) {
          // Estimate EBITDA as profit + estimated depreciation/amortization (typically 2-5% of revenue)
          const profit = Number(autoFillFields.profit)
          const revenue = Number(autoFillFields.revenue || autoFillFields.exactRevenue || autoFillFields.revenue2024 || 0)
          if (revenue > 0) {
            const estimatedEBITDA = profit + (revenue * 0.03) // Assume 3% depreciation
            if (estimatedEBITDA > 0) {
              newData.ebitda = Math.round(estimatedEBITDA).toString()
              console.log('Calculated EBITDA:', estimatedEBITDA, 'from profit:', profit, 'revenue:', revenue)
            }
          }
        }
        
        // Balance sheet data - always fill if available
        if (autoFillFields.totalAssets) {
          newData.totalAssets = autoFillFields.totalAssets.toString()
        }
        if (autoFillFields.totalLiabilities) {
          newData.totalLiabilities = autoFillFields.totalLiabilities.toString()
        }
        if (autoFillFields.cash) {
          newData.cash = autoFillFields.cash.toString()
        }
        if (autoFillFields.accountsReceivable) {
          newData.accountsReceivable = autoFillFields.accountsReceivable.toString()
        }
        if (autoFillFields.inventory) {
          newData.inventory = autoFillFields.inventory.toString()
        }
        if (autoFillFields.shortTermDebt) {
          newData.shortTermDebt = autoFillFields.shortTermDebt.toString()
        }
        if (autoFillFields.longTermDebt) {
          newData.longTermDebt = autoFillFields.longTermDebt.toString()
        }
        
        // Equity - useful for substance valuation (always fill if available)
        if (autoFillFields.equity) {
          // Store equity - can be used for calculations even if not directly shown in wizard
          // Note: equity field might not exist in ValuationData interface, but we can use it for calculations
        }
        
        // Estimate equipment, real estate, and intangible assets from total assets if available
        // These are typically not in Bolagsverket data, but we can estimate based on industry
        if (autoFillFields.totalAssets && !newData.equipment && !newData.realEstate && !newData.intangibleAssets) {
          const totalAssets = Number(autoFillFields.totalAssets)
          if (totalAssets > 0) {
            // Rough estimates based on typical SME balance sheets:
            // - Equipment: 20-30% of total assets
            // - Real estate: 30-40% of total assets (if owned)
            // - Intangible assets: 5-10% of total assets
            // Note: These are estimates and should be verified by user
            const estimatedEquipment = totalAssets * 0.25
            const estimatedRealEstate = totalAssets * 0.35
            const estimatedIntangible = totalAssets * 0.075
            
            // Only fill if reasonable values (not too small)
            if (estimatedEquipment > 100000) {
              newData.equipment = Math.round(estimatedEquipment).toString()
            }
            if (estimatedRealEstate > 100000) {
              newData.realEstate = Math.round(estimatedRealEstate).toString()
            }
            if (estimatedIntangible > 50000) {
              newData.intangibleAssets = Math.round(estimatedIntangible).toString()
            }
          }
        }
        
        // Calculate COGS if we have revenue and gross margin
        // COGS = Revenue * (1 - Gross Margin / 100)
        if (autoFillFields.revenue && autoFillFields.grossMargin) {
          const revenue = Number(autoFillFields.revenue || autoFillFields.exactRevenue || autoFillFields.revenue2024 || 0)
          const grossMarginPercent = Number(autoFillFields.grossMargin)
          if (revenue > 0 && grossMarginPercent > 0) {
            const cogs = revenue * (1 - grossMarginPercent / 100)
            newData.cogs = Math.round(cogs).toString()
          }
        } else if (autoFillFields.revenue && !newData.cogs) {
          // Estimate COGS as 50% of revenue if no gross margin available (industry average)
          const revenue = Number(autoFillFields.revenue || autoFillFields.exactRevenue || autoFillFields.revenue2024 || 0)
          if (revenue > 0) {
            newData.cogs = Math.round(revenue * 0.5).toString()
          }
        }
        
        // Operating costs breakdown (always fill if available)
        if (autoFillFields.operatingCosts) {
          // Try to estimate breakdown if we have total operating costs
          const totalOps = Number(autoFillFields.operatingCosts)
          // Typical breakdown: salaries 60%, rent 15%, marketing 10%, other 15%
          if (totalOps > 0) {
            newData.salaries = Math.round(totalOps * 0.6).toString()
            newData.rentCosts = Math.round(totalOps * 0.15).toString()
            newData.marketingCosts = Math.round(totalOps * 0.1).toString()
            newData.otherOperatingCosts = Math.round(totalOps * 0.15).toString()
          }
        }
        
        // Estimate gross margin if we have revenue and operating costs (always calculate if data available)
        if (autoFillFields.revenue && autoFillFields.operatingCosts) {
          const revenue = Number(autoFillFields.revenue || autoFillFields.exactRevenue || autoFillFields.revenue2024 || 0)
          const opsCosts = Number(autoFillFields.operatingCosts)
          if (revenue > 0) {
            // Gross margin = (Revenue - COGS) / Revenue
            // Estimate COGS as 40-60% of revenue depending on industry
            const estimatedCOGS = revenue * 0.5 // Default 50%
            const grossMargin = ((revenue - estimatedCOGS) / revenue) * 100
            newData.grossMargin = grossMargin.toFixed(1)
          }
        }
        
        // Customer concentration risk (always fill if available)
        if (autoFillFields.customerConcentrationRisk) {
          newData.customerConcentrationRisk = autoFillFields.customerConcentrationRisk
        }
        
        // Payment terms (always fill if available)
        if (autoFillFields.paymentTerms) {
          newData.paymentTerms = autoFillFields.paymentTerms
        }
        
        // Regulatory licenses (always fill if available)
        if (autoFillFields.regulatoryLicenses) {
          newData.regulatoryLicenses = autoFillFields.regulatoryLicenses
        }
        
        // Competitive advantages (always fill if available)
        if (autoFillFields.competitiveAdvantage) {
          newData.competitiveAdvantages = autoFillFields.competitiveAdvantage
        }
        
        // Update state with all new data
        const fieldsFilled = Object.keys(newData).filter(key => newData[key as keyof ValuationData] !== undefined && newData[key as keyof ValuationData] !== '')
        console.log('Fields to be filled:', fieldsFilled)
        console.log('New data values:', newData)
        console.log('Company name specifically:', {
          inAutoFill: autoFillFields.companyName,
          inNewData: newData.companyName,
          willBeSet: !!newData.companyName
        })
        console.log('Total fields available from API:', Object.keys(autoFillFields).length)
        console.log('All autoFillFields:', autoFillFields)
        
        setData(prev => {
          const updated = { ...prev, ...newData }
          console.log('Data after update:', {
            companyName: updated.companyName,
            industry: updated.industry,
            address: updated.address
          })
          return updated
        })
        
        // Store enriched data for later use
        if (enrichedData.enrichedCompanyData) {
          localStorage.setItem('enrichedCompanyData', JSON.stringify(enrichedData.enrichedCompanyData))
        }
        
        // Store raw enriched data for valuation API
        localStorage.setItem('enrichedCompanyData', JSON.stringify(enrichedData))
        
        // Create a more detailed status message showing which steps were filled
        const filledCount = fieldsFilled.length
        const keyFields: string[] = []
        const stepsFilled: number[] = []
        
        // Step 1 fields
        if (newData.companyName) {
          keyFields.push('företagsnamn')
          if (!stepsFilled.includes(1)) stepsFilled.push(1)
        }
        if (newData.industry) {
          keyFields.push('bransch')
          if (!stepsFilled.includes(1)) stepsFilled.push(1)
        }
        if (newData.companyAge) {
          keyFields.push('företagsålder')
          if (!stepsFilled.includes(1)) stepsFilled.push(1)
        }
        if (newData.employees) {
          keyFields.push('anställda')
          if (!stepsFilled.includes(7)) stepsFilled.push(7)
        }
        
        // Step 2 fields
        if (newData.revenue) {
          keyFields.push('omsättning')
          if (!stepsFilled.includes(2)) stepsFilled.push(2)
        }
        if (newData.profitMargin) {
          if (!stepsFilled.includes(2)) stepsFilled.push(2)
        }
        if (newData.ebitda) {
          if (!stepsFilled.includes(2)) stepsFilled.push(2)
        }
        
        // Step 3 fields
        if (newData.salaries || newData.rentCosts || newData.marketingCosts) {
          if (!stepsFilled.includes(3)) stepsFilled.push(3)
        }
        
        // Step 4 fields
        if (newData.totalAssets || newData.cash || newData.accountsReceivable) {
          if (!stepsFilled.includes(4)) stepsFilled.push(4)
        }
        
        // Step 5 fields
        if (newData.customerConcentrationRisk || newData.paymentTerms) {
          if (!stepsFilled.includes(5)) stepsFilled.push(5)
        }
        
        // Step 6 fields
        if (newData.competitiveAdvantages) {
          if (!stepsFilled.includes(6)) stepsFilled.push(6)
        }
        
        // Step 7 fields
        if (newData.regulatoryLicenses) {
          if (!stepsFilled.includes(7)) stepsFilled.push(7)
        }
        
        const stepsText = stepsFilled.length > 0 
          ? ` (Steg ${stepsFilled.sort((a, b) => a - b).join(', ')})`
          : ''
        
        const statusMessage = filledCount > 0
          ? `Data hämtad! ${filledCount} fält ifyllda automatiskt${stepsText}${keyFields.length > 0 ? ` - ${keyFields.join(', ')}` : ''}.`
          : 'Data hämtad men inga nya fält kunde fyllas i.'
        
        setEnrichmentStatus(statusMessage)
        setTimeout(() => setEnrichmentStatus(''), 8000) // Show longer since it has more info
      }
    } catch (error) {
      console.error('Enrichment error:', error)
      setEnrichmentStatus('Kunde inte hämta data')
    } finally {
      setIsEnriching(false)
    }
  }

  const handleFillDemoData = () => {
    if (!demoValuationProfiles.length) return
    const profile = demoValuationProfiles[Math.floor(Math.random() * demoValuationProfiles.length)]
    if (!profile) return

    setData(prev => ({
      ...prev,
      ...profile.data,
      email: user?.email || prev.email || profile.data.email || ''
    }))
    setAcceptedPrivacy(true)
    setErrors({})
    setEnrichmentStatus('')
    setAutoFillMessage(`Fyllde i ${profile.label}`)
  }

  useEffect(() => {
    const orgNumberRaw = data.orgNumber?.replace(/\D/g, '')
    const normalizedOrgNumber =
      orgNumberRaw && orgNumberRaw.length === 12 ? orgNumberRaw.slice(-10) : orgNumberRaw

    const companyNameTrimmed = data.companyName?.trim() || ''

    // 1) Auto-trigger på giltigt orgnr (10 siffror)
    if (
      normalizedOrgNumber &&
      normalizedOrgNumber.length === 10 &&
      !isEnriching &&
      normalizedOrgNumber !== lastEnrichedOrgNumber.current
    ) {
      console.log('Org number detected, will fetch data in 1 second:', normalizedOrgNumber)

      const timer = setTimeout(() => {
        lastEnrichedOrgNumber.current = normalizedOrgNumber
        lastEnrichedCompanyName.current = companyNameTrimmed || null
        handleEnrichData()
      }, 1000) // Debounce 1 second after typing stops

      return () => clearTimeout(timer)
    }

    // 2) Om inget orgnr: auto-trigger baserat på företagsnamn (minst 3 tecken)
    if (
      (!normalizedOrgNumber || normalizedOrgNumber.length < 10) &&
      companyNameTrimmed.length >= 3 &&
      !isEnriching &&
      companyNameTrimmed !== lastEnrichedCompanyName.current
    ) {
      console.log('Company name detected, will fetch data in 1 second:', companyNameTrimmed)

      const timer = setTimeout(() => {
        lastEnrichedOrgNumber.current = null
        lastEnrichedCompanyName.current = companyNameTrimmed
        handleEnrichData()
      }, 1000)

      return () => clearTimeout(timer)
    }

    // Reset refs när fälten rensas
    if (!normalizedOrgNumber || normalizedOrgNumber.length < 10) {
      lastEnrichedOrgNumber.current = null
    }
    if (!companyNameTrimmed) {
      lastEnrichedCompanyName.current = null
    }
  }, [data.orgNumber, data.companyName, isEnriching])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Auto-create account if needed
      if (!user && data.email && acceptedPrivacy) {
        try {
          await login(data.email, 'seller', acceptedPrivacy)
        } catch (error) {
          console.error('Auto account creation failed:', error)
        }
      }
      
      // Calculate total operating costs
      const totalOperatingCosts = 
        Number(data.salaries || 0) + 
        Number(data.rentCosts || 0) + 
        Number(data.marketingCosts || 0) + 
        Number(data.otherOperatingCosts || 0)
      
      // Prepare submission data
      const submitData = {
        ...data,
        operatingCosts: totalOperatingCosts.toString(),
        // Ensure we have EBITDA or calculate it
        ebitda: data.ebitda || (
          Number(data.revenue || 0) * Number(data.profitMargin || 0) / 100
        ).toString()
      }
      
      // Save to localStorage
      localStorage.setItem('valuationData', JSON.stringify(submitData))
      
      // Get enriched company data from localStorage and slim it down before sending
      let slimEnrichedData: any = null
      try {
        const enrichedDataStr = localStorage.getItem('enrichedCompanyData')
        const enrichedData = enrichedDataStr ? JSON.parse(enrichedDataStr) : null
        slimEnrichedData = buildSlimEnrichedData(enrichedData)
      } catch (error) {
        console.warn('Failed to parse enriched company data. Continuing without it.', error)
      }
      
      // Call valuation API
      const response = await fetch('/api/valuation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...submitData,
          enrichedCompanyData: slimEnrichedData
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate valuation')
      }
      
      const { result } = await response.json()
      
      // Show result modal
      setValuationResult(result)
      setShowResult(true)
      
    } catch (error) {
      console.error('Valuation error:', error)
      // Fallback: navigate to results page
      router.push(`/${locale}/vardering/resultat`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-primary-navy mb-2">Grundläggande information</h2>
              <p className="text-gray-600">Låt oss börja med det mest grundläggande om ditt företag</p>
            </div>
            
            <FormField
              label="Din e-postadress"
              type="email"
              value={data.email}
              onValueChange={(value) => updateData('email', value)}
              placeholder="din@email.com"
              required
              error={errors.email}
            />
            
            <FormField
              label="Organisationsnummer (valfritt)"
              value={data.orgNumber}
              onValueChange={(value) => updateData('orgNumber', value)}
              placeholder="556123-4567"
              tooltip="Vi hämtar automatiskt offentlig data"
            />
            
            <FormField
              label="Företagsnamn"
              value={data.companyName}
              onValueChange={(value) => updateData('companyName', value)}
              placeholder="AB Exempel"
              required
              error={errors.companyName}
            />
            
            <ModernSelect
              label="Bransch"
              options={industries}
              value={data.industry}
              onChange={(value) => updateData('industry', value)}
              placeholder="Välj bransch"
              required
              searchable
              error={errors.industry}
            />
            
            <FormField
              label="Webbplats"
              value={data.website}
              onValueChange={(value) => updateData('website', value)}
              placeholder="www.exempel.se"
            />
            
            {enrichmentStatus && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                {enrichmentStatus}
              </div>
            )}
          </div>
        )
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-primary-navy mb-2">Finansiell information</h2>
              <p className="text-gray-600">Hjälp oss förstå företagets ekonomiska ställning</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormFieldCurrency
                label="Årlig omsättning (SEK)"
                value={data.revenue}
                onChange={(value) => updateData('revenue', value)}
                placeholder="10 000 000"
                required
              />
              
              <FormFieldCurrency
                label="Genomsnittlig omsättning senaste 3 åren"
                value={data.revenue3Years}
                onChange={(value) => updateData('revenue3Years', value)}
                placeholder="8 000 000"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormFieldPercent
                label="Vinstmarginal (%)"
                value={data.profitMargin}
                onChange={(value) => updateData('profitMargin', value)}
                placeholder="15"
                required
                helpText="Vinst efter alla kostnader / omsättning"
              />
              
              <FormFieldPercent
                label="Bruttomarginal (%)"
                value={data.grossMargin}
                onChange={(value) => updateData('grossMargin', value)}
                placeholder="40"
                helpText="(Omsättning - direkta kostnader) / omsättning"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormFieldCurrency
                label="EBITDA (SEK)"
                value={data.ebitda}
                onChange={(value) => updateData('ebitda', value)}
                placeholder="2 000 000"
                helpText="Resultat före räntor, skatt och avskrivningar"
              />
              
              <FormFieldPercent
                label="Årlig tillväxttakt (%)"
                value={data.revenueGrowthRate}
                onChange={(value) => updateData('revenueGrowthRate', value)}
                placeholder="10"
                helpText="Genomsnittlig årlig tillväxt senaste 3 åren"
              />
            </div>
            
            <FormFieldPercent
              label="Andel återkommande intäkter (%)"
              value={data.recurringRevenuePercentage}
              onChange={(value) => updateData('recurringRevenuePercentage', value)}
              placeholder="60"
              helpText="T.ex. prenumerationer, serviceavtal"
            />
          </div>
        )
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-primary-navy mb-2">Kostnadsstruktur</h2>
              <p className="text-gray-600">Hur ser företagets kostnader ut?</p>
            </div>
            
            {errors.costs && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {errors.costs}
              </div>
            )}
            
            <FormFieldCurrency
              label="Direkta produktionskostnader (COGS)"
              value={data.cogs}
              onChange={(value) => updateData('cogs', value)}
              placeholder="4 000 000"
              helpText="Kostnader direkt kopplade till produktion/försäljning"
            />
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormFieldCurrency
                label="Personalkostnader"
                value={data.salaries}
                onChange={(value) => updateData('salaries', value)}
                placeholder="3 000 000"
                helpText="Löner, sociala avgifter, pensioner"
              />
              
              <FormFieldCurrency
                label="Lokalkostnader"
                value={data.rentCosts}
                onChange={(value) => updateData('rentCosts', value)}
                placeholder="600 000"
                helpText="Hyra, el, värme, städning"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormFieldCurrency
                label="Marknadsföringskostnader"
                value={data.marketingCosts}
                onChange={(value) => updateData('marketingCosts', value)}
                placeholder="400 000"
                helpText="Reklam, PR, events"
              />
              
              <FormFieldCurrency
                label="Övriga rörelsekostnader"
                value={data.otherOperatingCosts}
                onChange={(value) => updateData('otherOperatingCosts', value)}
                placeholder="500 000"
                helpText="IT, försäkringar, konsulter, övrigt"
              />
            </div>
          </div>
        )
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-primary-navy mb-2">Tillgångar & Skulder</h2>
              <p className="text-gray-600">Företagets balansräkning</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                <HelpCircle className="w-4 h-4 inline mr-1" />
                Dessa uppgifter är valfria men ger en mer exakt värdering
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormFieldCurrency
                label="Totala tillgångar"
                value={data.totalAssets}
                onChange={(value) => updateData('totalAssets', value)}
                placeholder="15 000 000"
              />
              
              <FormFieldCurrency
                label="Totala skulder"
                value={data.totalLiabilities}
                onChange={(value) => updateData('totalLiabilities', value)}
                placeholder="5 000 000"
              />
            </div>
            
            <h3 className="font-semibold text-gray-900 mt-8 mb-4">Omsättningstillgångar</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <FormFieldCurrency
                label="Kassa & bank"
                value={data.cash}
                onChange={(value) => updateData('cash', value)}
                placeholder="2 000 000"
              />
              
              <FormFieldCurrency
                label="Kundfordringar"
                value={data.accountsReceivable}
                onChange={(value) => updateData('accountsReceivable', value)}
                placeholder="1 500 000"
              />
              
              <FormFieldCurrency
                label="Lager"
                value={data.inventory}
                onChange={(value) => updateData('inventory', value)}
                placeholder="800 000"
              />
            </div>
            
            <h3 className="font-semibold text-gray-900 mt-8 mb-4">Anläggningstillgångar</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <FormFieldCurrency
                label="Inventarier & utrustning"
                value={data.equipment}
                onChange={(value) => updateData('equipment', value)}
                placeholder="500 000"
              />
              
              <FormFieldCurrency
                label="Fastigheter"
                value={data.realEstate}
                onChange={(value) => updateData('realEstate', value)}
                placeholder="0"
              />
              
              <FormFieldCurrency
                label="Immateriella tillgångar"
                value={data.intangibleAssets}
                onChange={(value) => updateData('intangibleAssets', value)}
                placeholder="200 000"
                helpText="Patent, varumärken, goodwill"
              />
            </div>
            
            <h3 className="font-semibold text-gray-900 mt-8 mb-4">Skulder</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <FormFieldCurrency
                label="Kortfristiga skulder"
                value={data.shortTermDebt}
                onChange={(value) => updateData('shortTermDebt', value)}
                placeholder="2 000 000"
                helpText="Förfaller inom 1 år"
              />
              
              <FormFieldCurrency
                label="Långfristiga skulder"
                value={data.longTermDebt}
                onChange={(value) => updateData('longTermDebt', value)}
                placeholder="3 000 000"
                helpText="Förfaller efter 1 år"
              />
            </div>
          </div>
        )
        
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-primary-navy mb-2">Kundbas & Affärsmodell</h2>
              <p className="text-gray-600">Information om era kunder och intäktsmodell</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                label="Antal kunder"
                value={data.customerCount}
                onValueChange={(value) => updateData('customerCount', value)}
                placeholder="150"
                type="number"
              />
              
              <FormFieldCurrency
                label="Genomsnittligt kundvärde per år"
                value={data.averageCustomerValue}
                onChange={(value) => updateData('averageCustomerValue', value)}
                placeholder="50 000"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormFieldPercent
                label="Kundbortfall per år (%)"
                value={data.customerChurnRate}
                onChange={(value) => updateData('customerChurnRate', value)}
                placeholder="10"
                helpText="Andel kunder som lämnar årligen"
              />
              
              <ModernSelect
                label="Kundkoncentrationsrisk"
                options={[
                  { value: 'low', label: 'Låg', description: 'Ingen kund > 10% av omsättning' },
                  { value: 'medium', label: 'Medel', description: 'Största kund 10-25% av omsättning' },
                  { value: 'high', label: 'Hög', description: 'Största kund > 25% av omsättning' },
                ]}
                value={data.customerConcentrationRisk}
                onChange={(value) => updateData('customerConcentrationRisk', value)}
                placeholder="Välj risknivå"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <ModernSelect
                label="Typisk avtalslängd"
                options={[
                  { value: 'none', label: 'Ingen (löpande)', description: 'Engångsköp eller löpande' },
                  { value: 'monthly', label: 'Månadsvis', description: 'Månadsabonnemang' },
                  { value: 'yearly', label: 'Årsvis', description: 'Ettåriga avtal' },
                  { value: 'multi-year', label: 'Fleråriga', description: '2+ år avtal' },
                ]}
                value={data.contractLength}
                onChange={(value) => updateData('contractLength', value)}
                placeholder="Välj avtalslängd"
              />
              
              <ModernSelect
                label="Betalningsvillkor"
                options={[
                  { value: 'advance', label: 'Förskott', description: 'Betalning i förväg' },
                  { value: 'immediate', label: 'Direkt', description: 'Vid leverans' },
                  { value: '30-days', label: '30 dagar', description: 'Netto 30' },
                  { value: '60-days', label: '60 dagar', description: 'Netto 60' },
                  { value: '90-days', label: '90+ dagar', description: 'Längre kredittid' },
                ]}
                value={data.paymentTerms}
                onChange={(value) => updateData('paymentTerms', value)}
                placeholder="Välj betalningsvillkor"
              />
            </div>
          </div>
        )
        
      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-primary-navy mb-2">Marknadsposition</h2>
              <p className="text-gray-600">Er position på marknaden och konkurrenslandskap</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormFieldCurrency
                label="Total marknadsstorlek (SEK)"
                value={data.marketSize}
                onChange={(value) => updateData('marketSize', value)}
                placeholder="500 000 000"
                helpText="Uppskattad total marknad i Sverige"
              />
              
              <FormFieldPercent
                label="Er marknadsandel (%)"
                value={data.marketShare}
                onChange={(value) => updateData('marketShare', value)}
                placeholder="2"
              />
            </div>
            
            <FormTextarea
              label="Konkurrensfördelar"
              value={data.competitiveAdvantages}
              onChange={(event) => updateData('competitiveAdvantages', event.target.value)}
              placeholder="Beskriv vad som gör ert företag unikt (t.ex. patent, exklusiva avtal, starka varumärken)"
              rows={3}
            />
            
            <FormTextarea
              label="Huvudkonkurrenter"
              value={data.mainCompetitors}
              onChange={(event) => updateData('mainCompetitors', event.target.value)}
              placeholder="Lista era 3-5 största konkurrenter"
              rows={2}
            />
            
            <ModernSelect
              label="Geografisk räckvidd"
              options={[
                { value: 'local', label: 'Lokal', description: 'En stad/kommun' },
                { value: 'regional', label: 'Regional', description: 'Ett län/region' },
                { value: 'national', label: 'Nationell', description: 'Hela Sverige' },
                { value: 'nordic', label: 'Nordisk', description: 'Norden' },
                { value: 'international', label: 'Internationell', description: 'Global närvaro' },
              ]}
              value={data.geographicReach}
              onChange={(value) => updateData('geographicReach', value)}
              placeholder="Välj räckvidd"
            />
          </div>
        )
        
      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-primary-navy mb-2">Organisation & Risker</h2>
              <p className="text-gray-600">Information om företagets struktur och potentiella risker</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                label="Antal anställda"
                value={data.employees}
                onValueChange={(value) => updateData('employees', value)}
                placeholder="25"
                type="number"
              />
              
              <FormField
                label="Företagets ålder (år)"
                value={data.companyAge}
                onValueChange={(value) => updateData('companyAge', value)}
                placeholder="15"
                type="number"
              />
            </div>
            
            <ModernSelect
              label="Nyckelpersonsberoende"
              options={[
                { value: 'low', label: 'Lågt', description: 'Väl dokumenterade processer, flera kan ta över' },
                { value: 'medium', label: 'Medel', description: 'Vissa nyckelpersoner viktiga' },
                { value: 'high', label: 'Högt', description: 'Mycket beroende av 1-2 personer' },
              ]}
              value={data.keyEmployeeDependency}
              onChange={(value) => updateData('keyEmployeeDependency', value)}
              placeholder="Välj beroende"
              helperText="Hur beroende är företaget av specifika personer?"
            />
            
            <ModernSelect
              label="Ägarens involvering i daglig drift"
              options={[
                { value: 'passive', label: 'Passiv', description: 'Styrelsearbete endast' },
                { value: 'strategic', label: 'Strategisk', description: 'Strategiska beslut, inte daglig drift' },
                { value: 'operational', label: 'Operativ', description: 'Delaktig i daglig drift' },
                { value: 'critical', label: 'Kritisk', description: 'Central för daglig drift' },
              ]}
              value={data.ownerInvolvement}
              onChange={(value) => updateData('ownerInvolvement', value)}
              placeholder="Välj involvering"
            />
            
            <FormTextarea
              label="Större risker eller utmaningar"
              value={data.majorRisks}
              onChange={(event) => updateData('majorRisks', event.target.value)}
              placeholder="Beskriv eventuella större risker (t.ex. beroendet av leverantörer, regeländringar, teknologiskiften)"
              rows={3}
            />
            
            <FormTextarea
              label="Tillstånd och licenser"
              value={data.regulatoryLicenses}
              onChange={(event) => updateData('regulatoryLicenses', event.target.value)}
              placeholder="Lista viktiga tillstånd eller licenser som krävs för verksamheten"
              rows={2}
            />
          </div>
        )
        
      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-primary-navy mb-2">Framtidsutsikter</h2>
              <p className="text-gray-600">Potential och planer för företagets framtid</p>
            </div>
            
            <ModernSelect
              label="Tillväxtpotential"
              options={[
                { value: 'limited', label: 'Begränsad', description: '0-5% årlig tillväxt' },
                { value: 'moderate', label: 'Måttlig', description: '5-15% årlig tillväxt' },
                { value: 'high', label: 'Hög', description: '15-30% årlig tillväxt' },
                { value: 'very-high', label: 'Mycket hög', description: '>30% årlig tillväxt' },
              ]}
              value={data.growthPotential}
              onChange={(value) => updateData('growthPotential', value)}
              placeholder="Välj tillväxtpotential"
            />
            
            <FormTextarea
              label="Expansionsplaner"
              value={data.expansionPlans}
              onChange={(event) => updateData('expansionPlans', event.target.value)}
              placeholder="Beskriv planerade expansioner (nya marknader, produkter, kanaler)"
              rows={3}
            />
            
            <FormFieldCurrency
              label="Investeringsbehov kommande 2 år"
              value={data.investmentNeeds}
              onChange={(value) => updateData('investmentNeeds', value)}
              placeholder="2 000 000"
              helpText="För planerad tillväxt och utveckling"
            />
            
            <ModernSelect
              label="Önskad exitstrategi"
              options={[
                { value: 'strategic', label: 'Strategisk köpare', description: 'Branschaktör som kan skapa synergier' },
                { value: 'financial', label: 'Finansiell köpare', description: 'PE-bolag eller investerare' },
                { value: 'competitor', label: 'Konkurrent', description: 'Sammanslagning med konkurrent' },
                { value: 'mbo', label: 'MBO', description: 'Försäljning till ledning/anställda' },
                { value: 'ipo', label: 'Börsnotering', description: 'IPO (om tillräcklig storlek)' },
              ]}
              value={data.exitStrategy}
              onChange={(value) => updateData('exitStrategy', value)}
              placeholder="Välj exitstrategi"
            />
            
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Nästan klar!</h3>
                  <p className="text-sm text-green-800">
                    Vi har nu tillräcklig information för att generera en professionell värdering av ditt företag.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="privacy"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="privacy" className="text-sm text-gray-700">
                Jag accepterar{' '}
                <Link
                  href={`/${locale}/juridiskt/integritetspolicy`}
                  className="text-primary-navy underline"
                >
                  integritetspolicyn
                </Link>{' '}
                och{' '}
                <Link
                  href={`/${locale}/juridiskt/anvandarvillkor`}
                  className="text-primary-navy underline"
                >
                  användarvillkoren
                </Link>
              </label>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  // Quick valuation preview
  const quickValuation = useMemo(() => {
    const revenue = Number(data.revenue) || 0
    const profitMargin = Number(data.profitMargin) || 0
    const ebitda = Number(data.ebitda) || (revenue * profitMargin) / 100

    if (!revenue || !ebitda) {
      return null
    }

    const { base, spread } = INDUSTRY_MULTIPLIERS[data.industry] || { base: 4, spread: 0.25 }
    const margin = revenue > 0 ? ebitda / revenue : 0

    let adjustedMultiple = base
    if (margin >= 0.25) {
      adjustedMultiple += 0.6
    } else if (margin >= 0.15) {
      adjustedMultiple += 0.3
    } else if (margin <= 0.05) {
      adjustedMultiple -= 0.4
    } else if (margin <= 0.1) {
      adjustedMultiple -= 0.2
    }
    adjustedMultiple = Math.max(1.8, adjustedMultiple)

    const midpoint = ebitda * adjustedMultiple
    const valuationPadding = midpoint * spread
    const min = Math.max(midpoint - valuationPadding, ebitda * 1.2)
    const max = midpoint + valuationPadding

    const coverageFields = [
      data.marketSize,
      data.marketShare,
      data.competitiveAdvantages,
      data.mainCompetitors,
      data.geographicReach,
      data.growthPotential,
      data.expansionPlans,
      data.majorRisks,
    ]
    const totalCoverageFields = coverageFields.length || 1
    const filledCoverage = coverageFields.filter(
      (field) => typeof field === 'string' && field.trim().length > 0
    ).length
    const coverageScore = filledCoverage / totalCoverageFields

    let confidence = 0.55 + coverageScore * 0.2

    if (revenue >= 20000000) {
      confidence += 0.05
    } else if (revenue >= 5000000) {
      confidence += 0.03
    }

    if (margin >= 0.2) {
      confidence += 0.07
    }
    if (margin <= 0.08) {
      confidence -= 0.05
    }
    if (margin <= 0.03) {
      confidence -= 0.07
    }

    confidence = Math.max(0.35, Math.min(0.9, confidence))

    return {
      min,
      max,
      midpoint,
      confidence,
    }
  }, [
    data.revenue,
    data.ebitda,
    data.profitMargin,
    data.industry,
    data.marketSize,
    data.marketShare,
    data.competitiveAdvantages,
    data.mainCompetitors,
    data.geographicReach,
    data.growthPotential,
    data.expansionPlans,
    data.majorRisks,
  ])

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-primary-navy">Företagsvärdering</h1>
                <p className="text-gray-600 mt-1">Få en professionell värdering på 5 minuter</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {autoFillMessage && (
                  <span className="text-xs text-green-700">{autoFillMessage}</span>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFillDemoData}
                    disabled={isSubmitting || isEnriching}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-60"
                    style={{ borderColor: '#1F3C58', color: '#1F3C58' }}
                  >
                    Fyll med demo-data
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Steg {currentStep} av {steps.length}
                </span>
                {quickValuation && currentStep >= 2 && (
                  <span className={`text-sm font-medium ${getValuationColor(quickValuation.midpoint)}`}>
                    Preliminär värdering: {quickValuation.min.toLocaleString('sv-SE')} - {quickValuation.max.toLocaleString('sv-SE')} kr
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: '#1F3C58'
                  }}
                />
              </div>
            </div>
            
            {/* Step indicators */}
            <div className="flex items-center justify-between mt-6 overflow-x-auto pb-2">
              {steps.map((step) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id
                
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (step.id < currentStep || (step.id === currentStep - 1)) {
                        setCurrentStep(step.id)
                      }
                    }}
                    disabled={step.id > currentStep}
                    className={`
                      flex flex-col items-center min-w-[80px] p-2 rounded-lg transition-all
                      ${isActive ? 'bg-primary-navy/10' : ''}
                      ${isCompleted ? 'cursor-pointer hover:bg-gray-50' : ''}
                      ${step.id > currentStep ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all
                      ${isActive ? 'bg-primary-navy text-white' : ''}
                      ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? 'text-primary-navy' : 'text-gray-600'}`}>
                      {step.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6" ref={scrollRef}>
            {renderStepContent()}
          </div>
          
          {/* Footer */}
          <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`
                  flex items-center px-6 py-3 rounded-lg font-medium transition-all
                  ${currentStep === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Tillbaka
              </button>
              
              <button
                onClick={handleNext}
                disabled={
                  isSubmitting ||
                  (currentStep === 8 && !acceptedPrivacy) ||
                  (currentStep === 1 && isEnriching)
                }
                className={`
                  flex items-center px-8 py-3 rounded-lg font-medium transition-all
                  ${currentStep === steps.length 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700' 
                    : 'bg-primary-navy text-white hover:bg-primary-navy/90'
                  }
                  ${
                    isSubmitting ||
                    (currentStep === 8 && !acceptedPrivacy) ||
                    (currentStep === 1 && isEnriching)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Genererar värdering...
                  </>
                ) : currentStep === 1 && isEnriching ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Hämtar företagsdata...
                  </>
                ) : currentStep === steps.length ? (
                  <>
                    Få värdering
                    <Sparkles className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    Nästa
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {showResult && valuationResult && (
        <ValuationResultModal
          result={valuationResult}
          inputData={data}
          onClose={() => {
            setShowResult(false)
            onClose()
          }}
        />
      )}
    </>
  )
}
