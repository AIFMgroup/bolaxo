import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// GET /api/saved-searches - Get all saved searches for user
export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('afterfounder_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ savedSearches })
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json({ error: 'Kunde inte hämta sparade sökningar' }, { status: 500 })
  }
}

// POST /api/saved-searches - Create a new saved search
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('afterfounder_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const body = await request.json()
    const { name, filters, notifyOnNew = true, notifyEmail = true, notifyInApp = true } = body

    if (!name || !filters) {
      return NextResponse.json({ error: 'Namn och filter krävs' }, { status: 400 })
    }

    // Count existing saved searches (limit to 10)
    const existingCount = await prisma.savedSearch.count({
      where: { userId },
    })

    if (existingCount >= 10) {
      return NextResponse.json(
        { error: 'Maximalt 10 sparade sökningar tillåtna' },
        { status: 400 }
      )
    }

    // Get initial match count
    const matchCount = await countMatches(filters)

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId,
        name,
        filters,
        notifyOnNew,
        notifyEmail,
        notifyInApp,
        lastMatchCount: matchCount,
        lastNotifiedAt: new Date(),
      },
    })

    return NextResponse.json({ savedSearch, matchCount })
  } catch (error) {
    console.error('Error creating saved search:', error)
    return NextResponse.json({ error: 'Kunde inte spara sökning' }, { status: 500 })
  }
}

// Helper function to count matches for a filter
async function countMatches(filters: any): Promise<number> {
  const where: any = {
    status: 'published',
  }

  if (filters.industries && filters.industries.length > 0) {
    where.industry = { in: filters.industries }
  }

  if (filters.regions && filters.regions.length > 0) {
    where.region = { in: filters.regions }
  }

  if (filters.priceMin || filters.priceMax) {
    where.askingPrice = {}
    if (filters.priceMin) where.askingPrice.gte = filters.priceMin
    if (filters.priceMax) where.askingPrice.lte = filters.priceMax
  }

  if (filters.revenueMin || filters.revenueMax) {
    where.revenue = {}
    if (filters.revenueMin) where.revenue.gte = filters.revenueMin
    if (filters.revenueMax) where.revenue.lte = filters.revenueMax
  }

  if (filters.employeesMin || filters.employeesMax) {
    where.employees = {}
    if (filters.employeesMin) where.employees.gte = filters.employeesMin
    if (filters.employeesMax) where.employees.lte = filters.employeesMax
  }

  return await prisma.listing.count({ where })
}

