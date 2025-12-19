'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowRight, 
  CheckCircle, 
  TrendingUp,
  Shield,
  Users,
  Search,
  FileText,
  Briefcase,
  Building2,
  Sparkles,
  FileCheck,
  HandshakeIcon,
  Lock,
  Eye,
  MessageSquare,
  Scale
} from 'lucide-react'

export default function HomePageContent() {
  const locale = useLocale()

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* HERO SECTION - Full width image hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background image - no gradient overlay */}
        <div className="absolute inset-0">
          <Image
            src="/polaroid/premium_photo-1712016875326-7dbba3f6ec26.jpg"
            alt="Afterfounder Hero"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={65}
          />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 sm:py-24 md:py-32">
          {/* White content box with pulsating navy shadow */}
          <div className="max-w-2xl bg-white rounded-3xl p-8 sm:p-10 md:p-12 animate-pulse-navy-glow">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-navy/10 text-navy px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Sveriges smartaste företagsförmedling</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-navy leading-tight mb-6">
              Köp och sälj företag
              <span className="block text-navy/70 mt-2">tryggt och transparent</span>
            </h1>
            
            {/* Intro Text */}
            <p className="text-lg sm:text-xl text-gray-600 max-w-xl mb-10 leading-relaxed">
              Afterfounder kopplar samman kvalificerade köpare med 
              verifierade säljare. Anonymt tills NDA är signerat.
            </p>
            
            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                href={`/${locale}/sok`}
                className="group inline-flex items-center justify-center gap-3 bg-navy text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 active:scale-95 sm:hover:scale-105 shadow-lg shadow-navy/30 min-h-[56px]"
              >
                <Search className="w-5 h-5" />
                <span>Utforska bolag till salu</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link
                href={`/${locale}/salja/skapa-annons`}
                className="group inline-flex items-center justify-center gap-3 bg-navy/10 text-navy font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 active:scale-95 sm:hover:bg-navy/20 border-2 border-navy/20 min-h-[56px]"
              >
                <FileText className="w-5 h-5" />
                <span>Annonsera ditt företag</span>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-navy" />
                <span>Anonymt tills NDA</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-navy" />
                <span>Verifierade uppgifter</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-navy" />
                <span>Inga success fees</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Så fungerar det - 3 steg med bilder */}
      <section className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-bold text-navy/60 uppercase tracking-widest mb-4">
              Så fungerar det
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy">
              Tre enkla steg till en lyckad affär
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Steg 1 */}
            <div className="relative group">
              <div className="relative aspect-[4/3] mb-6 overflow-hidden rounded-xl shadow-lg">
                <Image
                  src="/polaroid/premium_photo-1712171314294-629a8cd44f15.jpg"
                  alt="Utforska anonymt"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  quality={70}
                />
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-navy text-white rounded-full font-bold text-lg mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">Utforska anonymt</h3>
                <p className="text-gray-600 leading-relaxed">
                  Bläddra bland verifierade bolag till salu. Alla annonser är anonyma tills du begär mer information.
                </p>
              </div>
            </div>
            
            {/* Steg 2 */}
            <div className="relative group md:mt-8">
              <div className="relative aspect-[4/3] mb-6 overflow-hidden rounded-xl shadow-lg">
                <Image
                  src="/polaroid/premium_photo-1712312886917-7feb1ec0f060.jpg"
                  alt="Signera NDA"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  quality={70}
                />
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-navy text-white rounded-full font-bold text-lg mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">Signera NDA</h3>
                <p className="text-gray-600 leading-relaxed">
                  När du hittar ett intressant bolag signerar du NDA digitalt och får tillgång till fullständig information.
                </p>
              </div>
            </div>
            
            {/* Steg 3 */}
            <div className="relative group">
              <div className="relative aspect-[4/3] mb-6 overflow-hidden rounded-xl shadow-lg">
                <Image
                  src="/polaroid/premium_photo-1713112356951-402c687642ec.jpg"
                  alt="Genomför affären"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  quality={70}
                />
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-navy text-white rounded-full font-bold text-lg mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">Genomför affären</h3>
                <p className="text-gray-600 leading-relaxed">
                  Förhandla direkt med säljaren. Vi tillhandahåller verktyg för LOI, due diligence och avtal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* För köpare och säljare - med bilder */}
      <section className="py-20 md:py-28 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-bold text-navy/60 uppercase tracking-widest mb-4">
              Välj din roll
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy">
              Oavsett om du köper eller säljer
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* För köpare */}
            <Link href={`/${locale}/investerarprofil`} className="group">
              <div className="h-full bg-navy text-white rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] shadow-xl shadow-navy/20 hover:shadow-2xl hover:shadow-navy/30">
                <div className="relative h-56 sm:h-64">
                  <Image
                    src="/polaroid/premium_photo-1712852503960-82f6fd804694.jpg"
                    alt="För köpare"
                    fill
                    className="object-cover group-hover:scale-105 transition-all duration-500"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={65}
                  />
                  <div className="absolute bottom-6 left-6">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                      <Briefcase className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-4 text-white">Jag vill köpa företag</h3>
                  <p className="text-white/70 leading-relaxed mb-6">
                    Få tillgång till verifierade bolag till salu. Filtrera på bransch, region, omsättning och lönsamhet.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>Gratis för köpare</span>
                    </li>
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>Smart matchning baserat på dina kriterier</span>
                    </li>
                    <li className="flex items-center gap-3 text-white/80">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>Säkert datarum efter NDA</span>
                    </li>
                  </ul>
                  <div className="flex items-center gap-2 text-white/60 group-hover:text-white transition-colors">
                    <span className="font-medium">Skapa investerarprofil</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                  </div>
                </div>
              </div>
            </Link>
            
            {/* För säljare */}
            <Link href={`/${locale}/saljarprofil`} className="group">
              <div className="h-full bg-white text-navy rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] border-2 border-navy/10 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-navy/10 hover:border-navy/20">
                <div className="relative h-56 sm:h-64">
                  <Image
                    src="/polaroid/premium_photo-1712852503923-e37c86a3bb32.jpg"
                    alt="För säljare"
                    fill
                    className="object-cover group-hover:scale-105 transition-all duration-500"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={65}
                  />
                  <div className="absolute bottom-6 left-6">
                    <div className="w-14 h-14 bg-navy/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                      <Building2 className="w-7 h-7 text-navy" />
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-4 text-navy">Jag vill sälja mitt företag</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Nå kvalificerade köpare utan att exponera ditt företag. Anonym annonsering med full kontroll.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span>Anonymt tills NDA är signerat</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span>Inga success fees</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span>Fasta, transparenta priser</span>
                    </li>
                  </ul>
                  <div className="flex items-center gap-2 text-navy/60 group-hover:text-navy transition-colors">
                    <span className="font-medium">Skapa säljarprofil</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Varför Afterfounder - med bild */}
      <section className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Bild */}
            <div className="relative order-2 lg:order-1">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-navy/20">
                <Image
                  src="/polaroid/premium_photo-1711984441568-9b15d0a082ed.jpg"
                  alt="Varför Afterfounder"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  quality={70}
                />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl shadow-navy/10 border border-navy/5 hidden sm:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-navy">100%</div>
                    <div className="text-sm text-gray-500">Transparent prissättning</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="order-1 lg:order-2">
              <span className="inline-block text-sm font-bold text-navy/60 uppercase tracking-widest mb-4">
                Fördelar
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy mb-8">
                Varför välja Afterfounder?
              </h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-navy/5 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-navy" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy mb-1">Anonymitet</h3>
                    <p className="text-gray-600">Ditt företag förblir anonymt tills köparen signerat NDA.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-navy/5 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Scale className="w-6 h-6 text-navy" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy mb-1">Inga success fees</h3>
                    <p className="text-gray-600">Fasta månadsavgifter istället för procentuella arvoden.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-navy/5 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-navy" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy mb-1">Verifierade uppgifter</h3>
                    <p className="text-gray-600">Alla annonser kvalitetsgranskas innan publicering.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-navy/5 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-navy" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy mb-1">Säker kommunikation</h3>
                    <p className="text-gray-600">Inbyggd chatt och dokumenthantering i plattformen.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Om oss - Pactior Group med bild */}
      <section className="py-20 md:py-28 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden bg-navy text-white rounded-3xl">
            {/* Background image */}
            <div className="absolute inset-0">
              <Image
                src="/polaroid/premium_photo-1712016875078-3935da1b9730.jpg"
                alt="Pactior Group"
                fill
                className="object-cover opacity-30"
                sizes="100vw"
                quality={60}
              />
            </div>
            <div className="absolute inset-0 bg-navy/70" />
            
            <div className="relative z-10 p-10 md:p-16 text-center">
              <span className="inline-block text-sm font-bold text-white/60 uppercase tracking-widest mb-4">
                Trygghet & kompetens
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-white">
                En del av Pactior Group
              </h2>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
                Afterfounder utvecklas tillsammans med Pactior Group och erfarna M&A-rådgivare. 
                Kombinationen av modern teknologi och klassisk transaktionskompetens gör processen 
                både effektiv och trygg.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
                <div className="flex items-center gap-2 text-white/70">
                  <Shield className="w-5 h-5" />
                  <span>Trygg process</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <TrendingUp className="w-5 h-5" />
                  <span>Fintech-driven</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Users className="w-5 h-5" />
                  <span>M&A-expertis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prismodell */}
      <section className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-bold text-navy/60 uppercase tracking-widest mb-4">
              Transparent prissättning
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy mb-4">
              Inga dolda avgifter
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              För köpare är plattformen helt gratis. För säljare erbjuder vi fasta månadspaket.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Köpare */}
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border-2 border-emerald-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-navy">För köpare</h3>
                  <p className="text-emerald-600 font-semibold">Helt gratis</p>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Obegränsat sökande</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>NDA-förfrågningar</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Direktkontakt med säljare</span>
                </li>
              </ul>
              <Link
                href={`/${locale}/investerarprofil`}
                className="inline-flex items-center gap-2 text-navy font-semibold hover:text-navy/70 transition-colors min-h-[44px]"
              >
                Kom igång gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Säljare */}
            <div className="bg-navy p-8 rounded-3xl shadow-xl shadow-navy/30 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">För säljare</h3>
                  <p className="text-white/60">Från 495 kr/mån</p>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-white/80">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Anonym annonsering</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Smart matchning med köpare</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Inga success fees</span>
                </li>
              </ul>
              <Link
                href={`/${locale}/priser`}
                className="inline-flex items-center gap-2 text-white font-semibold hover:text-white/80 transition-colors min-h-[44px]"
              >
                Se alla paket
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA med bakgrundsbild */}
      <section className="py-20 md:py-28 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl">
            {/* Background image */}
            <div className="absolute inset-0">
              <Image
                src="/polaroid/premium_photo-1713980018127-cac075aede35.jpg"
                alt="CTA bakgrund"
                fill
                className="object-cover opacity-40"
                sizes="(max-width: 1024px) 100vw, 896px"
                quality={60}
              />
              <div className="absolute inset-0 bg-navy/75" />
            </div>
            
            <div className="relative z-10 p-10 md:p-16 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-white">
                Redo att ta nästa steg?
              </h2>
              <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
                Utforska bolag till salu eller skapa en annons för ditt företag.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`/${locale}/sok`}
                  className="group inline-flex items-center justify-center gap-3 bg-white text-navy font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 active:scale-95 sm:hover:scale-105 shadow-lg min-h-[56px]"
                >
                  <Search className="w-5 h-5" />
                  <span>Sök bolag</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href={`/${locale}/salja/skapa-annons`}
                  className="group inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 active:bg-white/20 sm:hover:bg-white/20 border border-white/30 min-h-[56px]"
                >
                  <FileText className="w-5 h-5" />
                  <span>Skapa annons</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer for footer */}
      <div className="h-16"></div>
    </main>
  )
}
