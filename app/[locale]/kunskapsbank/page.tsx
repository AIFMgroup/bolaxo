'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { 
  BookOpen, 
  FileText, 
  Download, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Calendar,
  Target,
  Clock,
  Sparkles,
  Mail,
  ChevronDown,
  Filter,
  Star,
  Briefcase,
  Shield,
  TrendingUp
} from 'lucide-react'

// Resource types
interface Resource {
  id: string
  type: 'checklista' | 'mall' | 'guide' | 'video'
  phase: 'fore' | 'under' | 'efter'
  title: string
  description: string
  downloadable: boolean
  premium?: boolean
}

const resources: Resource[] = [
  {
    id: '1',
    type: 'checklista',
    phase: 'fore',
    title: 'Så förbereder du ditt bolag för försäljning – 12-månaders checklista',
    description: 'Det här dokumentet hjälper dig att planera i god tid. Månad för månad går vi igenom vad du som ägare bör göra – från att städa i siffrorna och se över avtal, till att bygga en tydlig equity story. Perfekt för dig som funderar på försäljning inom 1–3 år.',
    downloadable: true
  },
  {
    id: '2',
    type: 'mall',
    phase: 'fore',
    title: 'Ägarens målbild & exit-plan – ifyllbar mall',
    description: 'Innan du börjar prata med köpare behöver du vara kristallklar på vad du själv vill. Den här mallen guidar dig genom frågor om prisförväntningar, roll efter försäljning, tidsram och vad som är viktigast för dig.',
    downloadable: true
  },
  {
    id: '3',
    type: 'guide',
    phase: 'fore',
    title: 'Värderingsguide – förstå vad ditt bolag är värt',
    description: 'En komplett guide till de vanligaste värderingsmetoderna för SME-bolag. Lär dig skillnaden mellan multipelvärdering, DCF och substansvärdering – och när du ska använda vilken.',
    downloadable: true
  },
  {
    id: '4',
    type: 'checklista',
    phase: 'under',
    title: 'Due Diligence-förberedelser – vad köpare vill se',
    description: 'Förbered dig på köparens granskning. Den här checklistan går igenom alla dokument och områden som typiskt undersöks i en DD-process för små och medelstora bolag.',
    downloadable: true
  },
  {
    id: '5',
    type: 'mall',
    phase: 'under',
    title: 'Teaser & IM-mall – presentera ditt bolag',
    description: 'Professionella mallar för att skapa en säljande teaser och ett komplett informationsmemorandum. Strukturen som erfarna M&A-rådgivare använder.',
    downloadable: true,
    premium: true
  },
  {
    id: '6',
    type: 'guide',
    phase: 'under',
    title: 'NDA & sekretess – skydda din information',
    description: 'Förstå hur du skyddar känslig information under försäljningsprocessen. Inkluderar mallformulär och förklaringar av vanliga klausuler.',
    downloadable: true
  },
  {
    id: '7',
    type: 'checklista',
    phase: 'efter',
    title: 'Överlämning & integration – första 100 dagarna',
    description: 'En strukturerad plan för överlämningen till nya ägare. Fokuserar på personal, kunder, leverantörer och operativ kontinuitet.',
    downloadable: true
  },
  {
    id: '8',
    type: 'guide',
    phase: 'efter',
    title: 'Skatteplanering efter försäljning',
    description: 'Översikt av de viktigaste skattemässiga övervägandena efter en företagsförsäljning. Kapitalvinstskatt, holdingbolag och reinvestering.',
    downloadable: true,
    premium: true
  }
]

const phaseLabels: Record<string, string> = {
  fore: 'Före försäljning',
  under: 'Under processen',
  efter: 'Efter försäljningen'
}

const typeLabels: Record<string, string> = {
  checklista: 'Checklista',
  mall: 'Mall',
  guide: 'Guide',
  video: 'Video'
}

const typeIcons: Record<string, any> = {
  checklista: CheckCircle,
  mall: FileText,
  guide: BookOpen,
  video: TrendingUp
}

