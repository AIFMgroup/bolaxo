'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { 
  ArrowRight, 
  ArrowLeft,
  CheckCircle, 
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  Target,
  Briefcase,
  Settings,
  Shield,
  Sparkles,
  FileText,
  Check,
  Loader2,
  Download,
  AlertTriangle,
  X,
  ChevronDown,
  HelpCircle,
  Upload,
  Paperclip,
  File,
  Trash2
} from 'lucide-react'
import { INDUSTRIES } from './IndustrySelectorModal'

// File upload types
interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: Date
}

interface UploadedFilesState {
  [key: string]: UploadedFile[]
}

// Help Tooltip Component
function HelpTooltip({ content, title }: { content: string; title?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="ml-1.5 p-0.5 rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-all duration-200 focus:outline-none"
        aria-label="Visa hjälp"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 w-64 sm:w-72 p-4 rounded-xl border bg-gray-900/95 backdrop-blur-sm text-white border-white/20 shadow-2xl bottom-full mb-2"
          style={{ 
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: 1
          }}
        >
          {title && (
            <h4 className="font-semibold text-sm mb-1.5 text-white">{title}</h4>
          )}
          <p className="text-sm leading-relaxed text-white/80">{content}</p>
          <div 
            className="absolute w-0 h-0 border-[6px] top-full border-l-transparent border-r-transparent border-b-transparent border-t-gray-900/95"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          />
        </div>
      )}
    </div>
  )
}

// Label with Help component
function LabelWithHelp({ 
  label, 
  helpContent, 
  helpTitle,
  required = false 
}: { 
  label: string
  helpContent: string
  helpTitle?: string
  required?: boolean 
}) {
  return (
    <label className="flex items-center text-sm font-medium text-white/80 mb-2">
      <span>{label}{required && ' *'}</span>
      <HelpTooltip content={helpContent} title={helpTitle} />
    </label>
  )
}

