import { Role } from '@prisma/client'

export const PERMISSIONS = {
  // User management
  USER_CREATE: ['ADMIN'],
  USER_UPDATE: ['ADMIN'],
  USER_DELETE: ['ADMIN'],
  USER_VIEW_ALL: ['ADMIN', 'INSPECTOR'],
  
  // Course management
  COURSE_CREATE: ['ADMIN'],
  COURSE_UPDATE: ['ADMIN'],
  COURSE_DELETE: ['ADMIN'],
  COURSE_VIEW: ['ADMIN', 'INSPECTOR', 'DRIVER'],
  
  // Document management
  DOCUMENT_REVIEW: ['ADMIN', 'INSPECTOR'],
  DOCUMENT_APPROVE: ['ADMIN', 'INSPECTOR'],
  DOCUMENT_UPLOAD: ['DRIVER'],
  
  // PII access
  PII_VIEW: ['ADMIN', 'INSPECTOR'],
  PII_UPDATE: ['ADMIN'],
  
  // Reports
  REPORTS_VIEW: ['ADMIN', 'INSPECTOR'],
  REPORTS_EXPORT: ['ADMIN'],
  
  // Settings
  SETTINGS_UPDATE: ['ADMIN'],
  
  // Leaderboard
  LEADERBOARD_VIEW: ['ADMIN', 'INSPECTOR', 'DRIVER'],
  
  // Announcements
  ANNOUNCEMENT_CREATE: ['ADMIN'],
  ANNOUNCEMENT_UPDATE: ['ADMIN'],
  
  // Audit logs
  AUDIT_LOG_VIEW: ['ADMIN'],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(userRole: Role, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly Role[]
  return allowedRoles.includes(userRole)
}

export function requirePermission(userRole: Role, permission: Permission): void {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Insufficient permissions: ${permission} required`)
  }
}

export function canAccessUser(actorRole: Role, targetUserId: string, actorId: string): boolean {
  if (actorRole === 'ADMIN') return true
  if (actorRole === 'INSPECTOR') return true // Inspectors can access drivers
  return actorId === targetUserId // Users can access their own data
}

