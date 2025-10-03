'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FolderOpen,
  Archive,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'

interface Document {
  id: string
  type: string
  urls: string[]
  status: string
  expiryDate?: Date | null
  reviewerId?: string | null
  reviewedAt?: Date | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

interface UserDocumentsClientProps {
  documents: Document[]
  userName: string
  userId: string
}

export function UserDocumentsClient({ documents, userName, userId }: UserDocumentsClientProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
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

  const handleDownloadDocument = async (document: Document) => {
    try {
      setIsDownloading(true)
      
      // For each URL in the document, create a download link
      for (let i = 0; i < document.urls.length; i++) {
        const url = document.urls[i]
        const link = document.createElement('a')
        link.href = url
        link.download = `${document.type}_${i + 1}_${format(new Date(document.createdAt), 'yyyy-MM-dd')}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Add a small delay between downloads
        if (i < document.urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Error downloading document. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadAllDocuments = async () => {
    try {
      setIsDownloading(true)
      
      // Create a ZIP file with all documents
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      // Create a folder for this user
      const userFolder = zip.folder(`${userName.replace(/\s+/g, '_')}_Documents`)
      
      for (const document of documents) {
        if (document.urls.length > 0) {
          // Create a subfolder for each document type
          const docFolder = userFolder?.folder(document.type.replace(/\s+/g, '_'))
          
          for (let i = 0; i < document.urls.length; i++) {
            try {
              const response = await fetch(document.urls[i])
              const blob = await response.blob()
              const fileName = `${document.type}_${i + 1}_${format(new Date(document.createdAt), 'yyyy-MM-dd')}.pdf`
              docFolder?.file(fileName, blob)
            } catch (error) {
              console.error(`Error fetching document ${document.urls[i]}:`, error)
            }
          }
        }
      }
      
      // Generate and download the ZIP file
      const content = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = `${userName.replace(/\s+/g, '_')}_All_Documents_${format(new Date(), 'yyyy-MM-dd')}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      
    } catch (error) {
      console.error('Error creating ZIP file:', error)
      alert('Error creating ZIP file. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document)
  }

  const closeDocumentViewer = () => {
    setSelectedDocument(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Document Folder
              </CardTitle>
              <CardDescription>
                {documents.length} document{documents.length !== 1 ? 's' : ''} in {userName}'s folder
              </CardDescription>
            </div>
            {documents.length > 0 && (
              <Button 
                onClick={handleDownloadAllDocuments}
                disabled={isDownloading}
                className="gap-2"
              >
                <Archive className="h-4 w-4" />
                {isDownloading ? 'Creating ZIP...' : 'Download All'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents in this folder</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(document.status)}
                    <div>
                      <p className="font-medium">{document.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                      </p>
                      {document.urls.length > 0 && (
                        <p className="text-xs text-blue-600">
                          {document.urls.length} file{document.urls.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(document.status)}>
                      {document.status.replace('_', ' ')}
                    </Badge>
                    {document.urls.length > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(document)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(document)}
                          disabled={isDownloading}
                          className="gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{selectedDocument.type}</h3>
              <Button variant="outline" onClick={closeDocumentViewer}>
                Close
              </Button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(selectedDocument.status)}
                  <Badge className={getStatusColor(selectedDocument.status)}>
                    {selectedDocument.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Uploaded: {format(new Date(selectedDocument.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
                {selectedDocument.reviewedAt && (
                  <p className="text-sm text-muted-foreground">
                    Reviewed: {format(new Date(selectedDocument.reviewedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
                {selectedDocument.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <p className="text-sm font-medium">Notes:</p>
                    <p className="text-sm text-muted-foreground">{selectedDocument.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {selectedDocument.urls.map((url, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Document {index + 1}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = url
                          link.target = '_blank'
                          link.click()
                        }}
                        className="gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Open
                      </Button>
                    </div>
                    <div className="w-full h-96 border rounded">
                      <iframe
                        src={url}
                        className="w-full h-full"
                        title={`Document ${index + 1}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
