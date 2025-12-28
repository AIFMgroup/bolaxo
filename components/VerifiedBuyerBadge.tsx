'use client'

import { CheckCircle, ShieldCheck } from 'lucide-react'

interface VerifiedBuyerBadgeProps {
  verified?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export default function VerifiedBuyerBadge({ 
  verified = false, 
  size = 'md',
  showLabel = true,
  className = ''
}: VerifiedBuyerBadgeProps) {
  if (!verified) return null

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-2.5 py-1 gap-1.5'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }

  return (
    <span 
      className={`inline-flex items-center font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full ${sizeClasses[size]} ${className}`}
      title="Verifierad köpare - KYC godkänd"
    >
      <ShieldCheck className={iconSizes[size]} />
      {showLabel && <span>Verifierad</span>}
    </span>
  )
}

// Compact icon-only version for tight spaces
export function VerifiedBuyerIcon({ 
  verified = false,
  size = 'md',
  className = ''
}: { verified?: boolean; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  if (!verified) return null

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <span 
      className={`text-emerald-600 ${className}`}
      title="Verifierad köpare - KYC godkänd"
    >
      <ShieldCheck className={iconSizes[size]} />
    </span>
  )
}

