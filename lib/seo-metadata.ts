import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'

/**
 * Generate metadata for listing pages
 */
export async function generateListingMetadata(listingId: string): Promise<Metadata> {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        anonymousTitle: true,
        description: true,
        location: true,
        region: true,
        industry: true,
        priceMin: true,
        priceMax: true,
        image: true,
        type: true,
      },
    })

    if (!listing) {
      return {
        title: 'Objekt hittades inte',
        description: 'Detta objekt finns inte längre.',
      }
    }

    const title = `${listing.anonymousTitle} | Köp företag ${listing.location || listing.region || ''} | BOLAXO`
    const description = listing.description 
      ? `${listing.description.substring(0, 150)}...`
      : `Köp ${listing.anonymousTitle} i ${listing.location || listing.region || 'Sverige'}. ${listing.industry || ''} företag till salu.`

    const priceRange = listing.priceMin && listing.priceMax
      ? `${(listing.priceMin / 1000000).toFixed(0)}-${(listing.priceMax / 1000000).toFixed(0)} MSEK`
      : listing.priceMin
      ? `Från ${(listing.priceMin / 1000000).toFixed(0)} MSEK`
      : ''

    return {
      title,
      description: `${description} ${priceRange ? `Pris: ${priceRange}.` : ''} Verifierad uppgifter, säker transaktion.`,
      keywords: [
        'köp företag',
        listing.anonymousTitle.toLowerCase(),
        listing.location?.toLowerCase(),
        listing.region?.toLowerCase(),
        listing.industry?.toLowerCase(),
        listing.type?.toLowerCase(),
        'företagsförmedling',
        'företagsöverlåtelse',
        priceRange ? `${priceRange} företag` : '',
      ].filter(Boolean),
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'sv_SE',
        url: `${baseUrl}/objekt/${listingId}`,
        images: listing.image ? [
          {
            url: listing.image,
            width: 1200,
            height: 630,
            alt: listing.anonymousTitle,
          },
        ] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: listing.image ? [listing.image] : undefined,
      },
      alternates: {
        canonical: `${baseUrl}/objekt/${listingId}`,
      },
    }
  } catch (error) {
    console.error('Error generating listing metadata:', error)
    return {
      title: 'Objekt | BOLAXO',
      description: 'Företag till salu på BOLAXO',
    }
  }
}

/**
 * Generate metadata for blog posts
 */
export function generateBlogMetadata(post: {
  title: string
  excerpt: string
  author: string
  date: Date | string
  image?: string
  category?: string
}): Metadata {
  const datePublished = post.date instanceof Date 
    ? post.date.toISOString() 
    : new Date(post.date).toISOString()

  return {
    title: `${post.title} | BOLAXO Blogg`,
    description: post.excerpt,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: datePublished,
      authors: [post.author],
      images: post.image ? [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.image ? [post.image] : undefined,
    },
  }
}

/**
 * Generate metadata for city pages
 */
export function generateCityMetadata(city: {
  name: string
  slug: string
  region: string
  type: 'buyer' | 'seller'
}): Metadata {
  const typeLabel = city.type === 'buyer' ? 'köpa' : 'sälja'
  const title = `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} företag i ${city.name} | BOLAXO`
  const description = `Sök efter företag att ${typeLabel} i ${city.name}, ${city.region}. Vi hjälper dig hitta rätt match med AI-driven värdering och smart matchning.`

  return {
    title,
    description,
    keywords: [
      `${typeLabel} företag ${city.name}`,
      `företagsförmedling ${city.name}`,
      `${city.name} företag`,
      `${city.region} företag`,
      'företagsvärdering',
      'företagsöverlåtelse',
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'sv_SE',
      url: `${baseUrl}/${city.type === 'buyer' ? 'kopare' : 'saljare'}/${city.slug}`,
    },
    alternates: {
      canonical: `${baseUrl}/${city.type === 'buyer' ? 'kopare' : 'saljare'}/${city.slug}`,
    },
  }
}

