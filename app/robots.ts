import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/transaktion/',
          '/kopare/loi/',
          '/kopare/spa/',
          '/kopare/payment/',
          '/kopare/closing/',
          '/kopare/dd/',
          '/kopare/signing/',
          '/kopare/chat/',
          '/kopare/settings/',
          '/kopare/qa/',
          '/salja/onboarding/',
          '/salja/preview/',
          '/salja/klart/',
          '/salja/chat/',
          '/salja/settings/',
          '/salja/sme-kit/',
          '/loi/',
          '/nda/',
          '/kvitto/',
          '/kassa/',
          '/checkout/',
          '/auth/',
          '/dev-login/',
        ],
      },
      // Special rules for AI crawlers and LLMs
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'anthropic-ai',
          'Claude-Web',
          'Google-Extended',
          'PerplexityBot',
          'YouBot',
          'Applebot-Extended',
        ],
        allow: [
          '/',
          '/sok',
          '/kopare',
          '/salja',
          '/priser',
          '/om-oss',
          '/faq',
          '/blogg',
          '/success-stories',
          '/vardering',
          '/juridiskt/',
          '/kopare/sa-fungerar-det',
          '/salja/start',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/transaktion/',
          '/auth/',
        ],
      },
      // Block common scrapers that we don't want
      {
        userAgent: [
          'AhrefsBot',
          'MJ12bot',
          'DotBot',
          'SemrushBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

