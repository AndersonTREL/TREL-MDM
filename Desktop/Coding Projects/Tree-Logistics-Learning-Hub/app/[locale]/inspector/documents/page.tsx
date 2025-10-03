import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BackButton } from '@/components/back-button'
import Link from 'next/link'
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

export default async function InspectorDocumentsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !['ADMIN', 'INSPECTOR'].includes(session.user.role)) {
    redirect('/unauthorized')
  }

  const documents = await db.document.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewer: {
        select: {
          name: true,
        },
      },
    },
  })

  const pendingDocs = documents.filter(d => d.status === 'PENDING_REVIEW')
  const approvedDocs = documents.filter(d => d.status === 'APPROVED')
  const rejectedDocs = documents.filter(d => d.status === 'REJECTED')

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <BackButton href="/inspector/dashboard" label="Back to Dashboard" />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="h-8 w-8" />
          Document Review
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and approve driver documents
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Review
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{pendingDocs.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{approvedDocs.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">{rejectedDocs.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pending Documents</CardTitle>
          <CardDescription>
            Documents awaiting your review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingDocs.length > 0 ? (
            <div className="space-y-4">
              {pendingDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <FileText className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{doc.type.replace(/_/g, ' ')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {doc.user.name} ({doc.user.email})
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploaded {format(new Date(doc.createdAt), 'PPp')}
                      </p>
                      {doc.expiryDate && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Expires {format(new Date(doc.expiryDate), 'PPP')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">Pending</Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/inspector/documents/${doc.id}`}>
                        Review
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">All documents reviewed!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Recently Approved</CardTitle>
            <CardDescription>Last 5 approved documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvedDocs.slice(0, 5).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{doc.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{doc.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      by {doc.reviewer?.name} • {format(new Date(doc.reviewedAt!), 'MMM dd')}
                    </p>
                  </div>
                  <Badge variant="success">Approved</Badge>
                </div>
              ))}
              {approvedDocs.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No approved documents yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Recently Rejected</CardTitle>
            <CardDescription>Last 5 rejected documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rejectedDocs.slice(0, 5).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{doc.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{doc.user.name}</p>
                    {doc.notes && (
                      <p className="text-xs text-red-600 mt-1">Reason: {doc.notes}</p>
                    )}
                  </div>
                  <Badge variant="destructive">Rejected</Badge>
                </div>
              ))}
              {rejectedDocs.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No rejected documents
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

