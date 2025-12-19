'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Check, CheckCircle, TrendingUp, Shield, Clock, Users, Star, ArrowRight, 
  Zap, Target, Award, Heart, DollarSign, Eye, Lock, MessageCircle, 
  Trophy, Rocket, Handshake, XCircle
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export default function OnePagerPage() {
  const t = useTranslations('onepager')
  const locale = useLocale()
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

  const testimonials = t.raw('hero.testimonials') as Array<{
    quote: string
    name: string
    company: string
    result: string
  }>

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
                <span className="font-semibold">{liveCounter.toLocaleString(locale === 'sv' ? 'sv-SE' : 'en-US')}</span>
                <span className="ml-1">{t('hero.socialProof')}</span>
              </div>

              {/* Main headline - Emotionell */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                {t('hero.title')}<br/>
                <span className="text-light-blue">{t('hero.titleHighlight')}</span><br/>
                <span className="text-white/90">{t('hero.titleSubtext')}</span>
              </h1>

              {/* Subheadline - Smärta → Lösning */}
              <p className="text-xl md:text-xl sm:text-2xl mb-8 opacity-90 leading-relaxed">
                {t('hero.subtitle')}{' '}
                <strong className="text-white">{t('hero.subtitleHighlight')}</strong>{' '}{t('hero.subtitleSubtext')}
              </p>

              {/* Key benefits - Konkreta */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-lg">
                  <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0 text-green-400" />
                  <span><strong>{t('hero.benefits.freeValuation')}</strong> {t('hero.benefits.freeValuationTime')}</span>
                </div>
                <div className="flex items-center text-lg">
                  <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0 text-green-400" />
                  <span><strong>{t('hero.benefits.anonymous')}</strong> {t('hero.benefits.anonymousUntil')}</span>
                </div>
                <div className="flex items-center text-lg">
                  <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0 text-green-400" />
                  <span><strong>{t('hero.benefits.avgPrice')}</strong> {t('hero.benefits.avgPriceValue')}</span>
                </div>
              </div>

              {/* CTA Buttons - Hierarki */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href={`/${locale}/vardering`} 
                  className="btn-primary bg-white text-primary-blue hover:bg-gray-100 text-lg px-8 py-4 inline-flex items-center justify-center group shadow-2xl"
                >
                  <Zap className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                  {t('hero.cta.freeValuation')}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link 
                  href={`/${locale}/salja/start`} 
                  className="btn-secondary bg-white text-primary-blue hover:bg-gray-100 text-lg px-8 py-4 inline-flex items-center justify-center"
                >
                  {t('hero.cta.startSelling')}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Link>
              </div>

              {/* Trust signals */}
              <div className="mt-8 flex items-center gap-3 sm:gap-4 md:gap-6 text-sm opacity-75">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span>{t('hero.trust.bankIdSecure')}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span>{t('hero.trust.avgDays')}</span>
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
                <div className="text-sm text-text-gray">{t('hero.stats.companiesSold')}</div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-white text-text-dark px-6 py-3 rounded-xl shadow-lg animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
                <div className="text-2xl sm:text-3xl font-bold text-green-600">4.9/5</div>
                <div className="text-sm text-text-gray">{t('hero.stats.satisfiedSellers')}</div>
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
              <div className="text-4xl font-bold text-primary-blue mb-2">{locale === 'sv' ? '18.7M kr' : '18.7M SEK'}</div>
              <div className="text-text-gray">{t('statsBar.avgPrice')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-blue mb-2">{locale === 'sv' ? '94 dagar' : '94 days'}</div>
              <div className="text-text-gray">{t('statsBar.avgTime')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-blue mb-2">50,000+</div>
              <div className="text-text-gray">{t('statsBar.verifiedBuyers')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-blue mb-2">97%</div>
              <div className="text-text-gray">{t('statsBar.recommend')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="py-6 sm:py-8 md:py-12 bg-gradient-to-b from-white to-light-blue/10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-16">
            <h2 className="heading-1 mb-6">
              {t('problemSolution.title')}{' '}<span className="text-red-600">{t('problemSolution.titleHighlight')}</span>{' '}{t('problemSolution.titleEnd')}
            </h2>
            <p className="text-xl text-text-gray max-w-3xl mx-auto">
              {t('problemSolution.subtitle')}
            </p>
          </div>

          {/* Problem vs Solution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-3 sm:gap-4 md:gap-6">
            {/* Problems */}
            <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-text-dark mb-6 flex items-center">
              <XCircle className="w-6 h-6 text-red-600 mr-2" />
              {t('problemSolution.traditional')}
            </h3>
              
              <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500">
                <div className="font-semibold text-text-dark mb-2">{t('problemSolution.problems.longTime.title')}</div>
                <p className="text-sm text-text-gray">{t('problemSolution.problems.longTime.desc')}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500">
                <div className="font-semibold text-text-dark mb-2">{t('problemSolution.problems.expensive.title')}</div>
                <p className="text-sm text-text-gray">{t('problemSolution.problems.expensive.desc')}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500">
                <div className="font-semibold text-text-dark mb-2">{t('problemSolution.problems.noAnonymity.title')}</div>
                <p className="text-sm text-text-gray">{t('problemSolution.problems.noAnonymity.desc')}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500">
                <div className="font-semibold text-text-dark mb-2">{t('problemSolution.problems.unserious.title')}</div>
                <p className="text-sm text-text-gray">{t('problemSolution.problems.unserious.desc')}</p>
              </div>
            </div>

            {/* Solutions */}
            <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-primary-blue mb-6 flex items-center">
              <CheckCircle className="w-6 h-6 text-primary-blue mr-2" />
              {t('problemSolution.withBOLAXO')}
            </h3>
              
              <div className="bg-gradient-to-br from-green-50 to-light-blue p-6 rounded-2xl border-l-4 border-green-500">
                <div className="font-semibold text-text-dark mb-2">{t('problemSolution.solutions.fast.title')}</div>
                <p className="text-sm text-text-gray">{t('problemSolution.solutions.fast.desc')}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-light-blue p-6 rounded-2xl border-l-4 border-green-500">
                <div className="font-semibold text-text-dark mb-2">{t('problemSolution.solutions.fixedPrice.title')}</div>
                <p className="text-sm text-text-gray">{t('problemSolution.solutions.fixedPrice.desc')}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-light-blue p-6 rounded-2xl border-l-4 border-green-500">
                <div className="font-semibold text-text-dark mb-2">{t('problemSolution.solutions.anonymous.title')}</div>
                <p className="text-sm text-text-gray">{t('problemSolution.solutions.anonymous.desc')}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-light-blue p-6 rounded-2xl border-l-4 border-green-500">
                <div className="font-semibold text-text-dark mb-2">{t('problemSolution.solutions.verified.title')}</div>
                <p className="text-sm text-text-gray">{t('problemSolution.solutions.verified.desc')}</p>
              </div>
            </div>
          </div>

          {/* Giant CTA */}
          <div className="mt-16 text-center">
            <Link 
              href={`/${locale}/vardering`} 
              className="inline-flex items-center px-12 py-6 bg-primary-blue hover:bg-blue-800 text-white text-xl sm:text-2xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 mr-3" />
              {t('problemSolution.cta.button')}
              <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 ml-3" />
            </Link>
            <p className="text-text-gray mt-4">{t('problemSolution.cta.subtext')}</p>
          </div>
        </div>
      </section>

      {/* How it works - Super simpel */}
      <section className="py-6 sm:py-8 md:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-16">
            <h2 className="heading-1 mb-4">{t('howItWorks.title')}</h2>
            <p className="text-xl text-text-gray">{t('howItWorks.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-3 sm:gap-4 md:gap-6 relative">
            {/* Arrow connectors */}
            <div className="hidden lg:block absolute top-1/2 left-1/3 w-full md:w-1/3 h-0.5 bg-gradient-to-r from-primary-blue to-light-blue transform -translate-y-1/2"></div>
            <div className="hidden lg:block absolute top-1/2 right-0 w-full md:w-1/3 h-0.5 bg-gradient-to-r from-light-blue to-primary-blue transform -translate-y-1/2"></div>

            <div className="relative bg-gradient-to-br from-light-blue to-white p-8 rounded-2xl shadow-card text-center transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-primary-blue text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl sm:text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-3">{t('howItWorks.steps.step1.title')}</h3>
              <p className="text-text-gray">{t('howItWorks.steps.step1.desc')}</p>
              <div className="mt-4 text-sm text-primary-blue font-semibold flex items-center justify-center">
                <Zap className="w-4 h-4 mr-1" /> {t('howItWorks.steps.step1.time')}
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-light-blue to-white p-8 rounded-2xl shadow-card text-center transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-primary-blue text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl sm:text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-3">{t('howItWorks.steps.step2.title')}</h3>
              <p className="text-text-gray">{t('howItWorks.steps.step2.desc')}</p>
              <div className="mt-4 text-sm text-primary-blue font-semibold flex items-center justify-center">
                <Lock className="w-4 h-4 mr-1" /> {t('howItWorks.steps.step2.note')}
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-light-blue to-white p-8 rounded-2xl shadow-card text-center transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-primary-blue text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl sm:text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-3">{t('howItWorks.steps.step3.title')}</h3>
              <p className="text-text-gray">{t('howItWorks.steps.step3.desc')}</p>
              <div className="mt-4 text-sm text-primary-blue font-semibold flex items-center justify-center">
                <Check className="w-4 h-4 mr-1" /> {t('howItWorks.steps.step3.time')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Recent sales */}
      <section className="py-6 sm:py-8 md:py-12 bg-primary-blue/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-2">{t('recentSales.title')}</h2>
            <p className="text-text-gray">{t('recentSales.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {t.raw('recentSales.sales').map((sale: { company: string; price: string; days: string; bids: number }, index: number) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-card border-t-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-text-gray">{t('recentSales.soldFor')} {sale.days}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                    {t('recentSales.closed')}
                  </span>
                </div>
                <div className="font-semibold text-text-dark mb-2">{sale.company}</div>
                <div className="text-xl sm:text-2xl font-bold text-primary-blue mb-2">{sale.price}</div>
                <div className="text-sm text-text-gray">{sale.bids} {t('recentSales.bidsReceived')}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Konkret värde */}
      <section className="py-6 sm:py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-16">
            <h2 className="heading-1 mb-4">{t('features.title')}</h2>
            <p className="text-xl text-text-gray">{t('features.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {t.raw('features.items').map((feature: { title: string; desc: string; value: string }, index: number) => {
              const iconMap: Record<string, any> = {
                'AI-Värdering': Zap,
                'Anonymitet': Lock,
                '50K+ Köpare': Eye,
                'BankID & NDA': Shield,
                'Datarum & Q&A': MessageCircle,
                'Smart Matchning': Target,
                'Rådgivning': Award,
                'Transparent Pris': DollarSign,
                // English translations
                'AI Valuation': Zap,
                'Anonymity': Lock,
                '50K+ Buyers': Eye,
                'Data Room & Q&A': MessageCircle,
                'Smart Matching': Target,
                'Advisory': Award,
                'Transparent Price': DollarSign
              }
              const IconComponent = iconMap[feature.title] || Zap
              return (
                <div key={index} className="bg-gradient-to-br from-white to-light-blue/20 p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all group">
                  <IconComponent className="w-12 h-12 text-primary-blue mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-text-dark mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-gray mb-3">{feature.desc}</p>
                  <div className="text-xs font-bold text-primary-blue">{feature.value}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials - Emotionella berättelser */}
      <section className="py-6 sm:py-8 md:py-12 bg-gradient-to-br from-primary-blue/5 to-light-blue/10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-16">
            <h2 className="heading-1 mb-4">{t('testimonials.title')}</h2>
            <p className="text-xl text-text-gray">{t('testimonials.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-3 sm:gap-4 md:gap-6">
                {t.raw('testimonials.stories').map((story: { name: string; age: number; company: string; quote: string; result: string; metric: string }, index: number) => {
                  const iconMap: Record<number, any> = { 0: Trophy, 1: Rocket, 2: Handshake }
                  const IconComponent = iconMap[index] || Trophy
                  return (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-card hover:shadow-card-hover transition-all">
                <div className="text-5xl mb-4">
                  <IconComponent className="w-10 h-10 text-primary-blue" />
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
            )})}
          </div>
        </div>
      </section>

      {/* FOMO - Brådska */}
      <section className="py-6 sm:py-8 md:py-12 bg-yellow-50 border-y-4 border-yellow-400">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 text-center">
          <div className="inline-flex items-center px-3 sm:px-3 sm:px-4 py-2 min-h-10 sm:min-h-auto bg-yellow-200 text-yellow-900 rounded-full font-semibold mb-6">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {t('fomo.badge')}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-dark mb-4">
            {t('fomo.title')}{' '}<span className="text-primary-blue">{t('fomo.titleHighlight')}</span>{' '}{t('fomo.titleEnd')}
          </h2>
          <p className="text-lg text-text-gray mb-6">
            {t('fomo.subtitle')}
          </p>
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-3 h-3 bg-primary-blue rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-primary-blue rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-primary-blue rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <Link href={`/${locale}/vardering`} className="btn-primary text-xl px-10 py-5 inline-flex items-center shadow-2xl">
            {t('fomo.cta')}
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
              {t('guarantee.title')}
            </h2>
            <p className="text-xl text-text-gray mb-8">
              {t('guarantee.subtitle')}{' '}<strong className="text-primary-blue">{t('guarantee.subtitleHighlight')}</strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 text-left">
              {t.raw('guarantee.items').map((item: { title: string; desc: string }, index: number) => (
              <div key={index} className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-text-dark">{item.title}</div>
                  <div className="text-sm text-text-gray">{item.desc}</div>
                </div>
              </div>
              ))}
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
            {t('finalCta.title')}
          </h2>
          
          <p className="text-xl sm:text-2xl mb-4 opacity-90">
            {t('finalCta.subtitle')}
          </p>
          
          <p className="text-xl mb-12 opacity-75 max-w-2xl mx-auto">
            {t('finalCta.description')}{' '}
            <strong className="text-white">{t('finalCta.descriptionHighlight')}</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center mb-8">
            <Link 
              href={`/${locale}/vardering`} 
              className="btn-primary bg-white text-primary-blue hover:bg-gray-100 text-xl sm:text-2xl px-12 py-6 inline-flex items-center justify-center shadow-2xl group"
            >
              <Zap className="w-7 h-7 mr-3 group-hover:scale-110 transition-transform" />
              {t('finalCta.cta')}
              <ArrowRight className="w-7 h-7 ml-3 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <p className="text-sm opacity-75">
            {t('finalCta.subtext')}
          </p>
        </div>
      </section>

      {/* FAQ - Hantera invändningar */}
      <section className="py-6 sm:py-8 md:py-12 bg-white">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <h2 className="heading-2 text-center mb-12">{t('faq.title')}</h2>
          
          <div className="space-y-4">
            {t.raw('faq.items').map((faq: { q: string; a: string }, index: number) => (
              <div key={index} className="bg-light-blue/20 p-6 rounded-xl">
                <div className="font-semibold text-text-dark mb-2">{faq.q}</div>
                <div className="text-text-gray">{faq.a}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href={`/${locale}/faq`} className="text-primary-blue hover:underline font-semibold">
              {t('faq.seeAll')}
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
