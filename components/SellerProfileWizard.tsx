'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { 
  ArrowRight, 
  ArrowLeft,
  CheckCircle, 
  User,
  FileText,
  MapPin,
  Building2,
  Shield,
  Check,
  Loader2,
  ChevronDown
} from 'lucide-react'

// Types
export interface SellerWizardState {
  // Step 1 - Grunduppgifter
  name: string
  email: string
  phone: string
  country: string
  city: string
  sellerType: string
  orgId: string
  website: string
  linkedin: string
  // Step 2 - Säljarprofil & bakgrund
  sellerDescription: string
  situationText: string
  // Step 3 - Geografi
  regions: string[]
  // Step 4 - Bransch & bolagstyp
  branches: string[]
  companyStatus: number[]
  // Step 5 - Verifiering
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
  { id: 8, title: "Marknads-/regelförändringar", text: "Kräver ny ägare med andra resurser eller nätverk." },
  { id: 9, title: "Konkursbo – inkråm/rörelse", text: "Konkursförvaltare avyttrar tillgångar, inkråm eller hela bolaget från konkursbo." },
  { id: 10, title: "Konkursbo – helt bolag", text: "Konkursförvaltare säljer hela verksamheten som going concern." }
]

const sellerTypeOptions = [
  { value: "privatperson", label: "Privatperson som ska sälja bolag" },
  { value: "holdingbolag", label: "Holdingbolag som ska sälja bolag" },
  { value: "maklare", label: "Mäklare som ska sälja bolag" },
  { value: "konkursforvaltare", label: "Konkursförvaltare" }
]

const stepMeta = [
  { id: 1, title: "Grunduppgifter", icon: User },
  { id: 2, title: "Säljarprofil & bakgrund", icon: FileText },
  { id: 3, title: "Geografisk inriktning", icon: MapPin },
  { id: 4, title: "Bransch & bolagstyp", icon: Building2 },
  { id: 5, title: "Verifiering", icon: Shield }
]

const initialState: SellerWizardState = {
  name: "",
  email: "",
  phone: "",
  country: "Sverige",
  city: "",
  sellerType: "",
  orgId: "",
  website: "",
  linkedin: "",
  sellerDescription: "",
  situationText: "",
  regions: [],
  branches: [],
  companyStatus: [],
  verificationMethod: ""
}

function isStepComplete(state: SellerWizardState, stepId: number): boolean {
  switch (stepId) {
    case 1:
      return state.name.trim().length > 0 && state.email.trim().length > 0 && state.city.trim().length > 0 && state.sellerType.trim().length > 0
    case 2:
      return state.situationText.trim().length >= 10
    case 3:
      return state.regions.length > 0
    case 4:
      return state.branches.length > 0 && state.companyStatus.length > 0
    case 5:
      return !!state.verificationMethod
    default:
      return false
  }
}

