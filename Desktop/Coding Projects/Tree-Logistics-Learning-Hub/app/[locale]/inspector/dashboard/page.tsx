import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function InspectorDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !['ADMIN', 'INSPECTOR'].includes(session.user.role)) {
    redirect('/unauthorized')
  }

  const pendingDocuments = await db.document.findMany({
    where: { status: 'PENDING_REVIEW' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const expiringDocuments = await db.document.findMany({
    where: {
      status: 'APPROVED',
      expiryDate: {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        gte: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { expiryDate: 'asc' },
    take: 10,
  })

  const totalDrivers = await db.user.count({
    where: { role: 'DRIVER' },
  })

  const activeDrivers = await db.user.count({
    where: { role: 'DRIVER', status: 'ACTIVE' },
  })

  const blockedDrivers = await db.user.count({
    where: { role: 'DRIVER', status: 'BLOCKED' },
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Inspector Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Drivers</CardDescription>
            <CardTitle className="text-3xl">{totalDrivers}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Drivers</CardDescription>
            <CardTitle className="text-3xl">{activeDrivers}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Blocked Drivers</CardDescription>
            <CardTitle className="text-3xl text-destructive">{blockedDrivers}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Pending Document Reviews</CardTitle>
                <CardDescription>Documents waiting for your review</CardDescription>
              </div>
              <Badge variant="warning">{pendingDocuments.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingDocuments.length > 0 ? (
              <div className="space-y-4">
                {pendingDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/inspector/documents/${doc.id}`}
                    className="block p-4 border rounded-lg hover:bg-accent transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{doc.type.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.user.name} ({doc.user.email})
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploaded {format(new Date(doc.createdAt), 'PPp')}
                        </p>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No pending documents
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Expiring Documents</CardTitle>
                <CardDescription>Documents expiring in next 30 days</CardDescription>
              </div>
              <Badge variant="destructive">{expiringDocuments.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {expiringDocuments.length > 0 ? (
              <div className="space-y-4">
                {expiringDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{doc.type.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.user.name} ({doc.user.email})
                        </p>
                        <p className="text-xs text-destructive mt-1">
                          Expires {format(new Date(doc.expiryDate!), 'PPP')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No expiring documents
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

