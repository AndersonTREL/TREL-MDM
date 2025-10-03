import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { BackButton } from '@/components/back-button'
import { DocumentsClient } from '@/components/documents-client'

interface AdminDocumentsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function AdminDocumentsPage({ searchParams }: AdminDocumentsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  // Extract filter parameters
  const status = searchParams.status as string

  // Build where clause based on filters
  const whereClause: any = {}
  if (status) {
    whereClause.status = status
  }

  const documents = await db.document.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      status: true,
      urls: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })

  const stats = await Promise.all([
    db.document.count(),
    db.document.count({ where: { status: 'PENDING_REVIEW' } }),
    db.document.count({ where: { status: 'APPROVED' } }),
    db.document.count({ where: { status: 'REJECTED' } }),
  ])

  const [totalDocuments, pendingDocuments, approvedDocuments, rejectedDocuments] = stats

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <BackButton href="/admin/dashboard" label="Back to Dashboard" />
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            📄 Document Management
            {status && (
              <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                Status: {status.replace('_', ' ')}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and review all documents in the system
          </p>
        </div>
      </div>

      <DocumentsClient
        documents={documents}
        stats={{
          totalDocuments,
          pendingDocuments,
          approvedDocuments,
          rejectedDocuments,
        }}
        status={status}
      />
    </div>
  )
}
