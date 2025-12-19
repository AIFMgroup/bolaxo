// Component för att lägga till Article structured data på blogg-sidan
'use client'

import { useEffect } from 'react'
import { generateArticleStructuredData } from '@/lib/structured-data'

interface BlogPostStructuredDataProps {
  post: {
    id: string
    title: string
    excerpt: string
    author: string
    date: Date | string
    image?: string
    category?: string
    tags?: string[]
  }
}

export function BlogPostStructuredData({ post }: BlogPostStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'
  
  useEffect(() => {
    const datePublished = post.date instanceof Date 
      ? post.date.toISOString() 
      : new Date(post.date).toISOString()

    const articleData = generateArticleStructuredData({
      title: post.title,
      description: post.excerpt,
      author: post.author,
      datePublished,
      dateModified: datePublished,
      image: post.image,
      url: `${baseUrl}/blogg/${post.id}`,
    })

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(articleData)
    script.id = 'structured-data-article'

    const existing = document.getElementById('structured-data-article')
    if (existing) existing.remove()

    document.head.appendChild(script)

    return () => {
      const scriptToRemove = document.getElementById('structured-data-article')
      if (scriptToRemove) scriptToRemove.remove()
    }
  }, [post, baseUrl])

  return null
}

