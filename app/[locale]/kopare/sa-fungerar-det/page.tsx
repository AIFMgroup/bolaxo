'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CheckCircle, Lock, User, Search, Shield, ChartBar, Building2, Key, Eye, FileText, MessagesSquare, BarChart3, Target } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export default function BuyerInfoPage() {
  const t = useTranslations('kopareSaFungerarDet')
  const locale = useLocale()
  const [activeStep, setActiveStep] = useState(1)

  const steps = useMemo(() => [
    {
      step: 1,
      title: t('steps.step1.title'),
      shortTitle: t('steps.step1.shortTitle'),
      description: t('steps.step1.description'),
      icon: <User className="w-6 h-6" />,
      detailedTitle: t('steps.step1.detailedTitle'),
      detailedDescription: t('steps.step1.detailedDescription'),
    },
    {
      step: 2,
      title: t('steps.step2.title'),
      shortTitle: t('steps.step2.shortTitle'),
      description: t('steps.step2.description'),
      icon: <Search className="w-6 h-6" />,
      detailedTitle: t('steps.step2.detailedTitle'),
      detailedDescription: t('steps.step2.detailedDescription'),
    },
    {
      step: 3,
      title: t('steps.step3.title'),
      shortTitle: t('steps.step3.shortTitle'),
      description: t('steps.step3.description'),
      icon: <Shield className="w-6 h-6" />,
      detailedTitle: t('steps.step3.detailedTitle'),
      detailedDescription: t('steps.step3.detailedDescription'),
    },
    {
      step: 4,
      title: t('steps.step4.title'),
      shortTitle: t('steps.step4.shortTitle'),
      description: t('steps.step4.description'),
      icon: <ChartBar className="w-6 h-6" />,
      detailedTitle: t('steps.step4.detailedTitle'),
      detailedDescription: t('steps.step4.detailedDescription'),
    },
    {
      step: 5,
      title: t('steps.step5.title'),
      shortTitle: t('steps.step5.shortTitle'),
      description: t('steps.step5.description'),
      icon: <Building2 className="w-6 h-6" />,
      detailedTitle: t('steps.step5.detailedTitle'),
      detailedDescription: t('steps.step5.detailedDescription'),
    },
  ], [t])

  return (
    <main className="bg-gray-100">
      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Mascot - Left side */}
            <div className="flex-shrink-0">
              <img 
                src="/Home/maskot3.png" 
                alt="Afterfounder maskot" 
                className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 object-contain"
              />
            </div>

            {/* Content - Right side */}
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block text-sm font-bold text-primary-navy/60 uppercase tracking-widest mb-4">
                Köparprocess
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-navy leading-tight mb-6">
                {t('heroTitle')}
              </h1>
              <p className="text-lg md:text-xl text-gray-700 max-w-2xl mb-8 leading-relaxed">
                {t('heroSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href={`/${locale}/registrera`} className="group inline-flex items-center justify-center gap-3 bg-primary-navy text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  {t('createProfileButton')}
                </Link>
                <Link href={`/${locale}/sok`} className="group inline-flex items-center justify-center gap-3 bg-primary-navy/10 text-primary-navy font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 hover:bg-primary-navy/20 border-2 border-primary-navy/20">
                  {t('watchButton')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Interactive Steps Section */}
        <section className="bg-gray-50 py-12 sm:py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-navy mb-4 text-center uppercase">
              {t('processTitle')}
            </h2>
            <p className="text-center text-primary-navy mb-12 sm:mb-16 text-lg sm:text-xl font-semibold uppercase">{t('buyerLabel')}</p>

            {/* Modern Tab Navigation */}
            <div className="mb-12 sm:mb-16">
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-primary-navy/10">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {steps.map((item) => (
                    <button
                      key={item.step}
                      onClick={() => setActiveStep(item.step)}
                      className={`relative group transition-all duration-300 ${
                        activeStep === item.step ? 'transform scale-105' : ''
                      }`}
                    >
                      {/* Card Background */}
                      <div className={`
                        p-4 rounded-xl border-2 transition-all duration-300
                        ${activeStep === item.step 
                          ? 'bg-primary-navy text-white border-primary-navy shadow-2xl' 
                          : 'bg-white hover:bg-primary-navy/5 text-primary-navy border-primary-navy/20 hover:border-primary-navy/50 shadow-md hover:shadow-lg'
                        }
                      `}>
                        {/* Pulsing effect for active */}
                        {activeStep === item.step && (
                          <div className="absolute -inset-1 rounded-xl bg-primary-navy opacity-25 blur-md animate-pulse"></div>
                        )}
                        
                        {/* Step Number */}
                        <div className={`
                          w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300
                          ${activeStep === item.step 
                            ? 'bg-white text-primary-navy' 
                            : 'bg-primary-navy/10 text-primary-navy group-hover:bg-primary-navy/20'
                          }
                        `}>
                          {item.step}
                        </div>
                        
                        {/* Title */}
                        <div className="text-center">
                          <div className="font-bold text-sm">{item.shortTitle}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Step Detail */}
            <div className="max-w-4xl mx-auto animate-fadeIn">
              <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-2xl border-2 border-primary-navy/20">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-primary-navy text-white rounded-2xl flex items-center justify-center shadow-lg">
                      {steps[activeStep - 1].icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl sm:text-3xl font-bold text-primary-navy mb-4">{steps[activeStep - 1].detailedTitle}</h3>
                    <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                      {steps[activeStep - 1].detailedDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Fill Profile */}
        <section className="bg-white py-12 sm:py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-12 shadow-xl border-2 border-primary-navy/10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-navy mb-6 sm:mb-8 text-center">
            {t('whyProfileTitle')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-navy text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-primary-navy mb-2">{t('whyProfile.trust.title')}</h3>
              <p className="text-sm text-gray-700">{t('whyProfile.trust.desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-navy text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-primary-navy mb-2">{t('whyProfile.speed.title')}</h3>
              <p className="text-sm text-gray-700">{t('whyProfile.speed.desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-navy text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-primary-navy mb-2">{t('whyProfile.matches.title')}</h3>
              <p className="text-sm text-gray-700">{t('whyProfile.matches.desc')}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <h3 className="font-bold text-primary-navy mb-4">{t('profileCheckTitle')}</h3>
            <ul className="space-y-3">
              {t.raw('profileCheckItems').map((item: string, idx: number) => (
                <li key={idx} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          </div>
        </div>
        </section>

        {/* What's Included */}
        <section className="bg-gray-50 py-12 sm:py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-navy mb-8 sm:mb-12 text-center">
            {t('whatsIncludedTitle')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {t.raw('features').map((feature: { title: string; description: string }, idx: number) => {
              const icons = [
                <Shield key="shield" className="w-8 h-8" />,
                <BarChart3 key="barchart" className="w-8 h-8" />,
                <Eye key="eye" className="w-8 h-8" />,
                <FileText key="filetext" className="w-8 h-8" />,
                <MessagesSquare key="messages" className="w-8 h-8" />,
                <Building2 key="building" className="w-8 h-8" />
              ]
              return (
                <div key={idx} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border border-primary-navy/10">
                  <div className="w-14 h-14 bg-primary-navy/10 text-primary-navy rounded-lg flex items-center justify-center mb-4">
                    {icons[idx]}
                  </div>
                  <h3 className="text-lg font-bold text-primary-navy mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-700">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
        </section>

        {/* Pricing */}
        <section className="bg-white py-12 sm:py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-12 shadow-xl border-2 border-primary-navy/10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-navy mb-6 sm:mb-8 text-center">
            {t('pricingTitle')}
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {t.raw('pricing').map((item: { title: string; desc: string }, idx: number) => (
              <div key={idx} className="bg-white rounded-lg p-6 flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-primary-navy mb-1">{item.title}</h3>
                  <p className="text-gray-700">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
        </section>

        {/* Security */}
        <section className="bg-gray-50 py-12 sm:py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-navy mb-8 sm:mb-12 text-center">
            {t('securityTitle')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-md border border-primary-navy/10">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-primary-navy" />
                <h3 className="text-xl font-bold text-primary-navy">{t('security.buyerIdentity.title')}</h3>
              </div>
              <p className="text-gray-700">{t('security.buyerIdentity.desc')}</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-md border border-primary-navy/10">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-primary-navy" />
                <h3 className="text-xl font-bold text-primary-navy">{t('security.sellerIdentity.title')}</h3>
              </div>
              <p className="text-gray-700">{t('security.sellerIdentity.desc')}</p>
            </div>
          </div>
          
          <div className="mt-8 bg-primary-navy/5 rounded-xl p-8 text-center">
            <Shield className="w-12 h-12 text-primary-navy mx-auto mb-4" />
            <h3 className="text-xl font-bold text-primary-navy mb-4">{t('security.securityTitle')}</h3>
            <p className="text-gray-700 max-w-2xl mx-auto">
              {t('security.securityDesc')}
            </p>
          </div>
        </div>
        </section>

        {/* CTA Row */}
        <section className="bg-white py-24 sm:py-32 md:py-48">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary-navy to-primary-navy/90 rounded-2xl p-8 sm:p-12 text-center text-white shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">{t('cta.title')}</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${locale}/registrera`} className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-navy font-bold rounded-lg hover:bg-gray-100 transition-all shadow-lg">
                {t('cta.createProfile')}
              </Link>
              <Link href={`/${locale}/sok`} className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all border-2 border-white">
                {t('cta.watch')}
              </Link>
              <Link href={`/${locale}/loi-mall`} className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all border-2 border-white">
                {t('cta.importLoi')}
              </Link>
            </div>
          </div>
        </div>
        </section>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </main>
  )
}