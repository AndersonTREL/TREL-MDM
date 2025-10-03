import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const take = parseInt(searchParams.get('take') || '50')
    const search = searchParams.get('search') || ''

    // Build where clause for search
    const whereClause: any = {}
    if (search) {
      whereClause.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { actor: { name: { contains: search, mode: 'insensitive' } } },
        { actor: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const auditLogs = await db.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        actor: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(auditLogs)
  } catch (error) {
    console.error('[API ERROR] Failed to fetch audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
