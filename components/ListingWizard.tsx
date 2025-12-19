'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { 
  ArrowRight, 
  ArrowLeft,
  CheckCircle, 
  Building2,
  FileText,
  Users,
  Briefcase,
  Target,
  Paperclip,
  Send,
  Check,
  Loader2,
  ChevronDown,
  Eye,
  Upload,
  X,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

// Types
export interface ListingWizardState {
  // Step 1 - Bolagsfakta
  companyName: string
  orgNumber: string
  website: string
  revenueLTM: string
  showRevenue: boolean
  ebitLTM: string
  showEbit: boolean
  growthVsLastFY: string
  growthComment: string
  employees: string
  recurringRevenueShare: string
  
  // Step 2 - Skyltfönster
  adTitle: string
  adPitch: string
  branch: string
  country: string
  region: string
  city: string
  revenueSpan: string
  ebitSpan: string
  dealType: string
  anonymity: string
  
  // Step 3 - Affärsmodell & kunder
  businessModel: string
  customerTypes: string[]
  largestCustomerShare: string
  top5CustomerShare: string
  salesChannels: string[]
  contractTerms: string
  
  // Step 4 - Organisation
  ownerRole: string
  canRunWithoutOwner: string
  canRunWithoutOwnerText: string
  keyPeople: string
  needsAfterAcquisition: string
  
  // Step 5 - Försäljningsupplägg
  saleReasons: string[]
  saleReasonOther: string
  preferredBuyerType: string
  timeHorizon: string
  priceExpectationType: string
  priceExpectationSpan: string
  engagementAfterSale: string
  
  // Step 6 - Bilagor & förhandsgranska
  hasPitchDeck: boolean
  hasFinancials: boolean
  hasOtherAttachments: boolean
  showInAd: {
    pitch: boolean
    branch: boolean
    revenueSpan: boolean
    ebitSpan: boolean
    region: boolean
    employees: boolean
  }
  detailsVisibility: string
  contactFlow: string
  
