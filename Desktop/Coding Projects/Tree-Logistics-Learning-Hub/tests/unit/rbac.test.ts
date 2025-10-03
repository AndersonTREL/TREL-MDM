import { describe, it, expect } from 'vitest'
import { hasPermission, requirePermission, canAccessUser } from '@/lib/rbac'
import { Role } from '@prisma/client'

describe('RBAC', () => {
  describe('hasPermission', () => {
    it('should allow admin to create users', () => {
      expect(hasPermission(Role.ADMIN, 'USER_CREATE')).toBe(true)
    })

    it('should not allow driver to create users', () => {
      expect(hasPermission(Role.DRIVER, 'USER_CREATE')).toBe(false)
    })

    it('should allow inspector to review documents', () => {
      expect(hasPermission(Role.INSPECTOR, 'DOCUMENT_REVIEW')).toBe(true)
    })

    it('should not allow driver to review documents', () => {
      expect(hasPermission(Role.DRIVER, 'DOCUMENT_REVIEW')).toBe(false)
    })

    it('should allow driver to upload documents', () => {
      expect(hasPermission(Role.DRIVER, 'DOCUMENT_UPLOAD')).toBe(true)
    })

    it('should allow all roles to view courses', () => {
      expect(hasPermission(Role.ADMIN, 'COURSE_VIEW')).toBe(true)
      expect(hasPermission(Role.INSPECTOR, 'COURSE_VIEW')).toBe(true)
      expect(hasPermission(Role.DRIVER, 'COURSE_VIEW')).toBe(true)
    })

    it('should allow only admin to view audit logs', () => {
      expect(hasPermission(Role.ADMIN, 'AUDIT_LOG_VIEW')).toBe(true)
      expect(hasPermission(Role.INSPECTOR, 'AUDIT_LOG_VIEW')).toBe(false)
      expect(hasPermission(Role.DRIVER, 'AUDIT_LOG_VIEW')).toBe(false)
    })
  })

  describe('requirePermission', () => {
    it('should not throw for allowed permission', () => {
      expect(() => {
        requirePermission(Role.ADMIN, 'USER_CREATE')
      }).not.toThrow()
    })

    it('should throw for denied permission', () => {
      expect(() => {
        requirePermission(Role.DRIVER, 'USER_CREATE')
      }).toThrow('Insufficient permissions')
    })
  })

  describe('canAccessUser', () => {
    it('should allow admin to access any user', () => {
      expect(canAccessUser(Role.ADMIN, 'user123', 'admin123')).toBe(true)
    })

    it('should allow inspector to access any user', () => {
      expect(canAccessUser(Role.INSPECTOR, 'user123', 'inspector123')).toBe(true)
    })

    it('should allow user to access their own data', () => {
      expect(canAccessUser(Role.DRIVER, 'driver123', 'driver123')).toBe(true)
    })

    it('should not allow driver to access other users', () => {
      expect(canAccessUser(Role.DRIVER, 'otherDriver', 'driver123')).toBe(false)
    })
  })
})

