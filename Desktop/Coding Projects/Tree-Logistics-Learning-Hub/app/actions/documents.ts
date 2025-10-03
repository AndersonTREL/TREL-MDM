'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadDocumentImage } from '@/lib/s3'
import { createAuditLog } from '@/lib/audit'
import { inngest } from '@/lib/inngest/client'
import { DocumentType, DocumentStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function uploadDocument(
  formData: FormData
): Promise<{ success: boolean; error?: string; documentId?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const file = formData.get('file') as File
    const type = formData.get('type') as DocumentType
    const expiryDate = formData.get('expiryDate') as string

    if (!file || !type) {
      return { success: false, error: 'Missing required fields' }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png']
    if (type === 'REGISTRATION_CERTIFICATE') {
      allowedTypes.push('application/pdf')
    }

    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type' }
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'File size exceeds 10MB limit' }
    }

    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer())
    const { url } = await uploadDocumentImage(
      buffer,
      file.name,
      session.user.id,
      type
    )

    // Create document record
    const document = await db.document.create({
      data: {
        userId: session.user.id,
        type,
        urls: [url],
        status: DocumentStatus.PENDING_REVIEW,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    })

    // Trigger event
    await inngest.send({
      name: 'document/uploaded',
      data: {
        documentId: document.id,
        userId: session.user.id,
        type,
      },
    })

    // Create audit log
    await createAuditLog({
      actorId: session.user.id,
      action: 'UPDATE_PII',
      entity: 'Document',
      entityId: document.id,
      diff: { type, status: 'PENDING_REVIEW' },
    })

    revalidatePath('/dashboard')
    revalidatePath('/documents')

    return { success: true, documentId: document.id }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Failed to upload document' }
  }
}

export async function reviewDocument(
  documentId: string,
  action: 'APPROVE' | 'REJECT',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!['ADMIN', 'INSPECTOR'].includes(session.user.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    const document = await db.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return { success: false, error: 'Document not found' }
    }

    const status = action === 'APPROVE' ? DocumentStatus.APPROVED : DocumentStatus.REJECTED

    await db.document.update({
      where: { id: documentId },
      data: {
        status,
        reviewerId: session.user.id,
        reviewedAt: new Date(),
        notes,
      },
    })

    // Trigger appropriate event
    if (action === 'APPROVE') {
      await inngest.send({
        name: 'document/approved',
        data: {
          documentId: document.id,
          userId: document.userId,
          type: document.type,
        },
      })
    } else {
      await inngest.send({
        name: 'document/rejected',
        data: {
          documentId: document.id,
          userId: document.userId,
          type: document.type,
          reason: notes || 'No reason provided',
        },
      })
    }

    // Create audit log
    await createAuditLog({
      actorId: session.user.id,
      action: action === 'APPROVE' ? 'APPROVE_DOCUMENT' : 'REJECT_DOCUMENT',
      entity: 'Document',
      entityId: documentId,
      diff: { status, notes },
    })

    revalidatePath('/inspector/documents')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Review error:', error)
    return { success: false, error: 'Failed to review document' }
  }
}

export async function getDocuments(userId?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return []
  }

  const targetUserId = userId || session.user.id

  // Check permissions
  if (session.user.role === 'DRIVER' && targetUserId !== session.user.id) {
    throw new Error('Insufficient permissions')
  }

  const documents = await db.document.findMany({
    where: { userId: targetUserId },
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return documents
}

