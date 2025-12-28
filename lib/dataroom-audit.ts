import { prisma } from '@/lib/prisma'

export type AuditAction = 
  | 'view'
  | 'download' 
  | 'upload'
  | 'delete'
  | 'invite'
  | 'accept_nda'
  | 'policy_change'
  | 'folder_create'
  | 'folder_delete'
  | 'permission_change'

interface LogAuditParams {
  dataRoomId: string
  actorId?: string | null
  actorEmail?: string | null
  action: AuditAction
  targetType?: string
  targetId?: string
  meta?: Record<string, any>
}

/**
 * Log an audit event to the dataroom audit trail.
 * Call this from API routes when actions occur.
 */
export async function logDataRoomAudit({
  dataRoomId,
  actorId,
  actorEmail,
  action,
  targetType,
  targetId,
  meta
}: LogAuditParams): Promise<void> {
  try {
    await prisma.dataRoomAudit.create({
      data: {
        dataRoomId,
        actorId: actorId || null,
        actorEmail: actorEmail || null,
        action,
        targetType: targetType || null,
        targetId: targetId || null,
        meta: meta ?? undefined
      }
    })
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error('Failed to log audit event:', error)
  }
}

