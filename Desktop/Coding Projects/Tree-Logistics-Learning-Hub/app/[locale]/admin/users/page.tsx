import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'
import { UserManagementClient } from '@/components/user-management-client'

interface AdminUsersPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  // Extract filter parameters
  const role = searchParams.role as string
  const status = searchParams.status as string

  // Build where clause based on filters
  const whereClause: any = {}
  if (role) {
    whereClause.role = role
  }
  if (status) {
    whereClause.status = status
  }

  const users = await db.user.findMany({
    where: whereClause,
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <BackButton href="/admin/dashboard" label="Back to Dashboard" />
      </div>

        <UserManagementClient 
          users={users} 
          initialFilter={{ role, status }}
        />
    </div>
  )
}

