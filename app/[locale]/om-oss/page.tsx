'use client'

import Image from 'next/image'
import { Lightbulb, Eye, Target, Shield, TrendingUp, Users, Heart, Zap } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export default function AboutPage() {
  const t = useTranslations('about')
  const locale = useLocale()
  
  const teamMembers = t.raw('team')
  const values = t.raw('values')
  
  // Map team member images
  const teamImages = [
    '/polaroid/premium_photo-1712852503914-e892c988df70.jpg',
    '/polaroid/premium_photo-1712418419981-86f289e68598.jpg',
    '/polaroid/premium_photo-1713399247260-3b9c4f2c4575.jpg'
  ]
  
  return (
    <main className="bg-white">
      {/* Hero med bakgrundsbild */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/polaroid/premium_photo-1712016875079-5c42a61067e2.jpg"
            alt="Om Afterfounder"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/60" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            {t('heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl text-white/80 leading-relaxed max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Mission & Vision med bilder */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="group">
              <div className="polaroid-image aspect-video mb-8 overflow-hidden">
                <Image
                  src="/polaroid/premium_photo-1711984441590-2de9543b4ae2.jpg"
                  alt="Vår mission"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-navy/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-7 h-7 text-navy" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-navy mb-4">{t('missionTitle')}</h2>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {t('missionText')}
                  </p>
                </div>
              </div>
            </div>

            {/* Vision */}
            <div className="group">
              <div className="polaroid-image aspect-video mb-8 overflow-hidden">
                <Image
                  src="/polaroid/premium_photo-1712000450367-08f949135a62.jpg"
                  alt="Vår vision"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-navy/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Eye className="w-7 h-7 text-navy" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-navy mb-4">{t('visionTitle')}</h2>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {t('visionText')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Started med stor bild */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-navy/10 rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-navy" />
                </div>
                <h2 className="text-3xl font-bold text-navy">{t('whyStartedTitle')}</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {t('whyStartedText1')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('whyStartedText2')}
              </p>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="polaroid-image glow-strong aspect-square rounded-3xl overflow-hidden">
                <Image
                  src="/polaroid/premium_photo-1712171314341-d427afbf66b5.jpg"
                  alt="Varför vi startade"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team med bilder */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-6">{t('teamTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('teamSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member: any, idx: number) => (
              <div key={idx} className="group">
                <div className="polaroid-image floating aspect-[3/4] rounded-2xl overflow-hidden mb-6" style={{ animationDelay: `${idx * 0.5}s` }}>
                  <Image
                    src={teamImages[idx] || teamImages[0]}
                    alt={member.name}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-navy mb-1">{member.name}</h3>
                  <div className="text-sm font-semibold text-navy/60 mb-3">{member.title}</div>
                  <p className="text-gray-600">{member.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values med bakgrundsbild */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/polaroid/premium_photo-1712016875086-6af5b078671f.jpg"
            alt="Våra värderingar"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-navy/90" />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-16 uppercase">{t('valuesTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {values.map((val: any, idx: number) => {
              const icons = [Shield, Heart, Zap]
              const Icon = icons[idx] || Shield
              return (
                <div key={idx} className="text-white">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{val.title}</h3>
                  <p className="text-lg text-white/80">{val.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pactior Group */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="polaroid-image glow-strong aspect-video rounded-3xl overflow-hidden">
              <Image
                src="/polaroid/premium_photo-1713980018081-ce8029f61463.jpg"
                alt="Pactior Group"
                fill
                className="object-cover"
              />
            </div>
            
            <div>
              <span className="inline-block text-sm font-bold text-navy/60 uppercase tracking-widest mb-4">
                Del av
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-6">Pactior Group</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Afterfounder utvecklas tillsammans med Pactior Group och erfarna M&A-rådgivare. 
                Kombinationen av modern teknologi och klassisk transaktionskompetens gör processen 
                både effektiv och trygg.
              </p>
              <div className="flex flex-wrap gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-navy" />
                  <span>Trygg process</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-navy" />
                  <span>Fintech-driven</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-navy" />
                  <span>M&A-expertis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
