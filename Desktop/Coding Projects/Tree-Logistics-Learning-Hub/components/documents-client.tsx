'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { DocumentApprovalClient } from '@/components/document-approval-client'

interface Document {
  id: string
  type: string
  status: string
  urls: string[]
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
    role: string
  }
}

interface DocumentsClientProps {
  documents: Document[]
  stats: {
    totalDocuments: number
    pendingDocuments: number
    approvedDocuments: number
    rejectedDocuments: number
  }
  status?: string
}

export function DocumentsClient({ documents: initialDocuments, stats, status }: DocumentsClientProps) {
  const [documents, setDocuments] = useState(initialDocuments)

  const handleStatusChange = (documentId: string, newStatus: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, status: newStatus } : doc
    ))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejectedDocuments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {documents.length} document{documents.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(document.status)}
                    <div>
                      <p className="font-medium">{document.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {document.user.name} ({document.user.email})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(document.status)}>
                      {document.status.replace('_', ' ')}
                    </Badge>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/users/${document.user.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DocumentApprovalClient
                      document={document}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
