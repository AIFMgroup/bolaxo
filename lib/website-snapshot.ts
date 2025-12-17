import * as cheerio from 'cheerio'
import { createTimeoutSignal } from '@/lib/scrapers/abort-helper'

export interface WebsiteSnapshot {
  canonicalUrl: string
  rootDomain: string
  title?: string
  metaDescription?: string
  summary?: string
  keyHighlights?: string[]
  contact?: {
    emails?: string[]
    phones?: string[]
  }
  pagesAnalyzed: number
  fetchedAt: string
}

const DEFAULT_PATHS = ['/', '/about', '/om-oss', '/services', '/tjanster', '/produkter', '/solutions', '/case', '/kundcase']
const MAX_PAGES = 4
const MAX_SUMMARY_CHARS = 3200

export async function fetchWebsiteSnapshot(rawUrl?: string, companyName?: string): Promise<WebsiteSnapshot | null> {
  if (!rawUrl) return null
  let normalized = rawUrl.trim()
  if (!normalized) return null
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`
  }

  let parsed: URL
  try {
    parsed = new URL(normalized)
  } catch (error) {
    console.warn('[WebsiteSnapshot] Invalid URL supplied:', rawUrl, error)
    return null
  }

  const origin = parsed.origin
  const visited = new Set<string>()
  const highlights: string[] = []
  const emailSet = new Set<string>()
  const phoneSet = new Set<string>()
  const sections: string[] = []
  let pagesAnalyzed = 0
  let pageTitle: string | undefined
  let metaDescription: string | undefined

  const candidatePaths = Array.from(
    new Set(
      [
        parsed.pathname || '/',
        ...DEFAULT_PATHS,
        ...extractSiteSections(parsed.pathname)
      ].map((path) => (path.startsWith('/') ? path : `/${path}`))
    )
  )

  for (const path of candidatePaths) {
    if (pagesAnalyzed >= MAX_PAGES) break
    const targetUrl = `${origin}${path}`
    if (visited.has(targetUrl)) continue
    visited.add(targetUrl)

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'AfterfounderBot/1.0 (https://afterfounder.com)'
        },
        signal: createTimeoutSignal(8000)
      })

      if (!response.ok) continue

      const html = await response.text()
      const $ = cheerio.load(html)

      if (!pageTitle) {
        pageTitle = $('title').first().text().trim() || undefined
      }

      if (!metaDescription) {
        const meta = $('meta[name="description"]').attr('content')?.trim()
        if (meta) metaDescription = meta
      }

      $('script, style, noscript, template').remove()

      $('h1, h2').each((_, el) => {
        const heading = $(el)
          .text()
          .replace(/\s+/g, ' ')
          .trim()
        if (heading) {
          highlights.push(heading)
        }
      })

      const bodyText = $('body')
        .text()
        .replace(/\s+/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .trim()

      if (bodyText) {
        sections.push(`${pagesAnalyzed === 0 ? 'Startsida' : `Sektion ${pagesAnalyzed + 1}`} (${path}): ${bodyText}`)
        pagesAnalyzed++

        extractContacts(bodyText, emailSet, phoneSet)

        if (sections.join('\n\n').length >= MAX_SUMMARY_CHARS) break
      }
    } catch (error) {
      console.warn('[WebsiteSnapshot] Failed to fetch page', targetUrl, error)
    }
  }

  if (sections.length === 0) {
    return null
  }

  const summary = sections.join('\n\n').slice(0, MAX_SUMMARY_CHARS)
  const filteredHighlights = Array.from(new Set(highlights)).slice(0, 8)

  return {
    canonicalUrl: parsed.href,
    rootDomain: origin,
    title: pageTitle,
    metaDescription,
    summary,
    keyHighlights: filteredHighlights.length ? filteredHighlights : undefined,
    contact: {
      emails: Array.from(emailSet).slice(0, 3),
      phones: Array.from(phoneSet).slice(0, 3)
    },
    pagesAnalyzed,
    fetchedAt: new Date().toISOString()
  }
}

function extractSiteSections(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const derived: string[] = []
  if (segments.length === 0) return derived
  segments.forEach((segment) => {
    const clean = segment.toLowerCase()
    if (clean && clean.length > 2) {
      derived.push(`/${clean}`)
    }
  })
  return derived
}

function extractContacts(text: string, emailSet: Set<string>, phoneSet: Set<string>) {
  const emailMatches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)
  if (emailMatches) {
    emailMatches.forEach((email) => emailSet.add(email.toLowerCase()))
  }

  const phoneMatches = text.match(/(?:\+?46|0)\s?\d[\d\s-]{6,}/g)
  if (phoneMatches) {
    phoneMatches.forEach((phone) => phoneSet.add(phone.replace(/\s+/g, ' ').trim()))
  }
}

