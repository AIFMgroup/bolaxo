import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// In production, create an AuditLog model in Prisma schema:
// model AuditLog {
//   id              String    @id @default(cuid())
//   adminId         String
//   action          String    // create, update, delete, approve, reject, suspend, etc
//   resourceType    String    // user, listing, payment, transaction, etc
//   resourceId      String
//   oldValues       Json?
//   newValues       Json?
//   details         String?
//   ipAddress       String?
//   userAgent       String?
//   status          String    // success, failed
//   errorMessage    String?
//   createdAt       DateTime  @default(now())
//   
//   @@index([adminId])
//   @@index([createdAt])
//   @@index([resourceType])
// }

// For now, we'll create mock audit logs based on system activity
interface AuditLogEntry {
  id: string
  adminId: string
  adminEmail: string
  action: string
  resourceType: string
  resourceId: string
  resourceName: string
  details: string
  status: 'success' | 'failed'
  timestamp: Date
}

// Mock audit logs storage (in production, store in database)
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    adminId: 'admin-1',
    adminEmail: 'admin@bolaxo.se',
    action: 'verify',
    resourceType: 'listing',
    resourceId: 'listing-123',
    resourceName: 'E-handel med 5M revenue',
    details: 'Listed verified after content review',
    status: 'success',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: '2',
    adminId: 'admin-1',
    adminEmail: 'admin@bolaxo.se',
    action: 'suspend',
    resourceType: 'user',
    resourceId: 'user-456',
    resourceName: 'spam@example.com',
    details: 'User suspended for suspicious activity - 15 listings in 3 days',
    status: 'success',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '3',
    adminId: 'admin-2',
    adminEmail: 'moderator@bolaxo.se',
    action: 'reject',
    resourceType: 'listing',
    resourceId: 'listing-789',
    resourceName: 'Suspicious 100M SEK startup',
    details: 'Listing rejected - unrealistic revenue claims',
    status: 'success',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: '4',
    adminId: 'admin-1',
    adminEmail: 'admin@bolaxo.se',
    action: 'update',
    resourceType: 'payment',
    resourceId: 'payment-111',
    resourceName: 'Payment 5M SEK',
    details: 'Changed status from PENDING to RELEASED',
    status: 'success',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
]

// GET - Fetch audit trail with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const adminId = searchParams.get('adminId')
    const action = searchParams.get('action')
    const resourceType = searchParams.get('resourceType')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Filter logs
    let filtered = [...mockAuditLogs]

    if (adminId) filtered = filtered.filter(log => log.adminId === adminId)
    if (action) filtered = filtered.filter(log => log.action === action)
    if (resourceType) filtered = filtered.filter(log => log.resourceType === resourceType)
    if (status) filtered = filtered.filter(log => log.status === status)

    if (dateFrom) {
      const from = new Date(dateFrom)
      filtered = filtered.filter(log => log.timestamp >= from)
    }

    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      filtered = filtered.filter(log => log.timestamp <= to)
    }

    // Sort
    filtered.sort((a, b) =>
      sortOrder === 'desc'
        ? b.timestamp.getTime() - a.timestamp.getTime()
        : a.timestamp.getTime() - b.timestamp.getTime()
    )

    const total = filtered.length
    const paginated = filtered.slice(skip, skip + limit)

    // Get action types
    const actionCounts = filtered.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get resource type counts
    const resourceCounts = filtered.reduce((acc, log) => {
      acc[log.resourceType] = (acc[log.resourceType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get unique admins
    const adminCounts = filtered.reduce((acc, log) => {
      acc[log.adminEmail] = (acc[log.adminEmail] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: paginated,
      stats: {
        total,
        successCount: filtered.filter(l => l.status === 'success').length,
        failedCount: filtered.filter(l => l.status === 'failed').length,
        actionBreakdown: actionCounts,
        resourceBreakdown: resourceCounts,
        adminActivity: adminCounts,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching audit trail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit trail' },
      { status: 500 }
    )
  }
}

// POST - Log an action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      adminId,
      adminEmail,
      action,
      resourceType,
      resourceId,
      resourceName,
      details,
      oldValues,
      newValues,
      status
    } = body

    if (!adminId || !action || !resourceType || !resourceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // In production, save to database
    const auditLog: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      adminId,
      adminEmail: adminEmail || 'unknown@bolaxo.se',
      action,
      resourceType,
      resourceId,
      resourceName: resourceName || resourceId,
      details: details || `${action} on ${resourceType} ${resourceId}`,
      status: status || 'success',
      timestamp: new Date(),
    }

    // Add to mock logs (in production, save to DB)
    mockAuditLogs.unshift(auditLog)

    // Keep only last 1000 logs in memory
    if (mockAuditLogs.length > 1000) {
      mockAuditLogs.pop()
    }

    return NextResponse.json({
      success: true,
      data: auditLog
    })
  } catch (error) {
    console.error('Error logging audit:', error)
    return NextResponse.json(
      { error: 'Failed to log audit action' },
      { status: 500 }
    )
  }
}

// GET export - Export audit logs as CSV
export async function HEAD(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'json'

    if (format === 'csv') {
      // Generate CSV
      const headers = ['ID', 'Admin', 'Action', 'Resource Type', 'Resource ID', 'Details', 'Status', 'Timestamp']
      const rows = mockAuditLogs.map(log => [
        log.id,
        log.adminEmail,
        log.action,
        log.resourceType,
        log.resourceId,
        log.details,
        log.status,
        log.timestamp.toISOString()
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="audit-trail.csv"'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Export format not supported yet'
    })
  } catch (error) {
    console.error('Error exporting audit trail:', error)
    return NextResponse.json(
      { error: 'Failed to export audit trail' },
      { status: 500 }
    )
  }
}
