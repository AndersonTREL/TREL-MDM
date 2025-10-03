import { Resend } from 'resend'
import twilio from 'twilio'
import { db } from './db'
import { NotificationChannel } from '@prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY)
const twilioClient = (() => {
  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    }
    return null
  } catch (error) {
    console.warn('Failed to initialize Twilio client:', error)
    return null
  }
})()

export interface NotificationData {
  userId: string
  channel: NotificationChannel
  template: string
  subject?: string
  body: string
  bodyDe?: string
  metadata?: Record<string, any>
}

export async function sendNotification(data: NotificationData) {
  const user = await db.user.findUnique({
    where: { id: data.userId },
    select: { email: true, phone: true, locale: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const body = user.locale === 'de' && data.bodyDe ? data.bodyDe : data.body

  // Create notification record
  const notification = await db.notification.create({
    data: {
      userId: data.userId,
      channel: data.channel,
      template: data.template,
      subject: data.subject,
      body,
      bodyDe: data.bodyDe,
      metadata: data.metadata,
    },
  })

  // Send via appropriate channel
  try {
    if (data.channel === 'EMAIL' && user.email) {
      await sendEmail(user.email, data.subject || 'Notification', body)
    } else if (data.channel === 'SMS' && user.phone) {
      await sendSMS(user.phone, body)
    }

    // Mark as sent
    await db.notification.update({
      where: { id: notification.id },
      data: { sentAt: new Date() },
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }

  return notification
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[EMAIL STUB]', { to, subject, html })
    return
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@treelogistics.com',
    to,
    subject,
    html,
  })
}

export async function sendSMS(to: string, body: string) {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('[SMS STUB]', { to, body })
    return
  }

  await twilioClient.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  })
}

export async function sendDocumentApprovalNotification(userId: string, documentType: string) {
  return sendNotification({
    userId,
    channel: 'EMAIL',
    template: 'document_approved',
    subject: 'Document Approved',
    body: `Your ${documentType} has been approved.`,
    bodyDe: `Ihr ${documentType} wurde genehmigt.`,
  })
}

export async function sendDocumentRejectionNotification(
  userId: string,
  documentType: string,
  reason: string
) {
  return sendNotification({
    userId,
    channel: 'EMAIL',
    template: 'document_rejected',
    subject: 'Document Rejected',
    body: `Your ${documentType} has been rejected. Reason: ${reason}`,
    bodyDe: `Ihr ${documentType} wurde abgelehnt. Grund: ${reason}`,
  })
}

export async function sendExpiryReminderNotification(
  userId: string,
  documentType: string,
  daysUntilExpiry: number
) {
  return sendNotification({
    userId,
    channel: 'EMAIL',
    template: 'expiry_reminder',
    subject: 'Document Expiring Soon',
    body: `Your ${documentType} will expire in ${daysUntilExpiry} days. Please upload a new one.`,
    bodyDe: `Ihr ${documentType} läuft in ${daysUntilExpiry} Tagen ab. Bitte laden Sie ein neues hoch.`,
  })
}

export async function sendCourseCompletionNotification(userId: string, courseTitle: string) {
  return sendNotification({
    userId,
    channel: 'EMAIL',
    template: 'course_completed',
    subject: 'Course Completed',
    body: `Congratulations! You have completed the course: ${courseTitle}`,
    bodyDe: `Herzlichen Glückwunsch! Sie haben den Kurs abgeschlossen: ${courseTitle}`,
  })
}