  // Step 7 - Publicering
  publishVerification: string
  packageType: string
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

const customerTypes = [
  "Privatpersoner (B2C)",
  "Företag (B2B – SME)",
  "Företag (B2B – större bolag/koncern)",
  "Offentlig sektor"
]

const salesChannels = [
  "E-handel",
  "Fysisk butik / showroom",
  "Fältsäljare / account managers",
  "Återförsäljare / partners",
  "Annat"
]

const reasonOptions = [
  "Generationsskifte/pension",
  "Fokus på annat bolag/projekt",
  "Tillväxtpartner/kapitalbehov",
  "Strategisk avyttring (icke-kärnverksamhet)",
  "Flytt/ändrad livssituation",
  "Sjukdom/utbrändhet",
  "Annat"
]

const buyerTypes = [
  { value: "privatperson", label: "Privatperson/entreprenör" },
  { value: "strategic", label: "Strategisk köpare i samma bransch" },
  { value: "financial", label: "Finansiell köpare/investerare" },
  { value: "any", label: "Spelar mindre roll" }
]

const timeHorizonOptions = [
  { value: "asap", label: "Så snart som möjligt" },
  { value: "6months", label: "Inom 6 månader" },
  { value: "12months", label: "Inom 12 månader" },
  { value: "longterm", label: "Långsiktigt, kan avvakta rätt köpare" }
]

const ownerRoleOptions = [
  { value: "fulltime", label: "Operativ heltid" },
  { value: "parttime", label: "Operativ deltid" },
  { value: "board", label: "Ej operativ, styrelse/ägare" }
]

const engagementAfterSaleOptions = [
  { value: "leave", label: "Vill lämna helt" },
  { value: "consult", label: "Öppen för konsultroll under en period" },
  { value: "stay", label: "Vill vara kvar som delägare/minoritetsägare" }
]

const growthOptions = [
  { value: "positive", label: "Positiv" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negativ" }
]

const dealTypeOptions = [
  { value: "shares", label: "Aktieöverlåtelse" },
  { value: "asset", label: "Inkråmsaffär" },
  { value: "both", label: "Båda möjliga" }
]

const stepMeta = [
  { id: 1, title: "Bolagsfakta", icon: Building2 },
  { id: 2, title: "Skyltfönster", icon: Eye },
  { id: 3, title: "Affärsmodell & kunder", icon: Users },
  { id: 4, title: "Organisation", icon: Briefcase },
  { id: 5, title: "Försäljningsupplägg", icon: Target },
  { id: 6, title: "Bilagor & preview", icon: Paperclip },
  { id: 7, title: "Publicering", icon: Send }
]

const initialState: ListingWizardState = {
  companyName: "",
  orgNumber: "",
  website: "",
  revenueLTM: "",
  showRevenue: true,
  ebitLTM: "",
  showEbit: true,
  growthVsLastFY: "",
  growthComment: "",
  employees: "",
  recurringRevenueShare: "",
  adTitle: "",
  adPitch: "",
  branch: "",
  country: "Sverige",
  region: "",
  city: "",
  revenueSpan: "",
  ebitSpan: "",
  dealType: "",
  anonymity: "anonymous",
  businessModel: "",
  customerTypes: [],
  largestCustomerShare: "",
  top5CustomerShare: "",
  salesChannels: [],
  contractTerms: "",
  ownerRole: "",
  canRunWithoutOwner: "",
  canRunWithoutOwnerText: "",
  keyPeople: "",
  needsAfterAcquisition: "",
  saleReasons: [],
  saleReasonOther: "",
  preferredBuyerType: "",
  timeHorizon: "",
  priceExpectationType: "",
  priceExpectationSpan: "",
  engagementAfterSale: "",
  hasPitchDeck: false,
  hasFinancials: false,
  hasOtherAttachments: false,
  showInAd: {
    pitch: true,
    branch: true,
    revenueSpan: true,
    ebitSpan: true,
    region: true,
    employees: true
  },
  detailsVisibility: "",
  contactFlow: "",
  publishVerification: "",
  packageType: ""
}

function isStepComplete(state: ListingWizardState, stepId: number): boolean {
  switch (stepId) {
    case 1:
      return !!state.companyName && !!state.orgNumber && !!state.revenueLTM && !!state.ebitLTM && !!state.growthVsLastFY && !!state.employees
    case 2:
      return state.adTitle.trim().length > 5 && state.adPitch.trim().length > 20 && !!state.branch && !!state.region && !!state.revenueSpan && !!state.ebitSpan && !!state.dealType
    case 3:
      return state.businessModel.trim().length > 20 && state.customerTypes.length > 0
    case 4:
      return !!state.ownerRole && !!state.canRunWithoutOwner && state.canRunWithoutOwnerText.trim().length >= 5
    case 5:
      return state.saleReasons.length > 0 && !!state.preferredBuyerType && !!state.timeHorizon && !!state.priceExpectationType && !!state.engagementAfterSale
    case 6:
      return !!state.detailsVisibility && !!state.contactFlow
    case 7:
      return !!state.publishVerification && !!state.packageType
    default:
      return false
  }
}

// Custom minimalist dropdown component
function MinimalDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
  placeholder: string 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(o => o.value === value)

  return (
    <div className="relative">
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

interface ListingWizardProps {
  onClose?: () => void
}

export default function ListingWizard({ onClose }: ListingWizardProps) {
  const [state, setState] = useState<ListingWizardState>(initialState)
  const [activeStep, setActiveStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const router = useRouter()
  const locale = useLocale()

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

  const updateField = (field: keyof ListingWizardState, value: any) => {
    setState(prev => ({ ...prev, [field]: value }))
  }

  const toggleInArray = (field: keyof ListingWizardState, value: string) => {
    setState(prev => {
      const arr = (prev[field] as string[]) || []
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) }
      }
      return { ...prev, [field]: [...arr, value] }
    })
  }

  const toggleShowInAd = (key: keyof ListingWizardState['showInAd']) => {
    setState(prev => ({
      ...prev,
      showInAd: {
        ...prev.showInAd,
        [key]: !prev.showInAd[key]
      }
    }))
  }

  const goNext = () => {
    if (activeStep < stepMeta.length) {
      setActiveStep(s => s + 1)
    }
  }

  const goPrev = () => {
    if (activeStep > 1) {
      setActiveStep(s => s - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      showError('Du måste vara inloggad för att publicera en annons')
      return
    }

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...state,
          userId: user.id,
          status: 'pending_approval', // Sent for admin approval
          anonymousTitle: state.adTitle,
          description: state.adPitch,
          industry: state.branch,
          revenue: state.revenueLTM,
          askingPrice: state.priceExpectationSpan || '0'
        })
      })

      if (response.ok) {
        setSubmitMessage('Din annons har skickats för granskning!')
        success('Annons inskickad för godkännande!')
        
        setTimeout(() => {
          router.push(`/${locale}/dashboard`)
        }, 2000)
      } else {
        const error = await response.json()
        showError(error.message || 'Kunde inte skicka annonsen')
        setSubmitMessage('Ett fel uppstod. Försök igen.')
      }
    } catch (error) {
      console.error('Submit error:', error)
      showError('Ett fel uppstod')
      setSubmitMessage('Ett fel uppstod. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Bolagsfakta & nyckeltal</h2>
              <p className="text-white/70">Ryggraden i annonsen – siffror och grunddata som köpare bryr sig om.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Bolagsnamn *</label>
                <input
                  type="text"
                  value={state.companyName}
                  onChange={e => updateField("companyName", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="AB Exempel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Organisationsnummer *</label>
                <input
                  type="text"
                  value={state.orgNumber}
                  onChange={e => updateField("orgNumber", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="556123-4567"
                />
                <p className="text-xs text-white/50 mt-1">Kan användas för att hämta siffror automatiskt.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Hemsida</label>
                <input
                  type="text"
                  value={state.website}
                  onChange={e => updateField("website", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="www.bolag.se"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Antal anställda *</label>
                <input
                  type="text"
                  value={state.employees}
                  onChange={e => updateField("employees", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="8 heltidstjänster + 2 konsulter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Omsättning LTM (MSEK) *</label>
                <input
                  type="text"
                  value={state.revenueLTM}
                  onChange={e => updateField("revenueLTM", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">EBIT LTM (MSEK) *</label>
                <input
                  type="text"
                  value={state.ebitLTM}
                  onChange={e => updateField("ebitLTM", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Tillväxt mot senaste bokslut *</label>
                <MinimalDropdown
                  value={state.growthVsLastFY}
                  onChange={(val) => updateField("growthVsLastFY", val)}
                  options={growthOptions}
                  placeholder="Välj"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Andel återkommande intäkter (%)</label>
                <input
                  type="text"
                  value={state.recurringRevenueShare}
                  onChange={e => updateField("recurringRevenueShare", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="ca 65 %"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Kort kommentar om utvecklingen</label>
              <textarea
                value={state.growthComment}
                onChange={e => updateField("growthComment", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[100px]"
                placeholder="Stark tillväxt drivet av nya kundavtal 2024..."
              />
            </div>

            <div className="border-t border-white/10 pt-6">
              <label className="block text-sm font-medium text-white/80 mb-4">Synlighet i annons</label>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  state.showRevenue ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                }`}>
                  <input
                    type="checkbox"
                    checked={state.showRevenue}
                    onChange={e => updateField("showRevenue", e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-white/80">Visa omsättning öppet i annonsen</span>
                </label>
                <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  state.showEbit ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                }`}>
                  <input
                    type="checkbox"
                    checked={state.showEbit}
                    onChange={e => updateField("showEbit", e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-white/80">Visa EBIT öppet i annonsen</span>
                </label>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Annonsens skyltfönster</h2>
              <p className="text-white/70">Det här är det första en köpare ser – gör det tydligt och säljande.</p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/80">Annonsrubrik *</label>
                <span className="flex items-center gap-1 text-xs bg-white/10 text-white/60 px-2 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  AI kan föreslå
                </span>
              </div>
              <input
                type="text"
                value={state.adTitle}
                onChange={e => updateField("adTitle", e.target.value)}
                maxLength={80}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                placeholder="Lönsamt tjänstebolag inom fastighetsservice i Stockholm"
              />
              <p className="text-xs text-white/50 mt-1">Max 80 tecken. Tänk rubrik som på Hemnet – konkret + nyfikenhet.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/80">Kort pitch / sammanfattning *</label>
                <span className="flex items-center gap-1 text-xs bg-white/10 text-white/60 px-2 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  AI kan föreslå
                </span>
              </div>
              <textarea
                value={state.adPitch}
                onChange={e => updateField("adPitch", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[120px]"
                placeholder="2–4 meningar som summerar bolaget, kundbasen och varför det är intressant för en köpare."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Bransch *</label>
                <MinimalDropdown
                  value={state.branch}
                  onChange={(val) => updateField("branch", val)}
                  options={branches.map(b => ({ value: b, label: b }))}
                  placeholder="Välj bransch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Region *</label>
                <MinimalDropdown
                  value={state.region}
                  onChange={(val) => updateField("region", val)}
                  options={regions.map(r => ({ value: r, label: r }))}
                  placeholder="Välj region"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Stad / ort</label>
                <input
                  type="text"
                  value={state.city}
                  onChange={e => updateField("city", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="Stockholm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Omsättningsspann *</label>
                <input
                  type="text"
                  value={state.revenueSpan}
                  onChange={e => updateField("revenueSpan", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="5–10 MSEK"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">EBIT-span *</label>
                <input
                  type="text"
                  value={state.ebitSpan}
                  onChange={e => updateField("ebitSpan", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="1–3 MSEK"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Typ av affär *</label>
                <MinimalDropdown
                  value={state.dealType}
                  onChange={(val) => updateField("dealType", val)}
                  options={dealTypeOptions}
                  placeholder="Välj"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Anonym eller öppen annons</label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  state.anonymity === 'anonymous' ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                }`}>
                  <input
                    type="radio"
                    name="anonymity"
                    checked={state.anonymity === "anonymous"}
                    onChange={() => updateField("anonymity", "anonymous")}
                  />
                  <span className="text-white/80">Anonym – visa inte bolagsnamn</span>
                </label>
                <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  state.anonymity === 'open' ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                }`}>
                  <input
                    type="radio"
                    name="anonymity"
                    checked={state.anonymity === "open"}
                    onChange={() => updateField("anonymity", "open")}
                  />
                  <span className="text-white/80">Öppen – visa bolagsnamn</span>
                </label>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Affärsmodell & kunder</h2>
              <p className="text-white/70">Beskriv hur ni tjänar pengar, vilka ni säljer till och hur stabil kundbasen är.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Kort beskrivning av affärsmodellen *</label>
              <textarea
                value={state.businessModel}
                onChange={e => updateField("businessModel", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[120px]"
                placeholder="Vi levererar löpande tjänster inom X till Y-typ av kunder, med abonnemangsintäkter kombinerat med projekt..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">Typ av kunder *</label>
              <div className="space-y-2">
                {customerTypes.map(ct => (
                  <label
                    key={ct}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      state.customerTypes.includes(ct)
                        ? 'bg-white/20 border border-white/30'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={state.customerTypes.includes(ct)}
                      onChange={() => toggleInArray("customerTypes", ct)}
                      className="rounded"
                    />
                    <span className="text-white/80">{ct}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Största kund (ca % av omsättningen)</label>
                <input
                  type="text"
                  value={state.largestCustomerShare}
                  onChange={e => updateField("largestCustomerShare", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="ca 18 %"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Top 5-kunder (ca % av omsättningen)</label>
                <input
                  type="text"
                  value={state.top5CustomerShare}
                  onChange={e => updateField("top5CustomerShare", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="ca 55 %"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">Säljkanaler</label>
              <div className="flex flex-wrap gap-2">
                {salesChannels.map(sc => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => toggleInArray("salesChannels", sc)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      state.salesChannels.includes(sc)
                        ? 'bg-white text-navy'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Avtalslängder / bindningstid (om relevant)</label>
              <textarea
                value={state.contractTerms}
                onChange={e => updateField("contractTerms", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[80px]"
                placeholder="Årsavtal med 12 månaders bindningstid, 3 månaders uppsägning..."
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Organisation & ägarens roll</h2>
              <p className="text-white/70">Förklara hur bolaget drivs i vardagen och hur beroende det är av ägaren.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Ägarens nuvarande roll *</label>
                <MinimalDropdown
                  value={state.ownerRole}
                  onChange={(val) => updateField("ownerRole", val)}
                  options={ownerRoleOptions}
                  placeholder="Välj"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Bolaget kan fungera utan ägare? *</label>
                <MinimalDropdown
                  value={state.canRunWithoutOwner}
                  onChange={(val) => updateField("canRunWithoutOwner", val)}
                  options={[
                    { value: "yes", label: "Ja" },
                    { value: "no", label: "Nej" }
                  ]}
                  placeholder="Välj"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Beskriv kort hur organisationen ser ut *</label>
              <textarea
                value={state.canRunWithoutOwnerText}
                onChange={e => updateField("canRunWithoutOwnerText", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[100px]"
                placeholder="Operativ chef ansvarar för daglig drift, ekonomiansvarig hanterar rapportering, ägare fokuserar på nyckelkunder..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Nyckelpersoner & team</label>
              <textarea
                value={state.keyPeople}
                onChange={e => updateField("keyPeople", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[100px]"
                placeholder="Kort om nyckelpersoner, deras roller och hur kritiska de är för verksamheten."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Behov efter ett förvärv</label>
              <textarea
                value={state.needsAfterAcquisition}
                onChange={e => updateField("needsAfterAcquisition", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[80px]"
                placeholder="Rekrytering av VD inom 12 månader, behov av stärkt säljorganisation..."
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Försäljningsorsak & önskat upplägg</h2>
              <p className="text-white/70">Hjälp köpare förstå varför bolaget säljs och vad ni söker.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">Varför överväger ni att sälja? *</label>
              <div className="space-y-2">
                {reasonOptions.map(r => (
                  <label
                    key={r}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      state.saleReasons.includes(r)
                        ? 'bg-white/20 border border-white/30'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={state.saleReasons.includes(r)}
                      onChange={() => toggleInArray("saleReasons", r)}
                      className="rounded"
                    />
                    <span className="text-white/80">{r}</span>
                  </label>
                ))}
              </div>
              {state.saleReasons.includes("Annat") && (
                <textarea
                  value={state.saleReasonOther}
                  onChange={e => updateField("saleReasonOther", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors mt-3"
                  placeholder="Beskriv kort annan anledning."
                />
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Vilken typ av köpare söker ni? *</label>
                <MinimalDropdown
                  value={state.preferredBuyerType}
                  onChange={(val) => updateField("preferredBuyerType", val)}
                  options={buyerTypes}
                  placeholder="Välj"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Önskad tidshorisont *</label>
                <MinimalDropdown
                  value={state.timeHorizon}
                  onChange={(val) => updateField("timeHorizon", val)}
                  options={timeHorizonOptions}
                  placeholder="Välj"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Prisförväntan *</label>
                <MinimalDropdown
                  value={state.priceExpectationType}
                  onChange={(val) => updateField("priceExpectationType", val)}
                  options={[
                    { value: "discuss", label: "Pris diskuteras" },
                    { value: "range", label: "Indikativ prisnivå (spann)" }
                  ]}
                  placeholder="Välj"
                />
                {state.priceExpectationType === "range" && (
                  <input
                    type="text"
                    value={state.priceExpectationSpan}
                    onChange={e => updateField("priceExpectationSpan", e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors mt-3"
                    placeholder="15–20 MSEK"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Engagemang efter försäljning *</label>
                <MinimalDropdown
                  value={state.engagementAfterSale}
                  onChange={(val) => updateField("engagementAfterSale", val)}
                  options={engagementAfterSaleOptions}
                  placeholder="Välj"
                />
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Bilagor & förhandsgranska</h2>
              <p className="text-white/70">Ställ in vad som visas öppet, hur detaljer visas och hur köpare tar kontakt.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-4">Bilagor (valfritt)</label>
                  <div className="space-y-2">
                    <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      state.hasPitchDeck ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                    }`}>
                      <input
                        type="checkbox"
                        checked={state.hasPitchDeck}
                        onChange={e => updateField("hasPitchDeck", e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-white/80">Bolagspresentation / pitchdeck</span>
                    </label>
                    <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      state.hasFinancials ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                    }`}>
                      <input
                        type="checkbox"
                        checked={state.hasFinancials}
                        onChange={e => updateField("hasFinancials", e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-white/80">Resultaträkning / balans (1–3 år)</span>
                    </label>
                    <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      state.hasOtherAttachments ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                    }`}>
                      <input
                        type="checkbox"
                        checked={state.hasOtherAttachments}
                        onChange={e => updateField("hasOtherAttachments", e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-white/80">Övriga bilagor</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-4">Vem får se detaljerade bilagor? *</label>
                  <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      state.detailsVisibility === 'approved-buyers' ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                    }`}>
                      <input
                        type="radio"
                        name="detailsVisibility"
                        checked={state.detailsVisibility === "approved-buyers"}
                        onChange={() => updateField("detailsVisibility", "approved-buyers")}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-white">Endast registrerade och godkända köpare</div>
                        <div className="text-sm text-white/60">Ni godkänner intresseförfrågningar innan bilagor släpps.</div>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      state.detailsVisibility === 'nda' ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                    }`}>
                      <input
                        type="radio"
                        name="detailsVisibility"
                        checked={state.detailsVisibility === "nda"}
                        onChange={() => updateField("detailsVisibility", "nda")}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-white">Endast efter signerat NDA via plattformen</div>
                        <div className="text-sm text-white/60">Köpare signerar NDA digitalt, sedan öppnas bilagor automatiskt.</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-4">Kontaktflöde *</label>
                  <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      state.contactFlow === 'platform-chat' ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                    }`}>
                      <input
                        type="radio"
                        name="contactFlow"
                        checked={state.contactFlow === "platform-chat"}
                        onChange={() => updateField("contactFlow", "platform-chat")}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-white">All dialog via plattformens chatt</div>
                        <div className="text-sm text-white/60">Köpare skickar intresse direkt i BOLAXO – ni svarar när det passar.</div>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      state.contactFlow === 'direct-contact' ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                    }`}>
                      <input
                        type="radio"
                        name="contactFlow"
                        checked={state.contactFlow === "direct-contact"}
                        onChange={() => updateField("contactFlow", "direct-contact")}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-white">Intresserade köpare kontaktar er direkt</div>
                        <div className="text-sm text-white/60">E-post/telefon visas efter att ni godkänt köparens förfrågan.</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-4">Förhandsgranska annons</label>
                <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {state.adTitle || "Rubrik på annonsen visas här"}
                    </h3>
                    <p className="text-sm text-white/70">
                      {state.adPitch || "En kort pitch på 2–4 meningar som beskriver bolaget och caset."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {state.showInAd.branch && state.branch && (
                      <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{state.branch}</span>
                    )}
                    {state.showInAd.region && state.region && (
                      <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{state.region}</span>
                    )}
                    {state.showInAd.revenueSpan && state.revenueSpan && (
                      <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">Oms: {state.revenueSpan}</span>
                    )}
                    {state.showInAd.ebitSpan && state.ebitSpan && (
                      <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">EBIT: {state.ebitSpan}</span>
                    )}
                    {state.showInAd.employees && state.employees && (
                      <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{state.employees} anställda</span>
                    )}
                  </div>
                  <p className="text-xs text-white/40">
                    Detta är en förenklad förhandsvisning. Den slutgiltiga annonsen kan innehålla fler detaljer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Publicering</h2>
              <p className="text-white/70">Verifiera dig och välj paket. Din annons granskas innan publicering.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-4">Verifiering *</label>
                <div className="space-y-3">
                  <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.publishVerification === 'bankid' ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                  }`}>
                    <input
                      type="radio"
                      name="verification"
                      checked={state.publishVerification === "bankid"}
                      onChange={() => updateField("publishVerification", "bankid")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        Verifiera med BankID
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Rekommenderas
                        </span>
                      </div>
                      <div className="text-sm text-white/60">Säker identifiering innan publicering. Bygger förtroende hos köpare.</div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.publishVerification === 'later' ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                  }`}>
                    <input
                      type="radio"
                      name="verification"
                      checked={state.publishVerification === "later"}
                      onChange={() => updateField("publishVerification", "later")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-white">Verifiera vid ett senare tillfälle</div>
                      <div className="text-sm text-white/60">Annonsen kan förberedas nu, men kräver BankID innan full exponering.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-4">Välj paket *</label>
                <div className="space-y-3">
                  <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.packageType === 'bas' ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                  }`}>
                    <input
                      type="radio"
                      name="packageType"
                      checked={state.packageType === "bas"}
                      onChange={() => updateField("packageType", "bas")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-white">Bas</div>
                      <div className="text-sm text-white/60">Grundläggande publicering i BOLAXO med synlighet i relevanta sökningar.</div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.packageType === 'premium' ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'
                  }`}>
                    <input
                      type="radio"
                      name="packageType"
                      checked={state.packageType === "premium"}
                      onChange={() => updateField("packageType", "premium")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        Premium
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                          Populär
                        </span>
                      </div>
                      <div className="text-sm text-white/60">Ökad exponering, lyft i listor och bättre synlighet mot matchande köpare.</div>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-white/40 mt-4">
                  Din annons granskas av vårt team innan publicering för att säkerställa kvalitet och trovärdighet.
                </p>
              </div>
            </div>

            {submitMessage && (
              <div className={`p-4 rounded-xl ${submitMessage.includes('fel') ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {submitMessage}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const canPublish = Object.values(completionMap).every(Boolean)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-navy tracking-wider">BOLAXO</div>
          <div className="flex items-center gap-4">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <div className="text-sm text-gray-500">
              Skapa annons · {completedCount} av {stepMeta.length} steg klara
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 lg:sticky lg:top-24">
              <h3 className="font-semibold text-navy mb-1">Skapa en färdig annons</h3>
              <p className="text-sm text-gray-500 mb-6">Svara på frågorna steg för steg – vi bygger en tydlig, säljande annons åt dig.</p>
              
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
              {renderStep()}
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

              {activeStep === stepMeta.length ? (
                <button
                  onClick={handleSubmit}
                  disabled={!canPublish || isSubmitting}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                    canPublish && !isSubmitting
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Skickar...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Publicera annons
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-full font-medium hover:bg-navy/90 transition-all duration-200"
                >
                  Nästa steg
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
