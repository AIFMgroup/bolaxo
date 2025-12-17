'use client'

import { useRef, useState, useEffect } from 'react'
import ObjectCard from './ObjectCard'
import { BusinessObject } from '@/data/mockObjects'

interface LazyObjectCardProps {
  object: BusinessObject
  matchScore?: number
  index: number
}

/**
 * Lazy-loaded ObjectCard using Intersection Observer
 * Only renders when card is about to enter viewport
 */
export default function LazyObjectCard({ object, matchScore, index }: LazyObjectCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            setHasBeenVisible(true)
            // Once visible, stop observing
            observer.unobserve(entry.target)
          }
        })
      },
      {
        root: null,
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0
      }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  // Stagger animation delay based on index (but cap it)
  const animationDelay = Math.min(index * 50, 200)

  return (
    <div
      ref={cardRef}
      className={`transform transition-all duration-500 ${
        hasBeenVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4'
      }`}
      style={{ 
        transitionDelay: hasBeenVisible ? `${animationDelay}ms` : '0ms',
        minHeight: hasBeenVisible ? 'auto' : '280px' // Prevent layout shift
      }}
    >
      {hasBeenVisible ? (
        <ObjectCard object={object} matchScore={matchScore} />
      ) : (
        // Skeleton placeholder
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-8 bg-gray-200 rounded" />
          </div>
          <div className="mt-4 h-10 bg-gray-200 rounded" />
        </div>
      )}
    </div>
  )
}

/**
 * Virtualized list for very large datasets
 * Only renders items in viewport + buffer
 */
export function VirtualizedObjectList({ 
  objects, 
  itemHeight = 300,
  bufferSize = 5 
}: { 
  objects: BusinessObject[]
  itemHeight?: number
  bufferSize?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    const handleResize = () => {
      setContainerHeight(container.clientHeight)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const totalHeight = objects.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize)
  const endIndex = Math.min(
    objects.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize
  )
  const visibleObjects = objects.slice(startIndex, endIndex)

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto"
      style={{ height: '100vh' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: startIndex * itemHeight,
            left: 0,
            right: 0
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {visibleObjects.map((object, i) => (
              <ObjectCard 
                key={object.id} 
                object={object} 
                matchScore={object.matchScore}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

