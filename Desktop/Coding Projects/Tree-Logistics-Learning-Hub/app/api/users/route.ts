import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createAuditLog } from '@/lib/audit'

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'INSPECTOR', 'DRIVER']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED', 'ARCHIVED']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user with email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create the user
    const newUser = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        status: validatedData.status,
        emailVerified: null, // Will be set when they verify their email
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            documents: true,
            enrollments: true,
          },
        },
      },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('[API ERROR] Failed to create user:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            documents: true,
            enrollments: true,
          },
        },
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('[API ERROR] Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// Archive user endpoint
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, archiveReason } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Archive the user
    const archivedUser = await db.user.update({
      where: { id: userId },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        archivedBy: session.user.id,
        archiveReason: archiveReason || 'User no longer with company',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        archivedAt: true,
        archiveReason: true,
        createdAt: true,
        _count: {
          select: {
            documents: true,
            enrollments: true,
          },
        },
      },
    })

    // Log the archive action
    try {
      await createAuditLog({
        actorId: session.user.id,
        action: 'ARCHIVE_USER',
        entity: 'User',
        entityId: userId,
        diff: {
          status: 'ARCHIVED',
          reason: archiveReason || 'User no longer with company',
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      })
    } catch (auditError) {
      console.warn('[AUDIT WARNING] Failed to create audit log for archive:', auditError)
      // Continue without failing the main operation
    }

    return NextResponse.json(archivedUser)
  } catch (error) {
    console.error('[API ERROR] Failed to archive user:', error)
    return NextResponse.json(
      { error: 'Failed to archive user' },
      { status: 500 }
    )
  }
}

// Restore user endpoint
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, newStatus, restoreReason } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Validate new status
    if (!['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status for restoration' }, { status: 400 })
    }

    // Restore the user
    const restoredUser = await db.user.update({
      where: { id: userId },
      data: {
        status: newStatus,
        archivedAt: null, // Clear archive timestamp
        archivedBy: null, // Clear archive actor
        archiveReason: null, // Clear archive reason
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            documents: true,
            enrollments: true,
          },
        },
      },
    })

    // Log the restoration action
    try {
      await createAuditLog({
        actorId: session.user.id,
        action: 'RESTORE_USER',
        entity: 'User',
        entityId: userId,
        diff: {
          from: 'ARCHIVED',
          to: newStatus,
          reason: restoreReason || 'User restored from archive',
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      })
    } catch (auditError) {
      console.warn('[AUDIT WARNING] Failed to create audit log for restore:', auditError)
      // Continue without failing the main operation
    }

    return NextResponse.json(restoredUser)
  } catch (error) {
    console.error('[API ERROR] Failed to restore user:', error)
    return NextResponse.json(
      { error: 'Failed to restore user' },
      { status: 500 }
    )
  }
}
