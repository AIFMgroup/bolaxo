import { prisma } from './prisma'
import { headers } from 'next/headers'

// Audit log categories
export type AuditCategory = 
  | 'auth'      // Login, logout, 2FA
  | 'nda'       // NDA requests, approvals
  | 'listing'   // Listing create/edit/delete
  | 'dataroom'  // Dataroom access, downloads
  | 'admin'     // Admin actions
  | 'payment'   // Payment events
  | 'user'      // User profile changes
  | 'security'  // Security-related events

// Audit action types
export type AuditAction =
  // Auth
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | '2fa_setup'
  | '2fa_enabled'
  | '2fa_disabled'
  | '2fa_verified'
  | '2fa_failed'
  | 'backup_code_used'
  | 'password_changed'
  | 'password_reset_requested'
  // NDA
  | 'nda_requested'
  | 'nda_approved'
  | 'nda_rejected'
  | 'nda_signed'
  // Listing
  | 'listing_created'
  | 'listing_updated'
  | 'listing_deleted'
  | 'listing_published'
  | 'listing_paused'
  // Dataroom
  | 'dataroom_accessed'
  | 'dataroom_document_viewed'
  | 'dataroom_document_downloaded'
  | 'dataroom_document_uploaded'
  | 'dataroom_settings_changed'
  | 'dataroom_ip_blocked'
  // Admin
  | 'admin_user_created'
  | 'admin_user_edited'
  | 'admin_user_deleted'
  | 'admin_listing_edited'
  | 'admin_impersonation'
  // Payment
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  | 'subscription_changed'
  // User
  | 'profile_updated'
  | 'email_changed'
  | 'account_deleted'
  // Security
  | 'suspicious_activity'
  | 'ip_blocked'
  | 'rate_limit_exceeded'

export type AuditSeverity = 'info' | 'warning' | 'critical'

interface AuditLogEntry {
  userId?: string
  userEmail?: string
  userRole?: string
  action: AuditAction
  category: AuditCategory
  severity?: AuditSeverity
  targetType?: string
  targetId?: string
  description: string
  metadata?: Record<string, any>
  previousValue?: any
  newValue?: any
  success?: boolean
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an audit log entry
 * Automatically captures IP and User-Agent from request headers
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // Get request context
    let ipAddress = entry.ipAddress
    let userAgent = entry.userAgent
    
    if (!ipAddress || !userAgent) {
      try {
        const headersList = await headers()
        ipAddress = ipAddress || 
          headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          headersList.get('x-real-ip') ||
          'unknown'
        userAgent = userAgent || headersList.get('user-agent') || 'unknown'
      } catch {
        // Headers not available (e.g., running outside request context)
        ipAddress = ipAddress || 'system'
        userAgent = userAgent || 'system'
      }
    }

    // Derive country from IP (simplified - in production use GeoIP service)
    const country = await getCountryFromIP(ipAddress)

    await prisma.auditLog.create({
      data: {
        userId: entry.userId || null,
        userEmail: entry.userEmail || null,
        userRole: entry.userRole || null,
        action: entry.action,
        category: entry.category,
        severity: entry.severity || determineSeverity(entry.action),
        targetType: entry.targetType || null,
        targetId: entry.targetId || null,
        description: entry.description,
        metadata: entry.metadata || undefined,
        previousValue: entry.previousValue || undefined,
        newValue: entry.newValue || undefined,
        success: entry.success ?? true,
        errorMessage: entry.errorMessage || null,
        ipAddress,
        userAgent,
        country,
      }
    })
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('[AuditLog] Failed to create audit log:', error)
  }
}

/**
 * Quick helper for auth-related events
 */
export async function logAuthEvent(
  action: AuditAction,
  userId: string | undefined,
  userEmail: string | undefined,
  success: boolean,
  details?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId,
    userEmail,
    action,
    category: 'auth',
    description: getAuthDescription(action, success, userEmail),
    success,
    metadata: details,
  })
}

/**
 * Quick helper for admin actions
 */
export async function logAdminAction(
  action: AuditAction,
  adminId: string,
  adminEmail: string,
  targetType: string,
  targetId: string,
  description: string,
  changes?: { previous?: any; new?: any }
): Promise<void> {
  await createAuditLog({
    userId: adminId,
    userEmail: adminEmail,
    userRole: 'admin',
    action,
    category: 'admin',
    severity: 'warning',
    targetType,
    targetId,
    description,
    previousValue: changes?.previous,
    newValue: changes?.new,
  })
}

