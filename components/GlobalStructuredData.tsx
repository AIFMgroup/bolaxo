'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { StructuredData, defaultOrganizationData, websiteStructuredData, serviceStructuredData } from '@/lib/structured-data'

/**
 * Global Structured Data Provider
 * Lägger automatiskt till grundläggande structured data på alla sidor
 */
export function GlobalStructuredData() {
  const pathname = usePathname()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'

  useEffect(() => {
    // Add Organization data to all pages
    const orgScript = document.createElement('script')
    orgScript.type = 'application/ld+json'
    orgScript.text = JSON.stringify(defaultOrganizationData)
    orgScript.id = 'structured-data-organization'
    
    // Remove existing if present
    const existingOrg = document.getElementById('structured-data-organization')
    if (existingOrg) existingOrg.remove()
    
    document.head.appendChild(orgScript)

    // Add WebSite data to all pages
    const websiteScript = document.createElement('script')
    websiteScript.type = 'application/ld+json'
    websiteScript.text = JSON.stringify({
      ...websiteStructuredData,
      url: `${baseUrl}${pathname}`,
    })
    websiteScript.id = 'structured-data-website'
    
    const existingWebsite = document.getElementById('structured-data-website')
    if (existingWebsite) existingWebsite.remove()
    
    document.head.appendChild(websiteScript)

    // Add Service data to main pages
    if (pathname === '/' || pathname.startsWith('/kopare') || pathname.startsWith('/salja')) {
      const serviceScript = document.createElement('script')
      serviceScript.type = 'application/ld+json'
      serviceScript.text = JSON.stringify(serviceStructuredData)
      serviceScript.id = 'structured-data-service'
      
      const existingService = document.getElementById('structured-data-service')
      if (existingService) existingService.remove()
      
      document.head.appendChild(serviceScript)
    }

    // Cleanup
    return () => {
      // Scripts are automatically cleaned up by React
    }
  }, [pathname, baseUrl])

  return null
}

