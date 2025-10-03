import { describe, it, expect } from 'vitest'
import {
  ibanSchema,
  bicSchema,
  taxIdSchema,
  phoneSchema,
  dateOfBirthSchema,
  imageFileSchema,
} from '@/lib/validators'

describe('Validators', () => {
  describe('IBAN validation', () => {
    it('should accept valid IBAN', () => {
      const result = ibanSchema.safeParse('DE89370400440532013000')
      expect(result.success).toBe(true)
    })

    it('should reject invalid IBAN', () => {
      const result = ibanSchema.safeParse('INVALID')
      expect(result.success).toBe(false)
    })
  })

  describe('BIC validation', () => {
    it('should accept valid BIC', () => {
      const result = bicSchema.safeParse('DEUTDEFF')
      expect(result.success).toBe(true)
    })

    it('should reject invalid BIC', () => {
      const result = bicSchema.safeParse('123')
      expect(result.success).toBe(false)
    })
  })

  describe('Tax ID validation', () => {
    it('should accept 11 digit tax ID', () => {
      const result = taxIdSchema.safeParse('12345678901')
      expect(result.success).toBe(true)
    })

    it('should reject non-11 digit tax ID', () => {
      const result = taxIdSchema.safeParse('123456')
      expect(result.success).toBe(false)
    })

    it('should reject non-numeric tax ID', () => {
      const result = taxIdSchema.safeParse('1234567890a')
      expect(result.success).toBe(false)
    })
  })

  describe('Phone validation', () => {
    it('should accept valid phone number', () => {
      const result = phoneSchema.safeParse('+491234567890')
      expect(result.success).toBe(true)
    })

    it('should reject invalid phone number', () => {
      const result = phoneSchema.safeParse('invalid')
      expect(result.success).toBe(false)
    })
  })

  describe('Date of birth validation', () => {
    it('should accept age 18+', () => {
      const date = new Date()
      date.setFullYear(date.getFullYear() - 20)
      const result = dateOfBirthSchema.safeParse(date.toISOString())
      expect(result.success).toBe(true)
    })

    it('should reject age under 18', () => {
      const date = new Date()
      date.setFullYear(date.getFullYear() - 15)
      const result = dateOfBirthSchema.safeParse(date.toISOString())
      expect(result.success).toBe(false)
    })
  })

  describe('Image file validation', () => {
    it('should accept valid JPEG image', () => {
      const file = {
        name: 'test.jpg',
        type: 'image/jpeg' as const,
        size: 5 * 1024 * 1024, // 5MB
      }
      const result = imageFileSchema.safeParse(file)
      expect(result.success).toBe(true)
    })

    it('should accept valid PNG image', () => {
      const file = {
        name: 'test.png',
        type: 'image/png' as const,
        size: 5 * 1024 * 1024,
      }
      const result = imageFileSchema.safeParse(file)
      expect(result.success).toBe(true)
    })

    it('should reject file over size limit', () => {
      const file = {
        name: 'test.jpg',
        type: 'image/jpeg' as const,
        size: 15 * 1024 * 1024, // 15MB
      }
      const result = imageFileSchema.safeParse(file)
      expect(result.success).toBe(false)
    })

    it('should reject non-image file', () => {
      const file = {
        name: 'test.pdf',
        type: 'application/pdf' as any,
        size: 5 * 1024 * 1024,
      }
      const result = imageFileSchema.safeParse(file)
      expect(result.success).toBe(false)
    })
  })
})

