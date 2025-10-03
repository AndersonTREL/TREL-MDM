'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { inngest } from '@/lib/inngest/client'
import { revalidatePath } from 'next/cache'

export async function enrollInCourse(courseId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  // Check if already enrolled
  const existing = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  })

  if (existing) {
    return { success: false, error: 'Already enrolled' }
  }

  await db.enrollment.create({
    data: {
      userId: session.user.id,
      courseId,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  })

  revalidatePath('/courses')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function startCourse(courseId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  await db.enrollment.update({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  })

  revalidatePath('/courses')

  return { success: true }
}

export async function completeCourse(courseId: string, score: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  await db.enrollment.update({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      score,
    },
  })

  // Trigger course completion event
  await inngest.send({
    name: 'course/completed',
    data: {
      userId: session.user.id,
      courseId,
      score,
    },
  })

  revalidatePath('/courses')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function submitQuizAttempt(
  quizId: string,
  answers: Record<string, string>
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  // Get quiz with questions and options
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  })

  if (!quiz) {
    throw new Error('Quiz not found')
  }

  // Calculate score
  let correctAnswers = 0
  const totalQuestions = quiz.questions.length

  for (const question of quiz.questions) {
    const userAnswer = answers[question.id]
    const correctOption = question.options.find((opt) => opt.isCorrect)

    if (userAnswer === correctOption?.id) {
      correctAnswers++
    }
  }

  const score = (correctAnswers / totalQuestions) * 100
  const passed = score >= quiz.passingScore

  // Create attempt record
  const attempt = await db.quizAttempt.create({
    data: {
      quizId,
      userId: session.user.id,
      answers,
      score,
      passed,
      finishedAt: new Date(),
    },
  })

  // Trigger quiz completion event
  await inngest.send({
    name: 'quiz/completed',
    data: {
      userId: session.user.id,
      quizId,
      score,
      passed,
    },
  })

  revalidatePath('/courses')

  return { 
    success: true, 
    score, 
    passed, 
    correctAnswers, 
    totalQuestions,
    attemptId: attempt.id,
  }
}

export async function getCourses() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return []
  }

  const courses = await db.course.findMany({
    where: { isActive: true },
    include: {
      modules: {
        include: {
          lessons: true,
        },
        orderBy: { order: 'asc' },
      },
      enrollments: {
        where: { userId: session.user.id },
      },
    },
    orderBy: { order: 'asc' },
  })

  return courses
}

export async function getCourseById(courseId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          lessons: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      enrollments: {
        where: { userId: session.user.id },
      },
    },
  })

  return course
}

export async function getQuizById(quizId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  // Don't send correct answers to client
  if (quiz) {
    const quizWithoutAnswers = {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        ...q,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          textDe: opt.textDe,
          order: opt.order,
        })),
      })),
    }
    return quizWithoutAnswers
  }

  return null
}

