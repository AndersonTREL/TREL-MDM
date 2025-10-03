import { describe, it, expect } from 'vitest'
import { formatFileSize, getInitials, truncate } from '@/lib/utils'

describe('Utility functions', () => {
  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(5242880)).toBe('5 MB')
    })

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })
  })

  describe('getInitials', () => {
    it('should get initials from single name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('should get initials from three part name', () => {
      expect(getInitials('John Michael Doe')).toBe('JM')
    })

    it('should handle lowercase names', () => {
      expect(getInitials('john doe')).toBe('JD')
    })
  })

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      expect(truncate('Hello', 10)).toBe('Hello')
    })

    it('should truncate long strings', () => {
      expect(truncate('This is a long string', 10)).toBe('This is a ...')
    })

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello')
    })
  })
})

