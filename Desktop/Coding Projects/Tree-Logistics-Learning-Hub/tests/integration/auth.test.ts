import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/crypto'

describe('Authentication Integration', () => {
  const testEmail = 'test@example.com'
  let userId: string

  beforeAll(async () => {
    // Create test user
    const password = await hashPassword('TestPassword123!')
    const user = await db.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
        password,
        role: 'DRIVER',
        status: 'ACTIVE',
      },
    })
    userId = user.id
  })

  afterAll(async () => {
    // Cleanup
    await db.user.delete({ where: { id: userId } }).catch(() => {})
  })

  it('should create user with hashed password', async () => {
    const user = await db.user.findUnique({
      where: { email: testEmail },
    })

    expect(user).toBeTruthy()
    expect(user?.password).toBeTruthy()
    expect(user?.password).not.toBe('TestPassword123!')
  })

  it('should verify correct password', async () => {
    const user = await db.user.findUnique({
      where: { email: testEmail },
    })

    if (!user?.password) throw new Error('User not found')

    const isValid = await verifyPassword('TestPassword123!', user.password)
    expect(isValid).toBe(true)
  })

  it('should reject incorrect password', async () => {
    const user = await db.user.findUnique({
      where: { email: testEmail },
    })

    if (!user?.password) throw new Error('User not found')

    const isValid = await verifyPassword('WrongPassword', user.password)
    expect(isValid).toBe(false)
  })

  it('should have correct default role', async () => {
    const user = await db.user.findUnique({
      where: { email: testEmail },
    })

    expect(user?.role).toBe('DRIVER')
  })

  it('should have correct default status', async () => {
    const user = await db.user.findUnique({
      where: { email: testEmail },
    })

    expect(user?.status).toBe('ACTIVE')
  })
})

