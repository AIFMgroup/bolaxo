'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Mail, Phone, MapPin, Clock, CheckCircle2, Calendar, User, ShoppingCart, DollarSign, Handshake, HelpCircle, ChevronDown, X } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

interface ContactFormData {
  name: string
  phone: string
  email: string
  subject: string
  contactMethod: 'email' | 'phone' | 'demo' | ''
  interest: 'buying' | 'selling' | 'partnership' | 'other'
  preferredDate?: string
  preferredTime?: string
}

export default function ContactPage() {
  const t = useTranslations('contact')
  const locale = useLocale()
  
  const interestOptions = [
    { value: 'buying', label: t('buying'), icon: ShoppingCart },
    { value: 'selling', label: t('selling'), icon: DollarSign },
    { value: 'partnership', label: t('partnership'), icon: Handshake },
    { value: 'other', label: t('other'), icon: HelpCircle },
  ]
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: '',
    phone: '',
    email: '',
    subject: '',
    contactMethod: '',
    interest: 'buying'
  })
  const [contactFormSubmitted, setContactFormSubmitted] = useState(false)
  const [interestDropdownOpen, setInterestDropdownOpen] = useState(false)
  const interestDropdownRef = useRef<HTMLDivElement>(null)

  // Generate available time slots for the next 7 days
  const getAvailableTimeSlots = () => {
    const slots = []
    const today = new Date()
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue
      
      const dateStr = date.toLocaleDateString(locale === 'sv' ? 'sv-SE' : 'en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })
      
      slots.push({
        date: date.toISOString().split('T')[0],
        label: dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
      })
    }
    
    return slots
  }

  const timeSlots = [
    { value: '09:00', label: '09:00 - 09:30' },
    { value: '09:30', label: '09:30 - 10:00' },
    { value: '10:00', label: '10:00 - 10:30' },
    { value: '10:30', label: '10:30 - 11:00' },
    { value: '11:00', label: '11:00 - 11:30' },
    { value: '13:00', label: '13:00 - 13:30' },
    { value: '13:30', label: '13:30 - 14:00' },
    { value: '14:00', label: '14:00 - 14:30' },
    { value: '14:30', label: '14:30 - 15:00' },
    { value: '15:00', label: '15:00 - 15:30' },
    { value: '15:30', label: '15:30 - 16:00' },
  ]

  // Close interest dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (interestDropdownRef.current && !interestDropdownRef.current.contains(event.target as Node)) {
        setInterestDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate based on contact method
    if (!contactForm.name || !contactForm.contactMethod) return
    
    if (contactForm.contactMethod === 'email' && !contactForm.email) return
    if (contactForm.contactMethod === 'phone' && (!contactForm.phone || !contactForm.preferredDate || !contactForm.preferredTime || !contactForm.subject)) return
    if (contactForm.contactMethod === 'demo' && (!contactForm.phone || !contactForm.preferredDate || !contactForm.preferredTime || !contactForm.subject)) return
    
    // Here you would normally send the contact form to your backend
    console.log('Contact form submitted:', contactForm)
    
    setContactFormSubmitted(true)
    
    // Reset after 3 seconds
    setTimeout(() => {
      setContactFormSubmitted(false)
      setContactForm({ 
        name: '', 
        phone: '', 
        email: '', 
        subject: '',
        contactMethod: '',
        interest: 'buying',
        preferredDate: '',
        preferredTime: ''
      })
    }, 5000)
  }

  if (contactFormSubmitted) {
    return (
      <main className="min-h-screen bg-neutral-white py-20 sm:py-32 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-white p-12 rounded-3xl shadow-2xl border border-gray-200">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-primary-navy mb-4">{t('thankYou')}</h1>
            <p className="text-lg text-primary-navy leading-relaxed mb-10">
              {contactForm.contactMethod === 'email' 
                ? t('contactEmail24h')
                : contactForm.contactMethod === 'demo'
                ? t('contactDemo')
                : t('contactTime')}
            </p>
            <button 
              onClick={() => {
                setContactFormSubmitted(false)
                setContactForm({ 
                  name: '', 
                  phone: '', 
                  email: '', 
                  subject: '',
                  contactMethod: '',
                  interest: 'buying',
                  preferredDate: '',
                  preferredTime: ''
                })
              }}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1F3C58] text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              {t('sendNew')}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero med bakgrundsbild */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/polaroid/premium_photo-1713887090765-5fb598f7ca9d.jpg"
            alt="Kontakta oss"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/60" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">{t('title').toUpperCase()}</h1>
          <p className="text-xl text-white/80 max-w-xl mx-auto">
            Vi hjälper dig gärna med frågor om köp eller försäljning av företag
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-primary-navy mb-8">{t('contactInfo')}</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <Mail className="w-6 h-6 text-[#1F3C58] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-primary-navy mb-1">{t('email')}</h3>
                  <a href="mailto:hej@afterfounder.com" className="text-gray-700 hover:text-[#1F3C58] transition-colors">
                    hej@afterfounder.com
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <MapPin className="w-6 h-6 text-[#1F3C58] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-primary-navy mb-1">{t('address')}</h3>
                  <p className="text-gray-700">
                    Norrmälarstrand 10<br />
                    111 19 Stockholm<br />
                    {t('country')}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <Clock className="w-6 h-6 text-[#1F3C58] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-primary-navy mb-1">{t('openingHours')}</h3>
                  <p className="text-gray-700">
                    {t('openingHoursText')}<br />
                    {t('closedWeekend')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form - Matching ChatWidget Design */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Header */}
              <div className="bg-[#1F3C58] text-white p-6 md:p-8">
                <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white">{t('weContact')}</h3>
                <p className="text-base md:text-lg text-white">{t('chooseContact')}</p>
              </div>

              {/* Form */}
              <form onSubmit={handleContactSubmit} className="p-6 md:p-8 space-y-6">
                {/* Contact Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('howContact')} *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                           style={{ borderColor: contactForm.contactMethod === 'email' ? '#1F3C58' : '#E5E7EB' }}>
                      <input
                        type="radio"
                        name="contactMethod"
                        value="email"
                        checked={contactForm.contactMethod === 'email'}
                        onChange={(e) => setContactForm({ ...contactForm, contactMethod: 'email' })}
                        className="mr-3"
                      />
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-base font-medium">{t('email')}</p>
                          <p className="text-sm text-gray-500">{t('emailResponse')}</p>
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                           style={{ borderColor: contactForm.contactMethod === 'phone' ? '#1F3C58' : '#E5E7EB' }}>
                      <input
                        type="radio"
                        name="contactMethod"
                        value="phone"
                        checked={contactForm.contactMethod === 'phone'}
                        onChange={(e) => setContactForm({ ...contactForm, contactMethod: 'phone' })}
                        className="mr-3"
                      />
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-base font-medium">{t('phone')}</p>
                          <p className="text-sm text-gray-500">{t('phoneBook')}</p>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                           style={{ borderColor: contactForm.contactMethod === 'demo' ? '#1F3C58' : '#E5E7EB' }}>
                      <input
                        type="radio"
                        name="contactMethod"
                        value="demo"
                        checked={contactForm.contactMethod === 'demo'}
                        onChange={(e) => setContactForm({ ...contactForm, contactMethod: 'demo' })}
                        className="mr-3"
                      />
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-base font-medium">{t('demoBook')}</p>
                          <p className="text-sm text-gray-500">{t('demoDuration')}</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Subject - Show for phone and demo */}
                {(contactForm.contactMethod === 'phone' || contactForm.contactMethod === 'demo') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('subjectLabel')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#1F3C58] focus:outline-none"
                      placeholder={t('subjectPlaceholder')}
                      maxLength={100}
                    />
                  </div>
                )}

                {/* Interest Dropdown */}
                <div className="relative" ref={interestDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('interest')} *
                  </label>
                  <button
                    type="button"
                    onClick={() => setInterestDropdownOpen(!interestDropdownOpen)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-left focus:outline-none focus:border-[#1F3C58] focus:ring-2 focus:ring-[#1F3C58]/20 transition-all flex items-center justify-between hover:border-[#1F3C58]/50"
                  >
                    <span className="flex items-center gap-2">
                      {interestOptions.find(opt => opt.value === contactForm.interest)?.icon && (
                        (() => {
                          const IconComponent = interestOptions.find(opt => opt.value === contactForm.interest)?.icon
                          return IconComponent ? <IconComponent className="w-5 h-5 text-gray-600" /> : null
                        })()
                      )}
                      {interestOptions.find(opt => opt.value === contactForm.interest)?.label}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${interestDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {interestDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {interestOptions.map((option) => {
                        const IconComponent = option.icon
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setContactForm({ ...contactForm, interest: option.value as any })
                              setInterestDropdownOpen(false)
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[#1F3C58]/5 transition-colors ${
                              contactForm.interest === option.value ? 'bg-[#1F3C58]/10 font-semibold' : ''
                            }`}
                          >
                            <IconComponent className="w-5 h-5 text-gray-600" />
                            <span>{option.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('name')} *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#1F3C58] focus:outline-none"
                      placeholder={t('namePlaceholder')}
                    />
                  </div>
                </div>

                {/* Email (shown if email contact method selected) */}
                {contactForm.contactMethod === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('email')} *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#1F3C58] focus:outline-none"
                        placeholder={t('emailPlaceholder')}
                      />
                    </div>
                  </div>
                )}

                {/* Phone and Calendar (shown if phone or demo contact method selected) */}
                {(contactForm.contactMethod === 'phone' || contactForm.contactMethod === 'demo') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('phoneNumber')} *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          required
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#1F3C58] focus:outline-none"
                          placeholder={t('phonePlaceholder')}
                        />
                      </div>
                    </div>

                    {/* Date Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="inline w-4 h-4 mr-1" />
                        {t('whenCall')} *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {getAvailableTimeSlots().map((slot) => (
                          <button
                            key={slot.date}
                            type="button"
                            onClick={() => setContactForm({ ...contactForm, preferredDate: slot.date })}
                            className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                              contactForm.preferredDate === slot.date
                                ? 'border-[#1F3C58] bg-[#1F3C58] text-white'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Selection (shown after date is selected) */}
                    {contactForm.preferredDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('selectTime')} *
                        </label>
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot.value}
                              type="button"
                              onClick={() => setContactForm({ ...contactForm, preferredTime: slot.value })}
                              className={`p-2 border-2 rounded-lg text-sm transition-all ${
                                contactForm.preferredTime === slot.value
                                  ? 'border-[#1F3C58] bg-[#1F3C58] text-white'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {slot.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setContactForm({ 
                        name: '', 
                        phone: '', 
                        email: '', 
                        subject: '',
                        contactMethod: '',
                        interest: 'buying',
                        preferredDate: '',
                        preferredTime: ''
                      })
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    {t('clear')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-[#1F3C58] text-white rounded-xl hover:shadow-lg transition-all font-medium"
                  >
                    {t('send')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
