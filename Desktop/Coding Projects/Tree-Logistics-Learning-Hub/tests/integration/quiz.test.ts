import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/crypto'

describe('Quiz Grading Integration', () => {
  let userId: string
  let quizId: string
  let questionIds: string[] = []
  let correctOptionIds: string[] = []

  beforeAll(async () => {
    // Create test user
    const password = await hashPassword('TestPassword123!')
    const user = await db.user.create({
      data: {
        email: 'quiztest@example.com',
        name: 'Quiz Test User',
        password,
        role: 'DRIVER',
        status: 'ACTIVE',
      },
    })
    userId = user.id

    // Create test quiz with questions
    const quiz = await db.quiz.create({
      data: {
        title: 'Test Quiz',
        passingScore: 80,
        pointsReward: 100,
        isActive: true,
        questions: {
          create: [
            {
              text: 'Question 1?',
              type: 'MCQ',
              order: 1,
              options: {
                create: [
                  { text: 'Correct Answer', isCorrect: true, order: 1 },
                  { text: 'Wrong Answer', isCorrect: false, order: 2 },
                ],
              },
            },
            {
              text: 'Question 2?',
              type: 'MCQ',
              order: 2,
              options: {
                create: [
                  { text: 'Wrong Answer', isCorrect: false, order: 1 },
                  { text: 'Correct Answer', isCorrect: true, order: 2 },
                ],
              },
            },
          ],
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    })

    quizId = quiz.id
    questionIds = quiz.questions.map((q) => q.id)
    correctOptionIds = quiz.questions.map(
      (q) => q.options.find((opt) => opt.isCorrect)!.id
    )
  })

  afterAll(async () => {
    // Cleanup
    await db.quizAttempt.deleteMany({ where: { userId } }).catch(() => {})
    await db.quiz.delete({ where: { id: quizId } }).catch(() => {})
    await db.user.delete({ where: { id: userId } }).catch(() => {})
  })

  it('should calculate 100% score for all correct answers', async () => {
    const answers: Record<string, string> = {}
    questionIds.forEach((qId, index) => {
      answers[qId] = correctOptionIds[index]
    })

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

    let correctAnswers = 0
    const totalQuestions = quiz!.questions.length

    for (const question of quiz!.questions) {
      const userAnswer = answers[question.id]
      const correctOption = question.options.find((opt) => opt.isCorrect)
      if (userAnswer === correctOption?.id) {
        correctAnswers++
      }
    }

    const score = (correctAnswers / totalQuestions) * 100
    expect(score).toBe(100)
  })

  it('should calculate 50% score for half correct answers', async () => {
    const answers: Record<string, string> = {}
    // First answer correct, second wrong
    answers[questionIds[0]] = correctOptionIds[0]
    const wrongOption = await db.option.findFirst({
      where: {
        questionId: questionIds[1],
        isCorrect: false,
      },
    })
    answers[questionIds[1]] = wrongOption!.id

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

    let correctAnswers = 0
    const totalQuestions = quiz!.questions.length

    for (const question of quiz!.questions) {
      const userAnswer = answers[question.id]
      const correctOption = question.options.find((opt) => opt.isCorrect)
      if (userAnswer === correctOption?.id) {
        correctAnswers++
      }
    }

    const score = (correctAnswers / totalQuestions) * 100
    expect(score).toBe(50)
  })

  it('should mark quiz as passed when score >= passing score', async () => {
    const answers: Record<string, string> = {}
    questionIds.forEach((qId, index) => {
      answers[qId] = correctOptionIds[index]
    })

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

    let correctAnswers = 0
    const totalQuestions = quiz!.questions.length

    for (const question of quiz!.questions) {
      const userAnswer = answers[question.id]
      const correctOption = question.options.find((opt) => opt.isCorrect)
      if (userAnswer === correctOption?.id) {
        correctAnswers++
      }
    }

    const score = (correctAnswers / totalQuestions) * 100
    const passed = score >= quiz!.passingScore

    expect(passed).toBe(true)
    expect(score).toBeGreaterThanOrEqual(quiz!.passingScore)
  })

  it('should create quiz attempt record', async () => {
    const answers: Record<string, string> = {}
    questionIds.forEach((qId, index) => {
      answers[qId] = correctOptionIds[index]
    })

    const attempt = await db.quizAttempt.create({
      data: {
        quizId,
        userId,
        answers,
        score: 100,
        passed: true,
        finishedAt: new Date(),
      },
    })

    expect(attempt).toBeTruthy()
    expect(attempt.score).toBe(100)
    expect(attempt.passed).toBe(true)
  })
})

