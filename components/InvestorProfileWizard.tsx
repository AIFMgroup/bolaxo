'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { 
  ArrowRight, 
  ArrowLeft,
  CheckCircle, 
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Globe,
  Linkedin,
  Target,
  Briefcase,
  BarChart3,
  Users,
  Handshake,
  Shield,
  Sparkles,
  Check,
  Loader2,
  ChevronDown
} from 'lucide-react'

// Format number with thousand separators (Swedish format: 1.000.000)
function formatNumber(value: string): string {
  const num = value.replace(/\D/g, '')
  if (!num) return ''
  return Number(num).toLocaleString('sv-SE')
}

// Parse formatted number back to raw number string
function parseFormattedNumber(value: string): string {
  return value.replace(/\./g, '').replace(/\s/g, '')
}

// Custom minimalist dropdown component
function MinimalDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder,
  label
}: { 
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  label?: string 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(o => o.value === value)

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-white/80 mb-2">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-left flex items-center justify-between transition-all duration-200 hover:bg-white/15 focus:outline-none focus:border-white/40"
      >
        <span className={selectedOption ? 'text-white' : 'text-white/40'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-2 bg-navy border border-white/20 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-3 text-left transition-colors duration-150 ${
                  value === option.value 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Formatted number input component
function FormattedNumberInput({
  value,
  onChange,
  placeholder,
  suffix
}: {
  value: string
  onChange: (val: string) => void
  placeholder: string
  suffix?: string
}) {
  const [displayValue, setDisplayValue] = useState(value ? formatNumber(value) : '')

  useEffect(() => {
    if (value) {
      setDisplayValue(formatNumber(value))
    } else {
      setDisplayValue('')
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseFormattedNumber(e.target.value)
    onChange(rawValue)
    setDisplayValue(formatNumber(rawValue))
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
      />
      {suffix && displayValue && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
          {suffix}
        </span>
      )}
    </div>
  )
}

// Types
export interface WizardState {
  // Step 1 - Grunduppgifter
  name: string
  email: string
  phone: string
  country: string
  city: string
  buyerType: string
  orgNo: string
  website: string
  linkedin: string
  // Step 2 - Investerarprofil
  investorDescription: string
  targetTypeText: string
  // Step 3 - Geografi
  regions: string[]
  // Step 4 - Bransch
  branches: string[]
  companyStatus: number[]
  // Step 5 - Storlek
  turnoverMin: string
  turnoverMax: string
  ebitdaMin: string
  ebitdaMax: string
  employeesMin: string
  employeesMax: string
  priceMin: string
  priceMax: string
  investMin: string
  investMax: string
  profitabilityLevels: string[]
  // Step 6 - Ägarandel
  ownership: string[]
  // Step 7 - Deal-preferenser
  situations: string[]
  ownerStay: string
  earnOut: string
  takeOverLoans: string
  // Step 8 - Verifiering
  verificationMethod: string
}

const regions = [
  "Hela Sverige",
  "Stockholm & Mälardalen",
  "Västsverige",
  "Syd",
  "Östra & Småland",
  "Norr & Mitt"
]

const branches = [
  "IT-konsult & utveckling",
  "E-handel/D2C",
  "SaaS & licensmjukvara",
  "Bygg & anläggning",
  "El, VVS & installation",
  "Städ & facility services",
  "Lager, logistik & 3PL",
  "Restaurang & café",
  "Detaljhandel (fysisk)",
  "Grossist/partihandel",
  "Lätt tillverkning/verkstad",
  "Fastighetsservice & förvaltning",
  "Marknadsföring, kommunikation & PR",
  "Ekonomitjänster & redovisning",
  "Hälsa/skönhet (salonger, kliniker, spa)",
  "Gym, fitness & wellness",
  "Event, konferens & upplevelser",
  "Utbildning, kurser & edtech småskaligt",
  "Bilverkstad & fordonsservice",
  "Jord/skog, trädgård & grönyteskötsel"
]

const statusOptions = [
  { id: 1, title: "Ägarens pension/generationsskifte", text: "Stabilt bolag, ägaren vill kliva av." },
  { id: 2, title: "Fokus på annat bolag/projekt", text: "Verksamheten mår bra men tiden räcker inte." },
  { id: 3, title: "Tillväxtpartner söks / kapitalbehov", text: "Stor potential, ny ägare kan skala snabbare." },
  { id: 4, title: "Strategisk avyttring (icke-kärnverksamhet)", text: "Säljs av koncern/ägare för att renodla." },
  { id: 5, title: "Flytt/ändrad livssituation", text: "Ägaren byter stad/land eller livsstil." },
  { id: 6, title: "Kompetensväxling behövs", text: "Bolaget behöver ny kompetens/ägare för nästa fas." },
  { id: 7, title: "Sjukdom/utbrändhet i ägarled", text: "Tid/kraft saknas för att driva vidare." },
  { id: 8, title: "Marknads-/regelförändringar", text: "Kräver ny ägare med andra resurser eller nätverk." }
]

const situationOptions = [
  "Generationsskifte",
  "Ägare vill trappa ner / gå i pension",
  "Tillväxtkapital",
  "Rekonstruktion/turnaround",
  "Buy-and-build (plattform + förvärv)"
]

const stepMeta = [
  { id: 1, title: "Grunduppgifter", icon: User },
  { id: 2, title: "Investerarprofil", icon: Target },
  { id: 3, title: "Geografisk inriktning", icon: MapPin },
  { id: 4, title: "Bransch & bolagstyp", icon: Building2 },
  { id: 5, title: "Storlek & nyckeltal", icon: BarChart3 },
  { id: 6, title: "Ägarandel & roll", icon: Users },
  { id: 7, title: "Deal-preferenser", icon: Handshake },
  { id: 8, title: "Verifiering", icon: Shield }
]

const initialState: WizardState = {
  name: "",
  email: "",
  phone: "",
  country: "Sverige",
  city: "",
  buyerType: "",
  orgNo: "",
  website: "",
  linkedin: "",
  investorDescription: "",
  targetTypeText: "",
  regions: [],
  branches: [],
  companyStatus: [],
  turnoverMin: "",
  turnoverMax: "",
  ebitdaMin: "",
  ebitdaMax: "",
  employeesMin: "",
  employeesMax: "",
  priceMin: "",
  priceMax: "",
  investMin: "",
  investMax: "",
  profitabilityLevels: [],
  ownership: [],
  situations: [],
  ownerStay: "",
  earnOut: "",
  takeOverLoans: "",
  verificationMethod: ""
}

function isStepComplete(state: WizardState, stepId: number): boolean {
  switch (stepId) {
    case 1:
      return state.name.trim().length > 0 && state.email.trim().length > 0 && state.city.trim().length > 0 && state.buyerType.trim().length > 0
    case 2:
      return state.targetTypeText.trim().length >= 10
    case 3:
      return state.regions.length > 0
    case 4:
      return state.branches.length > 0 && state.companyStatus.length > 0
    case 5:
      return state.turnoverMin.trim() !== "" && state.turnoverMax.trim() !== "" && state.investMin.trim() !== "" && state.investMax.trim() !== "" && state.profitabilityLevels.length > 0
    case 6:
      return state.ownership.length > 0
    case 7:
      return state.situations.length > 0 && !!state.ownerStay && !!state.earnOut && !!state.takeOverLoans
    case 8:
      return !!state.verificationMethod
    default:
      return false
  }
}

interface InvestorProfileWizardProps {
  isDemo?: boolean
  onComplete?: (data: WizardState) => void
  initialData?: Partial<WizardState>
  userEmail?: string
  userName?: string
}

// Helper to convert DB profile to wizard state
function profileToWizardState(profile: any, user?: any): Partial<WizardState> {
  if (!profile) return {}
  
  return {
    name: user?.name || '',
    email: user?.email || '',
    phone: profile.phone || '',
    country: profile.country || 'Sverige',
    city: profile.city || '',
    buyerType: profile.buyerType || '',
    orgNo: profile.orgNo || '',
    website: profile.website || '',
    linkedin: profile.linkedin || '',
    investorDescription: profile.investorDescription || '',
    targetTypeText: profile.targetTypeText || '',
    regions: profile.preferredRegions || [],
    branches: profile.preferredIndustries || [],
    companyStatus: profile.companyStatus || [],
    turnoverMin: profile.revenueMin ? String(profile.revenueMin / 1000000) : '',
    turnoverMax: profile.revenueMax ? String(profile.revenueMax / 1000000) : '',
    ebitdaMin: profile.ebitdaMin ? String(profile.ebitdaMin / 1000000) : '',
    ebitdaMax: profile.ebitdaMax ? String(profile.ebitdaMax / 1000000) : '',
    employeesMin: profile.employeeCountMin ? String(profile.employeeCountMin) : '',
    employeesMax: profile.employeeCountMax ? String(profile.employeeCountMax) : '',
    priceMin: profile.priceMin ? String(profile.priceMin / 1000000) : '',
    priceMax: profile.priceMax ? String(profile.priceMax / 1000000) : '',
    investMin: profile.investMin ? String(profile.investMin) : '',
    investMax: profile.investMax ? String(profile.investMax) : '',
    profitabilityLevels: profile.profitabilityLevels || [],
    ownership: profile.ownership || [],
    situations: profile.situations || [],
    ownerStay: profile.ownerStay || '',
    earnOut: profile.earnOut || '',
    takeOverLoans: profile.takeOverLoans || '',
    verificationMethod: profile.verificationMethod || ''
  }
}

export default function InvestorProfileWizard({ 
  isDemo = false, 
  onComplete,
  initialData,
  userEmail,
  userName
}: InvestorProfileWizardProps) {
  const [state, setState] = useState<WizardState>({
    ...initialState,
    email: userEmail || '',
    name: userName || '',
    ...initialData
  })
  const [activeStep, setActiveStep] = useState(1)
  const [isLoading, setIsLoading] = useState(!isDemo)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Load existing profile data
  useEffect(() => {
    if (isDemo) return
    
    async function loadProfile() {
      try {
        const res = await fetch('/api/investor-profile')
        if (res.ok) {
          const data = await res.json()
          if (data.profile || data.user) {
            const loadedState = profileToWizardState(data.profile, data.user)
            setState(prev => ({ ...prev, ...loadedState }))
            // Set active step based on completed steps
            if (data.profile?.completedSteps) {
              setActiveStep(Math.min(data.profile.completedSteps + 1, 8))
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProfile()
  }, [isDemo])

  // Save profile to API
  const saveProfile = useCallback(async (showMessage = true) => {
    if (isDemo) return
    
    setIsSaving(true)
    try {
      const res = await fetch('/api/investor-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...state,
          completedSteps: activeStep,
          profileComplete: activeStep === 8 && isStepComplete(state, 8)
        })
      })
      
      if (res.ok && showMessage) {
        setSaveMessage('Profil sparad!')
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      if (showMessage) {
        setSaveMessage('Fel vid sparning')
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } finally {
      setIsSaving(false)
    }
  }, [state, activeStep, isDemo])

  const completionMap = useMemo(() => {
    const map: Record<number, boolean> = {}
    stepMeta.forEach(step => {
      map[step.id] = isStepComplete(state, step.id)
    })
    return map
  }, [state])

  const completedCount = useMemo(
    () => Object.values(completionMap).filter(Boolean).length,
    [completionMap]
  )

  const updateField = (field: keyof WizardState, value: string | string[] | number[]) => {
    setState(prev => ({ ...prev, [field]: value }))
  }

  const toggleInArray = (field: keyof WizardState, value: string | number) => {
    setState(prev => {
      const arr = (prev[field] as (string | number)[]) || []
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) }
      }
      return { ...prev, [field]: [...arr, value] }
    })
  }

  const goNext = async () => {
    // Save current step before moving
    await saveProfile(false)
    
    if (activeStep === stepMeta.length) {
      // Final save with completion flag
      await saveProfile(true)
      if (onComplete) {
        onComplete(state)
      }
    } else {
      setActiveStep(s => Math.min(stepMeta.length, s + 1))
    }
  }

  const goPrev = async () => {
    // Save current step before moving
    await saveProfile(false)
    setActiveStep(s => Math.max(1, s - 1))
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy mx-auto mb-4" />
          <p className="text-gray-600">Laddar din investerarprofil...</p>
        </div>
      </div>
    )
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Grunduppgifter</h2>
              <p className="text-white/70">Berätta vem du är och hur vi kan kontakta dig.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">För- och efternamn *</label>
                <input
                  type="text"
                  value={state.name}
                  onChange={e => updateField("name", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="Ditt namn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">E-postadress *</label>
                <input
                  type="email"
                  value={state.email}
                  onChange={e => updateField("email", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="din@email.se"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Mobilnummer</label>
                <input
                  type="tel"
                  value={state.phone}
                  onChange={e => updateField("phone", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="+46 70 123 45 67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Stad / ort *</label>
                <input
                  type="text"
                  value={state.city}
                  onChange={e => updateField("city", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="Stockholm"
                />
              </div>
              <div>
                <MinimalDropdown
                  label="Typ av köpare *"
                  value={state.buyerType}
                  onChange={(val) => updateField("buyerType", val)}
                  options={[
                    { value: "privatperson", label: "Privatperson" },
                    { value: "ab", label: "Aktiebolag" },
                    { value: "investeringsbolag", label: "Investeringsbolag / Family office" },
                    { value: "pe-fond", label: "Private equity / fond" },
                    { value: "industriell", label: "Industriell köpare" }
                  ]}
                  placeholder="Välj typ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Organisationsnummer</label>
                <input
                  type="text"
                  value={state.orgNo}
                  onChange={e => updateField("orgNo", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="Om du investerar via bolag"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Webbplats</label>
                <input
                  type="text"
                  value={state.website}
                  onChange={e => updateField("website", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">LinkedIn-profil</label>
                <input
                  type="text"
                  value={state.linkedin}
                  onChange={e => updateField("linkedin", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="linkedin.com/in/..."
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Investerarprofil & bakgrund</h2>
              <p className="text-white/70">Ge en kort bild av dig som ägare och vad du letar efter.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Kort beskrivning av dig/er som investerare</label>
                <textarea
                  value={state.investorDescription}
                  onChange={e => updateField("investorDescription", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[120px]"
                  placeholder="Exempel: Erfaren företagsbyggare med fokus på tjänstebolag inom B2B..."
                />
                <p className="text-xs text-white/50 mt-2">Gärna 3–5 rader – det här ser säljare och mäklare först.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Vilken typ av bolag letar du efter? *</label>
                <textarea
                  value={state.targetTypeText}
                  onChange={e => updateField("targetTypeText", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[120px]"
                  placeholder="Exempel: Stabilt, ägarlett bolag med 10–40 MSEK i omsättning och god historik..."
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Geografisk inriktning</h2>
              <p className="text-white/70">Välj en eller flera regioner där du vill investera.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">Vilka regioner intresserar dig? *</label>
              <div className="flex flex-wrap gap-3">
                {regions.map(region => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => toggleInArray("regions", region)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      state.regions.includes(region)
                        ? 'bg-white text-navy'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {state.regions.includes(region) && <Check className="w-4 h-4 inline mr-2" />}
                    {region}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Bransch- & bolagstyp</h2>
              <p className="text-white/70">Vad vill du investera i – och vilken typ av situation söker du?</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">Vilka branscher intresserar dig? *</label>
              <div className="flex flex-wrap gap-2">
                {branches.map(branch => (
                  <button
                    key={branch}
                    type="button"
                    onClick={() => toggleInArray("branches", branch)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      state.branches.includes(branch)
                        ? 'bg-white text-navy'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {branch}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <label className="block text-sm font-medium text-white/80 mb-2">Status på bolag du söker *</label>
              <p className="text-xs text-white/50 mb-4">Anledning till försäljning – välj en eller flera alternativ.</p>
              <div className="space-y-2">
                {statusOptions.map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      state.companyStatus.includes(opt.id)
                        ? 'bg-white/20 border border-white/30'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={state.companyStatus.includes(opt.id)}
                      onChange={() => toggleInArray("companyStatus", opt.id)}
                      className="mt-1 rounded"
                    />
                    <div>
                      <div className="font-medium text-white">{opt.id}. {opt.title}</div>
                      <div className="text-sm text-white/60">{opt.text}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Storlek & nyckeltal</h2>
              <p className="text-white/70">Rama in vilka bolag som är relevanta för dig.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Omsättningsintervall (MSEK) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <FormattedNumberInput
                    placeholder="Min"
                    value={state.turnoverMin}
                    onChange={(val) => updateField("turnoverMin", val)}
                  />
                  <FormattedNumberInput
                    placeholder="Max"
                    value={state.turnoverMax}
                    onChange={(val) => updateField("turnoverMax", val)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">EBITDA-intervall (MSEK)</label>
                <div className="grid grid-cols-2 gap-2">
                  <FormattedNumberInput
                    placeholder="Min"
                    value={state.ebitdaMin}
                    onChange={(val) => updateField("ebitdaMin", val)}
                  />
                  <FormattedNumberInput
                    placeholder="Max"
                    value={state.ebitdaMax}
                    onChange={(val) => updateField("ebitdaMax", val)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Antal anställda</label>
                <div className="grid grid-cols-2 gap-2">
                  <FormattedNumberInput
                    placeholder="Min"
                    value={state.employeesMin}
                    onChange={(val) => updateField("employeesMin", val)}
                  />
                  <FormattedNumberInput
                    placeholder="Max"
                    value={state.employeesMax}
                    onChange={(val) => updateField("employeesMax", val)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Prislapp / Enterprise value (MSEK)</label>
                <div className="grid grid-cols-2 gap-2">
                  <FormattedNumberInput
                    placeholder="Min"
                    value={state.priceMin}
                    onChange={(val) => updateField("priceMin", val)}
                  />
                  <FormattedNumberInput
                    placeholder="Max"
                    value={state.priceMax}
                    onChange={(val) => updateField("priceMax", val)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Minsta investering (SEK) *</label>
                <FormattedNumberInput
                  value={state.investMin}
                  onChange={(val) => updateField("investMin", val)}
                  placeholder="1.000.000"
                  suffix="kr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Högsta investering (SEK) *</label>
                <FormattedNumberInput
                  value={state.investMax}
                  onChange={(val) => updateField("investMax", val)}
                  placeholder="50.000.000"
                  suffix="kr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">Acceptabel lönsamhetsnivå *</label>
              <div className="flex flex-wrap gap-3">
                {["Lönsamt bolag", "Svagt lönsamt / break-even", "Förlustbolag med hög potential"].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleInArray("profitabilityLevels", level)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      state.profitabilityLevels.includes(level)
                        ? 'bg-white text-navy'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Ägarandel & roll</h2>
              <p className="text-white/70">Hur vill du gå in i ett bolag?</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">Önskad ägarandel *</label>
              <div className="space-y-3">
                {[
                  { value: "100 % (helägare)", description: "Jag vill äga hela bolaget." },
                  { value: "Majoritet (50–99 %)", description: "Jag vill ha kontrollerande majoritetsägande." },
                  { value: "Minoritet (under 50 %)", description: "Jag vill kunna investera en mindre andel än 50 %, där grundare fortsatt har en majoritet." }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleInArray("ownership", opt.value)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                      state.ownership.includes(opt.value)
                        ? 'bg-white/20 border border-white/30'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        state.ownership.includes(opt.value)
                          ? 'border-white bg-white'
                          : 'border-white/40'
                      }`}>
                        {state.ownership.includes(opt.value) && <Check className="w-3 h-3 text-navy" />}
                      </div>
                      <div>
                        <div className="font-medium text-white">{opt.value}</div>
                        <div className="text-sm text-white/60">{opt.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Deal-preferenser</h2>
              <p className="text-white/70">Hur ser din ideala affär ut?</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">Vilka typer av situationer är du extra intresserad av? *</label>
              <div className="flex flex-wrap gap-2">
                {situationOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleInArray("situations", opt)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      state.situations.includes(opt)
                        ? 'bg-white text-navy'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">Hur ser du på att befintlig ägare är kvar en period? *</label>
                <div className="space-y-2">
                  {["Gärna kvar operativt", "Gärna kvar i styrelse/ägarroll", "Helst lämnar helt på sikt"].map(opt => (
                    <label key={opt} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="ownerStay"
                        checked={state.ownerStay === opt}
                        onChange={() => updateField("ownerStay", opt)}
                        className="text-navy"
                      />
                      <span className="text-white/80 text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">Öppen för earn-out? *</label>
                  <div className="flex gap-4">
                    {["Ja", "Nej"].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="earnOut"
                          checked={state.earnOut === opt}
                          onChange={() => updateField("earnOut", opt)}
                          className="text-navy"
                        />
                        <span className="text-white/80">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">Öppen för att ta över lån/leasing? *</label>
                  <div className="flex gap-4">
                    {["Ja", "Nej"].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="takeOverLoans"
                          checked={state.takeOverLoans === opt}
                          onChange={() => updateField("takeOverLoans", opt)}
                          className="text-navy"
                        />
                        <span className="text-white/80">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Verifiering</h2>
              <p className="text-white/70">Verifierade profiler får högre trovärdighet och syns tydligare för säljare och mäklare.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-4">Välj verifieringsmetod *</label>
                <div className="space-y-3">
                  <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.verificationMethod === "magic-link"
                      ? 'bg-white/20 border border-white/30'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}>
                    <input
                      type="radio"
                      name="verification"
                      checked={state.verificationMethod === "magic-link"}
                      onChange={() => updateField("verificationMethod", "magic-link")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-white">Magic link (e-post)</div>
                      <div className="text-sm text-white/60">Vi skickar en säker länk till din e-postadress som du klickar på för att bekräfta profilen.</div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.verificationMethod === "bankid"
                      ? 'bg-white/20 border border-white/30'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}>
                    <input
                      type="radio"
                      name="verification"
                      checked={state.verificationMethod === "bankid"}
                      onChange={() => updateField("verificationMethod", "bankid")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        BankID (rekommenderas)
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Verifierad profil
                        </span>
                      </div>
                      <div className="text-sm text-white/60">Snabb verifiering via BankID. Du får en tydlig verifieringssymbol på din profil.</div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="bg-navy/80 rounded-2xl p-6 border border-white/10">
                <h3 className="font-semibold text-white mb-2">Så syns din verifiering</h3>
                <p className="text-sm text-white/60 mb-4">När du verifierar dig med BankID lägger vi till en symbol intill ditt namn.</p>
                <div className="bg-navy rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    Exempel Investerare AB
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Verifierad med BankID
                    </span>
                  </div>
                  <div className="text-xs text-white/50 mt-1">Aktiv köpare · Sverige · 25–75 MSEK omsättning</div>
                </div>
                <p className="text-xs text-white/40 mt-4">Profiler utan verifiering visas fortfarande – men utan symbol och med lägre förtroendenivå.</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-navy tracking-wider">Afterfounder</div>
          <div className="flex items-center gap-4">
            {saveMessage && (
              <span className={`text-sm font-medium ${saveMessage.includes('Fel') ? 'text-red-600' : 'text-emerald-600'}`}>
                {saveMessage}
              </span>
            )}
            {isSaving && (
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sparar...
              </span>
            )}
            <div className="text-sm text-gray-500">
              Investerarprofil · {completedCount} av {stepMeta.length} steg klara
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 lg:sticky lg:top-24">
              <h3 className="font-semibold text-navy mb-1">Skapa din investerarprofil</h3>
              <p className="text-sm text-gray-500 mb-6">Vi använder informationen för att matcha dig med rätt bolag.</p>
              
              <div className="space-y-1">
                {stepMeta.map(step => {
                  const Icon = step.icon
                  const isActive = step.id === activeStep
                  const isComplete = completionMap[step.id]
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveStep(step.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-navy text-white'
                          : isComplete
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        isActive || isComplete
                          ? 'bg-emerald-500 text-white'
                          : 'border border-gray-300 text-gray-400'
                      }`}>
                        {isComplete ? <Check className="w-3 h-3" /> : step.id}
                      </div>
                      <span>{step.id}. {step.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-navy rounded-3xl p-8 md:p-10 animate-pulse-box-navy">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={goPrev}
                disabled={activeStep === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  activeStep === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-navy hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Föregående
              </button>

              <div className="text-sm text-gray-500">
                {completedCount} av {stepMeta.length} steg klara
              </div>

              <button
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-full font-medium hover:bg-navy/90 transition-all duration-200"
              >
                {activeStep === stepMeta.length ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {isDemo ? 'Slutför demo' : 'Skapa profil'}
                  </>
                ) : (
                  <>
                    Nästa steg
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

