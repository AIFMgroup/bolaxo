/**
 * Core Listing type that matches the API response from /api/listings/[id]
 * This should be the single source of truth for listing data structures
 */
export interface Listing {
  // Core identifiers
  id: string
  userId: string
  
  // Basic company info
  companyName?: string // Only visible after NDA approval
  anonymousTitle: string
  orgNumber?: string // Only visible after NDA approval
  industry: string
  region: string
  location?: string
  address?: string // Only visible after NDA approval
  website?: string // Only visible after NDA approval
  
  // Financial data
  revenue: number
  revenueRange?: string
  revenue3Years?: number
  revenueGrowthRate?: number
  revenueYear1?: number
  revenueYear2?: number
  revenueYear3?: number
  ebitda?: number
  profit?: number
  profitMargin?: number
  grossMargin?: number
  
  // Pricing
  priceMin: number
  priceMax: number
  askingPrice?: number
  abstainPriceMin?: boolean
  abstainPriceMax?: boolean
  
  // Company details
  employees: number
  employeeRange?: string
  establishedYear?: number
  companyAge?: number
  
  // Assets & Liabilities
  cash?: number
  accountsReceivable?: number
  inventory?: number
  totalAssets?: number
  totalLiabilities?: number
  shortTermDebt?: number
  longTermDebt?: number
  
  // Operating Costs
  operatingCosts?: number
  salaries?: number
  rentCosts?: number
  marketingCosts?: number
  otherOperatingCosts?: number
  
  // Description & Marketing
  description?: string
  strengths?: string[]
  risks?: string[]
  whySelling?: string
  competitiveAdvantages?: string
  idealBuyer?: string
  highlights?: string[]
  
  // Business Model
  numberOfCustomers?: number
  recurringRevenuePercentage?: number
  customerAcquisitionCost?: number
  averageOrderValue?: number
  customerConcentrationRisk?: 'low' | 'medium' | 'high'
  
  // Market Position
  marketSize?: number
  marketShare?: number
  mainCompetitors?: string
  
  // Organization & Risks
  keyEmployeeDependency?: 'low' | 'medium' | 'high'
  mainRisks?: string
  regulatoryLicenses?: string
  paymentTerms?: string
  
  // Future Outlook
  growthPotential?: 'high' | 'moderate' | 'low'
  expansionPlans?: string
  
  // Media
  image?: string
  images?: string[]
  
  // Metadata
  status: 'draft' | 'active' | 'paused' | 'sold'
  type?: string
  category?: string
  verified: boolean
  broker?: boolean
  isNew?: boolean
  featured?: boolean
  views: number
  createdAt: string
  updatedAt: string
  
  // Package
  packageType?: 'basic' | 'pro' | 'enterprise'
  
  // API-specific fields (from /api/listings/[id])
  hasNDA?: boolean
  isOwner?: boolean
  masked?: boolean
  matchScore?: number
  matchReasons?: string[]
  
  // Detailed data (only after NDA)
  detailedFinancials?: any
  customers?: string[]
}

/**
 * Simplified listing for cards and list views
 */
export interface ListingCardData {
  id: string
  anonymousTitle: string
  companyName?: string
  industry: string
  region: string
  revenue: number
  priceMin: number
  priceMax: number
  askingPrice?: number
  employees: number
  verified: boolean
  isNew?: boolean
  views: number
  matchScore?: number
  image?: string
}

/**
 * Type guard to check if a listing is fully loaded
 */
export function isFullListing(listing: any): listing is Listing {
  return listing && typeof listing.id === 'string' && typeof listing.anonymousTitle === 'string'
}




