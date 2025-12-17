import { headers } from 'next/headers'

/**
 * IP Restriction utility for data rooms
 * Supports individual IPs, CIDR ranges, and country-based blocking
 */

interface IPRestrictionConfig {
  enabled: boolean
  allowedIPs: string[]      // Individual IPs or CIDR ranges
  allowedCountries: string[] // Country codes (SE, NO, DK, etc.)
}

interface IPCheckResult {
  allowed: boolean
  reason?: string
  ip: string
  country?: string
}

/**
 * Get client IP from request headers
 */
export async function getClientIP(): Promise<string> {
  try {
    const headersList = await headers()
    
    // Check various headers in order of preference
    const forwarded = headersList.get('x-forwarded-for')
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first (client)
      return forwarded.split(',')[0].trim()
    }
    
    const realIP = headersList.get('x-real-ip')
    if (realIP) {
      return realIP
    }
    
    // Cloudflare
    const cfIP = headersList.get('cf-connecting-ip')
    if (cfIP) {
      return cfIP
    }
    
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Check if IP is allowed based on restriction config
 */
export async function checkIPRestriction(
  config: IPRestrictionConfig,
  clientIP?: string
): Promise<IPCheckResult> {
  const ip = clientIP || await getClientIP()
  
  // If restrictions are disabled, allow all
  if (!config.enabled) {
    return { allowed: true, ip }
  }
  
  // If no restrictions configured, allow all
  if (config.allowedIPs.length === 0 && config.allowedCountries.length === 0) {
    return { allowed: true, ip }
  }
  
  // Check IP whitelist
  if (config.allowedIPs.length > 0) {
    const ipAllowed = isIPInList(ip, config.allowedIPs)
    if (ipAllowed) {
      return { allowed: true, ip, reason: 'IP whitelisted' }
    }
  }
  
  // Check country whitelist (if configured)
  if (config.allowedCountries.length > 0) {
    const country = await getCountryFromIP(ip)
    if (country && config.allowedCountries.includes(country)) {
      return { allowed: true, ip, country, reason: 'Country whitelisted' }
    }
    
    // If country check is enabled but IP not in allowed countries
    if (config.allowedIPs.length === 0) {
      // Only country restrictions, IP failed country check
      return { 
        allowed: false, 
        ip, 
        country,
        reason: `Access from ${country || 'unknown country'} is not allowed` 
      }
    }
  }
  
  // If we get here, IP is not in whitelist
  return { 
    allowed: false, 
    ip, 
    reason: 'IP address not in allowed list' 
  }
}

/**
 * Check if an IP is in the allowed list
 * Supports both individual IPs and CIDR notation
 */
function isIPInList(ip: string, allowedList: string[]): boolean {
  for (const allowed of allowedList) {
    if (allowed.includes('/')) {
      // CIDR notation
      if (isIPInCIDR(ip, allowed)) {
        return true
      }
    } else {
      // Exact match
      if (ip === allowed) {
        return true
      }
    }
  }
  return false
}

/**
 * Check if IP is within a CIDR range
 * Example: isIPInCIDR('192.168.1.100', '192.168.1.0/24') => true
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  try {
    const [range, bits] = cidr.split('/')
    const mask = parseInt(bits, 10)
    
    if (isNaN(mask) || mask < 0 || mask > 32) {
      return false
    }
    
    const ipNum = ipToNumber(ip)
    const rangeNum = ipToNumber(range)
    
    if (ipNum === null || rangeNum === null) {
      return false
    }
    
    const maskNum = ~((1 << (32 - mask)) - 1) >>> 0
    
    return (ipNum & maskNum) === (rangeNum & maskNum)
  } catch {
    return false
  }
}

/**
 * Convert IPv4 address to number
 */
function ipToNumber(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) {
    return null
  }
  
  let num = 0
  for (const part of parts) {
    const octet = parseInt(part, 10)
    if (isNaN(octet) || octet < 0 || octet > 255) {
      return null
    }
    num = (num << 8) | octet
  }
  
  return num >>> 0
}

/**
 * Get country code from IP address
 * In production, use a GeoIP service like MaxMind, ip-api, or ipinfo
 */
async function getCountryFromIP(ip: string): Promise<string | null> {
  // Skip for local/private IPs
  if (isPrivateIP(ip)) {
    return null
  }
  
  try {
    // Free tier API for demonstration
    // In production, use MaxMind GeoIP2 or similar service
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(2000) // 2 second timeout
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.countryCode || null
    }
  } catch {
    // GeoIP lookup failed, allow access but log
    console.warn(`[IPRestriction] Could not determine country for IP: ${ip}`)
  }
  
  return null
}

/**
 * Check if IP is a private/local address
 */
function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8',
    '169.254.0.0/16',
  ]
  
  for (const range of privateRanges) {
    if (isIPInCIDR(ip, range)) {
      return true
    }
  }
  
  return ip === '::1' || ip === 'localhost' || ip === 'unknown'
}

/**
 * Common Swedish corporate IP ranges (example)
 * In production, these would be configured per dataroom
 */
export const COMMON_SWEDEN_CORPORATE_RANGES = [
  // Example ranges - these should be configured by the seller
  // '193.10.0.0/16',   // Example: Some Swedish ISP
  // '194.16.0.0/16',   // Example: Another range
]

/**
 * Nordic country codes for quick setup
 */
export const NORDIC_COUNTRIES = ['SE', 'NO', 'DK', 'FI', 'IS']
export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
]

/**
 * Validate IP address format
 */
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipv4Regex.test(ip)) {
    return false
  }
  
  const parts = ip.split('.')
  return parts.every(part => {
    const num = parseInt(part, 10)
    return num >= 0 && num <= 255
  })
}

/**
 * Validate CIDR notation
 */
export function isValidCIDR(cidr: string): boolean {
  const parts = cidr.split('/')
  if (parts.length !== 2) {
    return false
  }
  
  const [ip, mask] = parts
  if (!isValidIP(ip)) {
    return false
  }
  
  const maskNum = parseInt(mask, 10)
  return !isNaN(maskNum) && maskNum >= 0 && maskNum <= 32
}

/**
 * Parse IP input (handles both single IPs and CIDR)
 */
export function parseIPInput(input: string): { valid: boolean; type: 'ip' | 'cidr'; value: string } {
  const trimmed = input.trim()
  
  if (trimmed.includes('/')) {
    return {
      valid: isValidCIDR(trimmed),
      type: 'cidr',
      value: trimmed
    }
  }
  
  return {
    valid: isValidIP(trimmed),
    type: 'ip',
    value: trimmed
  }
}

