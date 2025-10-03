import { inngest } from './client'
import { db } from '../db'
import { sendExpiryReminderNotification, sendDocumentApprovalNotification, sendDocumentRejectionNotification, sendCourseCompletionNotification } from '../notifications'
import { addDays, differenceInDays, isPast } from 'date-fns'

// Document expiry check - runs daily
export const checkDocumentExpiry = inngest.createFunction(
  { id: 'check-document-expiry', name: 'Check Document Expiry' },
  { cron: '0 2 * * *' }, // Run at 2 AM daily
  async ({ step }) => {
    const now = new Date()
    const checkDays = [30, 14, 7, 1]

    for (const days of checkDays) {
      const targetDate = addDays(now, days)

      await step.run(`check-expiry-${days}-days`, async () => {
        const expiringDocuments = await db.document.findMany({
          where: {
            status: 'APPROVED',
            expiryDate: {
              gte: now,
              lte: targetDate,
            },
          },
          include: {
            user: true,
          },
        })

        for (const doc of expiringDocuments) {
          const daysUntilExpiry = differenceInDays(doc.expiryDate!, now)
          
          await sendExpiryReminderNotification(
            doc.userId,
            doc.type,
            daysUntilExpiry
          )

          // Notify inspector
          const inspectors = await db.user.findMany({
            where: { role: 'INSPECTOR', status: 'ACTIVE' },
          })

          for (const inspector of inspectors) {
            await db.notification.create({
              data: {
                userId: inspector.id,
                channel: 'IN_APP',
                template: 'document_expiring',
                body: `Document ${doc.type} for user ${doc.user.name} expires in ${daysUntilExpiry} days`,
              },
            })
          }
        }

        return { checked: expiringDocuments.length }
      })
    }

    // Block users with expired critical documents
    await step.run('block-expired-users', async () => {
      const expiredDocs = await db.document.findMany({
        where: {
          status: 'APPROVED',
          expiryDate: {
            lt: now,
          },
          type: {
            in: ['DRIVERS_LICENSE_FRONT', 'ID_CARD_FRONT', 'WORK_PERMIT_FRONT'],
          },
        },
        select: { userId: true },
        distinct: ['userId'],
      })

      const userIds = expiredDocs.map(d => d.userId)

      if (userIds.length > 0) {
        await db.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: 'BLOCKED' },
        })
      }

      return { blockedUsers: userIds.length }
    })
  }
)

// Handle document approval
export const handleDocumentApproval = inngest.createFunction(
  { id: 'handle-document-approval', name: 'Handle Document Approval' },
  { event: 'document/approved' },
  async ({ event, step }) => {
    await step.run('send-notification', async () => {
      await sendDocumentApprovalNotification(event.data.userId, event.data.type)
    })

    await step.run('check-onboarding-progress', async () => {
      // Check if all required documents are approved
      const user = await db.user.findUnique({
        where: { id: event.data.userId },
        include: {
          documents: true,
        },
      })

      if (!user) return

      const requiredDocTypes = [
        'DRIVERS_LICENSE_FRONT',
        'DRIVERS_LICENSE_BACK',
        'ID_CARD_FRONT',
        'ID_CARD_BACK',
      ]

      const approvedDocs = user.documents.filter(d => d.status === 'APPROVED')
      const hasAllRequired = requiredDocTypes.every(type =>
        approvedDocs.some(d => d.type === type)
      )

      if (hasAllRequired) {
        await db.onboardingProgress.update({
          where: { userId: user.id },
          data: { documentsStep: 'COMPLETED' },
        })
      }
    })
  }
)

// Handle document rejection
export const handleDocumentRejection = inngest.createFunction(
  { id: 'handle-document-rejection', name: 'Handle Document Rejection' },
  { event: 'document/rejected' },
  async ({ event, step }) => {
    await step.run('send-notification', async () => {
      await sendDocumentRejectionNotification(
        event.data.userId,
        event.data.type,
        event.data.reason
      )
    })

    await step.run('update-onboarding-progress', async () => {
      await db.onboardingProgress.update({
        where: { userId: event.data.userId },
        data: { documentsStep: 'BLOCKED' },
      })
    })
  }
)

// Handle course completion
export const handleCourseCompletion = inngest.createFunction(
  { id: 'handle-course-completion', name: 'Handle Course Completion' },
  { event: 'course/completed' },
  async ({ event, step }) => {
    const { userId, courseId, score } = event.data

    await step.run('send-notification', async () => {
      const course = await db.course.findUnique({
        where: { id: courseId },
      })

      if (course) {
        await sendCourseCompletionNotification(userId, course.title)
      }
    })

    await step.run('award-achievement', async () => {
      const course = await db.course.findUnique({
        where: { id: courseId },
      })

      if (course) {
        await db.achievement.create({
          data: {
            userId,
            type: 'COURSE_COMPLETION',
            title: `Completed ${course.title}`,
            titleDe: `${course.titleDe || course.title} abgeschlossen`,
            points: course.pointsReward,
            badgeIcon: '🎓',
            metadata: { courseId, score },
          },
        })

        // Update leaderboard
        const totalPoints = await db.achievement.aggregate({
          where: { userId },
          _sum: { points: true },
        })

        await db.leaderboardSnapshot.upsert({
          where: {
            userId_period: {
              userId,
              period: 'all_time',
            },
          },
          create: {
            userId,
            period: 'all_time',
            points: totalPoints._sum.points || 0,
          },
          update: {
            points: totalPoints._sum.points || 0,
          },
        })
      }
    })

    await step.run('check-onboarding-progress', async () => {
      // Check if all assigned courses are completed
      const enrollments = await db.enrollment.findMany({
        where: {
          userId,
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        },
      })

      if (enrollments.length === 0) {
        await db.onboardingProgress.update({
          where: { userId },
          data: { coursesStep: 'COMPLETED' },
        })
      }
    })
  }
)

// Handle quiz completion
export const handleQuizCompletion = inngest.createFunction(
  { id: 'handle-quiz-completion', name: 'Handle Quiz Completion' },
  { event: 'quiz/completed' },
  async ({ event, step }) => {
    const { userId, quizId, score, passed } = event.data

    if (passed && score === 100) {
      await step.run('award-perfect-score', async () => {
        const quiz = await db.quiz.findUnique({
          where: { id: quizId },
        })

        if (quiz) {
          await db.achievement.create({
            data: {
              userId,
              type: 'QUIZ_PERFECT_SCORE',
              title: 'Perfect Score!',
              titleDe: 'Perfekte Punktzahl!',
              description: `Got 100% on ${quiz.title}`,
              descriptionDe: `100% bei ${quiz.titleDe || quiz.title} erreicht`,
              points: quiz.pointsReward + 50, // Bonus points
              badgeIcon: '⭐',
              metadata: { quizId, score },
            },
          })
        }
      })
    }
  }
)

export const inngestFunctions = [
  checkDocumentExpiry,
  handleDocumentApproval,
  handleDocumentRejection,
  handleCourseCompletion,
  handleQuizCompletion,
]