export default function KunskapsbankPage() {
  const locale = useLocale()
  const [activeFilter, setActiveFilter] = useState<string>('alla')
  const [expandedResource, setExpandedResource] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  const filters = [
    { id: 'alla', label: 'Alla' },
    { id: 'fore', label: 'Före försäljning' },
    { id: 'under', label: 'Under processen' },
    { id: 'efter', label: 'Efter försäljningen' }
  ]

  const filteredResources = activeFilter === 'alla' 
    ? resources 
    : resources.filter(r => r.phase === activeFilter)

  const handleDownload = (resourceId: string) => {
    // In a real app, this would trigger an email gate or direct download
    alert('Nedladdning startar snart! Kontrollera din e-post.')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section */}
      <section className="relative bg-navy text-white py-16 md:py-24 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/polaroid/premium_photo-1712171314766-4087f2e84711.jpg"
            alt=""
            fill
            className="object-cover opacity-20"
            sizes="100vw"
            quality={60}
          />
        </div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="lg:w-2/3">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-white/60 text-sm font-medium uppercase tracking-wider">Kunskapsbank</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Guider för hela resan
              </h1>
              <p className="text-xl text-white/80 max-w-2xl leading-relaxed">
                Checklistor, mallar och guider. De flesta material laddas ner via e-post så att vi kan följa upp smart.
                Det du ser här är Freemium-nivån – samma logik som i plattformen, men i PDF-form.
              </p>
            </div>
            <div className="lg:w-1/3 flex justify-center lg:justify-end">
              <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl animate-gentle-float">
                <Image
                  src="/polaroid/premium_photo-1713112356951-402c687642ec.jpg"
                  alt="Professionell rådgivning"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 192px, 224px"
                  quality={75}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-16 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left column - explanation */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-navy mb-4">Så fungerar Kunskapsbanken</h2>
              <p className="text-gray-600 mb-4">
                Alla guider är uppbyggda på samma sätt: först får du en överblick av <strong className="text-navy">vad</strong> du behöver göra i varje steg.
                Vill du sedan göra jobbet direkt i plattformen – och få stöd under resan – uppgraderar du till Bas eller Premium.
              </p>
              <p className="text-gray-600">
                I Freemium får du kort introduktion, "Läs vidare" och möjlighet att ladda ner mallar och checklistor.
                I Bas och Premium använder du samma frågebatteri, men digitalt och med mer guidning.
              </p>
            </div>

            {/* Right column - tier cards */}
            <div className="lg:col-span-3 grid md:grid-cols-3 gap-4">
              {/* Freemium */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nivå</span>
                <h3 className="text-lg font-bold text-navy mt-1 mb-2">Freemium</h3>
                <p className="text-sm font-medium text-navy mb-4">Ladda ner guider & checklistor gratis.</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Steg-för-steg & överblick</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Nedladdning via e-post (PDF)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Bra för att orientera dig</span>
                  </li>
                </ul>
              </div>

              {/* Bas */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nivå</span>
                <h3 className="text-lg font-bold text-navy mt-1 mb-2">Bas</h3>
                <p className="text-sm font-medium text-navy mb-4">Gör hela jobbet direkt i Afterfounder.</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Samma frågebatteri – fast interaktivt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Svar sparas och kan delas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Översikter som visar beredskap</span>
                  </li>
                </ul>
              </div>

              {/* Premium */}
              <div className="bg-navy text-white rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span className="bg-amber-400 text-navy text-xs font-bold px-2 py-1 rounded-full">
                    Populär
                  </span>
                </div>
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Nivå</span>
                <h3 className="text-lg font-bold mt-1 mb-2 text-white">Premium</h3>
                <p className="text-sm font-medium text-white/90 mb-4">Bas + rådgivare 45 min inkluderat.</p>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Allt i Bas-nivån</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Rådgivare 45 min utan extra kostnad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Hjälp att tolka och prioritera</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Resources */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtrera material:
              </span>
              <div className="flex flex-wrap gap-2">
                {filters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      activeFilter === filter.id
                        ? 'bg-navy text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-navy/30'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-sm text-gray-500">
              Freemium-nivå – uppgradera när du vill jobba vidare i plattformen.
            </span>
          </div>

          {/* Resource Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {filteredResources.map((resource, index) => {
              const TypeIcon = typeIcons[resource.type]
              const isExpanded = expandedResource === resource.id
              
              return (
                <div 
                  key={resource.id}
                  className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      <TypeIcon className="w-3 h-3" />
                      {typeLabels[resource.type]}
                    </span>
                    <span className="px-3 py-1 bg-navy/10 text-navy text-xs font-medium rounded-full">
                      {phaseLabels[resource.phase]}
                    </span>
                    {resource.premium && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        <Star className="w-3 h-3" />
                        Premium
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-navy mb-3">
                    {index + 1}. {resource.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {resource.description}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setExpandedResource(isExpanded ? null : resource.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-medium rounded-full hover:bg-navy/90 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      Läs mer
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {resource.downloadable && (
                      <button
                        onClick={() => setExpandedResource(resource.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-navy text-sm font-medium rounded-full border border-navy/20 hover:border-navy/40 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Ladda ner
                      </button>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
                      <div className="grid md:grid-cols-5 gap-6">
                        <div className="md:col-span-3">
                          <h4 className="font-semibold text-navy mb-2">Vad innehåller denna guide?</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            {resource.description} Du får en strukturerad genomgång med konkreta steg och exempel 
                            baserade på verkliga transaktioner.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                              PDF-format
                            </span>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                              Direktnedladdning
                            </span>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                              Ifyllbar
                            </span>
                          </div>
                        </div>
                        <div className="md:col-span-2 bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200">
                          <label className="block text-xs text-gray-500 mb-2">
                            Ange din e-post för att ladda ner
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="din@email.se"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-3 focus:outline-none focus:border-navy/40"
                          />
                          <button
                            onClick={() => handleDownload(resource.id)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-navy text-white text-sm font-medium rounded-full hover:bg-navy/90 transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                            Skicka till mig
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 border-t border-gray-200 overflow-hidden">
        {/* Subtle background image */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full hidden lg:block">
          <Image
            src="/polaroid/premium_photo-1713399247260-3b9c33e244ec.jpg"
            alt=""
            fill
            className="object-cover opacity-10"
            sizes="33vw"
            quality={50}
          />
        </div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-3">
              <h2 className="text-2xl md:text-3xl font-bold text-navy mb-4">
                Redo att gå från plan till genomförd affär?
              </h2>
              <p className="text-gray-600 mb-4">
                I Kunskapsbanken får du en tydlig bild av <strong className="text-navy">vad</strong> du behöver göra.
                När du vill börja genomföra arbetet på riktigt – med struktur och stöd – uppgraderar du till Bas eller Premium.
              </p>
              <p className="text-gray-600 mb-6">
                Alla guider här motsvarar moduler i plattformen. Du slipper egna Excel, delar enkelt med rådgivare
                och kan följa hur redo ditt bolag är inför en försäljning.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href={`/${locale}/sanitycheck`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white font-semibold rounded-full hover:bg-navy/90 transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  Starta värderingskoll utan kostnad
                </Link>
                <Link 
                  href={`/${locale}/salja/start`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-navy font-semibold rounded-full border border-navy/20 hover:border-navy/40 transition-colors"
                >
                  Skapa annons
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-bold text-navy mb-4">Bas vs Premium – kortfattat</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-navy mt-0.5 flex-shrink-0" />
                    <span><strong className="text-navy">Bas:</strong> Alla moduler digitalt, sparade svar, översikter & export.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-navy mt-0.5 flex-shrink-0" />
                    <span><strong className="text-navy">Premium:</strong> Allt i Bas + rådgivare som du kan boka 45 min utan extra kostnad.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-navy mt-0.5 flex-shrink-0" />
                    <span>Passar dig som vill ha både struktur och någon att bolla svåra frågor med.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <section className="py-8 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            Kunskapsbanken är Freemium-nivån i Afterfounder. Uppgradera när du vill fortsätta arbetet direkt i plattformen.
          </p>
        </div>
      </section>
    </div>
  )
}

