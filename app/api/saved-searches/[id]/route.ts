import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// GET /api/saved-searches/[id] - Get saved search with current matches
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const savedSearch = await prisma.savedSearch.findFirst({
      where: { id, userId },
    })

    if (!savedSearch) {
      return NextResponse.json({ error: 'Sparad sökning hittades inte' }, { status: 404 })
    }

    // Get current matches
    const matches = await getMatches(savedSearch.filters as any)
    const newMatchCount = matches.length - savedSearch.lastMatchCount

    return NextResponse.json({
      savedSearch,
      matches,
      newMatchCount: Math.max(0, newMatchCount),
    })
  } catch (error) {
    console.error('Error fetching saved search:', error)
    return NextResponse.json({ error: 'Kunde inte hämta sökning' }, { status: 500 })
  }
}

// PATCH /api/saved-searches/[id] - Update saved search
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const body = await request.json()
    const { name, notifyOnNew, notifyEmail, notifyInApp, markAsSeen } = body

    const existing = await prisma.savedSearch.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Sparad sökning hittades inte' }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (notifyOnNew !== undefined) updateData.notifyOnNew = notifyOnNew
    if (notifyEmail !== undefined) updateData.notifyEmail = notifyEmail
    if (notifyInApp !== undefined) updateData.notifyInApp = notifyInApp

    // If marking as seen, update lastMatchCount and lastNotifiedAt
    if (markAsSeen) {
      const currentCount = await countMatches(existing.filters as any)
      updateData.lastMatchCount = currentCount
      updateData.lastNotifiedAt = new Date()
    }

    const savedSearch = await prisma.savedSearch.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ savedSearch })
  } catch (error) {
    console.error('Error updating saved search:', error)
    return NextResponse.json({ error: 'Kunde inte uppdatera sökning' }, { status: 500 })
  }
}

// DELETE /api/saved-searches/[id] - Delete saved search
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const existing = await prisma.savedSearch.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Sparad sökning hittades inte' }, { status: 404 })
    }

    await prisma.savedSearch.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting saved search:', error)
    return NextResponse.json({ error: 'Kunde inte ta bort sökning' }, { status: 500 })
  }
}

// Helper function to get matches for a filter
async function getMatches(filters: any) {
  const where: any = {
    status: 'active',
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

  return await prisma.listing.findMany({
    where,
    select: {
      id: true,
      anonymousTitle: true,
      companyName: true,
      industry: true,
      region: true,
      askingPrice: true,
      revenue: true,
      employees: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

// Helper function to count matches
async function countMatches(filters: any): Promise<number> {
  const where: any = {
    status: 'active',
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

