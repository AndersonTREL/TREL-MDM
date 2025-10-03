import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, hashPassword, verifyPassword } from '@/lib/crypto'

describe('Crypto utilities', () => {
  describe('Encryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const plaintext = 'sensitive data'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'test data'
      const encrypted1 = encrypt(plaintext)
      const encrypted2 = encrypt(plaintext)
      
      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should handle special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should handle unicode characters', () => {
      const plaintext = 'Ü Ö Ä ß é'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })
  })

  describe('Password hashing', () => {
    it('should hash password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      
      expect(hash).toBeTruthy()
      expect(hash).not.toBe(password)
      expect(hash).toContain(':')
    })

    it('should verify correct password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)
      
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('WrongPassword', hash)
      
      expect(isValid).toBe(false)
    })

    it('should produce different hashes for same password', async () => {
      const password = 'TestPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
    })
  })
})

