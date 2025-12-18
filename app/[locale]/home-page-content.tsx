'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { 
  ArrowRight, 
  CheckCircle, 
  CheckCircle2,
  TrendingUp,
  Shield,
  Target,
  BarChart3,
  Users,
  Search,
  FileText,
  Briefcase,
  Building2,
  UserCheck,
  Sparkles,
  Zap,
  Crown,
  Clock,
  FileCheck,
  HandshakeIcon,
  BookOpen,
  Lock,
  Eye,
  MessageSquare,
  Scale
} from 'lucide-react'

export default function HomePageContent() {
  const locale = useLocale()

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* HERO SECTION - Mobile optimized */}
      <section className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 md:pb-24 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-navy/5 text-navy px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 animate-pulse-subtle">
              <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span className="truncate">Sveriges smartaste företagsförmedling</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-navy leading-tight mb-4 sm:mb-6 px-2">
              Köp och sälj företag
              <span className="block text-navy/60">tryggt och transparent</span>
            </h1>
            
            {/* Intro Text */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
              Afterfounder (en del av Pactior Group) kopplar samman kvalificerade köpare med 
              verifierade säljare. Anonymt tills NDA är signerat.
            </p>
            
            {/* Primary CTAs - Mobile optimized */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-2">
              <Link
                href={`/${locale}/sok`}
                className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 bg-navy text-white font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl text-base sm:text-lg transition-all duration-300 active:scale-95 sm:hover:scale-105 shadow-lg shadow-navy/25 sm:hover:shadow-xl sm:hover:shadow-navy/30 min-h-[52px]"
              >
                <Search className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="truncate">Utforska bolag till salu</span>
                <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 transition-transform group-hover:translate-x-1 flex-shrink-0" />
              </Link>
              
              <Link
                href={`/${locale}/salja/skapa-annons`}
                className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 bg-white text-navy font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl text-base sm:text-lg transition-all duration-300 active:scale-95 sm:hover:scale-105 border-2 border-navy/20 hover:border-navy/40 shadow-lg shadow-gray-200/50 min-h-[52px]"
              >
                <FileText className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="truncate">Annonsera ditt företag</span>
              </Link>
            </div>
            
            {/* Trust indicators - Mobile optimized */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-6 md:gap-8 justify-center text-xs sm:text-sm text-gray-500 px-2">
              <div className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Anonymt tills NDA</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Verifierade uppgifter</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Inga success fees</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Så fungerar det - 3 steg */}
      <section className="py-16 sm:py-20 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <span className="inline-block text-xs sm:text-sm font-bold text-navy/60 uppercase tracking-widest mb-3 sm:mb-4">
              Så fungerar det
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-navy px-2">
              Tre enkla steg till en lyckad affär
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Steg 1 */}
            <div className="relative bg-white p-8 rounded-3xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-navy/10 transition-all duration-500 group">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-navy/30">
                1
              </div>
              <div className="pt-4">
                <div className="w-14 h-14 bg-navy/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-navy/10 transition-colors">
                  <Eye className="w-7 h-7 text-navy" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-4">Utforska anonymt</h3>
                <p className="text-gray-600 leading-relaxed">
                  Bläddra bland verifierade bolag till salu. Alla annonser är anonyma tills du begär mer information.
                </p>
              </div>
            </div>
            
            {/* Steg 2 */}
            <div className="relative bg-white p-8 rounded-3xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-navy/10 transition-all duration-500 group">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-navy/30">
                2
              </div>
              <div className="pt-4">
                <div className="w-14 h-14 bg-navy/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-navy/10 transition-colors">
                  <FileCheck className="w-7 h-7 text-navy" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-4">Signera NDA</h3>
                <p className="text-gray-600 leading-relaxed">
                  När du hittar ett intressant bolag signerar du NDA digitalt och får tillgång till fullständig information.
                </p>
              </div>
            </div>
            
            {/* Steg 3 */}
            <div className="relative bg-white p-8 rounded-3xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-navy/10 transition-all duration-500 group">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-navy/30">
                3
              </div>
              <div className="pt-4">
                <div className="w-14 h-14 bg-navy/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-navy/10 transition-colors">
                  <HandshakeIcon className="w-7 h-7 text-navy" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-4">Genomför affären</h3>
                <p className="text-gray-600 leading-relaxed">
                  Förhandla direkt med säljaren. Vi tillhandahåller verktyg för LOI, due diligence och avtal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* För köpare och säljare */}
      <section className="py-16 sm:py-20 md:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <span className="inline-block text-xs sm:text-sm font-bold text-navy/60 uppercase tracking-widest mb-3 sm:mb-4">
              Välj din roll
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-navy px-2">
              Oavsett om du köper eller säljer
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* För köpare */}
            <Link href={`/${locale}/investerarprofil`} className="group">
              <div className="h-full bg-navy text-white p-10 rounded-3xl transition-all duration-500 hover:scale-[1.02] shadow-xl shadow-navy/20 hover:shadow-2xl hover:shadow-navy/30">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-white/20 transition-colors">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Jag vill köpa företag</h3>
                <p className="text-white/80 leading-relaxed mb-6">
                  Få tillgång till verifierade bolag till salu. Filtrera på bransch, region, omsättning och lönsamhet.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-white/70">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Gratis för köpare</span>
                  </li>
                  <li className="flex items-center gap-3 text-white/70">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Smart matchning baserat på dina kriterier</span>
                  </li>
                  <li className="flex items-center gap-3 text-white/70">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Säkert datarum efter NDA</span>
                  </li>
                </ul>
                <div className="flex items-center gap-2 text-white/60 group-hover:text-white transition-colors">
                  <span className="font-medium">Skapa investerarprofil</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                </div>
              </div>
            </Link>
            
            {/* För säljare */}
            <Link href={`/${locale}/saljarprofil`} className="group">
              <div className="h-full bg-white text-navy p-10 rounded-3xl transition-all duration-500 hover:scale-[1.02] border-2 border-navy/10 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-navy/10 hover:border-navy/20">
                <div className="w-16 h-16 bg-navy/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-navy/10 transition-colors">
                  <Building2 className="w-8 h-8 text-navy" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-navy">Jag vill sälja mitt företag</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Nå kvalificerade köpare utan att exponera ditt företag. Anonym annonsering med full kontroll.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span>Anonymt tills NDA är signerat</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span>Inga success fees</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span>Fasta, transparenta priser</span>
                  </li>
                </ul>
                <div className="flex items-center gap-2 text-navy/60 group-hover:text-navy transition-colors">
                  <span className="font-medium">Skapa säljarprofil</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Varför Afterfounder */}
      <section className="py-16 sm:py-20 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <span className="inline-block text-xs sm:text-sm font-bold text-navy/60 uppercase tracking-widest mb-3 sm:mb-4">
              Fördelar
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-navy px-2">
              Varför välja Afterfounder?
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {/* Fördel 1 */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all duration-300">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-navy/5 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Lock className="w-5 sm:w-6 h-5 sm:h-6 text-navy" />
              </div>
              <h3 className="font-bold text-navy mb-1.5 sm:mb-2 text-sm sm:text-base">Anonymitet</h3>
              <p className="text-xs sm:text-sm text-gray-600">Ditt företag förblir anonymt tills köparen signerat NDA.</p>
            </div>
            
            {/* Fördel 2 */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all duration-300">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-navy/5 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Scale className="w-5 sm:w-6 h-5 sm:h-6 text-navy" />
              </div>
              <h3 className="font-bold text-navy mb-1.5 sm:mb-2 text-sm sm:text-base">Inga success fees</h3>
              <p className="text-xs sm:text-sm text-gray-600">Fasta månadsavgifter istället för procentuella arvoden.</p>
            </div>
            
            {/* Fördel 3 */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all duration-300">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-navy/5 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Shield className="w-5 sm:w-6 h-5 sm:h-6 text-navy" />
              </div>
              <h3 className="font-bold text-navy mb-1.5 sm:mb-2 text-sm sm:text-base">Verifierade uppgifter</h3>
              <p className="text-xs sm:text-sm text-gray-600">Alla annonser kvalitetsgranskas innan publicering.</p>
            </div>
            
            {/* Fördel 4 */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all duration-300">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-navy/5 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <MessageSquare className="w-5 sm:w-6 h-5 sm:h-6 text-navy" />
              </div>
              <h3 className="font-bold text-navy mb-1.5 sm:mb-2 text-sm sm:text-base">Säker kommunikation</h3>
              <p className="text-xs sm:text-sm text-gray-600">Inbyggd chatt och dokumenthantering i plattformen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Om oss - Pactior Group */}
      <section className="py-16 sm:py-20 md:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-navy text-white p-6 sm:p-10 md:p-16 rounded-2xl sm:rounded-3xl text-center shadow-2xl shadow-navy/30">
            <span className="inline-block text-xs sm:text-sm font-bold text-white/60 uppercase tracking-widest mb-3 sm:mb-4">
              Trygghet & kompetens
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-white">
              En del av Pactior Group
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
              Afterfounder utvecklas tillsammans med Pactior Group och erfarna M&A-rådgivare. 
              Kombinationen av modern teknologi och klassisk transaktionskompetens gör processen 
              både effektiv och trygg.
            </p>
            <div className="mt-6 sm:mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8">
              <div className="flex items-center gap-2 text-white/60">
                <Shield className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="text-sm sm:text-base">Trygg process</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="text-sm sm:text-base">Fintech-driven</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Users className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="text-sm sm:text-base">M&A-expertis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prismodell */}
      <section className="py-16 sm:py-20 md:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <span className="inline-block text-xs sm:text-sm font-bold text-navy/60 uppercase tracking-widest mb-3 sm:mb-4">
              Transparent prissättning
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-navy mb-3 sm:mb-4 px-2">
              Inga dolda avgifter
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto px-2">
              För köpare är plattformen helt gratis. För säljare erbjuder vi fasta månadspaket.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Köpare */}
            <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 border-2 border-emerald-100">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-navy">För köpare</h3>
                  <p className="text-emerald-600 font-semibold text-sm sm:text-base">Helt gratis</p>
                </div>
              </div>
              <ul className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
                <li className="flex items-center gap-2.5 sm:gap-3 text-gray-600 text-sm sm:text-base">
                  <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 flex-shrink-0" />
                  <span>Obegränsat sökande</span>
                </li>
                <li className="flex items-center gap-2.5 sm:gap-3 text-gray-600 text-sm sm:text-base">
                  <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 flex-shrink-0" />
                  <span>NDA-förfrågningar</span>
                </li>
                <li className="flex items-center gap-2.5 sm:gap-3 text-gray-600 text-sm sm:text-base">
                  <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 flex-shrink-0" />
                  <span>Direktkontakt med säljare</span>
                </li>
              </ul>
              <Link
                href={`/${locale}/investerarprofil`}
                className="inline-flex items-center gap-2 text-navy font-semibold hover:text-navy/70 transition-colors text-sm sm:text-base min-h-[44px]"
              >
                Kom igång gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Säljare */}
            <div className="bg-navy p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl shadow-navy/30 text-white">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">För säljare</h3>
                  <p className="text-white/60 text-sm sm:text-base">Från 495 kr/mån</p>
                </div>
              </div>
              <ul className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
                <li className="flex items-center gap-2.5 sm:gap-3 text-white/80 text-sm sm:text-base">
                  <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400 flex-shrink-0" />
                  <span>Anonym annonsering</span>
                </li>
                <li className="flex items-center gap-2.5 sm:gap-3 text-white/80 text-sm sm:text-base">
                  <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400 flex-shrink-0" />
                  <span>Smart matchning med köpare</span>
                </li>
                <li className="flex items-center gap-2.5 sm:gap-3 text-white/80 text-sm sm:text-base">
                  <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400 flex-shrink-0" />
                  <span>Inga success fees</span>
                </li>
              </ul>
              <Link
                href={`/${locale}/priser`}
                className="inline-flex items-center gap-2 text-white font-semibold hover:text-white/80 transition-colors text-sm sm:text-base min-h-[44px]"
              >
                Se alla paket
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-navy to-navy/90 text-white p-6 sm:p-10 md:p-16 rounded-2xl sm:rounded-3xl text-center shadow-2xl shadow-navy/40">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-white">
              Redo att ta nästa steg?
            </h2>
            <p className="text-base sm:text-lg text-white/80 mb-6 sm:mb-8 md:mb-10 max-w-xl mx-auto">
              Utforska bolag till salu eller skapa en annons för ditt företag.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href={`/${locale}/sok`}
                className="group inline-flex items-center justify-center gap-2 sm:gap-3 bg-white text-navy font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl text-base sm:text-lg transition-all duration-300 active:scale-95 sm:hover:scale-105 shadow-lg min-h-[52px]"
              >
                <Search className="w-4 sm:w-5 h-4 sm:h-5" />
                <span>Sök bolag</span>
                <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href={`/${locale}/salja/skapa-annons`}
                className="group inline-flex items-center justify-center gap-2 sm:gap-3 bg-white/10 text-white font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl text-base sm:text-lg transition-all duration-300 active:bg-white/20 sm:hover:bg-white/20 border border-white/20 min-h-[52px]"
              >
                <FileText className="w-4 sm:w-5 h-4 sm:h-5" />
                <span>Skapa annons</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer for footer */}
      <div className="h-16"></div>
    </main>
  )
}
