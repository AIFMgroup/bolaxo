'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Phone, Mail, User, Sparkles, Calendar, CheckCircle2, ChevronDown, ShoppingCart, DollarSign, Handshake, HelpCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

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

export default function ChatWidget() {
  const t = useTranslations('chatWidget')
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('initialMessage'),
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  const interestOptions = [
    { value: 'buying', label: t('contactForm.interestBuying'), icon: ShoppingCart },
    { value: 'selling', label: t('contactForm.interestSelling'), icon: DollarSign },
    { value: 'partnership', label: t('contactForm.interestPartnership'), icon: Handshake },
    { value: 'other', label: t('contactForm.interestOther'), icon: HelpCircle },
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

  // Generate available time slots for the next 7 days
  const getAvailableTimeSlots = () => {
    const slots = []
    const today = new Date()
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue
      
      const dateStr = date.toLocaleDateString('sv-SE', { 
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Common questions based on current page
  const getCommonQuestions = () => {
    const baseQuestions = [
      { text: t('questions.base.valuation'), response: t('questions.base.valuationResponse') },
      { text: t('questions.base.cost'), response: t('questions.base.costResponse') },
      { text: t('questions.base.timeline'), response: t('questions.base.timelineResponse') }
    ]

    if (pathname.includes('vardering')) {
      return [
        { text: t('questions.valuation.free'), response: t('questions.valuation.freeResponse') },
        ...baseQuestions.slice(1)
      ]
    }

    if (pathname.includes('kopare')) {
      return [
        { text: t('questions.buyer.find'), response: t('questions.buyer.findResponse') },
        { text: t('questions.buyer.beforeNda'), response: t('questions.buyer.beforeNdaResponse') },
        baseQuestions[2]
      ]
    }

    return baseQuestions
  }

  const commonQuestions = getCommonQuestions()

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      const botResponse = getBotResponse(text)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    // Check for common questions
    for (const q of commonQuestions) {
      if (input.includes(q.text.toLowerCase()) || 
          q.text.toLowerCase().includes(input)) {
        return q.response
      }
    }

    // Specific responses - support both Swedish and English
    const isSwedish = locale === 'sv'
    
    if (isSwedish) {
      if (input.includes('hej') || input.includes('hallå')) {
        return t('botResponses.greeting')
      }
      if (input.includes('pris') || input.includes('kosta')) {
        return t('botResponses.pricing')
      }
      if (input.includes('värdering')) {
        return t('botResponses.valuation')
      }
      if (input.includes('sälja')) {
        return t('botResponses.selling')
      }
      if (input.includes('köpa') || input.includes('köpare')) {
        return t('botResponses.buying')
      }
      if (input.includes('kontakt') || input.includes('hjälp')) {
        return t('botResponses.contact')
      }
    } else {
      // English keywords
      if (input.includes('hi') || input.includes('hello')) {
        return t('botResponses.greeting')
      }
      if (input.includes('price') || input.includes('cost')) {
        return t('botResponses.pricing')
      }
      if (input.includes('valuation') || input.includes('value')) {
        return t('botResponses.valuation')
      }
      if (input.includes('sell') || input.includes('selling')) {
        return t('botResponses.selling')
      }
      if (input.includes('buy') || input.includes('buyer') || input.includes('buying')) {
        return t('botResponses.buying')
      }
      if (input.includes('contact') || input.includes('help')) {
        return t('botResponses.contact')
      }
    }

    // Default response
    return t('botResponses.default')
  }

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
      setShowContactForm(false)
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
    }, 3000)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[calc(var(--mobile-nav-height)+0.5rem)] lg:bottom-6 right-4 md:right-6 z-40 bg-navy text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group"
      >
        <div className="flex items-center gap-2 px-4 py-3 md:px-6 md:py-4">
          <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
          <span className="hidden md:block font-bold">{t('button')}</span>
        </div>
      </button>
    )
  }

  return (
    <>
      {/* Chat Window */}
      <div className="fixed bottom-0 right-0 lg:bottom-6 lg:right-6 z-40 w-full lg:w-[440px] h-[calc(100vh-var(--mobile-nav-height))] lg:h-[600px] bg-white lg:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-navy text-white p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg text-white">{t('header.title')}</h3>
              <p className="text-xs md:text-sm opacity-90">{t('header.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[80%] px-3 md:px-4 py-2 md:py-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-navy text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-white/70' : 'text-gray-400'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Common Questions */}
        <div className="px-3 md:px-4 py-2 md:py-3 bg-white border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">{t('commonQuestions')}</p>
          <div className="space-y-2">
            {commonQuestions.map((q, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(q.text)}
                className="w-full text-left text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {q.text}
              </button>
            ))}
            
            <button
              onClick={() => setShowContactForm(true)}
              className="w-full text-left text-sm px-3 py-2 bg-navy text-white rounded-lg hover:shadow-md transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              {t('contactMe')}
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="p-3 md:p-4 bg-white border-t border-gray-100">
          <form onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage(inputValue)
          }} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('inputPlaceholder')}
              className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-accent-pink text-sm"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2 md:p-3 bg-navy text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-w-full md:max-w-xl w-full overflow-hidden max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
            {!contactFormSubmitted ? (
              <>
                {/* Header */}
                <div className="bg-navy text-white p-4 md:p-6 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 text-white">{t('contactForm.title')}</h3>
                    <p className="text-sm md:text-base text-white/90">{t('contactForm.subtitle')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleContactSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
                  {/* Contact Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t('contactForm.contactMethod')}
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 md:p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                             style={{ borderColor: contactForm.contactMethod === 'email' ? '#1F3C58' : '#E5E7EB' }}>
                        <input
                          type="radio"
                          name="contactMethod"
                          value="email"
                          checked={contactForm.contactMethod === 'email'}
                          onChange={(e) => setContactForm({ ...contactForm, contactMethod: 'email' })}
                          className="mr-2 md:mr-3"
                        />
                        <div className="flex items-center gap-2 md:gap-3">
                          <Mail className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                          <div>
                            <p className="text-sm md:text-base font-medium">{t('contactForm.email')}</p>
                            <p className="text-xs md:text-sm text-gray-500">{t('contactForm.emailDesc')}</p>
                          </div>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-3 md:p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                             style={{ borderColor: contactForm.contactMethod === 'phone' ? '#1F3C58' : '#E5E7EB' }}>
                        <input
                          type="radio"
                          name="contactMethod"
                          value="phone"
                          checked={contactForm.contactMethod === 'phone'}
                          onChange={(e) => setContactForm({ ...contactForm, contactMethod: 'phone' })}
                          className="mr-2 md:mr-3"
                        />
                        <div className="flex items-center gap-2 md:gap-3">
                          <Phone className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                          <div>
                            <p className="text-sm md:text-base font-medium">{t('contactForm.phone')}</p>
                            <p className="text-xs md:text-sm text-gray-500">{t('contactForm.phoneDesc')}</p>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center p-3 md:p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                             style={{ borderColor: contactForm.contactMethod === 'demo' ? '#1F3C58' : '#E5E7EB' }}>
                        <input
                          type="radio"
                          name="contactMethod"
                          value="demo"
                          checked={contactForm.contactMethod === 'demo'}
                          onChange={(e) => setContactForm({ ...contactForm, contactMethod: 'demo' })}
                          className="mr-2 md:mr-3"
                        />
                        <div className="flex items-center gap-2 md:gap-3">
                          <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                          <div>
                            <p className="text-sm md:text-base font-medium">{t('contactForm.demo')}</p>
                            <p className="text-xs md:text-sm text-gray-500">{t('contactForm.demoDesc')}</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Subject - Show for phone and demo */}
                  {(contactForm.contactMethod === 'phone' || contactForm.contactMethod === 'demo') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('contactForm.subject')}
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-accent-pink focus:outline-none"
                        placeholder={t('contactForm.subjectPlaceholder')}
                        maxLength={100}
                      />
                    </div>
                  )}

                  {/* Interest Dropdown */}
                  <div className="relative" ref={interestDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contactForm.interest')}
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
                      {t('contactForm.name')}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-accent-pink focus:outline-none"
                        placeholder={t('contactForm.namePlaceholder')}
                      />
                    </div>
                  </div>

                  {/* Email (shown if email contact method selected) */}
                  {contactForm.contactMethod === 'email' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('contactForm.emailLabel')}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-accent-pink focus:outline-none"
                          placeholder={t('contactForm.emailPlaceholder')}
                        />
                      </div>
                    </div>
                  )}

                  {/* Phone and Calendar (shown if phone or demo contact method selected) */}
                  {(contactForm.contactMethod === 'phone' || contactForm.contactMethod === 'demo') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('contactForm.phoneLabel')}
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            required
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-accent-pink focus:outline-none"
                            placeholder={t('contactForm.phonePlaceholder')}
                          />
                        </div>
                      </div>

                      {/* Date Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="inline w-4 h-4 mr-1" />
                          {t('contactForm.whenCall')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {getAvailableTimeSlots().map((slot) => (
                            <button
                              key={slot.date}
                              type="button"
                              onClick={() => setContactForm({ ...contactForm, preferredDate: slot.date })}
                              className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                                contactForm.preferredDate === slot.date
                                  ? 'border-navy bg-navy text-white'
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
                            {t('contactForm.selectTime')}
                          </label>
                          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {timeSlots.map((slot) => (
                              <button
                                key={slot.value}
                                type="button"
                                onClick={() => setContactForm({ ...contactForm, preferredTime: slot.value })}
                                className={`p-2 border-2 rounded-lg text-sm transition-all ${
                                  contactForm.preferredTime === slot.value
                                    ? 'border-navy bg-navy text-white'
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
                      onClick={() => setShowContactForm(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      {t('contactForm.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-navy text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                      {t('contactForm.submit')}
                    </button>
                  </div>
                </form>
              </>
              ) : (
                <div className="p-8 md:p-12 text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{t('contactForm.thankYou')}</h3>
                  <p className="text-sm md:text-base text-gray-600">
                    {contactForm.contactMethod === 'email' 
                      ? t('contactForm.successEmail')
                      : contactForm.contactMethod === 'demo'
                      ? t('contactForm.successDemo')
                      : t('contactForm.successPhone')}
                  </p>
                </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}