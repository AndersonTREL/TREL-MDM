import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { BackButton } from '@/components/back-button'
import { AuditLogsClient } from '@/components/audit-logs-client'

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const auditLogs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <BackButton href="/admin/dashboard" label="Back to Dashboard" />
      </div>

      <AuditLogsClient auditLogs={auditLogs} />
    </div>
  )
}

