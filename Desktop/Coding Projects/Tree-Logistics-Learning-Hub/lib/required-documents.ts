// Required documents configuration for different user roles
export const REQUIRED_DOCUMENTS = {
  DRIVER: [
    {
      id: 'drivers_license',
      title: 'Driver\'s License',
      description: 'Valid driver\'s license',
      category: 'LICENSE',
      required: true,
    },
    {
      id: 'medical_certificate',
      title: 'Medical Certificate',
      description: 'Medical fitness certificate',
      category: 'HEALTH',
      required: true,
    },
    {
      id: 'background_check',
      title: 'Background Check',
      description: 'Criminal background check',
      category: 'SECURITY',
      required: true,
    },
    {
      id: 'employment_contract',
      title: 'Employment Contract',
      description: 'Signed employment agreement',
      category: 'LEGAL',
      required: true,
    },
    {
      id: 'insurance_document',
      title: 'Insurance Document',
      description: 'Vehicle insurance documentation',
      category: 'INSURANCE',
      required: true,
    },
    {
      id: 'training_certificate',
      title: 'Training Certificate',
      description: 'Safety training completion certificate',
      category: 'TRAINING',
      required: false,
    },
  ],
  INSPECTOR: [
    {
      id: 'inspection_license',
      title: 'Inspection License',
      description: 'Valid inspection license',
      category: 'LICENSE',
      required: true,
    },
    {
      id: 'medical_certificate',
      title: 'Medical Certificate',
      description: 'Medical fitness certificate',
      category: 'HEALTH',
      required: true,
    },
    {
      id: 'background_check',
      title: 'Background Check',
      description: 'Criminal background check',
      category: 'SECURITY',
      required: true,
    },
    {
      id: 'employment_contract',
      title: 'Employment Contract',
      description: 'Signed employment agreement',
      category: 'LEGAL',
      required: true,
    },
  ],
  ADMIN: [
    {
      id: 'employment_contract',
      title: 'Employment Contract',
      description: 'Signed employment agreement',
      category: 'LEGAL',
      required: true,
    },
    {
      id: 'background_check',
      title: 'Background Check',
      description: 'Criminal background check',
      category: 'SECURITY',
      required: true,
    },
  ],
} as const

export type DocumentCategory = 'LICENSE' | 'HEALTH' | 'SECURITY' | 'LEGAL' | 'INSURANCE' | 'TRAINING'

export interface RequiredDocument {
  id: string
  title: string
  description: string
  category: DocumentCategory
  required: boolean
}

export function getRequiredDocumentsForRole(role: string): RequiredDocument[] {
  return [...(REQUIRED_DOCUMENTS[role as keyof typeof REQUIRED_DOCUMENTS] || [])]
}

export function getMissingDocuments(userRole: string, userDocuments: Array<{ type: string; status: string }>): RequiredDocument[] {
  const requiredDocs = getRequiredDocumentsForRole(userRole)
  const submittedTypes = userDocuments
    .filter(doc => doc.status === 'APPROVED')
    .map(doc => doc.type.toLowerCase())

  return requiredDocs.filter(doc => {
    const isSubmitted = submittedTypes.some(type => 
      type.includes(doc.title.toLowerCase()) || 
      doc.title.toLowerCase().includes(type)
    )
    return !isSubmitted
  })
}

export function getDocumentComplianceStatus(userRole: string, userDocuments: Array<{ type: string; status: string }>): {
  totalRequired: number
  submitted: number
  approved: number
  pending: number
  missing: number
  compliancePercentage: number
} {
  const requiredDocs = getRequiredDocumentsForRole(userRole)
  const totalRequired = requiredDocs.filter(doc => doc.required).length
  
  const submittedDocs = userDocuments.filter(doc => 
    doc.status === 'APPROVED' || doc.status === 'PENDING_REVIEW'
  )
  
  const approvedDocs = userDocuments.filter(doc => doc.status === 'APPROVED')
  const pendingDocs = userDocuments.filter(doc => doc.status === 'PENDING_REVIEW')
  
  const missingDocs = getMissingDocuments(userRole, userDocuments)
  const missing = missingDocs.filter(doc => doc.required).length
  
  const compliancePercentage = totalRequired > 0 ? Math.round((approvedDocs.length / totalRequired) * 100) : 100

  return {
    totalRequired,
    submitted: submittedDocs.length,
    approved: approvedDocs.length,
    pending: pendingDocs.length,
    missing,
    compliancePercentage,
  }
}
