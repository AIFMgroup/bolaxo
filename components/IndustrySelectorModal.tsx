'use client'

import { useState } from 'react'
import { 
  Code, 
  ShoppingCart, 
  Cloud, 
  HardHat, 
  Wrench,
  SprayCan,
  Truck,
  UtensilsCrossed,
  Store,
  Package,
  Factory,
  Building,
  Megaphone,
  Calculator,
  Sparkles,
  Dumbbell,
  PartyPopper,
  GraduationCap,
  Car,
  TreePine,
  X,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

export interface IndustryOption {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  color: string
  gradient: string
}

export const INDUSTRIES: IndustryOption[] = [
  {
    id: 'it-konsult-utveckling',
    label: 'IT-konsult & utveckling',
    description: 'Mjukvaruutveckling, systemintegration, IT-rådgivning',
    icon: <Code className="w-6 h-6" />,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'ehandel-d2c',
    label: 'E-handel/D2C',
    description: 'Webbutiker, direktförsäljning till konsument',
    icon: <ShoppingCart className="w-6 h-6" />,
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-pink-600'
  },
  {
    id: 'saas-licensmjukvara',
    label: 'SaaS & licensmjukvara',
    description: 'Prenumerationstjänster, molnbaserad mjukvara',
    icon: <Cloud className="w-6 h-6" />,
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'bygg-anlaggning',
    label: 'Bygg & anläggning',
    description: 'Byggentreprenörer, ROT, nybyggnation',
    icon: <HardHat className="w-6 h-6" />,
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-amber-600'
  },
  {
    id: 'el-vvs-installation',
    label: 'El, VVS & installation',
    description: 'Elektriker, rörmokare, installationsföretag',
    icon: <Wrench className="w-6 h-6" />,
    color: 'text-yellow-600',
    gradient: 'from-yellow-500 to-orange-600'
  },
  {
    id: 'stad-facility-services',
    label: 'Städ & facility services',
    description: 'Städbolag, fastighetsskötsel, vaktmästeri',
    icon: <SprayCan className="w-6 h-6" />,
    color: 'text-green-600',
    gradient: 'from-green-500 to-emerald-600'
  },
  {
    id: 'lager-logistik-3pl',
    label: 'Lager, logistik & 3PL',
    description: 'Lagerhållning, transport, tredjepartslogistik',
    icon: <Truck className="w-6 h-6" />,
    color: 'text-slate-600',
    gradient: 'from-slate-500 to-gray-700'
  },
  {
    id: 'restaurang-cafe',
    label: 'Restaurang & café',
    description: 'Restauranger, caféer, catering',
    icon: <UtensilsCrossed className="w-6 h-6" />,
    color: 'text-red-600',
    gradient: 'from-red-500 to-orange-600'
  },
  {
    id: 'detaljhandel-fysisk',
    label: 'Detaljhandel (fysisk)',
    description: 'Butiker, showrooms, fysisk försäljning',
    icon: <Store className="w-6 h-6" />,
    color: 'text-teal-600',
    gradient: 'from-teal-500 to-cyan-600'
  },
  {
    id: 'grossist-partihandel',
    label: 'Grossist/partihandel',
    description: 'B2B-handel, import/export, distribution',
    icon: <Package className="w-6 h-6" />,
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-purple-600'
  },
  {
    id: 'latt-tillverkning-verkstad',
    label: 'Lätt tillverkning/verkstad',
    description: 'Produktion, verkstadsarbete, legotillverkning',
    icon: <Factory className="w-6 h-6" />,
    color: 'text-gray-600',
    gradient: 'from-gray-500 to-slate-700'
  },
  {
    id: 'fastighetsservice-forvaltning',
    label: 'Fastighetsservice & förvaltning',
    description: 'Fastighetsförvaltning, bostadsrättsförvaltning',
    icon: <Building className="w-6 h-6" />,
    color: 'text-stone-600',
    gradient: 'from-stone-500 to-gray-700'
  },
  {
    id: 'marknadsforing-kommunikation-pr',
    label: 'Marknadsföring, kommunikation & PR',
    description: 'Reklambyråer, PR-företag, marknadsföringsbolag',
    icon: <Megaphone className="w-6 h-6" />,
    color: 'text-pink-600',
    gradient: 'from-pink-500 to-rose-600'
  },
  {
    id: 'ekonomitjanster-redovisning',
    label: 'Ekonomitjänster & redovisning',
    description: 'Redovisningsbyråer, bokföring, revision',
    icon: <Calculator className="w-6 h-6" />,
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-green-600'
  },
  {
    id: 'halsa-skonhet',
    label: 'Hälsa/skönhet (salonger, kliniker, spa)',
    description: 'Frisörer, hudvård, skönhetsbehandlingar',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'text-fuchsia-600',
    gradient: 'from-fuchsia-500 to-pink-600'
  },
  {
    id: 'gym-fitness-wellness',
    label: 'Gym, fitness & wellness',
    description: 'Gym, PT-studios, wellness-center',
    icon: <Dumbbell className="w-6 h-6" />,
    color: 'text-lime-600',
    gradient: 'from-lime-500 to-green-600'
  },
  {
    id: 'event-konferens-upplevelser',
    label: 'Event, konferens & upplevelser',
    description: 'Eventbyråer, konferensanläggningar, upplevelser',
    icon: <PartyPopper className="w-6 h-6" />,
    color: 'text-violet-600',
    gradient: 'from-violet-500 to-purple-600'
  },
  {
    id: 'utbildning-kurser-edtech',
    label: 'Utbildning, kurser & edtech',
    description: 'Kursföretag, utbildningsplattformar, coaching',
    icon: <GraduationCap className="w-6 h-6" />,
    color: 'text-sky-600',
    gradient: 'from-sky-500 to-blue-600'
  },
  {
    id: 'bilverkstad-fordonsservice',
    label: 'Bilverkstad & fordonsservice',
    description: 'Verkstäder, däck, bilservice',
    icon: <Car className="w-6 h-6" />,
    color: 'text-rose-600',
    gradient: 'from-rose-500 to-red-600'
  },
  {
    id: 'jord-skog-tradgard-gronyteskotsel',
    label: 'Jord/skog, trädgård & grönyteskötsel',
    description: 'Trädgårdsanläggning, skogsbruk, parkskötsel',
    icon: <TreePine className="w-6 h-6" />,
    color: 'text-green-700',
    gradient: 'from-green-600 to-emerald-700'
  }
]

interface IndustrySelectorModalProps {
  onSelect: (industry: IndustryOption) => void
  onClose?: () => void
}

export default function IndustrySelectorModal({ onSelect, onClose }: IndustrySelectorModalProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [hoveredIndustry, setHoveredIndustry] = useState<string | null>(null)

  const handleContinue = () => {
    const industry = INDUSTRIES.find(i => i.id === selectedIndustry)
    if (industry) {
      onSelect(industry)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-t-3xl sm:rounded-3xl max-w-6xl w-full shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#1F3C58] px-4 sm:px-8 py-5 sm:py-8 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Building className="w-6 h-6 text-white" />
              </div>
              <span className="text-white/60 text-sm font-medium uppercase tracking-wider">Steg 0 av 8</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 group"
              >
                <X className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
              </button>
            )}
          </div>
          
          <h1 className="text-xl sm:text-3xl font-bold text-white mb-2">
            Vilken bransch verkar ditt företag i?
          </h1>
          <p className="text-sm sm:text-base text-white/70 max-w-2xl">
            Välj den kategori som bäst beskriver er verksamhet. Detta hjälper oss ställa rätt frågor och ge dig en mer träffsäker värdering.
          </p>
        </div>

        {/* Industry Grid */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {INDUSTRIES.map((industry) => {
              const isSelected = selectedIndustry === industry.id
              const isHovered = hoveredIndustry === industry.id
              
              return (
                <button
                  key={industry.id}
                  onClick={() => setSelectedIndustry(industry.id)}
                  onMouseEnter={() => setHoveredIndustry(industry.id)}
                  onMouseLeave={() => setHoveredIndustry(null)}
                  className={`
                    relative group text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.98]
                    ${isSelected 
                      ? 'border-[#1F3C58] bg-[#1F3C58] text-white shadow-lg' 
                      : 'border-gray-200 bg-white hover:border-[#1F3C58]/30 hover:shadow-md'
                    }
                  `}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                        <CheckCircle className="w-4 h-4 text-[#1F3C58]" />
                      </div>
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className={`
                    w-9 sm:w-11 h-9 sm:h-11 rounded-lg flex items-center justify-center mb-2 sm:mb-3 transition-all duration-200
                    ${isSelected 
                      ? 'bg-white/20' 
                      : 'bg-[#1F3C58]'
                    }
                  `}>
                    <div className="text-white [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6">
                      {industry.icon}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className={`font-bold text-xs sm:text-sm mb-0.5 sm:mb-1 leading-tight ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {industry.label}
                  </h3>
                  <p className={`text-[10px] sm:text-xs leading-snug sm:leading-relaxed hidden sm:block ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                    {industry.description}
                  </p>
                  
                  {/* Hover effect line */}
                  <div className={`
                    absolute bottom-0 left-0 right-0 h-1 rounded-b-xl transition-all duration-200
                    bg-[#1F3C58]
                    ${isSelected ? 'opacity-0' : isHovered ? 'opacity-100' : 'opacity-0'}
                  `} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-8 py-4 sm:py-5 bg-white border-t border-gray-100 flex-shrink-0 pb-[calc(1rem+var(--sab))] sm:pb-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              {selectedIndustry 
                ? <span className="text-gray-900 font-medium">
                    Vald: {INDUSTRIES.find(i => i.id === selectedIndustry)?.label}
                  </span>
                : 'Välj en bransch'
              }
            </p>
            
            <button
              onClick={handleContinue}
              disabled={!selectedIndustry}
              className={`
                group flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-6 py-3.5 sm:py-3 rounded-xl sm:rounded-lg font-bold
                transition-all duration-200 active:scale-[0.98]
                ${selectedIndustry 
                  ? 'bg-[#1F3C58] text-white hover:bg-[#2a4d6e] cursor-pointer' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Fortsätt till frågorna
              <ArrowRight className={`w-5 h-5 transition-transform duration-200 ${selectedIndustry ? 'group-hover:translate-x-1' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

