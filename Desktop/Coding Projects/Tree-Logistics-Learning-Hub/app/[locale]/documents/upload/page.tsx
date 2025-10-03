'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadDocument } from '@/app/actions/documents'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BackButton } from '@/components/back-button'
import { DocumentType } from '@prisma/client'
import { Upload } from 'lucide-react'

const documentTypes = [
  { value: 'DRIVERS_LICENSE_FRONT', label: "Driver's License (Front)" },
  { value: 'DRIVERS_LICENSE_BACK', label: "Driver's License (Back)" },
  { value: 'ID_CARD_FRONT', label: 'ID Card (Front)' },
  { value: 'ID_CARD_BACK', label: 'ID Card (Back)' },
  { value: 'WORK_PERMIT_FRONT', label: 'Work Permit (Front)' },
  { value: 'WORK_PERMIT_BACK', label: 'Work Permit (Back)' },
  { value: 'WORK_PERMIT_ADDITIONAL', label: 'Work Permit (Additional)' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'REGISTRATION_CERTIFICATE', label: 'Registration Certificate' },
  { value: 'SELFIE', label: 'Selfie' },
]

export default function UploadDocumentPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState<DocumentType>('DRIVERS_LICENSE_FRONT')
  const [expiryDate, setExpiryDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    if (expiryDate) {
      formData.append('expiryDate', expiryDate)
    }

    const result = await uploadDocument(formData)

    if (result.success) {
      router.push('/documents')
    } else {
      setError(result.error || 'Upload failed')
      setLoading(false)
    }
  }

  const requiresExpiry = [
    'DRIVERS_LICENSE_FRONT',
    'ID_CARD_FRONT',
    'WORK_PERMIT_FRONT',
    'PASSPORT',
  ].includes(type)

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <BackButton href="/documents" label="Back to Documents" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Upload Document
          </CardTitle>
          <CardDescription>
            Upload a new document for review. Accepted formats: JPEG, PNG
            {type === 'REGISTRATION_CERTIFICATE' && ', PDF'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Document Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as DocumentType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={loading}
              >
                {documentTypes.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                accept={
                  type === 'REGISTRATION_CERTIFICATE'
                    ? 'image/jpeg,image/png,application/pdf'
                    : 'image/jpeg,image/png'
                }
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={loading}
                required
              />
              <p className="text-sm text-muted-foreground">
                Maximum file size: 10MB
              </p>
            </div>

            {requiresExpiry && (
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Uploading...' : 'Upload Document'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