// File Upload Component
function FileUploadZone({ 
  fieldKey,
  files,
  onFilesChange,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
}: { 
  fieldKey: string
  files: UploadedFile[]
  onFilesChange: (key: string, files: UploadedFile[]) => void
  accept?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return
    
    const newFiles: UploadedFile[] = Array.from(selectedFiles).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date()
    }))
    
    onFilesChange(fieldKey, [...files, ...newFiles])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeFile = (fileId: string) => {
    onFilesChange(fieldKey, files.filter(f => f.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('xlsx')) return '📊'
    if (type.includes('presentation') || type.includes('powerpoint')) return '📽️'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('image')) return '🖼️'
    return '📎'
  }

  return (
    <div className="mt-3 animate-in slide-in-from-top-2 duration-300">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-emerald-400 bg-emerald-400/10' 
            : 'border-white/20 hover:border-white/40 hover:bg-white/5'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isDragging ? 'bg-emerald-400/20' : 'bg-white/10'
          }`}>
            <Upload className={`w-5 h-5 ${isDragging ? 'text-emerald-400' : 'text-white/60'}`} />
          </div>
          <div>
            <p className="text-sm text-white/80">
              <span className="font-medium text-white">Klicka för att ladda upp</span> eller dra och släpp
            </p>
            <p className="text-xs text-white/50 mt-1">
              PDF, Word, Excel, PowerPoint, bilder (max 10 MB)
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map(file => (
            <div 
              key={file.id}
              className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 group"
            >
              <span className="text-lg">{getFileIcon(file.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-white/50">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(file.id)
                }}
                className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Help texts for all fields
const HELP_TEXTS = {
  // Step 1 - Bolagsöversikt
  companyName: {
    title: "Bolagsnamn",
    content: "Det officiella registrerade företagsnamnet enligt Bolagsverket. Detta används för att verifiera och hämta information om ert bolag."
  },
  orgNumber: {
    title: "Organisationsnummer",
    content: "Ert 10-siffriga organisationsnummer (format: 556XXX-XXXX). Vi använder detta för att hämta offentlig bolagsinformation från Bolagsverket."
  },
  website: {
    title: "Hemsida",
    content: "Er företagshemsida hjälper potentiella köpare att snabbt få en bild av er verksamhet, produkter och varumärke."
  },
  industry: {
    title: "Bransch",
    content: "Välj den bransch som bäst beskriver er kärnverksamhet. Detta påverkar vilka värderingsmultiplar och jämförelser som används i analysen."
  },
  whySell: {
    title: "Varför sälja?",
    content: "Beskriv bakgrunden till försäljningen. Köpare vill förstå motivationen – är det pension, nya satsningar, eller strategisk avyttring? Ärliga svar skapar förtroende."
  },
  strategyScale: {
    title: "Strategisk tydlighet",
    content: "Hur väl definierad är er affärsstrategi för de kommande 3 åren? En tydlig strategi visar köpare att bolaget har riktning och att de kan bygga vidare på er plan."
  },
  hasPitchdeck: {
    title: "Pitchdeck/presentation",
    content: "Om ni redan har en investerarpresentation eller bolagspresentation kan processen gå snabbare. Om inte, hjälper vi er skapa en."
  },

  // Step 2 - Ägarberoende
  ownerIndependent: {
    title: "Ägaroberoende",
    content: "Kan bolaget fungera i vardagen utan er dagliga inblandning? Hög ägarberoende är en risk för köpare och kan påverka värderingen negativt."
  },
  leadershipScale: {
    title: "Ledningsstruktur",
    content: "Finns ett formellt ledningsteam med tydliga roller och ansvar? Bolag med stark organisation värderas högre än de som är beroende av en enskild person."
  },
  transferPlanScale: {
    title: "Överlämningsplan",
    content: "Har ni en plan för hur kompetens och relationer ska överföras till nya ägare? En bra överlämning minskar risken för köparen."
  },
  keypersonList: {
    title: "Nyckelpersoner",
    content: "Lista över kritiska medarbetare, deras roller och eventuella bindningsklausuler. Köpare vill veta vilka som är avgörande för verksamheten."
  },

  // Step 3 - Intäkter
  recurringPercent: {
    title: "Återkommande intäkter",
    content: "Andel av omsättningen som kommer från avtal, abonnemang eller återkommande kunder. Hög andel (>60%) ger oftast högre värdering då det indikerar stabilitet."
  },
  mainProductShare: {
    title: "Huvudprodukter",
    content: "Hur stor del av intäkterna kommer från era viktigaste produkter/tjänster? Hög koncentration kan vara en risk om marknaden förändras."
  },
  pricingText: {
    title: "Prissättningsmodell",
    content: "Beskriv hur ni prissätter era produkter/tjänster. Fast pris, abonnemang, usage-based, timdebitering? Prenumerationsmodeller värderas ofta högre."
  },

  // Step 4 - Lönsamhet
  annualRevenue: {
    title: "Årsomsättning",
    content: "Ange bolagets senaste helårs nettoomsättning i MSEK. Detta är grunden för omsättningsbaserade multiplar och jämförelser."
  },
  revenueGrowth: {
    title: "Omsättningstillväxt",
    content: "Ange den årliga tillväxttakten i procent (CAGR senaste 3 åren). Hög tillväxt (>15%) ger ofta högre multiplar."
  },
  ebitda: {
    title: "EBITDA",
    content: "Resultat före räntor, skatt, av- och nedskrivningar i MSEK. Det vanligaste måttet för företagsvärdering. Ange normaliserad EBITDA (justerat för engångsposter)."
  },
  ebitdaMargin: {
    title: "EBITDA-marginal",
    content: "EBITDA dividerat med omsättning i procent. God marginal varierar per bransch: SaaS >20%, tjänster 15-20%, tillverkning 10-15%."
  },
  ebitdaStabilityScale: {
    title: "EBITDA-stabilitet",
    content: "EBITDA (resultat före räntor, skatt, avskrivningar) är det vanligaste måttet för värdering. Stabil eller växande EBITDA de senaste 3 åren ger bäst multipel."
  },
  ebitdaComment: {
    title: "EBITDA-kommentar",
    content: "Beskriv eventuella engångsposter, säsongsvariationer eller andra faktorer som påverkat EBITDA. Normaliserade siffror är viktiga för värderingen."
  },
  totalDebt: {
    title: "Total skuld",
    content: "Summan av räntebärande skulder i MSEK (banklån, checkkredit, finansiell leasing). Skulder dras normalt från företagsvärdet vid köp."
  },
  netDebt: {
    title: "Nettoskuld",
    content: "Räntebärande skulder minus likvida medel i MSEK. Negativt värde (nettokassa) adderas till värdet, positivt dras av."
  },
  cashflowMatchScale: {
    title: "Kassaflöde",
    content: "Hur väl speglar kassaflödet den redovisade lönsamheten? Stora avvikelser kan indikera kvalitetsproblem i resultatet."
  },
  cashflowComment: {
    title: "Kassaflödeskommentar",
    content: "Beskriv kassaflödesmönster, investeringsbehov och eventuella skillnader mellan bokförd vinst och faktiskt kassaflöde."
  },
  workingCapitalScale: {
    title: "Rörelsekapital",
    content: "Hur mycket kapital binds i kundfordringar, lager och leverantörsskulder? Högt rörelsekapitalbehov kan påverka köpeskillingen."
  },
  workingCapitalComment: {
    title: "Rörelsekapitalkommentar",
    content: "Beskriv säsongsvariationer i rörelsekapital, betalningstider från kunder och till leverantörer, samt lageromsättningshastighet."
  },
  debtComment: {
    title: "Skuldsättning",
    content: "Beskriv era lån, checkräkningskrediter och eventuella finansiella villkor (covenants). Skulder påverkar ofta köpeskillingen."
  },
  hasSharesInOtherCompanies: {
    title: "Aktieinnehav",
    content: "Äger bolaget aktier i andra företag, t.ex. dotterbolag, intressebolag eller finansiella placeringar? Dessa kan påverka värderingen."
  },
  sharesIncludedInValuation: {
    title: "Inkludera i värdering",
    content: "Ska aktieinnehaven följa med vid försäljningen och inkluderas i den indikativa värderingen, eller ska de delas ut/säljas separat innan?"
  },
  sharesDescription: {
    title: "Beskrivning av aktieinnehav",
    content: "Beskriv vilka aktier som ägs, deras bokförda värde och uppskattade marknadsvärde. Ange även om det finns aktieägaravtal."
  },
  hasExcessValueInAssets: {
    title: "Övervärden i tillgångar",
    content: "Finns det tillgångar som är bokförda till ett lägre värde än marknadsvärdet? T.ex. fastigheter, maskiner eller varumärken."
  },
  excessValueDescription: {
    title: "Beskrivning av övervärden",
    content: "Beskriv vilka tillgångar som har övervärden, deras bokförda värde och uppskattade marknadsvärde."
  },

  // Step 5 - Kundbas
  totalCustomers: {
    title: "Totalt antal kunder",
    content: "Fler kunder innebär lägre risk för köparen. <10 kunder = hög risk, 10-50 = medel, 50-200 = låg, >200 = mycket låg koncentrationsrisk."
  },
  concentrationPercent: {
    title: "Kundkoncentration",
    content: "Hur stor andel av intäkterna kommer från de 3-5 största kunderna? >30% på en kund anses som hög risk och kan sänka värderingen."
  },
  stabilityPercent: {
    title: "Kundstabilitet",
    content: "Andel kunder som återkommer år efter år. Hög retention (>80%) visar att ni levererar värde och att kundrelationer är stabila."
  },
  marketPositionText: {
    title: "Marknadsposition",
    content: "Beskriv er position på marknaden: Är ni marknadsledare, utmanare, nischspelare? Vilka är era främsta konkurrenter?"
  },
  marketGrowthScale: {
    title: "Marknadstillväxt",
    content: "Hur växer er marknad? En marknad med stark tillväxt (+5% årligen) ger högre värdering då det finns potential för expansion."
  },

  // Step 6 - Team & organisation
  orgStructureScale: {
    title: "Organisationsstruktur",
    content: "Finns ett tydligt organisationsschema med definierade roller, ansvar och rapporteringsvägar? Tydlig struktur underlättar integration."
  },
  personnelDataCorrect: {
    title: "Personaldata",
    content: "Är information om anställda (antal, roller, anställningsvillkor) uppdaterad och korrekt? Köpare granskar detta noggrant."
  },
  cultureText: {
    title: "Företagskultur",
    content: "Beskriv er kultur och medarbetarengagemang. Hur är stämningen? Finns det tydliga värderingar som genomsyrar organisationen?"
  },
  growthReadyScale: {
    title: "Tillväxtberedskap",
    content: "Är organisationen rustad för att växa? Finns kapacitet, kompetens och processer för att skala upp verksamheten?"
  },

  // Step 7 - Processer & system
  processDocScale: {
    title: "Processdokumentation",
    content: "Är era kärnprocesser (försäljning, leverans, support) dokumenterade? Dokumentation gör bolaget mindre personberoende."
  },
  systemLandscapeScale: {
    title: "Systemlandskap",
    content: "Vilka system använder ni (ERP, CRM, ekonomisystem)? Moderna, integrerade system är mer attraktiva för köpare."
  },
  integrationScale: {
    title: "Systemintegration",
    content: "Hur väl fungerar systemen tillsammans? Automatiserade flöden och integrationer minskar manuellt arbete och risker."
  },
  bottlenecks: {
    title: "Flaskhalsar",
    content: "Finns det begränsningar i kapacitet, processer eller system som hindrar tillväxt eller pressar marginaler? Identifiera dessa proaktivt."
  },

  // Step 8 - Risk & compliance
  creditIssues: {
    title: "Betalningsanmärkningar",
    content: "Finns det betalningsanmärkningar, skatteskulder eller kronofogdeärenden? Dessa är allvarliga röda flaggor för köpare."
  },
  taxesPaidOnTime: {
    title: "Skatter och avgifter",
    content: "Är moms, arbetsgivaravgifter, preliminärskatt och andra skatter betalda i tid? Skatteskulder är ett allvarligt problem vid due diligence."
  },
  taxDeclarationsApproved: {
    title: "Inkomstdeklarationer",
    content: "Är bolagets inkomstdeklarationer inskickade och godkända av Skatteverket? Pågående granskningar eller omprövningar bör redovisas."
  },
  disputes: {
    title: "Tvister",
    content: "Finns pågående eller hotande rättsliga tvister, konflikter med kunder/leverantörer eller garantiärenden?"
  },
  policiesScale: {
    title: "Policyer & compliance",
    content: "Har ni dokumenterade policyer för GDPR, informationssäkerhet, AML och andra regelverk som påverkar er bransch?"
  },
  itSecurityScale: {
    title: "IT-säkerhet",
    content: "Hur väl skyddat är bolaget mot cyberattacker? Inkluderar brandväggar, backup-rutiner, tvåfaktorsautentisering, kryptering och incidenthantering."
  },
  itSecurityComment: {
    title: "IT-säkerhetskommentar",
    content: "Beskriv era IT-säkerhetsrutiner: backup-lösningar, lösenordspolicyer, säkerhetsutbildning för personal, samt eventuella incidenter."
  },
  riskSummaryText: {
    title: "Risksammanfattning",
    content: "Summera de viktigaste riskerna ur en köpares perspektiv. Var ärlig – dolda risker upptäcks alltid i due diligence."
  },

  // Step 9 - Tillväxt
  growthInitiativesText: {
    title: "Tillväxtinitiativ",
    content: "Vilka 2-3 viktigaste möjligheter ser ni för tillväxt? Nya produkter, marknader, partnerskap? Detta är centralt i equity story."
  },
  unusedCapacity: {
    title: "Outnyttjad kapacitet",
    content: "Finns kapacitet (lokaler, maskiner, personal) som kan utnyttjas bättre? Outnyttjad kapacitet kan ge snabb tillväxt för ny ägare."
  },
  scalabilityScale: {
    title: "Skalbarhet",
    content: "Hur enkelt kan ni öka volymen utan att kostnaderna ökar i samma takt? SaaS och tjänsteföretag har ofta god skalbarhet."
  },
  competitionText: {
    title: "Konkurrensfördelar",
    content: "Vad gör er unika? Varumärke, teknik, kundrelationer, kostnadsfördelar? Hållbara konkurrensfördelar höjer värderingen."
  },

  // Step 10 - Försäljningsberedskap
  dataroomReadyScale: {
    title: "Datarum",
    content: "Hur nära är ni att ha ett komplett digitalt datarum med alla dokument en köpare behöver? (bokslut, avtal, anställningsavtal, etc.)"
  },
  reportingQualityScale: {
    title: "Rapportering",
    content: "Kvalitet på era interna rapporter – månadsbokslut, KPI:er, dashboards. Bra rapportering visar att ni har koll på verksamheten."
  },
  equityStoryScale: {
    title: "Equity story",
    content: "Har ni en tydlig berättelse om varför bolaget är attraktivt för en köpare? Vad är investeringshighlights och tillväxtpotential?"
  },
  timingScale: {
    title: "Timing",
    content: "Är timingen rätt för alla parter? Är ägarna redo, presterar bolaget bra, och är marknaden gynnsam för affärer?"
  }
}

// Types
export interface SanitycheckState {
  // Step 1 - Bolagsöversikt & syfte
  companyName: string
  orgNumber: string
  website: string
  industry: string
  whySell: string
  whySellReasons: string[]
  strategyScale: string
  hasPitchdeck: string
  // Step 2 - Ägarberoende & ledning
  ownerIndependent: string
  ownerIndependentComment: string
  leadershipScale: string
  leadershipComment: string
  transferPlanScale: string
  keypersonList: string
  ownerComment: string
  // Step 3 - Intäkter & affärsmodell
  recurringPercent: string
  mainProductShare: string
  otherProductShare: string
  pricingText: string
  revenueDocs: string
  // Step 4 - Lönsamhet & kassaflöde
  annualRevenue: string
  revenueGrowth: string
  ebitda: string
  ebitdaMargin: string
  ebitdaStabilityScale: string
  ebitdaComment: string
  cashflowMatchScale: string
  cashflowComment: string
  workingCapitalScale: string
  workingCapitalComment: string
  debtComment: string
  totalDebt: string
  netDebt: string
  financialDocs: string
  // Övriga tillgångar
  hasSharesInOtherCompanies: string
  sharesIncludedInValuation: string
  sharesDescription: string
  hasExcessValueInAssets: string
  excessValueDescription: string
  // Step 5 - Kundbas & marknad
  totalCustomers: string
  concentrationPercent: string
  stabilityPercent: string
  marketPositionText: string
  marketGrowthScale: string
  marketGrowthComment: string
  customerDocs: string
  // Step 6 - Team & organisation
  orgStructureScale: string
  personnelDataCorrect: string
  cultureText: string
  growthReadyScale: string
  hrDocs: string
  // Step 7 - Processer & system
  processDocScale: string
  processDocComment: string
  systemLandscapeScale: string
  systemLandscapeComment: string
  integrationScale: string
  bottlenecks: string
  bottlenecksComment: string
  processDocs: string
  // Step 8 - Risk & compliance
  creditIssues: string
  taxesPaidOnTime: string
  taxDeclarationsApproved: string
  disputes: string
  policiesScale: string
  itSecurityScale: string
  itSecurityComment: string
  riskSummaryText: string
  riskDocs: string
  // Step 9 - Tillväxt & potential
  growthInitiativesText: string
  unusedCapacity: string
  scalabilityScale: string
  competitionText: string
  growthDocs: string
  // Step 10 - Försäljningsberedskap
  dataroomReadyScale: string
  reportingQualityScale: string
  equityStoryScale: string
  timingScale: string
  saleMaterialDocs: string
  // Step 12 - Uppgradering
  upgradeChoice: string
  upgradeComment: string
}

interface AnalysisResult {
  score: number
  swot: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  valuationRange: {
    min: number
    max: number
    multipleMin: number
    multipleMax: number
    basis: string
  }
  summary: string
  recommendations: string[]
  pitchdeckSlides: string[]
}

// Demo analysis result for investor presentations
const DEMO_ANALYSIS_RESULT: AnalysisResult = {
  score: 72,
  swot: {
    strengths: [
      "Stark återkommande intäktsmodell med hög kundlojalitet",
      "Erfaren ledningsgrupp med tydlig rollfördelning",
      "Dokumenterade processer och moderna system",
      "God lönsamhet med stabilt kassaflöde"
    ],
    weaknesses: [
      "Viss kundkoncentration på de tre största kunderna",
      "Beroende av nuvarande VD för kundrelationer",
      "Behov av uppdaterad teknisk dokumentation"
    ],
    opportunities: [
      "Stark marknadstillväxt inom segmentet",
      "Möjlighet till geografisk expansion",
      "Potential för produktutveckling och nya tjänster",
      "Synergieffekter vid strategiskt förvärv"
    ],
    threats: [
      "Ökande konkurrens från större aktörer",
      "Konjunkturkänslighet i kundsegmentet",
      "Regulatoriska förändringar kan påverka branschen"
    ]
  },
  valuationRange: {
    min: 25,
    max: 40,
    multipleMin: 4.5,
    multipleMax: 7.0,
    basis: "Baserat på branschspecifika multiplar för SaaS/tjänsteföretag med god tillväxt och stabil lönsamhet. Värderingen tar hänsyn till återkommande intäkter, kundkoncentration och ägaroberoende."
  },
  summary: "Bolaget visar god säljberedskap med starka återkommande intäkter och en erfaren organisation. Vissa förbättringsområden finns kring dokumentation och kundkoncentration som kan adresseras för att maximera värdet.",
  recommendations: [
    "Dokumentera överlämningsplan för VD-funktionen",
    "Diversifiera kundbasen för att minska koncentrationsrisk",
    "Uppdatera teknisk dokumentation och systemlandskap",
    "Förbered datarum med finansiella rapporter och kundavtal",
    "Utveckla en tydlig equity story och tillväxtplan"
  ],
  pitchdeckSlides: [
    "Executive Summary",
    "Marknad & Position",
    "Affärsmodell",
    "Finansiell historik",
    "Tillväxtstrategi",
    "Team & Organisation",
    "Investment Highlights"
  ]
}

const stepMeta = [
  { id: 1, title: "Bolagsöversikt & syfte", icon: Building2 },
  { id: 2, title: "Ägarberoende & ledning", icon: Users },
  { id: 3, title: "Intäkter & affärsmodell", icon: BarChart3 },
  { id: 4, title: "Lönsamhet & kassaflöde", icon: TrendingUp },
  { id: 5, title: "Kundbas & marknad", icon: Target },
  { id: 6, title: "Team & organisation", icon: Briefcase },
  { id: 7, title: "Processer & system", icon: Settings },
  { id: 8, title: "Risk & compliance", icon: Shield },
  { id: 9, title: "Tillväxt & potential", icon: Sparkles },
  { id: 10, title: "Försäljningsberedskap", icon: FileText },
  { id: 11, title: "Sammanfattning & resultat", icon: BarChart3 },
  { id: 12, title: "Uppgradering & nästa steg", icon: TrendingUp }
]

const whySellOptions = [
  "Generationsskifte / succession",
  "Söker tillväxtpartner",
  "Vill göra exit",
  "Vill frigöra tid/kapital",
  "Strategisk avyttring",
  "Annat"
]

const scaleOptions = ["1", "2", "3", "4", "5"]

const initialState: SanitycheckState = {
  companyName: "",
  orgNumber: "",
  website: "",
  industry: "",
  whySell: "",
  whySellReasons: [],
  strategyScale: "",
  hasPitchdeck: "",
  ownerIndependent: "",
  ownerIndependentComment: "",
  leadershipScale: "",
  leadershipComment: "",
  transferPlanScale: "",
  keypersonList: "",
  ownerComment: "",
  recurringPercent: "",
  mainProductShare: "",
  otherProductShare: "",
  pricingText: "",
  revenueDocs: "",
  annualRevenue: "",
  revenueGrowth: "",
  ebitda: "",
  ebitdaMargin: "",
  ebitdaStabilityScale: "",
  ebitdaComment: "",
  cashflowMatchScale: "",
  cashflowComment: "",
  workingCapitalScale: "",
  workingCapitalComment: "",
  debtComment: "",
  totalDebt: "",
  netDebt: "",
  financialDocs: "",
  hasSharesInOtherCompanies: "",
  sharesIncludedInValuation: "",
  sharesDescription: "",
  hasExcessValueInAssets: "",
  excessValueDescription: "",
  totalCustomers: "",
  concentrationPercent: "",
  stabilityPercent: "",
  marketPositionText: "",
  marketGrowthScale: "",
  marketGrowthComment: "",
  customerDocs: "",
  orgStructureScale: "",
  personnelDataCorrect: "",
  cultureText: "",
  growthReadyScale: "",
  hrDocs: "",
  processDocScale: "",
  processDocComment: "",
  systemLandscapeScale: "",
  systemLandscapeComment: "",
  integrationScale: "",
  bottlenecks: "",
  bottlenecksComment: "",
  processDocs: "",
  creditIssues: "",
  taxesPaidOnTime: "",
  taxDeclarationsApproved: "",
  disputes: "",
  policiesScale: "",
  itSecurityScale: "",
  itSecurityComment: "",
  riskSummaryText: "",
  riskDocs: "",
  growthInitiativesText: "",
  unusedCapacity: "",
  scalabilityScale: "",
  competitionText: "",
  growthDocs: "",
  dataroomReadyScale: "",
  reportingQualityScale: "",
  equityStoryScale: "",
  timingScale: "",
  saleMaterialDocs: "",
  upgradeChoice: "",
  upgradeComment: ""
}

function isStepComplete(state: SanitycheckState, stepId: number): boolean {
  switch (stepId) {
    case 1:
      return !!(state.companyName && state.orgNumber && state.whySell.length >= 10 && state.strategyScale)
    case 2:
      return !!(state.ownerIndependent && state.leadershipScale && state.transferPlanScale)
    case 3:
      return !!(state.recurringPercent && state.mainProductShare && state.pricingText.length >= 10)
    case 4:
      return !!(state.ebitdaStabilityScale && state.cashflowMatchScale && state.workingCapitalScale && state.debtComment.length >= 5)
    case 5:
      return !!(state.concentrationPercent && state.stabilityPercent && state.marketPositionText.length >= 10 && state.marketGrowthScale)
    case 6:
      return !!(state.orgStructureScale && state.personnelDataCorrect && state.growthReadyScale)
    case 7:
      return !!(state.processDocScale && state.systemLandscapeScale && state.integrationScale && state.bottlenecks)
    case 8:
      return !!(state.creditIssues && state.disputes && state.policiesScale && state.riskSummaryText.length >= 10)
    case 9:
      return !!(state.growthInitiativesText.length >= 10 && state.unusedCapacity && state.scalabilityScale && state.competitionText.length >= 10)
    case 10:
      return !!(state.dataroomReadyScale && state.reportingQualityScale && state.equityStoryScale && state.timingScale)
    case 11:
      // Step 11 is complete when steps 1-10 are complete
      return [1,2,3,4,5,6,7,8,9,10].every(id => isStepComplete(state, id))
    case 12:
      return !!state.upgradeChoice
    default:
      return false
  }
}

interface SanitycheckWizardProps {
  onComplete?: (data: SanitycheckState, result: AnalysisResult) => void
}

export default function SanitycheckWizard({ onComplete }: SanitycheckWizardProps) {
  const [state, setState] = useState<SanitycheckState>(initialState)
  const [activeStep, setActiveStep] = useState(1)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [showIndustryModal, setShowIndustryModal] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilesState>({})

  // Handle file upload changes
  const handleFilesChange = useCallback((key: string, files: UploadedFile[]) => {
    setUploadedFiles(prev => ({ ...prev, [key]: files }))
  }, [])

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

  const mainStepsComplete = useMemo(
    () => [1,2,3,4,5,6,7,8,9,10].filter(id => completionMap[id]).length,
    [completionMap]
  )

  const readinessPercent = Math.round((mainStepsComplete / 10) * 100)

  const updateField = (field: keyof SanitycheckState, value: string | string[]) => {
    setState(prev => ({ ...prev, [field]: value }))
  }

  const toggleMultiSelect = (field: keyof SanitycheckState, option: string) => {
    setState(prev => {
      const current = (prev[field] as string[]) || []
      if (current.includes(option)) {
        return { ...prev, [field]: current.filter(o => o !== option) }
      }
      return { ...prev, [field]: [...current, option] }
    })
  }

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const res = await fetch('/api/sanitycheck-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      })
      
      if (!res.ok) {
        throw new Error('Analysen misslyckades')
      }
      
      const result = await res.json()
      setAnalysisResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setIsAnalyzing(false)
    }
  }, [state])

  const generatePdf = useCallback(async () => {
    if (!analysisResult) return
    
    setIsGeneratingPdf(true)
    
    // Use demo data if no company name is provided
    const companyName = state.companyName || 'Exempelföretag AB'
    const orgNumber = state.orgNumber || '556123-4567'
    const industry = state.industry || 'Teknologi / SaaS'
    const website = state.website || 'www.exempel.se'
    
    try {
      const res = await fetch('/api/sanitycheck-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          orgNumber,
          industry,
          website,
          analysisResult,
          formData: state
        })
      })
      
      if (!res.ok) {
        throw new Error('PDF-genereringen misslyckades')
      }
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sanitycheck-${companyName.replace(/[^a-zA-Z0-9åäöÅÄÖ\s]/g, '').replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte generera PDF')
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [analysisResult, state])

  const goNext = async () => {
    if (activeStep === 10 && !analysisResult) {
      await runAnalysis()
    }
    setActiveStep(s => Math.min(stepMeta.length, s + 1))
  }

  const goPrev = () => {
    setActiveStep(s => Math.max(1, s - 1))
  }

  const renderScalePills = (field: keyof SanitycheckState, label: string, helpKey?: keyof typeof HELP_TEXTS) => (
    <div>
      <div className="flex items-center mb-3">
        <span className="text-sm font-medium text-white/80">{label}</span>
        {helpKey && HELP_TEXTS[helpKey] && (
          <HelpTooltip content={HELP_TEXTS[helpKey].content} title={HELP_TEXTS[helpKey].title} />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {scaleOptions.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => updateField(field, opt)}
            className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 ${
              state[field] === opt
                ? 'bg-white text-navy'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <p className="text-xs text-white/50 mt-2">1 = Lågt/Nej, 5 = Högt/Ja</p>
    </div>
  )

  const renderYesNo = (field: keyof SanitycheckState, label: string, helpKey?: keyof typeof HELP_TEXTS) => (
    <div>
      <div className="flex items-center mb-3">
        <span className="text-sm font-medium text-white/80">{label}</span>
        {helpKey && HELP_TEXTS[helpKey] && (
          <HelpTooltip content={HELP_TEXTS[helpKey].content} title={HELP_TEXTS[helpKey].title} />
        )}
      </div>
      <div className="flex gap-3">
        {["Ja", "Nej"].map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => updateField(field, opt)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              state[field] === opt
                ? 'bg-white text-navy'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )

  // Special version for document questions with file upload
  const renderDocumentQuestion = (
    field: keyof SanitycheckState, 
    label: string, 
    uploadLabel: string,
    helpKey?: keyof typeof HELP_TEXTS
  ) => (
    <div>
      <div className="flex items-center mb-3">
        <span className="text-sm font-medium text-white/80">{label}</span>
        {helpKey && HELP_TEXTS[helpKey] && (
          <HelpTooltip content={HELP_TEXTS[helpKey].content} title={HELP_TEXTS[helpKey].title} />
        )}
      </div>
      <div className="flex gap-3">
        {["Ja", "Nej"].map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => updateField(field, opt)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              state[field] === opt
                ? 'bg-white text-navy'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      
      {/* Show file upload when "Ja" is selected */}
      {state[field] === "Ja" && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">{uploadLabel}</span>
          </div>
          <FileUploadZone
            fieldKey={field}
            files={uploadedFiles[field] || []}
            onFilesChange={handleFilesChange}
          />
          {(uploadedFiles[field]?.length || 0) > 0 && (
            <p className="text-xs text-emerald-400/70 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {uploadedFiles[field].length} fil(er) uppladdad(e)
            </p>
          )}
        </div>
      )}
    </div>
  )

  const renderStep = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">1. Bolagsöversikt & syfte</h2>
              <p className="text-white/70">Grundläggande bild av bolaget, nyckeltal och varför ni överväger en försäljning.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <LabelWithHelp label="Bolagsnamn" helpContent={HELP_TEXTS.companyName.content} helpTitle={HELP_TEXTS.companyName.title} required />
                <input
                  type="text"
                  value={state.companyName}
                  onChange={e => updateField("companyName", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="Företag AB"
                />
              </div>
              <div>
                <LabelWithHelp label="Organisationsnummer" helpContent={HELP_TEXTS.orgNumber.content} helpTitle={HELP_TEXTS.orgNumber.title} required />
                <input
                  type="text"
                  value={state.orgNumber}
                  onChange={e => updateField("orgNumber", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="556XXX-XXXX"
                />
              </div>
              <div>
                <LabelWithHelp label="Hemsida" helpContent={HELP_TEXTS.website.content} helpTitle={HELP_TEXTS.website.title} />
                <input
                  type="text"
                  value={state.website}
                  onChange={e => updateField("website", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="https://..."
                />
              </div>
              <div>
                <LabelWithHelp label="Bransch" helpContent={HELP_TEXTS.industry.content} helpTitle={HELP_TEXTS.industry.title} />
                <button
                  type="button"
                  onClick={() => setShowIndustryModal(true)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-left text-white focus:outline-none focus:border-white/40 transition-colors flex items-center justify-between hover:bg-white/15"
                >
                  <span className={state.industry ? 'text-white' : 'text-white/40'}>
                    {state.industry || 'Välj bransch...'}
                  </span>
                  <ChevronDown className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <LabelWithHelp label="Kort om varför ni överväger att sälja" helpContent={HELP_TEXTS.whySell.content} helpTitle={HELP_TEXTS.whySell.title} required />
              <textarea
                value={state.whySell}
                onChange={e => updateField("whySell", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[100px]"
                placeholder="Beskriv bakgrunden till att ni överväger en försäljning..."
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {whySellOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMultiSelect("whySellReasons", opt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      state.whySellReasons.includes(opt)
                        ? 'bg-white text-navy'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {renderScalePills("strategyScale", "Hur tydlig är bolagets strategi kommande 3 år? *", "strategyScale")}
              {renderDocumentQuestion("hasPitchdeck", "Har ni redan en bolagspresentation eller pitchdeck?", "Ladda upp pitchdeck/presentation", "hasPitchdeck")}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">2. Ägarberoende & ledning</h2>
              <p className="text-white/70">Hur beroende är verksamheten av nuvarande ägare och nyckelpersoner?</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                {renderYesNo("ownerIndependent", "Bolaget kan fungera i vardagen utan nuvarande ägare *", "ownerIndependent")}
                <label className="block text-sm font-medium text-white/80 mb-2 mt-4">Kommentar (valfritt)</label>
                <textarea
                  value={state.ownerIndependentComment}
                  onChange={e => updateField("ownerIndependentComment", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[80px]"
                />
              </div>
              <div>
                {renderScalePills("leadershipScale", "Formellt definierat ledningsteam (roller, ansvar) *", "leadershipScale")}
                <label className="block text-sm font-medium text-white/80 mb-2 mt-4">Kommentar (valfritt)</label>
                <textarea
                  value={state.leadershipComment}
                  onChange={e => updateField("leadershipComment", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[80px]"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {renderScalePills("transferPlanScale", "Plan för överlämning av kompetens och ansvar *", "transferPlanScale")}
              {renderDocumentQuestion("keypersonList", "Lista över nyckelpersoner (roller, ansvar) är framtagen", "Ladda upp nyckelpersonslista", "keypersonList")}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Kommentar kring sårbarheter kopplat till ägare/nyckelpersoner</label>
              <textarea
                value={state.ownerComment}
                onChange={e => updateField("ownerComment", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[80px]"
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">3. Intäkter & affärsmodell</h2>
              <p className="text-white/70">Hur bolaget tjänar pengar och hur stabila intäkterna är över tid.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <LabelWithHelp label="Andel återkommande intäkter (%)" helpContent={HELP_TEXTS.recurringPercent.content} helpTitle={HELP_TEXTS.recurringPercent.title} required />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={state.recurringPercent}
                  onChange={e => updateField("recurringPercent", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="0-100"
                />
                <p className="text-xs text-white/50 mt-1">Andel av omsättning som är återkommande (avtal/abonnemang)</p>
              </div>
              <div>
                <LabelWithHelp label="Andel från huvudprodukter/tjänster (%)" helpContent={HELP_TEXTS.mainProductShare.content} helpTitle={HELP_TEXTS.mainProductShare.title} required />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={state.mainProductShare}
                  onChange={e => updateField("mainProductShare", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="0-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Andel från övriga produkter/tjänster (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={state.otherProductShare}
                  onChange={e => updateField("otherProductShare", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="0-100"
                />
              </div>
              {renderDocumentQuestion("revenueDocs", "Underlag för intäktsfördelning är framtaget", "Ladda upp intäktsunderlag")}
            </div>

            <div>
              <LabelWithHelp label="Beskrivning av prissättningsmodell" helpContent={HELP_TEXTS.pricingText.content} helpTitle={HELP_TEXTS.pricingText.title} required />
              <textarea
                value={state.pricingText}
                onChange={e => updateField("pricingText", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[100px]"
                placeholder="Beskriv hur ni prissätter era produkter/tjänster (fast pris, abonnemang, usage-based, etc.)"
              />
            </div>
          </div>
        )

      case 4:
        // Calculate EBITDA margin if both values exist
        const revenue = parseFloat(state.annualRevenue) || 0
        const ebitdaVal = parseFloat(state.ebitda) || 0
        const calculatedMargin = revenue > 0 && ebitdaVal > 0 ? ((ebitdaVal / revenue) * 100).toFixed(1) : null

        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">4. Lönsamhet & kassaflöde</h2>
              <p className="text-white/70">Lönsamhet, kassaflöde och rörelsekapital ur en köpares perspektiv.</p>
            </div>

            {/* Finansiella nyckeltal - VIKTIGT för värdering */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl p-5 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Finansiella nyckeltal</h3>
                  <p className="text-xs text-white/60">Dessa siffror används för att beräkna den indikativa värderingen</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <LabelWithHelp label="Årsomsättning (MSEK)" helpContent={HELP_TEXTS.annualRevenue.content} helpTitle={HELP_TEXTS.annualRevenue.title} required />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={state.annualRevenue}
                    onChange={e => updateField("annualRevenue", e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="T.ex. 25.5"
                  />
                </div>
                <div>
                  <LabelWithHelp label="Omsättningstillväxt (%)" helpContent={HELP_TEXTS.revenueGrowth.content} helpTitle={HELP_TEXTS.revenueGrowth.title} />
                  <input
                    type="number"
                    step="0.1"
                    value={state.revenueGrowth}
                    onChange={e => updateField("revenueGrowth", e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="T.ex. 12 (CAGR senaste 3 år)"
                  />
                </div>
                <div>
                  <LabelWithHelp label="EBITDA (MSEK)" helpContent={HELP_TEXTS.ebitda.content} helpTitle={HELP_TEXTS.ebitda.title} required />
                  <input
                    type="number"
                    step="0.1"
                    value={state.ebitda}
                    onChange={e => updateField("ebitda", e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="T.ex. 4.2 (normaliserad)"
                  />
                </div>
                <div>
                  <LabelWithHelp label="EBITDA-marginal (%)" helpContent={HELP_TEXTS.ebitdaMargin.content} helpTitle={HELP_TEXTS.ebitdaMargin.title} />
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={state.ebitdaMargin || (calculatedMargin || "")}
                      onChange={e => updateField("ebitdaMargin", e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                      placeholder="Beräknas automatiskt"
                    />
                    {calculatedMargin && !state.ebitdaMargin && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400">
                        Auto: {calculatedMargin}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Skuldsättning för equity value */}
              <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                <div>
                  <LabelWithHelp label="Räntebärande skulder (MSEK)" helpContent={HELP_TEXTS.totalDebt.content} helpTitle={HELP_TEXTS.totalDebt.title} />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={state.totalDebt}
                    onChange={e => updateField("totalDebt", e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="T.ex. 3.0"
                  />
                </div>
                <div>
                  <LabelWithHelp label="Nettoskuld (MSEK)" helpContent={HELP_TEXTS.netDebt.content} helpTitle={HELP_TEXTS.netDebt.title} />
                  <input
                    type="number"
                    step="0.1"
                    value={state.netDebt}
                    onChange={e => updateField("netDebt", e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="T.ex. 1.5 (negativt = nettokassa)"
                  />
                </div>
              </div>

              {/* Info om värdering */}
              {revenue > 0 && ebitdaVal > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-white/10 border border-white/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">Indikativ beräkning</p>
                      <p className="text-xs text-white/70 mt-1">
                        Baserat på {ebitdaVal} MSEK EBITDA och branschmultiplar kan företagsvärdet (EV) 
                        preliminärt uppskattas till {(ebitdaVal * 4).toFixed(1)}-{(ebitdaVal * 7).toFixed(1)} MSEK.
                        {parseFloat(state.netDebt) > 0 && ` Justerat för nettoskuld: ${(ebitdaVal * 4 - parseFloat(state.netDebt)).toFixed(1)}-${(ebitdaVal * 7 - parseFloat(state.netDebt)).toFixed(1)} MSEK.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* EBITDA kvalitet */}
            <div className="bg-white/5 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">EBITDA-kvalitet</h3>
              </div>
              {renderScalePills("ebitdaStabilityScale", "Stabilitet i EBITDA de senaste 3 åren *", "ebitdaStabilityScale")}
              <div>
                <LabelWithHelp label="Kommentar kring EBITDA" helpContent={HELP_TEXTS.ebitdaComment.content} helpTitle={HELP_TEXTS.ebitdaComment.title} />
                <textarea
                  value={state.ebitdaComment}
                  onChange={e => updateField("ebitdaComment", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[80px]"
                  placeholder="T.ex. engångsposter, säsongsvariationer, normaliserad EBITDA..."
                />
              </div>
            </div>

            {/* Kassaflöde */}
            <div className="bg-white/5 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Kassaflöde</h3>
              </div>
              {renderScalePills("cashflowMatchScale", "Hur väl speglar kassaflödet lönsamheten? *", "cashflowMatchScale")}
              <div>
                <LabelWithHelp label="Kommentar kring kassaflöde" helpContent={HELP_TEXTS.cashflowComment.content} helpTitle={HELP_TEXTS.cashflowComment.title} />
                <textarea
                  value={state.cashflowComment}
                  onChange={e => updateField("cashflowComment", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[80px]"
                  placeholder="T.ex. investeringsbehov, skillnad mellan vinst och kassaflöde..."
                />
              </div>
            </div>

            {/* Rörelsekapital */}
            <div className="bg-white/5 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Rörelsekapital</h3>
              </div>
              {renderScalePills("workingCapitalScale", "Rörelsekapitalnivå i förhållande till omsättning *", "workingCapitalScale")}
              <div>
                <LabelWithHelp label="Kommentar kring rörelsekapital" helpContent={HELP_TEXTS.workingCapitalComment.content} helpTitle={HELP_TEXTS.workingCapitalComment.title} />
                <textarea
                  value={state.workingCapitalComment}
                  onChange={e => updateField("workingCapitalComment", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[80px]"
                  placeholder="T.ex. säsongsvariationer, betalningstider, lageromsättning..."
                />
              </div>
            </div>

            {/* Skuldsättning */}
            <div className="bg-white/5 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Skuldsättning</h3>
              </div>
              <div>
                <LabelWithHelp label="Kommentar kring lån, skulder och eventuella covenants" helpContent={HELP_TEXTS.debtComment.content} helpTitle={HELP_TEXTS.debtComment.title} required />
                <textarea
                  value={state.debtComment}
                  onChange={e => updateField("debtComment", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[100px]"
                  placeholder="T.ex. banklån, checkräkningskredit, leasing, covenants..."
                />
              </div>
            </div>

            {/* Övriga tillgångar */}
            <div className="bg-white/5 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Övriga tillgångar</h3>
              </div>
              
              {/* Aktieinnehav */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center mb-3">
                    <span className="text-sm font-medium text-white/80">Äger bolaget aktier i andra företag?</span>
                    <HelpTooltip content={HELP_TEXTS.hasSharesInOtherCompanies.content} title={HELP_TEXTS.hasSharesInOtherCompanies.title} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["Ja", "Nej"].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateField("hasSharesInOtherCompanies", opt)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          state.hasSharesInOtherCompanies === opt
                            ? 'bg-white text-navy'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {state.hasSharesInOtherCompanies === "Ja" && (
                  <div className="pl-4 border-l-2 border-purple-500/30 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <div className="flex items-center mb-3">
                        <span className="text-sm font-medium text-white/80">Ska aktierna inkluderas i värderingen?</span>
                        <HelpTooltip content={HELP_TEXTS.sharesIncludedInValuation.content} title={HELP_TEXTS.sharesIncludedInValuation.title} />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {["Ja, inkludera", "Nej, delas ut separat", "Osäkert"].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateField("sharesIncludedInValuation", opt)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              state.sharesIncludedInValuation === opt
                                ? 'bg-white text-navy'
                                : 'bg-white/10 text-white/80 hover:bg-white/20'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <LabelWithHelp label="Beskriv aktieinnehaven" helpContent={HELP_TEXTS.sharesDescription.content} helpTitle={HELP_TEXTS.sharesDescription.title} />
                      <textarea
                        value={state.sharesDescription}
                        onChange={e => updateField("sharesDescription", e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[80px]"
                        placeholder="T.ex. 100% i Dotterbolag AB (bokfört 500 tkr, marknadsvärde ca 2 MSEK)..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Övervärden i materiella tillgångar */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div>
                  <div className="flex items-center mb-3">
                    <span className="text-sm font-medium text-white/80">Finns övervärden i materiella anläggningstillgångar?</span>
                    <HelpTooltip content={HELP_TEXTS.hasExcessValueInAssets.content} title={HELP_TEXTS.hasExcessValueInAssets.title} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["Ja", "Nej", "Vet ej"].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateField("hasExcessValueInAssets", opt)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          state.hasExcessValueInAssets === opt
                            ? 'bg-white text-navy'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {state.hasExcessValueInAssets === "Ja" && (
                  <div className="pl-4 border-l-2 border-purple-500/30 animate-in slide-in-from-top-2 duration-300">
                    <LabelWithHelp label="Beskriv övervärden i tillgångar" helpContent={HELP_TEXTS.excessValueDescription.content} helpTitle={HELP_TEXTS.excessValueDescription.title} />
                    <textarea
                      value={state.excessValueDescription}
                      onChange={e => updateField("excessValueDescription", e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[80px]"
                      placeholder="T.ex. Fastighet bokförd till 3 MSEK, marknadsvärde ca 8 MSEK..."
                    />
                  </div>
                )}
              </div>

              {/* Info box about valuation impact */}
              {(state.hasSharesInOtherCompanies === "Ja" || state.hasExcessValueInAssets === "Ja") && (
                <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-purple-400/90">
                      Övriga tillgångar kan väsentligt påverka den indikativa värderingen. Se till att dessa värderas separat vid en försäljningsprocess.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Dokument */}
            <div className="border-t border-white/10 pt-6">
              {renderDocumentQuestion("financialDocs", "Bokslut, månadsrapporter och prognoser är sammanställda", "Ladda upp finansiella dokument")}
            </div>
          </div>
        )

      case 5:
        // Calculate customer risk level
        const customerCount = parseInt(state.totalCustomers) || 0
        const customerRisk = customerCount === 0 ? null : 
          customerCount < 10 ? { level: 'high', label: 'Hög risk', color: 'rose', description: 'Mycket få kunder ökar beroendet betydligt' } :
          customerCount < 50 ? { level: 'medium', label: 'Medel risk', color: 'amber', description: 'Viss kundkoncentration, men hanterbar' } :
          customerCount < 200 ? { level: 'low', label: 'Låg risk', color: 'emerald', description: 'God spridning av kundbasen' } :
          { level: 'verylow', label: 'Mycket låg risk', color: 'emerald', description: 'Utmärkt diversifiering av kundbasen' }

        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">5. Kundbas & marknad</h2>
              <p className="text-white/70">Kundbas, kundkoncentration och marknadsposition.</p>
            </div>
            
            {/* Antal kunder med riskindikator */}
            <div className="bg-white/5 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Kundportfölj</h3>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <LabelWithHelp label="Totalt antal kunder" helpContent={HELP_TEXTS.totalCustomers.content} helpTitle={HELP_TEXTS.totalCustomers.title} required />
                  <input
                    type="number"
                    min="0"
                    value={state.totalCustomers}
                    onChange={e => updateField("totalCustomers", e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="Ange antal"
                  />
                </div>
                <div>
                  <LabelWithHelp label="Andel på toppkunder (%)" helpContent={HELP_TEXTS.concentrationPercent.content} helpTitle={HELP_TEXTS.concentrationPercent.title} required />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={state.concentrationPercent}
                    onChange={e => updateField("concentrationPercent", e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="Top 3-5 kunder"
                  />
                </div>
                <div>
                  <LabelWithHelp label="Återkommande kunder (%)" helpContent={HELP_TEXTS.stabilityPercent.content} helpTitle={HELP_TEXTS.stabilityPercent.title} required />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={state.stabilityPercent}
                    onChange={e => updateField("stabilityPercent", e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="Årlig retention"
                  />
                </div>
              </div>

              {/* Risk indicator */}
              {customerRisk && (
                <div className={`mt-4 p-3 rounded-lg border ${
                  customerRisk.color === 'rose' ? 'bg-rose-500/10 border-rose-500/30' :
                  customerRisk.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-emerald-500/10 border-emerald-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      customerRisk.color === 'rose' ? 'bg-rose-500' :
                      customerRisk.color === 'amber' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      customerRisk.color === 'rose' ? 'text-rose-400' :
                      customerRisk.color === 'amber' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      Kundkoncentrationsrisk: {customerRisk.label}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${
                    customerRisk.color === 'rose' ? 'text-rose-400/70' :
                    customerRisk.color === 'amber' ? 'text-amber-400/70' :
                    'text-emerald-400/70'
                  }`}>
                    {customerRisk.description}
                  </p>
                </div>
              )}
            </div>

            <div>
              <LabelWithHelp label="Beskriv er marknadsposition" helpContent={HELP_TEXTS.marketPositionText.content} helpTitle={HELP_TEXTS.marketPositionText.title} required />
              <textarea
                value={state.marketPositionText}
                onChange={e => updateField("marketPositionText", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[100px]"
                placeholder="Nisch, lokal/regional/nationell, konkurrenter, etc."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {renderScalePills("marketGrowthScale", "Marknadens tillväxttakt och framtidsutsikter *", "marketGrowthScale")}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Motivering</label>
                <textarea
                  value={state.marketGrowthComment}
                  onChange={e => updateField("marketGrowthComment", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[80px]"
                />
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">6. Team & organisation</h2>
              <p className="text-white/70">Organisation, kultur och hur skalbar verksamheten är.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {renderScalePills("orgStructureScale", "Tydlig organisationsstruktur (roller, rapportering) *", "orgStructureScale")}
              {renderYesNo("personnelDataCorrect", "Personaldata (antal, roller) är uppdaterad och korrekt *", "personnelDataCorrect")}
              {renderScalePills("growthReadyScale", "Hur väl rustad är organisationen för att växa? *", "growthReadyScale")}
              {renderDocumentQuestion("hrDocs", "Nyckelavtal (anställning, incitamentsprogram) är sammanställda", "Ladda upp HR-dokument")}
            </div>

            <div>
              <LabelWithHelp label="Hur skulle ni beskriva bolagets kultur och engagemang?" helpContent={HELP_TEXTS.cultureText.content} helpTitle={HELP_TEXTS.cultureText.title} />
              <textarea
                value={state.cultureText}
                onChange={e => updateField("cultureText", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[100px]"
              />
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">7. Processer & system</h2>
              <p className="text-white/70">Kärnprocesser och hur väl systemen stödjer affären.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                {renderScalePills("processDocScale", "Kärnprocesser är dokumenterade *", "processDocScale")}
                <textarea
                  value={state.processDocComment}
                  onChange={e => updateField("processDocComment", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[60px] mt-3"
                  placeholder="Kommentar..."
                />
              </div>
              <div>
                {renderScalePills("systemLandscapeScale", "Systemlandskap (ERP, CRM, etc.) *", "systemLandscapeScale")}
                <textarea
                  value={state.systemLandscapeComment}
                  onChange={e => updateField("systemLandscapeComment", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[60px] mt-3"
                  placeholder="Kommentar..."
                />
              </div>
              {renderScalePills("integrationScale", "Hur väl integrerade är systemen? *", "integrationScale")}
              <div>
                {renderYesNo("bottlenecks", "Finns flaskhalsar som begränsar tillväxt/marginaler? *", "bottlenecks")}
                <textarea
                  value={state.bottlenecksComment}
                  onChange={e => updateField("bottlenecksComment", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[60px] mt-3"
                  placeholder="Beskriv eventuella flaskhalsar..."
                />
              </div>
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">8. Risk & compliance</h2>
              <p className="text-white/70">Juridisk, finansiell och operativ risk.</p>
            </div>
            
            {/* Finansiell risk */}
            <div className="bg-white/5 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Finansiell risk</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center mb-3">
                    <span className="text-sm font-medium text-white/80">Finns betalningsanmärkningar/skulder? *</span>
                    <HelpTooltip content={HELP_TEXTS.creditIssues.content} title={HELP_TEXTS.creditIssues.title} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["Ja", "Nej", "Vet ej"].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateField("creditIssues", opt)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          state.creditIssues === opt
                            ? 'bg-white text-navy'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                {renderYesNo("disputes", "Finns kända tvister eller konflikter? *", "disputes")}
              </div>
            </div>

            {/* Skatter & deklarationer */}
            <div className="bg-white/5 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Skatter & deklarationer</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center mb-3">
                    <span className="text-sm font-medium text-white/80">Är skatter och avgifter betalda i tid? *</span>
                    <HelpTooltip content={HELP_TEXTS.taxesPaidOnTime.content} title={HELP_TEXTS.taxesPaidOnTime.title} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["Ja", "Nej", "Delvis"].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateField("taxesPaidOnTime", opt)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          state.taxesPaidOnTime === opt
                            ? 'bg-white text-navy'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center mb-3">
                    <span className="text-sm font-medium text-white/80">Inkomstdeklarationer inskickade och godkända? *</span>
                    <HelpTooltip content={HELP_TEXTS.taxDeclarationsApproved.content} title={HELP_TEXTS.taxDeclarationsApproved.title} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["Ja", "Nej", "Pågående granskning"].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateField("taxDeclarationsApproved", opt)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          state.taxDeclarationsApproved === opt
                            ? 'bg-white text-navy'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Warning if issues */}
              {(state.taxesPaidOnTime === "Nej" || state.taxesPaidOnTime === "Delvis" || state.taxDeclarationsApproved === "Nej" || state.taxDeclarationsApproved === "Pågående granskning") && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-400/90">
                      Skatteproblem upptäcks alltid i due diligence. Se till att ha en tydlig plan för att lösa eventuella eftersläpningar innan försäljningsprocessen startar.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* IT-säkerhet */}
            <div className="bg-white/5 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">IT-säkerhet</h3>
              </div>
              
              {renderScalePills("itSecurityScale", "Hur väl skyddat är bolaget mot cyberattacker? *", "itSecurityScale")}
              
              <div>
                <LabelWithHelp label="Beskriv era IT-säkerhetsrutiner" helpContent={HELP_TEXTS.itSecurityComment.content} helpTitle={HELP_TEXTS.itSecurityComment.title} />
                <textarea
                  value={state.itSecurityComment}
                  onChange={e => updateField("itSecurityComment", e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[80px]"
                  placeholder="T.ex. backup-rutiner, brandvägg, 2FA, kryptering, säkerhetsutbildning..."
                />
              </div>
            </div>

            {/* Policyer & compliance */}
            <div className="bg-white/5 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Policyer & compliance</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  {renderScalePills("policiesScale", "Dokumenterade policyer (GDPR, säkerhet, AML) *", "policiesScale")}
                </div>
                <div>
                  {renderDocumentQuestion("riskDocs", "Risk- eller revisionsrapporter är sammanställda", "Ladda upp riskrapporter")}
                </div>
              </div>
            </div>

            {/* Risksammanfattning */}
            <div className="border-t border-white/10 pt-6">
              <LabelWithHelp label="Sammanfattning av de viktigaste riskerna" helpContent={HELP_TEXTS.riskSummaryText.content} helpTitle={HELP_TEXTS.riskSummaryText.title} required />
              <textarea
                value={state.riskSummaryText}
                onChange={e => updateField("riskSummaryText", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[100px]"
                placeholder="Summera de viktigaste riskerna ur en köpares perspektiv..."
              />
            </div>
          </div>
        )

      case 9:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">9. Tillväxt & potential</h2>
              <p className="text-white/70">Vilken potential en framtida köpare kan se.</p>
            </div>
            
            <div>
              <LabelWithHelp label="Vilka 2-3 viktigaste tillväxtinitiativ ser ni framåt?" helpContent={HELP_TEXTS.growthInitiativesText.content} helpTitle={HELP_TEXTS.growthInitiativesText.title} required />
              <textarea
                value={state.growthInitiativesText}
                onChange={e => updateField("growthInitiativesText", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[100px]"
                placeholder="Nya produkter, marknader, partnerskap, etc."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {renderYesNo("unusedCapacity", "Finns outnyttjad kapacitet som kan utnyttjas? *", "unusedCapacity")}
              {renderScalePills("scalabilityScale", "Hur skalbar är affärsmodellen vid ökad volym? *", "scalabilityScale")}
              {renderDocumentQuestion("growthDocs", "Strategidokument eller tillväxtplaner är framtagna", "Ladda upp tillväxtplaner")}
            </div>

            <div>
              <LabelWithHelp label="Konkurrenssituation – vad gör er unika?" helpContent={HELP_TEXTS.competitionText.content} helpTitle={HELP_TEXTS.competitionText.title} required />
              <textarea
                value={state.competitionText}
                onChange={e => updateField("competitionText", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[100px]"
              />
            </div>
          </div>
        )

      case 10:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">10. Försäljningsberedskap</h2>
              <p className="text-white/70">Hur redo bolaget är att gå in i en strukturerad process.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {renderScalePills("dataroomReadyScale", "Hur nära är ni ett färdigt datarum? *", "dataroomReadyScale")}
              {renderScalePills("reportingQualityScale", "Kvalitet på rapportering (KPI:er, dashboards) *", "reportingQualityScale")}
              {renderScalePills("equityStoryScale", "Hur tydlig är er 'equity story'? *", "equityStoryScale")}
              {renderScalePills("timingScale", "Är timing rätt för er (ägare, bolag, marknad)? *", "timingScale")}
            </div>

            <div>
              {renderDocumentQuestion("saleMaterialDocs", "Övrigt material för pitchdeck/teaser är framtaget", "Ladda upp säljmaterial")}
            </div>

            {mainStepsComplete === 10 && (
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 mt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300 font-medium">Alla steg är ifyllda! Klicka på "Nästa steg" för att se din analys.</span>
                </div>
              </div>
            )}
          </div>
        )

      case 11:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">11. Sammanfattning & resultat</h2>
              <p className="text-white/70">Investeraranpassat sammandrag baserat på dina svar.</p>
            </div>

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                <p className="text-white/80 text-lg">Analyserar ditt bolag med AI...</p>
                <p className="text-white/60 text-sm mt-2">Detta kan ta upp till 30 sekunder</p>
              </div>
            ) : error ? (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 text-red-300">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={runAnalysis}
                  className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Försök igen
                </button>
              </div>
            ) : analysisResult ? (
              <>
                {/* Readiness Score */}
                <div className="bg-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Samlad säljberedskap</h3>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24">
                      <svg className="transform -rotate-90 w-24 h-24">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-white/10"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 - (analysisResult.score / 100) * 251.2}
                          className="text-emerald-400"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
                        {analysisResult.score}
                      </span>
                    </div>
                    <div>
                      <p className="text-white/80">{analysisResult.summary}</p>
                    </div>
                  </div>
                </div>

                {/* SWOT */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">SWOT-analys</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
                      <h4 className="font-semibold text-emerald-300 mb-2">Styrkor</h4>
                      <ul className="space-y-1">
                        {analysisResult.swot.strengths.map((s, i) => (
                          <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4">
                      <h4 className="font-semibold text-amber-300 mb-2">Svagheter</h4>
                      <ul className="space-y-1">
                        {analysisResult.swot.weaknesses.map((w, i) => (
                          <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-300 mb-2">Möjligheter</h4>
                      <ul className="space-y-1">
                        {analysisResult.swot.opportunities.map((o, i) => (
                          <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                      <h4 className="font-semibold text-red-300 mb-2">Hot</h4>
                      <ul className="space-y-1">
                        {analysisResult.swot.threats.map((t, i) => (
                          <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                            <Shield className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Valuation Range */}
                <div className="bg-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Indikativt värderingsspann</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-navy rounded-xl px-6 py-4 text-center">
                      <p className="text-white/60 text-sm">Spann</p>
                      <p className="text-2xl font-bold text-white">
                        {analysisResult.valuationRange.min}–{analysisResult.valuationRange.max} MSEK
                      </p>
                    </div>
                    <div className="bg-navy rounded-xl px-6 py-4 text-center">
                      <p className="text-white/60 text-sm">Multipel</p>
                      <p className="text-2xl font-bold text-white">
                        {analysisResult.valuationRange.multipleMin}–{analysisResult.valuationRange.multipleMax}× EBITDA
                      </p>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm">{analysisResult.valuationRange.basis}</p>
                </div>

                {/* Recommendations */}
                <div className="bg-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Rekommendationer</h3>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/80">
                        <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pitchdeck Preview */}
                <div className="bg-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Pitchdeck-struktur</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.pitchdeckSlides.map((slide, i) => (
                      <span key={i} className="bg-navy/50 text-white/80 px-3 py-1.5 rounded-full text-sm">
                        {slide}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Download PDF Button */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={generatePdf}
                    disabled={isGeneratingPdf}
                    className="relative group px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700"
                  >
                    {/* Pulsing shadow effect */}
                    {!isGeneratingPdf && (
                      <span className="absolute inset-0 rounded-2xl bg-emerald-500 animate-ping opacity-20" />
                    )}
                    <span className="relative flex items-center gap-3">
                      {isGeneratingPdf ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Genererar PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Ladda ner rapport (PDF)
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-white/10 rounded-2xl p-8 text-center max-w-md">
                  <Sparkles className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Redo att generera din rapport?</h3>
                  <p className="text-white/60 mb-6">
                    {mainStepsComplete < 10 
                      ? `Fyll i resterande ${10 - mainStepsComplete} steg för att få din fullständiga analys.`
                      : 'Klicka på knappen nedan för att skapa din personliga sanitycheck-rapport.'
                    }
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={runAnalysis}
                      disabled={mainStepsComplete < 10 || isAnalyzing}
                      className={`
                        relative group px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300
                        ${mainStepsComplete >= 10 
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 cursor-pointer'
                          : 'bg-white/20 text-white/50 cursor-not-allowed'
                        }
                      `}
                    >
                      {/* Pulsing shadow effect */}
                      {mainStepsComplete >= 10 && !isAnalyzing && (
                        <span className="absolute inset-0 rounded-2xl bg-emerald-500 animate-ping opacity-25" />
                      )}
                      <span className="relative flex items-center gap-3">
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Analyserar...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Generera rapport
                          </>
                        )}
                      </span>
                    </button>
                    
                    {/* Demo PDF Download Button */}
                    <button
                      onClick={() => {
                        setAnalysisResult(DEMO_ANALYSIS_RESULT)
                      }}
                      className="px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 bg-white/10 text-white hover:bg-white/20 border border-white/20"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" />
                        Visa exempelrapport
                      </span>
                    </button>
                  </div>
                  
                  {mainStepsComplete < 10 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(mainStepsComplete / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-white/60 text-sm whitespace-nowrap">{mainStepsComplete}/10</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )

      case 12:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">12. Uppgradering & nästa steg</h2>
              <p className="text-white/70">Du använder idag sanitycheck i freemium-läge. Vill du uppgradera?</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-4">Val av paket</label>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { id: "freemium", label: "Freemium", desc: "Gratis sanitycheck med grundläggande feedback" },
                  { id: "base", label: "Baspaket", desc: "Full sanitycheck, SWOT och indikativt värderingsspann", price: "4 995 kr" },
                  { id: "premium", label: "Premium", desc: "Bas + fördjupade mallar, pitchdeck-stöd och guidning", price: "14 995 kr" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateField("upgradeChoice", opt.id)}
                    className={`p-6 rounded-2xl text-left transition-all duration-200 ${
                      state.upgradeChoice === opt.id
                        ? 'bg-white text-navy ring-2 ring-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <h4 className={`font-bold mb-1 ${state.upgradeChoice === opt.id ? 'text-navy' : 'text-white'}`}>{opt.label}</h4>
                    <p className={`text-sm mb-2 ${state.upgradeChoice === opt.id ? 'text-navy/70' : 'text-white/80'}`}>
                      {opt.desc}
                    </p>
                    {opt.price && (
                      <p className={`font-bold ${state.upgradeChoice === opt.id ? 'text-navy' : 'text-white'}`}>
                        {opt.price}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Kommentar eller frågor (valfritt)</label>
              <textarea
                value={state.upgradeComment}
                onChange={e => updateField("upgradeComment", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors min-h-[100px]"
              />
            </div>

            {analysisResult && (
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={generatePdf}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-navy font-semibold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Genererar...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Ladda ner PDF-rapport
                    </>
                  )}
                </button>
              </div>
            )}
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
          <div className="text-sm text-gray-500">
            Värderingskoll · {completedCount} av {stepMeta.length} steg klara
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 lg:sticky lg:top-24">
              <h3 className="font-semibold text-navy mb-1">Snabb genomlysning & indikativ värdering</h3>
              <p className="text-sm text-gray-500 mb-6">Här gör du en snabb genomlysning av bolaget. Dina svar ger både en uppskattning av hur redo ni är att sälja och en indikativ bild av vad företaget kan vara värt.</p>
              
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
                      <span className="text-left">{step.id}. {step.title}</span>
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
                disabled={activeStep === stepMeta.length}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  activeStep === stepMeta.length
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-navy text-white hover:bg-navy/90'
                }`}
              >
                {activeStep === 10 && !analysisResult ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analysera
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

      {/* Industry Selector Modal */}
      {showIndustryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl max-w-6xl w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-navy px-8 py-8 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white/60 text-sm font-medium uppercase tracking-wider">Välj bransch</span>
                </div>
                <button
                  onClick={() => setShowIndustryModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 group"
                >
                  <X className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
                </button>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">
                Vilken bransch verkar ditt företag i?
              </h2>
              <p className="text-base text-white/70 max-w-2xl">
                Välj den kategori som bäst beskriver er verksamhet.
              </p>
            </div>

            {/* Industry Grid */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {INDUSTRIES.map((industry) => {
                  const isSelected = state.industry === industry.label
                  
                  return (
                    <button
                      key={industry.id}
                      onClick={() => {
                        updateField("industry", industry.label)
                        setShowIndustryModal(false)
                      }}
                      className={`
                        relative group text-left p-4 rounded-xl border-2 transition-all duration-200
                        ${isSelected 
                          ? 'border-navy bg-navy text-white shadow-lg' 
                          : 'border-gray-200 bg-white hover:border-navy/30 hover:shadow-md'
                        }
                      `}
                    >
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                            <CheckCircle className="w-4 h-4 text-navy" />
                          </div>
                        </div>
                      )}
                      
                      {/* Icon */}
                      <div className={`
                        w-11 h-11 rounded-lg flex items-center justify-center mb-3 transition-all duration-200
                        ${isSelected 
                          ? 'bg-white/20' 
                          : 'bg-navy'
                        }
                      `}>
                        <div className="text-white">
                          {industry.icon}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <h3 className={`font-bold text-sm mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {industry.label}
                      </h3>
                      <p className={`text-xs leading-relaxed ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                        {industry.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-white border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {state.industry 
                    ? <span className="text-gray-900 font-medium">
                        Vald bransch: {state.industry}
                      </span>
                    : 'Klicka på en bransch för att välja'
                  }
                </p>
                
                <button
                  onClick={() => setShowIndustryModal(false)}
                  className="px-6 py-3 bg-navy text-white font-bold rounded-lg hover:bg-navy/90 transition-colors"
                >
                  Stäng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