interface SellerProfileWizardProps {
  isDemo?: boolean
  onComplete?: (data: SellerWizardState) => void
  initialData?: Partial<SellerWizardState>
  userEmail?: string
  userName?: string
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
          <div className="absolute z-20 w-full mt-2 bg-navy border border-white/20 rounded-xl shadow-xl overflow-hidden">
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

export default function SellerProfileWizard({ 
  isDemo = false, 
  onComplete,
  initialData,
  userEmail,
  userName
}: SellerProfileWizardProps) {
  const [state, setState] = useState<SellerWizardState>({
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
    if (isDemo) {
      setIsLoading(false)
      return
    }
    
    async function loadProfile() {
      try {
        const res = await fetch('/api/seller-profile')
        if (res.ok) {
          const data = await res.json()
          if (data.profile) {
            setState(prev => ({ ...prev, ...data.profile }))
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
      const res = await fetch('/api/seller-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...state,
          profileComplete: activeStep === 5 && isStepComplete(state, 5)
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

  const updateField = (field: keyof SellerWizardState, value: string | string[] | number[]) => {
    setState(prev => ({ ...prev, [field]: value }))
  }

  const toggleInArray = (field: keyof SellerWizardState, value: string | number) => {
    setState(prev => {
      const arr = (prev[field] as (string | number)[]) || []
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) }
      }
      return { ...prev, [field]: [...arr, value] }
    })
  }

  const goNext = async () => {
    await saveProfile(false)
    
    if (activeStep === stepMeta.length) {
      await saveProfile(true)
      if (onComplete) {
        onComplete(state)
      }
    } else {
      setActiveStep(s => Math.min(stepMeta.length, s + 1))
    }
  }

  const goPrev = async () => {
    await saveProfile(false)
    setActiveStep(s => Math.max(1, s - 1))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy mx-auto mb-4" />
          <p className="text-gray-600">Laddar din säljarprofil...</p>
        </div>
      </div>
    )
  }

  const renderStep = () => {
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
                <label className="block text-sm font-medium text-white/80 mb-2">Typ av säljare *</label>
                <MinimalDropdown
                  value={state.sellerType}
                  onChange={(val) => updateField("sellerType", val)}
                  options={sellerTypeOptions}
                  placeholder="Välj typ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Organisationsnummer</label>
                <input
                  type="text"
                  value={state.orgId}
                  onChange={e => updateField("orgId", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="556XXX-XXXX"
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
              <h2 className="text-2xl font-bold text-white mb-2">Säljarprofil & bakgrund</h2>
              <p className="text-white/70">Ge en kort bild av dig/er som säljare och bolaget.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Kort beskrivning av dig/er som säljare</label>
                <textarea
                  value={state.sellerDescription}
                  onChange={e => updateField("sellerDescription", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[120px]"
                  placeholder="Exempel: Grundare och ägare som drivit bolaget i 15 år, vill nu trappa ner..."
                />
                <p className="text-xs text-white/50 mt-2">Gärna 3–5 rader – det här ser köpare och mäklare först.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Beskriv kort bolaget och vilken situation du befinner dig i *</label>
                <textarea
                  value={state.situationText}
                  onChange={e => updateField("situationText", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[120px]"
                  placeholder="Exempel: Ägarlett tjänstebolag med stabil kundbas, ägare vill sälja p.g.a. generationsskifte..."
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
              <p className="text-white/70">Välj i vilka regioner bolaget finns/verkar.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">Vilka regioner gäller för bolaget? *</label>
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
              <h2 className="text-2xl font-bold text-white mb-2">Bransch & bolagstyp</h2>
              <p className="text-white/70">Vilken bransch tillhör bolaget och vad är anledningen till försäljningen?</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">Vilken bransch tillhör bolaget? *</label>
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
              <label className="block text-sm font-medium text-white/80 mb-2">Anledning till försäljning *</label>
              <p className="text-xs text-white/50 mb-4">Välj en eller flera alternativ.</p>
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
              <h2 className="text-2xl font-bold text-white mb-2">Verifiering</h2>
              <p className="text-white/70">Verifierade profiler får högre trovärdighet och syns tydligare för köpare och mäklare.</p>
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
                    Exempel Säljare AB
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Verifierad med BankID
                    </span>
                  </div>
                  <div className="text-xs text-white/50 mt-1">Aktiv säljare · Sverige · SME-bolag</div>
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
          <div className="font-bold text-navy tracking-wider">BOLAXO</div>
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
              Säljarprofil · {completedCount} av {stepMeta.length} steg klara
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 lg:sticky lg:top-24">
              <h3 className="font-semibold text-navy mb-1">Skapa din säljarprofil</h3>
              <p className="text-sm text-gray-500 mb-6">Vi använder informationen för att matcha dig med rätt köpare.</p>
              
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

              <button
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-full font-medium hover:bg-navy/90 transition-all duration-200"
              >
                {activeStep === stepMeta.length ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
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

