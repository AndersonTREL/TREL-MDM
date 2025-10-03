import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/crypto'

describe('Document Integration', () => {
  let userId: string
  let documentId: string

  beforeAll(async () => {
    // Create test user
    const password = await hashPassword('TestPassword123!')
    const user = await db.user.create({
      data: {
        email: 'doctest@example.com',
        name: 'Doc Test User',
        password,
        role: 'DRIVER',
        status: 'ACTIVE',
      },
    })
    userId = user.id

    // Create test document
    const document = await db.document.create({
      data: {
        userId: user.id,
        type: 'DRIVERS_LICENSE_FRONT',
        urls: ['https://example.com/test.jpg'],
        status: 'PENDING_REVIEW',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    })
    documentId = document.id
  })

  afterAll(async () => {
    // Cleanup
    await db.document.deleteMany({ where: { userId } }).catch(() => {})
    await db.user.delete({ where: { id: userId } }).catch(() => {})
  })

  it('should create document with pending status', async () => {
    const document = await db.document.findUnique({
      where: { id: documentId },
    })

    expect(document).toBeTruthy()
    expect(document?.status).toBe('PENDING_REVIEW')
    expect(document?.userId).toBe(userId)
  })

  it('should have expiry date set', async () => {
    const document = await db.document.findUnique({
      where: { id: documentId },
    })

    expect(document?.expiryDate).toBeTruthy()
    expect(new Date(document!.expiryDate!).getTime()).toBeGreaterThan(Date.now())
  })

  it('should update document status', async () => {
    await db.document.update({
      where: { id: documentId },
      data: { status: 'APPROVED' },
    })

    const document = await db.document.findUnique({
      where: { id: documentId },
    })

    expect(document?.status).toBe('APPROVED')
  })

  it('should associate reviewer on approval', async () => {
    const inspector = await db.user.create({
      data: {
        email: 'inspector-test@example.com',
        name: 'Test Inspector',
        password: await hashPassword('Test123!'),
        role: 'INSPECTOR',
        status: 'ACTIVE',
      },
    })

    await db.document.update({
      where: { id: documentId },
      data: {
        reviewerId: inspector.id,
        reviewedAt: new Date(),
      },
    })

    const document = await db.document.findUnique({
      where: { id: documentId },
      include: { reviewer: true },
    })

    expect(document?.reviewerId).toBe(inspector.id)
    expect(document?.reviewer?.name).toBe('Test Inspector')
    expect(document?.reviewedAt).toBeTruthy()

    await db.user.delete({ where: { id: inspector.id } })
  })
})