/**
 * Quick helper for dataroom events
 */
export async function logDataroomEvent(
  action: AuditAction,
  userId: string,
  userEmail: string,
  dataRoomId: string,
  documentId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId,
    userEmail,
    action,
    category: 'dataroom',
    targetType: documentId ? 'document' : 'dataroom',
    targetId: documentId || dataRoomId,
    description: getDataroomDescription(action, userEmail),
    metadata: {
      dataRoomId,
      ...metadata,
    },
  })
}

/**
 * Quick helper for security events
 */
export async function logSecurityEvent(
  action: AuditAction,
  description: string,
  metadata?: Record<string, any>,
  userId?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    category: 'security',
    severity: 'critical',
    description,
    metadata,
  })
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    limit?: number
    category?: AuditCategory
    startDate?: Date
    endDate?: Date
  }
) {
  return prisma.auditLog.findMany({
    where: {
      userId,
      ...(options?.category && { category: options.category }),
      ...(options?.startDate && options?.endDate && {
        createdAt: {
          gte: options.startDate,
          lte: options.endDate,
        }
      }),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 100,
  })
}

/**
 * Get audit logs by IP address (for security investigation)
 */
export async function getAuditLogsByIP(
  ipAddress: string,
  options?: { limit?: number; startDate?: Date }
) {
  return prisma.auditLog.findMany({
    where: {
      ipAddress,
      ...(options?.startDate && {
        createdAt: { gte: options.startDate }
      }),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 100,
  })
}

/**
 * Get critical/warning events for admin dashboard
 */
export async function getCriticalEvents(limit: number = 50) {
  return prisma.auditLog.findMany({
    where: {
      severity: { in: ['warning', 'critical'] }
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

// Helper: Determine severity based on action
function determineSeverity(action: AuditAction): AuditSeverity {
  const criticalActions: AuditAction[] = [
    'login_failed',
    '2fa_failed',
    'password_changed',
    'admin_user_deleted',
    'admin_impersonation',
    'suspicious_activity',
    'ip_blocked',
    'account_deleted',
    'dataroom_ip_blocked',
  ]
  
  const warningActions: AuditAction[] = [
    '2fa_disabled',
    'nda_rejected',
    'listing_deleted',
    'admin_user_edited',
    'admin_listing_edited',
    'payment_failed',
    'rate_limit_exceeded',
    'backup_code_used',
  ]
  
  if (criticalActions.includes(action)) return 'critical'
  if (warningActions.includes(action)) return 'warning'
  return 'info'
}

// Helper: Get description for auth events
function getAuthDescription(action: AuditAction, success: boolean, email?: string): string {
  const user = email || 'Unknown user'
  
  switch (action) {
    case 'login_success': return `${user} logged in successfully`
    case 'login_failed': return `Failed login attempt for ${user}`
    case 'logout': return `${user} logged out`
    case '2fa_setup': return `${user} started 2FA setup`
    case '2fa_enabled': return `${user} enabled 2FA`
    case '2fa_disabled': return `${user} disabled 2FA`
    case '2fa_verified': return `${user} verified 2FA code`
    case '2fa_failed': return `${user} entered incorrect 2FA code`
    case 'backup_code_used': return `${user} used a backup code`
    case 'password_changed': return `${user} changed password`
    case 'password_reset_requested': return `Password reset requested for ${user}`
    default: return `Auth event: ${action}`
  }
}

// Helper: Get description for dataroom events
function getDataroomDescription(action: AuditAction, email?: string): string {
  const user = email || 'Unknown user'
  
  switch (action) {
    case 'dataroom_accessed': return `${user} accessed dataroom`
    case 'dataroom_document_viewed': return `${user} viewed document`
    case 'dataroom_document_downloaded': return `${user} downloaded document`
    case 'dataroom_document_uploaded': return `${user} uploaded document`
    case 'dataroom_settings_changed': return `${user} changed dataroom settings`
    case 'dataroom_ip_blocked': return `Access blocked for ${user} - IP restriction`
    default: return `Dataroom event: ${action}`
  }
}

// Helper: Get country from IP (simplified - use a GeoIP service in production)
async function getCountryFromIP(ip: string): Promise<string | null> {
  if (!ip || ip === 'unknown' || ip === 'system' || ip === '127.0.0.1' || ip === '::1') {
    return null
  }
  
  // In production, integrate with a GeoIP service like MaxMind or ip-api
  // For now, return null
  return null
}

