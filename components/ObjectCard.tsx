'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, TrendingUp, Calendar, Eye, Shield } from 'lucide-react'
import { BusinessObject } from '@/data/mockObjects'

interface ObjectCardProps {
  object: BusinessObject
  matchScore?: number // Match score for buyers
}

export default function ObjectCard({ object, matchScore }: ObjectCardProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} MSEK`
    }
    return `${(amount / 1000).toFixed(0)} KSEK`
  }

  const getDaysAgo = (date: Date) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date)
      const days = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24))
      if (days === 0) return 'Idag'
      if (days === 1) return 'Igår'
      return `${days} dagar sedan`
    } catch (error) {
      return 'Nyligen'
    }
  }

  return (
    <Link href={`/objekt/${object.id}`}>
      <div className="card-interactive group h-full overflow-hidden active:scale-[0.98] transition-transform">
        {/* Image Section with Organic Shape */}
        <div className="relative mb-2.5 sm:mb-3 md:mb-4 -mx-3 sm:-mx-4 md:-mx-6 -mt-3 sm:-mt-4 md:-mt-6">
          <div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64 overflow-hidden bg-white">
            {object.image ? (
              <div className="relative w-full h-full">
                {/* Pulsing shadow effect with organic shape */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="relative w-full h-full">
                    {/* Organic shadow shape */}
                    <div 
                      className="absolute inset-2 bg-gray-800/20 blur-xl animate-pulse"
                      style={{
                        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
                        transform: 'rotate(-2deg)'
                      }}
                    />
                    {/* Image with organic border */}
                    <div 
                      className="relative w-full h-full overflow-hidden"
                      style={{
                        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
                        transform: 'rotate(-2deg)'
                      }}
                    >
                      <Image
                        src={object.image}
                        alt={object.anonymousTitle}
                        fill
                        className="object-cover"
                        style={{ transform: 'rotate(2deg) scale(1.1)' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div 
                  className="w-32 h-32 flex items-center justify-center bg-gray-200 text-4xl font-bold text-gray-400"
                  style={{
                    borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%'
                  }}
                >
                  {object.type.charAt(0)}
                </div>
              </div>
            )}
          </div>
          
          {/* Status Badges - Positioned over image */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2">
              {object.featured && (
                <span className="bg-primary-blue text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium shadow-lg">
                  Framhävd
                </span>
              )}
              <span className="bg-white/90 backdrop-blur-sm text-text-dark px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium shadow-lg">
                {object.category || object.type}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {matchScore !== undefined && (
                <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg backdrop-blur-sm ${
                  matchScore >= 80 
                    ? 'bg-green-500/90 text-white'
                    : matchScore >= 60
                    ? 'bg-blue-500/90 text-white'
                    : 'bg-yellow-500/90 text-white'
                }`}>
                  {matchScore}% match
                </span>
              )}
              <div className="flex items-center text-white bg-black/50 backdrop-blur-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                <Calendar className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                <span className="hidden sm:inline">{object.createdAt ? getDaysAgo(object.createdAt) : 'Nyligen'}</span>
                <span className="sm:hidden">{object.createdAt ? getDaysAgo(object.createdAt).split(' ')[0] : 'Ny'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-2 sm:space-y-2.5 md:space-y-3 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          <div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-text-dark mb-1 sm:mb-1.5 group-hover:text-primary-blue transition-colors line-clamp-2">
              {object.title || object.anonymousTitle || `${object.type} i ${object.region}`}
            </h3>
            <p className="text-[11px] sm:text-xs md:text-sm text-text-gray line-clamp-2">{object.description}</p>
          </div>

          {/* KPI Chips Section - Mobile optimized */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 md:py-3">
            {/* Revenue Chip */}
            <div className="inline-flex items-center px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 bg-blue-50 text-blue-700 rounded-full text-[9px] sm:text-[10px] md:text-xs font-semibold border border-blue-200">
              <TrendingUp className="w-2.5 sm:w-3 md:w-3.5 h-2.5 sm:h-3 md:h-3.5 mr-0.5 sm:mr-1 md:mr-1.5" />
              {formatCurrency(object.revenue)}
            </div>

            {/* Price Chip */}
            <div className="inline-flex items-center px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 bg-primary-blue/10 text-primary-blue rounded-full text-[9px] sm:text-[10px] md:text-xs font-semibold border border-primary-blue/20">
              💰 {(() => {
                if (object.abstainPriceMin && object.abstainPriceMax) {
                  return 'Ej angivet'
                } else if (object.abstainPriceMin) {
                  return `Från ${formatCurrency(object.priceMax || 0)}`
                } else if (object.abstainPriceMax) {
                  return `Upp till ${formatCurrency(object.priceMin || 0)}`
                } else if (object.priceMin && object.priceMax) {
                  return `${formatCurrency(object.priceMin)}-${formatCurrency(object.priceMax)}`
                } else {
                  return formatCurrency(object.price || object.priceMin || 0)
                }
              })()}
            </div>

            {/* Location Chip */}
            <div className="inline-flex items-center px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 bg-orange-50 text-orange-700 rounded-full text-[9px] sm:text-[10px] md:text-xs font-semibold border border-orange-200">
              <MapPin className="w-2.5 sm:w-3 md:w-3.5 h-2.5 sm:h-3 md:h-3.5 mr-0.5 sm:mr-1 md:mr-1.5" />
              <span className="truncate max-w-[60px] sm:max-w-none">{object.location || object.region}</span>
            </div>

            {/* Employees Count - if available (hide on very small screens) */}
            {object.employees && object.employees !== '0' && (
              <div className="hidden sm:inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 bg-purple-50 text-purple-700 rounded-full text-[10px] md:text-xs font-semibold border border-purple-200">
                👥 {object.employees} anst.
              </div>
            )}
          </div>

          {/* Additional Info - Simplified */}
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs border-t border-gray-100 pt-1.5 sm:pt-2">
            <div className="flex items-center text-text-gray">
              <Eye className="w-3 h-3 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">{object.views} visningar</span>
              <span className="sm:hidden">{object.views}</span>
            </div>
            {(object.ndaRequired !== false) && (
              <div className="flex items-center text-primary-blue font-medium">
                <Shield className="w-3 h-3 mr-0.5 sm:mr-1" />
                NDA
              </div>
            )}
          </div>
        </div>

        {/* Hover Effect - Subtle glow */}
        <div className="absolute inset-0 rounded-card opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-card shadow-[0_0_20px_rgba(37,99,235,0.1)]" />
        </div>
      </div>
    </Link>
  )
}
