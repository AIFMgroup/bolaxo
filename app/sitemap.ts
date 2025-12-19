import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SWEDISH_CITIES } from '@/lib/cities'
import { locales } from '@/i18n'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'

// Static pages without locale prefix
const staticPages = [
  { path: '', priority: 1.0, changefreq: 'daily' },
  { path: '/sok', priority: 0.9, changefreq: 'daily' },
  { path: '/priser', priority: 0.9, changefreq: 'monthly' },
  { path: '/om-oss', priority: 0.8, changefreq: 'monthly' },
  { path: '/kontakt', priority: 0.7, changefreq: 'monthly' },
  { path: '/faq', priority: 0.8, changefreq: 'weekly' },
  { path: '/blogg', priority: 0.8, changefreq: 'daily' },
  { path: '/success-stories', priority: 0.8, changefreq: 'weekly' },
  { path: '/for-maklare', priority: 0.8, changefreq: 'monthly' },
  { path: '/investor', priority: 0.7, changefreq: 'monthly' },
  { path: '/partners', priority: 0.7, changefreq: 'monthly' },
  { path: '/karriar', priority: 0.6, changefreq: 'monthly' },
  { path: '/onepager', priority: 0.9, changefreq: 'monthly' },
  { path: '/kom-igang', priority: 0.9, changefreq: 'monthly' },
  { path: '/kopare', priority: 0.9, changefreq: 'daily' },
  { path: '/kopare/start', priority: 0.8, changefreq: 'monthly' },
  { path: '/kopare/sa-fungerar-det', priority: 0.8, changefreq: 'monthly' },
  { path: '/kopare/preferenser', priority: 0.7, changefreq: 'monthly' },
  { path: '/kopare/verifiering', priority: 0.6, changefreq: 'monthly' },
  { path: '/salja', priority: 0.9, changefreq: 'daily' },
  { path: '/salja/start', priority: 0.8, changefreq: 'monthly' },
  { path: '/salja/onboarding', priority: 0.7, changefreq: 'monthly' },
  { path: '/salja/priser', priority: 0.8, changefreq: 'monthly' },
  { path: '/salja/styrkor-risker', priority: 0.7, changefreq: 'monthly' },
  { path: '/salja/sme-kit', priority: 0.8, changefreq: 'monthly' },
  { path: '/juridiskt/integritetspolicy', priority: 0.5, changefreq: 'yearly' },
  { path: '/juridiskt/anvandarvillkor', priority: 0.5, changefreq: 'yearly' },
  { path: '/juridiskt/cookies', priority: 0.4, changefreq: 'yearly' },
  { path: '/juridiskt/gdpr', priority: 0.5, changefreq: 'yearly' },
  { path: '/vardering', priority: 0.9, changefreq: 'daily' },
  { path: '/vardering/demo', priority: 0.7, changefreq: 'monthly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapEntries: MetadataRoute.Sitemap = []

  // Add static pages per locale
  for (const locale of locales) {
    staticPages.forEach(page => {
      const localizedPath = page.path
        ? `/${locale}${page.path}`
        : `/${locale}`
      
      sitemapEntries.push({
        url: `${baseUrl}${localizedPath}`,
        lastModified: new Date(),
        changeFrequency: page.changefreq as any,
        priority: page.priority,
      })
    })
  }

  // Add city-based routes for köpare och säljare
  SWEDISH_CITIES.forEach(city => {
    for (const locale of locales) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/kopare/${city.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
      })
      
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/saljare/${city.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
      })
    }
  })

  // Add active listings (only public, active listings)
  try {
    const activeListings = await prisma.listing.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        updatedAt: true,
      },
      take: 1000, // Limit to 1000 most recent listings
      orderBy: {
        updatedAt: 'desc',
      },
    })

    activeListings.forEach(listing => {
      for (const locale of locales) {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/objekt/${listing.id}`,
          lastModified: listing.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    })
  } catch (error) {
    console.error('Error fetching listings for sitemap:', error)
    // Continue without listings if database fails
  }

  return sitemapEntries
}

