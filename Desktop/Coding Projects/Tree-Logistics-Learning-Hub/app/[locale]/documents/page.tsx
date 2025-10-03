import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getDocuments } from '@/app/actions/documents'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/back-button'
import Link from 'next/link'
import { format } from 'date-fns'
import { Upload, FileText } from 'lucide-react'

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  const documents = await getDocuments()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <BackButton href="/dashboard" label="Back to Dashboard" />
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Documents
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload and manage your documents
          </p>
        </div>
        <Link href="/documents/upload">
          <Button size="lg" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </Link>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No documents uploaded yet</p>
              <Link href="/documents/upload">
                <Button>Upload Your First Document</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {doc.type.replace(/_/g, ' ')}
                    </CardTitle>
                    <CardDescription>
                      Uploaded {format(new Date(doc.createdAt), 'PPP')}
                    </CardDescription>
                  </div>
                  <DocumentStatusBadge status={doc.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {doc.expiryDate && (
                    <div>
                      <span className="text-muted-foreground">Expires:</span>{' '}
                      <span className="font-medium">
                        {format(new Date(doc.expiryDate), 'PPP')}
                      </span>
                    </div>
                  )}
                  {doc.reviewer && (
                    <div>
                      <span className="text-muted-foreground">Reviewed by:</span>{' '}
                      <span className="font-medium">{doc.reviewer.name}</span>
                    </div>
                  )}
                  {doc.reviewedAt && (
                    <div>
                      <span className="text-muted-foreground">Reviewed:</span>{' '}
                      <span className="font-medium">
                        {format(new Date(doc.reviewedAt), 'PPP')}
                      </span>
                    </div>
                  )}
                  {doc.notes && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Notes:</span>{' '}
                      <span className="font-medium">{doc.notes}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentStatusBadge({ status }: { status: string }) {
  const statusVariants = {
    PENDING_REVIEW: 'warning',
    APPROVED: 'success',
    REJECTED: 'destructive',
  } as const

  return (
    <Badge variant={statusVariants[status as keyof typeof statusVariants]}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

