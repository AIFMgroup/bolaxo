// Component för att lägga till Product structured data på listings-sidor
'use client'

import { useEffect } from 'react'
import { generateProductStructuredData, generateBreadcrumbStructuredData } from '@/lib/structured-data'

interface ListingStructuredDataProps {
  listing: {
    id: string
    anonymousTitle: string
    description: string
    priceMin?: number
    priceMax?: number
    location?: string
    region?: string
    industry?: string
    type?: string
    image?: string
    images?: string[]
  }
}

export function ListingStructuredData({ listing }: ListingStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'
  
  useEffect(() => {
    // Product structured data
    const productData = generateProductStructuredData({
      name: listing.anonymousTitle,
      description: listing.description,
      price: listing.priceMin || listing.priceMax,
      priceCurrency: 'SEK',
      image: listing.image || listing.images?.[0],
      url: `${baseUrl}/objekt/${listing.id}`,
      category: listing.industry || listing.type,
      location: listing.location || listing.region,
    })

    // Breadcrumb structured data
    const breadcrumbData = generateBreadcrumbStructuredData([
      { name: 'Hem', url: baseUrl },
      { name: 'Sök företag', url: `${baseUrl}/sok` },
      { name: listing.anonymousTitle, url: `${baseUrl}/objekt/${listing.id}` },
    ])

    // Add Product schema
    const productScript = document.createElement('script')
    productScript.type = 'application/ld+json'
    productScript.text = JSON.stringify(productData)
    productScript.id = 'structured-data-product'

    // Add Breadcrumb schema
    const breadcrumbScript = document.createElement('script')
    breadcrumbScript.type = 'application/ld+json'
    breadcrumbScript.text = JSON.stringify(breadcrumbData)
    breadcrumbScript.id = 'structured-data-breadcrumb'

    // Remove existing scripts if present
    const existingProduct = document.getElementById('structured-data-product')
    const existingBreadcrumb = document.getElementById('structured-data-breadcrumb')
    if (existingProduct) existingProduct.remove()
    if (existingBreadcrumb) existingBreadcrumb.remove()

    document.head.appendChild(productScript)
    document.head.appendChild(breadcrumbScript)

    return () => {
      const productScriptToRemove = document.getElementById('structured-data-product')
      const breadcrumbScriptToRemove = document.getElementById('structured-data-breadcrumb')
      if (productScriptToRemove) productScriptToRemove.remove()
      if (breadcrumbScriptToRemove) breadcrumbScriptToRemove.remove()
    }
  }, [listing, baseUrl])

  return null
}

