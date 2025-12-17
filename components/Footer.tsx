'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, Facebook, Linkedin, Twitter, Shield, Users, Building2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'

export default function Footer() {
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear())
  const t = useTranslations('footer')
  const locale = useLocale()

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  return (
    <footer className="bg-primary-navy text-white">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className="inline-block mb-6">
              <div className="flex items-center gap-3">
                <Image 
                  src="/Logo/afterfounder.png" 
                  alt="Afterfounder" 
                  width={150} 
                  height={50}
                  className="h-12 md:h-10 w-auto"
                />
              </div>
            </Link>
            <p className="text-gray-300 text-base md:text-sm leading-relaxed mb-6">
              {t('description')}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-base md:text-sm">
              <a href="tel:+46812345678" className="flex items-center gap-3 text-gray-300 hover:text-accent-pink transition-colors">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+46 (0)8 123 456 78</span>
              </a>
              <a href="mailto:kontakt@trestorgroup.se" className="flex items-center gap-3 text-gray-300 hover:text-accent-pink transition-colors">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>kontakt@trestorgroup.se</span>
              </a>
              <div className="flex items-start gap-3 text-gray-300">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span dangerouslySetInnerHTML={{ __html: t('address').replace(/\n/g, '<br />') }} />
              </div>
            </div>
          </div>

          {/* För säljare */}
          <div>
            <h3 className="text-white font-bold text-lg md:text-base mb-6">{t('forSellers')}</h3>
            <ul className="space-y-3">
              <li><Link href={`/${locale}/salja`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">{t('howItWorks')}</Link></li>
              <li><Link href={`/${locale}/saljarprofil`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">Säljarprofil</Link></li>
              <li><Link href={`/${locale}/salja/skapa-annons`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">Skapa annons</Link></li>
              <li><Link href={`/${locale}/saljare`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">{t('sellInYourCity')}</Link></li>
              <li><Link href={`/${locale}/priser`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">{t('pricing')}</Link></li>
              <li><Link href={`/${locale}/faq`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">{t('faq')}</Link></li>
              <li><Link href={`/${locale}/kunskapsbank`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">Kunskapsbank</Link></li>
            </ul>
          </div>

          {/* För köpare */}
          <div>
            <h3 className="text-white font-bold text-lg md:text-base mb-6">{t('forBuyers')}</h3>
            <ul className="space-y-3">
              <li><Link href={`/${locale}/sok`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">{t('searchCompany')}</Link></li>
              <li><Link href={`/${locale}/kopare`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">{t('howItWorks')}</Link></li>
              <li><Link href={`/${locale}/kopare/start`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">{t('buyerSignup')}</Link></li>
              <li><Link href={`/${locale}/kopare`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">{t('buyInYourCity')}</Link></li>
              <li><Link href={`/${locale}/success-stories`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">{t('successStories')}</Link></li>
              <li><Link href={`/${locale}/blogg`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">{t('blog')}</Link></li>
            </ul>
          </div>

          {/* Om oss */}
          <div>
            <h3 className="text-white font-bold text-lg md:text-base mb-6">{t('about')}</h3>
            <ul className="space-y-3">
              <li><Link href={`/${locale}/om-oss`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">{t('company')}</Link></li>
              <li><Link href={`/${locale}/investor`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">{t('investors')}</Link></li>
              <li><Link href={`/${locale}/kontakt`} className="text-gray-300 text-base md:text-sm hover:text-accent-pink transition-colors">{t('contact')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-12"></div>

        {/* Trust Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* How it works */}
          <Link href={`/${locale}/salja`} className="group">
            <div className="flex items-start gap-4 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Users className="w-6 h-6 text-accent-pink flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold mb-2 group-hover:text-accent-pink transition-colors">{t('howItWorks')}</h4>
                <p className="text-gray-400 text-sm">{t('howItWorksDesc')}</p>
              </div>
            </div>
          </Link>

          {/* Security */}
          <Link href={`/${locale}/juridiskt/integritetspolicy`} className="group">
            <div className="flex items-start gap-4 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Shield className="w-6 h-6 text-accent-pink flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold mb-2 group-hover:text-accent-pink transition-colors">{t('security')}</h4>
                <p className="text-gray-400 text-sm">{t('securityDesc')}</p>
              </div>
            </div>
          </Link>

          {/* Partners */}
          <Link href={`/${locale}/partners`} className="group">
            <div className="flex items-start gap-4 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Building2 className="w-6 h-6 text-accent-pink flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-bold mb-2 group-hover:text-accent-pink transition-colors">{t('partners')}</h4>
                <p className="text-gray-400 text-sm">{t('partnersDesc')}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
          {/* Legal Links */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-xs text-gray-400">
            <Link href={`/${locale}/juridiskt/integritetspolicy`} className="hover:text-white transition-colors">
              {t('privacy')}
            </Link>
            <Link href={`/${locale}/juridiskt/anvandarvillkor`} className="hover:text-white transition-colors">
              {t('terms')}
            </Link>
            <Link href={`/${locale}/juridiskt/cookies`} className="hover:text-white transition-colors">
              {t('cookies')}
            </Link>
            <Link href={`/${locale}/juridiskt/gdpr`} className="hover:text-white transition-colors">
              {t('gdpr')}
            </Link>
            <Link href={`/${locale}/konto/radera`} className="hover:text-white transition-colors">
              {t('deleteAccount')}
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-6">
            <a 
              href="https://facebook.com/trestorgroup" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-accent-pink transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a 
              href="https://linkedin.com/company/pactior-group" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-accent-pink transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a 
              href="https://twitter.com/trestorgroup" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-accent-pink transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-xs text-gray-400">
          <p>{t('copyright', { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  )
}
