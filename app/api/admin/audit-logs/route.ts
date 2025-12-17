import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/admin-auth'

// GET /api/admin/audit-logs
// Get audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    const adminToken = await verifyAdminToken(request)
    
    if (!adminToken || adminToken.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Filtering options
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const action = searchParams.get('action')
    const severity = searchParams.get('severity')
    const ipAddress = searchParams.get('ip')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (category) {
      where.category = category
    }

    if (action) {
      where.action = action
    }

    if (severity) {
      if (severity === 'critical,warning') {
        where.severity = { in: ['critical', 'warning'] }
      } else {
        where.severity = severity
      }
    }

    if (ipAddress) {
      where.ipAddress = ipAddress
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get logs with count
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where })
    ])

    // Get summary stats
    const stats = await prisma.auditLog.groupBy({
      by: ['severity'],
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24h
      },
      _count: true
    })

    const severityCounts = {
      critical: 0,
      warning: 0,
      info: 0,
    }
    
    stats.forEach(s => {
      if (s.severity in severityCounts) {
        severityCounts[s.severity as keyof typeof severityCounts] = s._count
      }
    })

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        last24h: severityCounts
      }
    })
  } catch (error) {
    console.error('Audit logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

// GET categories and actions for filtering
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({
    categories: ['auth', 'nda', 'listing', 'dataroom', 'admin', 'payment', 'user', 'security'],
    severities: ['info', 'warning', 'critical'],
    actions: [
      // Auth
      'login_success', 'login_failed', 'logout', '2fa_setup', '2fa_enabled', 
      '2fa_disabled', '2fa_verified', '2fa_failed', 'backup_code_used',
      'password_changed', 'password_reset_requested',
      // NDA
      'nda_requested', 'nda_approved', 'nda_rejected', 'nda_signed',
      // Listing
      'listing_created', 'listing_updated', 'listing_deleted', 
      'listing_published', 'listing_paused',
      // Dataroom
      'dataroom_accessed', 'dataroom_document_viewed', 'dataroom_document_downloaded',
      'dataroom_document_uploaded', 'dataroom_settings_changed', 'dataroom_ip_blocked',
      // Admin
      'admin_user_created', 'admin_user_edited', 'admin_user_deleted',
      'admin_listing_edited', 'admin_impersonation',
      // Payment
      'payment_initiated', 'payment_completed', 'payment_failed', 'subscription_changed',
      // User
      'profile_updated', 'email_changed', 'account_deleted',
      // Security
      'suspicious_activity', 'ip_blocked', 'rate_limit_exceeded',
    ]
  })
}

