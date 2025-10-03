import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit'
import { sendDocumentApprovalNotification, sendDocumentRejectionNotification } from '@/lib/notifications'

const approveDocumentSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = approveDocumentSchema.parse(body)

    // Get the document with user information
    const document = await db.document.findUnique({
      where: { id: params.id },
      include: {
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

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.status !== 'PENDING_REVIEW') {
      return NextResponse.json({ 
        error: 'Document is not pending review' 
      }, { status: 400 })
    }

    // Debug session user
    console.log('[DEBUG] Session user:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role
    })

    // Verify the reviewer user exists
    const reviewer = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true }
    })

    console.log('[DEBUG] Reviewer lookup result:', reviewer)

    if (!reviewer) {
      console.error('[ERROR] Reviewer not found in database:', session.user.id)
      
      // Try to find any admin user as fallback
      const fallbackAdmin = await db.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true, email: true, name: true }
      })
      
      if (!fallbackAdmin) {
        return NextResponse.json({ 
          error: 'No admin user found', 
          details: 'Cannot process document approval without an admin user' 
        }, { status: 500 })
      }
      
      console.log('[FALLBACK] Using admin user as reviewer:', fallbackAdmin)
      // Use fallback admin as reviewer
      const updatedDocument = await db.document.update({
        where: { id: params.id },
        data: {
          status: validatedData.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          reviewerId: fallbackAdmin.id,
          reviewedAt: new Date(),
          notes: validatedData.notes || null,
        },
        include: {
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
      
      // Log the action with fallback admin
      try {
        await createAuditLog({
          actorId: fallbackAdmin.id,
          action: validatedData.action === 'APPROVE' ? 'APPROVE_DOCUMENT' : 'REJECT_DOCUMENT',
          entity: 'Document',
          entityId: params.id,
          diff: {
            documentType: document.type,
            userId: document.userId,
            userName: document.user.name,
            action: validatedData.action,
            notes: validatedData.notes,
            fallbackReviewer: true,
            originalReviewerId: session.user.id,
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        })
      } catch (auditError) {
        console.warn('[AUDIT WARNING] Failed to create audit log for document action:', auditError)
      }

      // Send email notification
      try {
        if (validatedData.action === 'APPROVE') {
          await sendDocumentApprovalNotification(
            document.user.id,
            document.type
          )
          console.log(`[NOTIFICATION] Document approval email sent to ${document.user.email}`)
        } else {
          await sendDocumentRejectionNotification(
            document.user.id,
            document.type,
            validatedData.notes || 'No reason provided'
          )
          console.log(`[NOTIFICATION] Document rejection email sent to ${document.user.email}`)
        }
      } catch (emailError) {
        console.warn('[EMAIL WARNING] Failed to send document notification:', emailError)
      }

      return NextResponse.json(updatedDocument)
    }

    // Update document status
    const updatedDocument = await db.document.update({
      where: { id: params.id },
      data: {
        status: validatedData.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        reviewerId: reviewer.id,
        reviewedAt: new Date(),
        notes: validatedData.notes || null,
      },
      include: {
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

    // Log the action
    try {
      await createAuditLog({
        actorId: session.user.id,
        action: validatedData.action === 'APPROVE' ? 'APPROVE_DOCUMENT' : 'REJECT_DOCUMENT',
        entity: 'Document',
        entityId: params.id,
        diff: {
          documentType: document.type,
          userId: document.userId,
          userName: document.user.name,
          action: validatedData.action,
          notes: validatedData.notes,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      })
    } catch (auditError) {
      console.warn('[AUDIT WARNING] Failed to create audit log for document action:', auditError)
    }

    // Send email notification
    try {
      if (validatedData.action === 'APPROVE') {
        await sendDocumentApprovalNotification(
          document.user.id,
          document.type
        )
        console.log(`[NOTIFICATION] Document approval email sent to ${document.user.email}`)
      } else {
        await sendDocumentRejectionNotification(
          document.user.id,
          document.type,
          validatedData.notes || 'No reason provided'
        )
        console.log(`[NOTIFICATION] Document rejection email sent to ${document.user.email}`)
      }
    } catch (emailError) {
      console.warn('[EMAIL WARNING] Failed to send document notification:', emailError)
      // Continue without failing the main operation
    }

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error('[API ERROR] Failed to process document:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to process document' 
    }, { status: 500 })
  }
}
