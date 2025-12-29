import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, checkRateLimit, RATE_LIMIT_CONFIGS } from '@/app/lib/rate-limiter'
import { prisma } from '@/lib/prisma'

// Helper function to verify admin authentication
async function verifyAdminAuth(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('adminToken')?.value
    if (!adminToken) {
      return { isValid: false, error: 'Unauthorized - No admin token' }
    }
    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: 'Authentication failed' }
  }
}

// GET - Fetch support tickets
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimitCheck = checkRateLimit(ip, RATE_LIMIT_CONFIGS.admin)
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS.admin.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
            'X-RateLimit-Reset': rateLimitCheck.resetTime.toString()
          }
        }
      )
    }
    
    // Verify admin auth
    const auth = await verifyAdminAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))
    const status = searchParams.get('status') // open, in_progress, resolved, closed
    const priority = searchParams.get('priority') // critical, high, medium, low
    const category = searchParams.get('category') // technical, billing, account, payment, listing
    const assignedTo = searchParams.get('assignedTo') // admin user id
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (priority && priority !== 'all') {
      where.priority = priority
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (assignedTo && assignedTo !== 'unassigned') {
      where.assignedTo = assignedTo
    } else if (assignedTo === 'unassigned') {
      where.assignedTo = null
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { createdByEmail: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Build orderBy - prioritize by status first
    const orderByArray: any[] = []
    
    // Sort by priority first (critical > high > medium > low)
    const priorityOrder: { [key: string]: number } = { critical: 0, high: 1, medium: 2, low: 3 }
    
    // Then by specified sort field
    if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'priority') {
      orderByArray.push({ [sortBy]: sortOrder })
    } else {
      orderByArray.push({ createdAt: 'desc' })
    }

    // Get total count
    const total = await prisma.supportTicket.count({ where })

    // Fetch tickets with user details
    const tickets = await prisma.supportTicket.findMany({
      where,
      select: {
        id: true,
        subject: true,
        description: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        createdByEmail: true,
        createdByName: true,
        assignedTo: true,
        assignedToEmail: true,
        userId: true,
        responses: true,
        lastResponse: true
      },
      orderBy: orderByArray,
      skip,
      take: limit
    })

    // Process tickets with calculated fields
    const processedTickets = tickets.map(ticket => {
      const now = new Date()
      const createdTime = new Date(ticket.createdAt)
      const hoursOpen = Math.floor((now.getTime() - createdTime.getTime()) / (1000 * 60 * 60))
      const daysOpen = Math.floor(hoursOpen / 24)
      
      let responseTimeStatus = 'on-time'
      if (ticket.status === 'open' && hoursOpen > 24) {
        responseTimeStatus = 'delayed'
      }

      const lastResponseTime = ticket.lastResponse
        ? Math.floor((now.getTime() - new Date(ticket.lastResponse).getTime()) / (1000 * 60))
        : null

      return {
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdBy: {
          email: ticket.createdByEmail,
          name: ticket.createdByName || 'Unknown'
        },
        assignedTo: ticket.assignedTo
          ? {
              id: ticket.assignedTo,
              email: ticket.assignedToEmail
            }
          : null,
        timeline: {
          createdAt: ticket.createdAt.toISOString(),
          updatedAt: ticket.updatedAt.toISOString(),
          lastResponse: ticket.lastResponse?.toISOString() || null,
          hoursOpen,
          daysOpen,
          lastResponseMinutesAgo: lastResponseTime
        },
        engagement: {
          responses: ticket.responses,
          responseTimeStatus
        }
      }
    })

    // Calculate statistics
    const allTickets = await prisma.supportTicket.findMany({
      where,
      select: {
        status: true,
        priority: true,
        category: true,
        assignedTo: true,
        responses: true,
        createdAt: true
      }
    })

    const stats = {
      total: allTickets.length,
      open: allTickets.filter(t => t.status === 'open').length,
      inProgress: allTickets.filter(t => t.status === 'in_progress').length,
      resolved: allTickets.filter(t => t.status === 'resolved').length,
      closed: allTickets.filter(t => t.status === 'closed').length,
      critical: allTickets.filter(t => t.priority === 'critical').length,
      unassigned: allTickets.filter(t => !t.assignedTo).length,
      overdue: allTickets.filter(t => {
        const hoursOpen = Math.floor((new Date().getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60))
        return t.status === 'open' && hoursOpen > 24
      }).length,
      avgResponseCount: Math.round(allTickets.reduce((sum, t) => sum + t.responses, 0) / Math.max(1, allTickets.length))
    }

    // Category breakdown
    const categoryStats = allTickets.reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1
      return acc
    }, {})

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      tickets: processedTickets,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore: page < pages
      },
      stats: {
        ...stats,
        categoryBreakdown: categoryStats
      }
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH - Update ticket status, priority, or assignment
export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimitCheck = checkRateLimit(ip, RATE_LIMIT_CONFIGS.admin)
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS.admin.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
            'X-RateLimit-Reset': rateLimitCheck.resetTime.toString()
          }
        }
      )
    }
    
    // Verify admin auth
    const auth = await verifyAdminAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const { ticketId, status, priority, assignedTo } = body

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId is required' }, { status: 400 })
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
    const validPriorities = ['critical', 'high', 'medium', 'low']

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `priority must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        assignedTo: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: 'Ticket updated successfully',
      data: updated
    })
  } catch (error) {
    console.error('Error updating ticket:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update ticket', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Add response to ticket
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimitCheck = checkRateLimit(ip, RATE_LIMIT_CONFIGS.admin)
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS.admin.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
            'X-RateLimit-Reset': rateLimitCheck.resetTime.toString()
          }
        }
      )
    }
    
    // Verify admin auth
    const auth = await verifyAdminAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const { ticketId, message, responderId, responderEmail } = body

    if (!ticketId || !message) {
      return NextResponse.json(
        { error: 'ticketId and message are required' },
        { status: 400 }
      )
    }

    // Find ticket first
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, responses: true }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Update ticket with new response count and timestamp
    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        responses: ticket.responses + 1,
        lastResponse: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        subject: true,
        status: true,
        responses: true,
        lastResponse: true,
        updatedAt: true,
        createdByEmail: true
      }
    })

    // Log the response in Activity model for audit trail
    // TODO: Implement SupportTicketActivity model for non-transaction auditing
    // await prisma.activity.create({
    //   data: {
    //     type: 'SUPPORT_RESPONSE',
    //     description: `Support response added to ticket: ${ticket.id}`,
    //     actorId: responderId,
    //     actorName: responderEmail,
    //     actorRole: 'admin',
    //     metadata: {
    //       ticketId,
    //       message: message.substring(0, 500),
    //       responderId,
    //       responderEmail
    //     }
    //   }
    // })

    return NextResponse.json({
      message: 'Response added successfully',
      data: {
        ticketId,
        responseNumber: updated.responses,
        addedAt: updated.updatedAt.toISOString(),
        message: message.substring(0, 500)
      }
    })
  } catch (error) {
    console.error('Error adding response to ticket:', error)
    return NextResponse.json(
      { error: 'Failed to add response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
