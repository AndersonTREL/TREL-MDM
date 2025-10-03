'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import { DocumentViewer } from '@/components/document-viewer'

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

interface DocumentApprovalClientProps {
  document: Document
  onStatusChange: (documentId: string, newStatus: string) => void
}

export function DocumentApprovalClient({ document, onStatusChange }: DocumentApprovalClientProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const handleApprove = async () => {
    setLoading('approve')
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'APPROVE',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve document')
      }

      const updatedDocument = await response.json()
      onStatusChange(document.id, updatedDocument.status)
      alert('Document approved successfully!')
    } catch (error) {
      console.error('[ERROR] Failed to approve document', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve document. Please try again.'
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection.')
      return
    }

    setLoading('reject')
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'REJECT',
          notes: rejectReason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject document')
      }

      const updatedDocument = await response.json()
      onStatusChange(document.id, updatedDocument.status)
      alert('Document rejected successfully!')
      setShowRejectModal(false)
      setRejectReason('')
    } catch (error) {
      console.error('[ERROR] Failed to reject document', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject document. Please try again.'
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(null)
    }
  }

  if (document.status !== 'PENDING_REVIEW') {
    return null
  }

  return (
    <>
      <div className="flex gap-2">
        <DocumentViewer document={document} />
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={loading === 'approve'}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {loading === 'approve' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShowRejectModal(true)}
          disabled={loading === 'reject'}
        >
          {loading === 'reject' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Reject
        </Button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Reject Document</h3>
            <p className="text-muted-foreground mb-4">
              Please provide a reason for rejecting this document. The user will receive this feedback.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rejection Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border rounded-md p-2"
                  placeholder="e.g., Document is unclear, missing information, expired, etc."
                  rows={4}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleReject}
                disabled={loading === 'reject' || !rejectReason.trim()}
                className="flex-1"
              >
                {loading === 'reject' ? 'Rejecting...' : 'Reject Document'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
