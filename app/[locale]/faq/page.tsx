'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronDown, HelpCircle, Users, Shield, CreditCard, FileText } from 'lucide-react'
import { generateFAQStructuredData } from '@/lib/structured-data'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: string
  category: 'general' | 'sellers' | 'buyers' | 'pricing' | 'security'
}

export default function FAQPage() {
  const t = useTranslations('faq')
  const locale = useLocale()
  const getLocalizedPath = (path: string) => `/${locale}${path}`
  
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [expandedItem, setExpandedItem] = useState<number | null>(0)

  // FAQ data with translations
  const faqData: FAQItem[] = [
    {
      category: 'general',
      question: t('items.general.whatIs.q'),
      answer: t('items.general.whatIs.a')
    },
    {
      category: 'general',
      question: t('items.general.howItWorks.q'),
      answer: t('items.general.howItWorks.a')
    },
    {
      category: 'general',
      question: t('items.general.cost.q'),
      answer: t('items.general.cost.a')
    },
    {
      category: 'sellers',
      question: t('items.sellers.freeValuation.q'),
      answer: t('items.sellers.freeValuation.a')
    },
    {
      category: 'sellers',
      question: t('items.sellers.timeToSell.q'),
      answer: t('items.sellers.timeToSell.a')
    },
    {
      category: 'sellers',
      question: t('items.sellers.anonymous.q'),
      answer: t('items.sellers.anonymous.a')
    },
    {
      category: 'buyers',
      question: t('items.buyers.freeSearch.q'),
      answer: t('items.buyers.freeSearch.a')
    },
    {
      category: 'buyers',
      question: t('items.buyers.findRight.q'),
      answer: t('items.buyers.findRight.a')
    },
    {
      category: 'pricing',
      question: t('items.pricing.discount.q'),
      answer: t('items.pricing.discount.a')
    },
    {
      category: 'security',
      question: t('items.security.dataProtection.q'),
      answer: t('items.security.dataProtection.a')
    }
  ]

  const categories = [
    { id: 'general', label: t('categories.general'), icon: HelpCircle },
    { id: 'sellers', label: t('categories.sellers'), icon: FileText },
    { id: 'buyers', label: t('categories.buyers'), icon: Users },
    { id: 'pricing', label: t('categories.pricing'), icon: CreditCard },
    { id: 'security', label: t('categories.security'), icon: Shield }
  ]

  const filteredFAQ = faqData.filter(item => item.category === selectedCategory)

  // Add FAQ structured data for SEO and LLM optimization
  useEffect(() => {
    const faqStructuredData = generateFAQStructuredData(
      faqData.map(item => ({
        question: item.question,
        answer: item.answer,
      }))
    )

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(faqStructuredData)
    script.id = 'structured-data-faq'

    // Remove existing script if present
    const existing = document.getElementById('structured-data-faq')
    if (existing) {
      existing.remove()
    }

    document.head.appendChild(script)

    return () => {
      const scriptToRemove = document.getElementById('structured-data-faq')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [])

  return (
    <main className="min-h-screen bg-white">
      {/* Hero med bakgrundsbild */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/polaroid/premium_photo-1712171314766-4087f2e84711.jpg"
            alt="FAQ"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/60" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">{t('title')}</h1>
          <p className="text-xl md:text-2xl text-white/80 leading-relaxed max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mb-12 justify-center">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  isActive
                    ? 'bg-accent-pink text-primary-navy'
                    : 'bg-neutral-off-white text-primary-navy border border-gray-200 hover:border-accent-pink'
                }`}
              >
                <Icon className="w-5 h-5" />
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {filteredFAQ.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                className="w-full px-6 py-5 sm:py-6 flex items-start justify-between gap-4 bg-white hover:bg-neutral-off-white transition-colors text-left"
              >
                <h3 className="text-base sm:text-lg font-bold text-primary-navy leading-relaxed pr-4">
                  {item.question}
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-accent-pink flex-shrink-0 transition-transform ${
                    expandedItem === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedItem === index && (
                <div className="px-6 py-6 sm:py-8 bg-neutral-off-white border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-accent-pink rounded-lg p-12 text-center">
          <h2 className="text-2xl font-bold text-primary-navy mb-4">{t('notFound')}</h2>
          <p className="text-lg text-primary-navy mb-8">
            {t('contactUs')}
          </p>
          <Link
            href={getLocalizedPath('/kontakt')}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-navy text-white font-bold rounded-lg hover:shadow-lg transition-all"
          >
            {t('contactButton')}
            <ChevronDown className="w-5 h-5 rotate-90" />
          </Link>
        </div>
      </div>
    </main>
  )
}
