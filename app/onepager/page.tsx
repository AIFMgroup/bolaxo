'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Check, CheckCircle, TrendingUp, Shield, Clock, Users, Star, ArrowRight, 
  Zap, Target, Award, Heart, DollarSign, Eye, Lock, MessageCircle, 
  Trophy, Rocket, Handshake, XCircle
} from 'lucide-react'

export default function OnePagerPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [liveCounter, setLiveCounter] = useState(2847)

  // Live counter animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCounter(prev => prev + Math.floor(Math.random() * 3))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % 3)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const testimonials = [
    {
      quote: "Vi fick 23 bud på 6 veckor. Sålde för 4.2 miljoner över vår värdering.",
      name: "Anna Lindström",
      company: "TechStart AB",
      result: "+4.2M kr över värdering"
    },
    {
      quote: "Processen var så smidig. Från annons till avslut på 87 dagar.",
      name: "Erik Johansson", 
      company: "Retail Solutions",
      result: "Såld på 87 dagar"
    },
    {
      quote: "Anonymiteten var perfekt. Kunde fortsätta driva verksamheten normalt.",
      name: "Maria Berg",
      company: "Konsultbyrån Nordic",
      result: "100% anonymitet"
    }
  ]

  return (
    <main className="overflow-x-hidden">
      {/* HERO - Emotionell hook */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary-blue via-blue-700 to-blue-900 text-white overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-light-blue rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Main message */}
            <div>
              {/* Social proof badge */}
              <div className="inline-flex items-center px-3 sm:px-3 sm:px-4 py-2 min-h-10 sm:min-h-auto bg-white/20 backdrop-blur-sm rounded-full text-sm mb-6 animate-fade-in">
                <Users className="w-4 h-4 mr-2" />
                <span className="font-semibold">{liveCounter.toLocaleString('sv-SE')}</span>
                <span className="ml-1">företagare använder BOLAXO</span>
              </div>

              {/* Main headline - Emotionell */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Sälj ditt företag.<br/>
                <span className="text-light-blue">Enkelt. Säkert.</span><br/>
                <span className="text-white/90">På dina villkor.</span>
              </h1>

              {/* Subheadline - Smärta → Lösning */}
              <p className="text-xl md:text-xl sm:text-2xl mb-8 opacity-90 leading-relaxed">
                Slipp oseriösa köpare, långa processer och dyra mellanhänder. 
                <strong className="text-white"> Vi kopplar dig direkt till rätt köpare</strong> - helt anonymt tills du bestämmer dig.
              </p>

              {/* Key benefits - Konkreta */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-lg">
                  <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0 text-green-400" />
                  <span><strong>Gratis värdering</strong> på 5 minuter</span>
                </div>
                <div className="flex items-center text-lg">
                  <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0 text-green-400" />
                  <span><strong>100% anonym</strong> tills NDA-signering</span>
                </div>
                <div className="flex items-center text-lg">
                  <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0 text-green-400" />
                  <span><strong>Genomsnittligt försäljningspris:</strong> 18.7M kr</span>
                </div>
              </div>

              {/* CTA Buttons - Hierarki */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/vardering" 
                  className="btn-primary bg-white text-primary-blue hover:bg-gray-100 text-lg px-8 py-4 inline-flex items-center justify-center group shadow-2xl"
                >
                  <Zap className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                  Få Gratis Värdering (5 min)
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link 
                  href="/salja/start" 
                  className="btn-secondary bg-white text-primary-blue hover:bg-gray-100 text-lg px-8 py-4 inline-flex items-center justify-center"
                >
                  Börja sälja
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Link>
              </div>

              {/* Trust signals */}
              <div className="mt-8 flex items-center gap-3 sm:gap-4 md:gap-6 text-sm opacity-75">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span>BankID-säkrat</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span>Ø 94 dagar till affär</span>
                </div>
              </div>
            </div>

            {/* Right: Live social proof */}
            <div className="relative">
              {/* Testimonial card - rotates */}
              <div className="bg-white text-text-dark p-8 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-warning fill-current" />
                  ))}
                </div>
                
                <p className="text-lg mb-6 italic">
                  "{testimonials[activeTestimonial].quote}"
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{testimonials[activeTestimonial].name}</div>
                    <div className="text-sm text-text-gray">{testimonials[activeTestimonial].company}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-primary-blue font-bold">
                      {testimonials[activeTestimonial].result}
                    </div>
                  </div>
                </div>

                {/* Indicator dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTestimonial(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === activeTestimonial ? 'bg-primary-blue w-6' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Floating stats */}
              <div className="absolute -top-6 -left-6 bg-white text-text-dark px-6 py-3 rounded-xl shadow-lg animate-bounce-slow">
                <div className="text-2xl sm:text-3xl font-bold text-primary-blue">2,847</div>
                <div className="text-sm text-text-gray">Företag sålda</div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-white text-text-dark px-6 py-3 rounded-xl shadow-lg animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
                <div className="text-2xl sm:text-3xl font-bold text-green-600">4.9/5</div>
                <div className="text-sm text-text-gray">Nöjda säljare</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Stats Bar - Social proof */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-3 sm:gap-4 md:gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-blue mb-2">18.7M kr</div>
              <div className="text-text-gray">Genomsnittligt försäljningspris</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-blue mb-2">94 dagar</div>
              <div className="text-text-gray">Genomsnittlig tid till affär</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-blue mb-2">50,000+</div>
              <div className="text-text-gray">Verifierade köpare</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-blue mb-2">97%</div>
              <div className="text-text-gray">Rekommenderar oss</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="py-6 sm:py-8 md:py-12 bg-gradient-to-b from-white to-light-blue/10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-16">
            <h2 className="heading-1 mb-6">
              Varför är det så <span className="text-red-600">svårt</span> att sälja sitt företag?
            </h2>
            <p className="text-xl text-text-gray max-w-3xl mx-auto">
              Vi förstår frustrationen. Därför byggde vi en bättre lösning.
            </p>
          </div>

          {/* Problem vs Solution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-3 sm:gap-4 md:gap-6">
            {/* Problems */}
            <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-text-dark mb-6 flex items-center">
              <XCircle className="w-6 h-6 text-red-600 mr-2" />
              Traditionellt sätt
            </h3>
              
              <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500">
                <div className="font-semibold text-text-dark mb-2">Tar upp till 2 år</div>
                <p className="text-sm text-text-gray">Långa processer med osäkra utfall</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500">
                <div className="font-semibold text-text-dark mb-2">Dyra mellanhänder</div>
                <p className="text-sm text-text-gray">10-15% provision + fasta avgifter</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500">
                <div className="font-semibold text-text-dark mb-2">Ingen anonymitet</div>
                <p className="text-sm text-text-gray">Rykten sprids, medarbetare oroliga</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500">
                <div className="font-semibold text-text-dark mb-2">Oseriösa intressenter</div>
                <p className="text-sm text-text-gray">Slösa tid på "turist-köpare"</p>
              </div>
            </div>

            {/* Solutions */}
            <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-primary-blue mb-6 flex items-center">
              <CheckCircle className="w-6 h-6 text-primary-blue mr-2" />
              Med BOLAXO
            </h3>
              
              <div className="bg-gradient-to-br from-green-50 to-light-blue p-6 rounded-2xl border-l-4 border-green-500">
                <div className="font-semibold text-text-dark mb-2">Ø 94 dagar till affär</div>
                <p className="text-sm text-text-gray">AI-matchning hittar rätt köpare snabbt</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-light-blue p-6 rounded-2xl border-l-4 border-green-500">
                <div className="font-semibold text-text-dark mb-2">Fast pris från 5,900 kr</div>
                <p className="text-sm text-text-gray">Ingen provision. Transparent prissättning.</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-light-blue p-6 rounded-2xl border-l-4 border-green-500">
                <div className="font-semibold text-text-dark mb-2">100% anonym process</div>
                <p className="text-sm text-text-gray">Du bestämmer när din identitet avslöjas</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-light-blue p-6 rounded-2xl border-l-4 border-green-500">
                <div className="font-semibold text-text-dark mb-2">Endast BankID-verifierade</div>
                <p className="text-sm text-text-gray">Alla köpare är seriösa och kontrollerade</p>
              </div>
            </div>
          </div>

          {/* Giant CTA */}
          <div className="mt-16 text-center">
            <Link 
              href="/vardering" 
              className="inline-flex items-center px-12 py-6 bg-primary-blue hover:bg-blue-800 text-white text-xl sm:text-2xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 mr-3" />
              Värdera Mitt Företag Gratis
              <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 ml-3" />
            </Link>
            <p className="text-text-gray mt-4">Tar bara 5 minuter • Ingen registrering • Helt gratis</p>
          </div>
        </div>
      </section>

      {/* How it works - Super simpel */}
      <section className="py-6 sm:py-8 md:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-16">
            <h2 className="heading-1 mb-4">Så enkelt är det</h2>
            <p className="text-xl text-text-gray">Från värdering till avslut på 3 steg</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-3 sm:gap-4 md:gap-6 relative">
            {/* Arrow connectors */}
            <div className="hidden lg:block absolute top-1/2 left-1/3 w-full md:w-1/3 h-0.5 bg-gradient-to-r from-primary-blue to-light-blue transform -translate-y-1/2"></div>
            <div className="hidden lg:block absolute top-1/2 right-0 w-full md:w-1/3 h-0.5 bg-gradient-to-r from-light-blue to-primary-blue transform -translate-y-1/2"></div>

            <div className="relative bg-gradient-to-br from-light-blue to-white p-8 rounded-2xl shadow-card text-center transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-primary-blue text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl sm:text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-3">Värdera Gratis</h3>
              <p className="text-text-gray">Få din AI-drivna värdering på 5 minuter. Helt gratis, ingen registrering.</p>
              <div className="mt-4 text-sm text-primary-blue font-semibold flex items-center justify-center">
                <Zap className="w-4 h-4 mr-1" /> 5 minuter
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-light-blue to-white p-8 rounded-2xl shadow-card text-center transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-primary-blue text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl sm:text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-3">Skapa Annons</h3>
              <p className="text-text-gray">Publicera anonymt. Välj exakt vad köpare ser före/efter NDA.</p>
              <div className="mt-4 text-sm text-primary-blue font-semibold flex items-center justify-center">
                <Lock className="w-4 h-4 mr-1" /> 100% anonymt
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-light-blue to-white p-8 rounded-2xl shadow-card text-center transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-primary-blue text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl sm:text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-3">Ta Emot Bud</h3>
              <p className="text-text-gray">50,000+ verifierade köpare ser din annons. Du väljer rätt köpare.</p>
              <div className="mt-4 text-sm text-primary-blue font-semibold flex items-center justify-center">
                <Check className="w-4 h-4 mr-1" /> Ø 94 dagar
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Recent sales */}
      <section className="py-6 sm:py-8 md:py-12 bg-primary-blue/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-2">Senaste affärerna</h2>
            <p className="text-text-gray">Live-uppdaterat från vår plattform</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[
              { company: 'Tech-bolag Stockholm', price: '23.5M kr', days: '67 dagar', bids: 18 },
              { company: 'E-handel Göteborg', price: '12.8M kr', days: '89 dagar', bids: 14 },
              { company: 'Konsultbolag Malmö', price: '8.2M kr', days: '52 dagar', bids: 11 },
            ].map((sale, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-card border-t-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-text-gray">Såld för {sale.days}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                    ✓ AVSLUTAD
                  </span>
                </div>
                <div className="font-semibold text-text-dark mb-2">{sale.company}</div>
                <div className="text-xl sm:text-2xl font-bold text-primary-blue mb-2">{sale.price}</div>
                <div className="text-sm text-text-gray">{sale.bids} bud mottagna</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Konkret värde */}
      <section className="py-6 sm:py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-16">
            <h2 className="heading-1 mb-4">Allt du behöver för en lyckad försäljning</h2>
            <p className="text-xl text-text-gray">Från värdering till avslut - vi guidar dig hela vägen</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[
              { icon: Zap, title: 'AI-Värdering', desc: 'Gratis värdering på 5 min', value: 'Värd 5,000 kr' },
              { icon: Lock, title: 'Anonymitet', desc: 'Full kontroll över vad som visas', value: 'Priceless' },
              { icon: Eye, title: '50K+ Köpare', desc: 'Maximal exponering', value: '10x fler än konkurrenter' },
              { icon: Shield, title: 'BankID & NDA', desc: 'Endast seriösa köpare', value: '99% kvalitet' },
              { icon: MessageCircle, title: 'Datarum & Q&A', desc: 'Strukturerad kommunikation', value: 'Sparar 40h' },
              { icon: Target, title: 'Smart Matchning', desc: 'AI hittar rätt köpare', value: '3x snabbare' },
              { icon: Award, title: 'Rådgivning', desc: 'Personlig support 24/7', value: 'Inkluderat' },
              { icon: DollarSign, title: 'Transparent Pris', desc: 'Från 5,900 kr fast pris', value: '0% provision' },
            ].map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-white to-light-blue/20 p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all group">
                <feature.icon className="w-12 h-12 text-primary-blue mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-text-dark mb-2">{feature.title}</h3>
                <p className="text-sm text-text-gray mb-3">{feature.desc}</p>
                <div className="text-xs font-bold text-primary-blue">{feature.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Emotionella berättelser */}
      <section className="py-6 sm:py-8 md:py-12 bg-gradient-to-br from-primary-blue/5 to-light-blue/10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-16">
            <h2 className="heading-1 mb-4">Riktiga företagare. Riktiga resultat.</h2>
            <p className="text-xl text-text-gray">Över 2,800 entreprenörer har nått sina drömmar genom BOLAXO</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-3 sm:gap-4 md:gap-6">
                {[
                  {
                    name: 'Stefan Andersson',
                    age: 62,
                    company: 'Byggföretag, 15 anställda',
                    quote: 'Efter 30 år var det dags att gå i pension. BOLAXO hjälpte mig hitta en köpare som verkligen bryr sig om mina medarbetare. Fick 6.2M över min värdering.',
                    result: '6.2M över värdering',
                    icon: Trophy,
                    metric: 'Såld på 78 dagar'
                  },
                  {
                    name: 'Lisa Chen',
                    age: 34,
                    company: 'SaaS-startup',
                    quote: 'Vi behövde växa snabbt. BOLAXO matchade oss med en strategisk köpare som hade rätt nätverk. Exit på 18.5M gav oss möjlighet att starta nästa venture.',
                    result: '18.5M exit',
                    icon: Rocket,
                    metric: '12 bud första veckan'
                  },
                  {
                    name: 'Johan Eriksson',
                    age: 48,
                    company: 'Tre restauranger',
                    quote: 'Ville sälja diskret utan att oroa personal. Processen var helt anonym och professionell. Fick 3 seriösa bud från branschspelare.',
                    result: '100% diskret',
                    icon: Handshake,
                    metric: 'Såld till drömköpare'
                  },
                ].map((story, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-card hover:shadow-card-hover transition-all">
                <div className="text-5xl mb-4">
                  <story.icon className="w-10 h-10 text-primary-blue" />
                </div>
                <p className="text-text-gray italic mb-6">"{story.quote}"</p>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-blue text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {story.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-text-dark">{story.name}, {story.age}</div>
                    <div className="text-sm text-text-gray">{story.company}</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-primary-blue font-bold">{story.result}</div>
                  <div className="text-sm text-text-gray">{story.metric}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOMO - Brådska */}
      <section className="py-6 sm:py-8 md:py-12 bg-yellow-50 border-y-4 border-yellow-400">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 text-center">
          <div className="inline-flex items-center px-3 sm:px-3 sm:px-4 py-2 min-h-10 sm:min-h-auto bg-yellow-200 text-yellow-900 rounded-full font-semibold mb-6">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Begränsat erbjudande
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-dark mb-4">
            Första 100 värderingar i mars får <span className="text-primary-blue">50% rabatt</span> på annonspris
          </h2>
          <p className="text-lg text-text-gray mb-6">
            87/100 platser kvar • Erbjudandet går ut om 13 dagar
          </p>
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-3 h-3 bg-primary-blue rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-primary-blue rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-primary-blue rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <Link href="/vardering" className="btn-primary text-xl px-10 py-5 inline-flex items-center shadow-2xl">
            Aktivera Mitt Erbjudande Nu
            <ArrowRight className="w-6 h-6 ml-2" />
          </Link>
        </div>
      </section>

      {/* Guarantee - Risk reversal */}
      <section className="py-6 sm:py-8 md:py-12 bg-white">
        <div className="max-w-5xl mx-auto px-3 sm:px-4">
          <div className="bg-gradient-to-br from-green-50 to-light-blue p-12 rounded-3xl border-2 border-green-200 text-center">
            <Shield className="w-20 h-20 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold text-text-dark mb-4">
              Vår BOLAXO-Garanti
            </h2>
            <p className="text-xl text-text-gray mb-8">
              Om du inte får minst 3 kvalificerade bud inom 90 dagar får du <strong className="text-primary-blue">pengarna tillbaka + 90 dagar gratis förlängning</strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 text-left">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-text-dark">Pengar-tillbaka</div>
                  <div className="text-sm text-text-gray">Om inga kvalificerade bud</div>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-text-dark">Ingen bindningstid</div>
                  <div className="text-sm text-text-gray">Avsluta när du vill</div>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-text-dark">Nöjd-kund-garanti</div>
                  <div className="text-sm text-text-gray">97% rekommenderar oss</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Emotionell */}
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-primary-blue via-blue-800 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/pattern.svg')] bg-repeat"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-3 sm:px-4 text-center">
          <Heart className="w-16 h-16 mx-auto mb-6 text-red-400" />
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Du har byggt något värdefullt.
          </h2>
          
          <p className="text-xl sm:text-2xl mb-4 opacity-90">
            Nu är det dags att få vad det är värt.
          </p>
          
          <p className="text-xl mb-12 opacity-75 max-w-2xl mx-auto">
            Tusentals företagare har redan tagit steget. De fick i genomsnitt 23% över sin egen värdering. 
            <strong className="text-white"> Din tur nu.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center mb-8">
            <Link 
              href="/vardering" 
              className="btn-primary bg-white text-primary-blue hover:bg-gray-100 text-xl sm:text-2xl px-12 py-6 inline-flex items-center justify-center shadow-2xl group"
            >
              <Zap className="w-7 h-7 mr-3 group-hover:scale-110 transition-transform" />
              Starta Min Gratis Värdering
              <ArrowRight className="w-7 h-7 ml-3 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <p className="text-sm opacity-75">
            Tar 5 minuter • 2,847 företagare värderade sina bolag denna månad • Ingen kreditkort krävs
          </p>
        </div>
      </section>

      {/* FAQ - Hantera invändningar */}
      <section className="py-6 sm:py-8 md:py-12 bg-white">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <h2 className="heading-2 text-center mb-12">Vanliga frågor</h2>
          
          <div className="space-y-4">
            {[
              { q: 'Hur mycket kostar det?', a: 'Från 5,900 kr fast pris. Ingen provision. Värderingen är helt gratis.' },
              { q: 'Måste jag avslöja mitt företag?', a: 'Nej! Du är 100% anonym tills du väljer att signera NDA med en specifik köpare.' },
              { q: 'Hur lång tid tar det?', a: 'Genomsnittligt 94 dagar från publicering till avslut. 23% snabbare än traditionella mäklare.' },
              { q: 'Vad händer om jag inte får bud?', a: 'Pengar-tillbaka-garanti om du inte får minst 3 kvalificerade bud inom 90 dagar.' },
            ].map((faq, index) => (
              <div key={index} className="bg-light-blue/20 p-6 rounded-xl">
                <div className="font-semibold text-text-dark mb-2">{faq.q}</div>
                <div className="text-text-gray">{faq.a}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/faq" className="text-primary-blue hover:underline font-semibold">
              Se alla vanliga frågor →
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}
