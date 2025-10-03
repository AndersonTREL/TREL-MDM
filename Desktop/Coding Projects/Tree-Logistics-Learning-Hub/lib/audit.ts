import { db } from './db'

export type AuditAction =
  | 'VIEW_PII'
  | 'UPDATE_PII'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'ARCHIVE_USER'
  | 'RESTORE_USER'
  | 'APPROVE_DOCUMENT'
  | 'REJECT_DOCUMENT'
  | 'CHANGE_ROLE'
  | 'CHANGE_STATUS'
  | 'EXPORT_DATA'
  | 'VIEW_AUDIT_LOG'
  | 'LOGIN'
  | 'LOGOUT'
  | 'FAILED_LOGIN'

export interface AuditLogData {
  actorId: string
  action: AuditAction
  entity: string
  entityId: string
  diff?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await db.auditLog.create({
      data: {
        actorId: data.actorId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        diff: data.diff as any || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logs should not break the application
  }
}

export function redactPII(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = [
    'password',
    'socialSecurityNumber',
    'taxIdentificationNumber',
    'iban',
    'twoFactorSecret',
  ]

  const redacted = { ...data }

  for (const field of sensitiveFields) {
    if (redacted[field]) {
      redacted[field] = '[REDACTED]'
    }
  }

  return redacted
}

