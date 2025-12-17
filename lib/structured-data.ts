// Structured Data (JSON-LD) för LLM-optimering
// Denna komponent lägger till structured data som hjälper LLM:er förstå innehållet

'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'FAQPage' | 'Article' | 'Product' | 'Service' | 'BreadcrumbList'
  data: any
}

export function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': type,
      ...data,
    })
    script.id = `structured-data-${type.toLowerCase()}`
    
    // Remove existing script if present
    const existing = document.getElementById(script.id)
    if (existing) {
      existing.remove()
    }
    
    document.head.appendChild(script)
    
    return () => {
      const scriptToRemove = document.getElementById(script.id)
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [type, data])

  return null
}

// Default Organization data för hela siten
export const defaultOrganizationData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Trestor Group',
  alternateName: 'En del av Pactior Group',
  url: 'https://trestorgroup.se',
  logo: 'https://afterfounder.com/Logo/afterfounder.png',
  description: 'Sveriges smartaste företagsförmedling med verifierade uppgifter, NDA innan detaljer och kvalificerade köpare.',
  foundingDate: '2024',
  sameAs: [
    // Lägg till social media länkar här när de finns
    // 'https://www.linkedin.com/company/bolaxo',
    // 'https://twitter.com/bolaxo',
    // 'https://www.facebook.com/bolaxo',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    availableLanguage: ['Swedish', 'English'],
    email: 'kontakt@trestorgroup.se',
    url: 'https://trestorgroup.se/kontakt',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Sweden',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127',
    bestRating: '5',
    worstRating: '1',
  },
}

// WebSite structured data
export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Trestor Group',
  url: 'https://trestorgroup.se',
  description: 'Sveriges smartaste företagsförmedling - Köp och sälj företag säkert och enkelt',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://trestorgroup.se/sok?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

// Service structured data för företagsförmedling
export const serviceStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Företagsförmedling',
  provider: {
    '@type': 'Organization',
    name: 'Trestor Group',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Sweden',
  },
  description: 'Professionell plattform för köp och försäljning av företag med AI-driven värdering, smart matchning och säker transaktionshantering.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Gratis värdering',
      price: '0',
      priceCurrency: 'SEK',
    },
    {
      '@type': 'Offer',
      name: 'Gratis för köpare',
      price: '0',
      priceCurrency: 'SEK',
    },
  ],
}

// FAQ Page structured data
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// Article structured data för blogg
export function generateArticleStructuredData(article: {
  title: string
  description: string
  author: string
  datePublished: string
  dateModified?: string
  image?: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Trestor Group',
      logo: {
        '@type': 'ImageObject',
        url: 'https://afterfounder.com/Logo/afterfounder.png',
      },
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    image: article.image,
    url: article.url,
  }
}

// BreadcrumbList structured data
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// Product structured data för listings
export function generateProductStructuredData(listing: {
  name: string
  description: string
  price?: number
  priceCurrency?: string
  image?: string
  url: string
  category?: string
  location?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.name,
    description: listing.description,
    image: listing.image,
    category: listing.category,
    offers: listing.price ? {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: listing.priceCurrency || 'SEK',
      availability: 'https://schema.org/InStock',
      url: listing.url,
    } : undefined,
    // Additional properties för företagsförsäljning
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'location',
        value: listing.location,
      },
    ],
  }
}

// Aggregated rating structured data
export function generateAggregateRatingStructuredData(rating: {
  ratingValue: number
  reviewCount: number
  bestRating?: number
  worstRating?: number
}) {
  return {
    '@type': 'AggregateRating',
    ratingValue: rating.ratingValue,
    reviewCount: rating.reviewCount,
    bestRating: rating.bestRating || 5,
    worstRating: rating.worstRating || 1,
  }
}

// HowTo structured data för guider
export function generateHowToStructuredData(howTo: {
  name: string
  description: string
  steps: Array<{ name: string; text: string; image?: string; url?: string }>
  totalTime?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    totalTime: howTo.totalTime,
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
      url: step.url,
    })),
  }
}

