import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'tree-learning-hub',
  eventKey: process.env.INNGEST_EVENT_KEY,
})

// Event types
export type Events = {
  'document/uploaded': {
    data: {
      documentId: string
      userId: string
      type: string
    }
  }
  'document/approved': {
    data: {
      documentId: string
      userId: string
      type: string
    }
  }
  'document/rejected': {
    data: {
      documentId: string
      userId: string
      type: string
      reason: string
    }
  }
  'course/completed': {
    data: {
      userId: string
      courseId: string
      score: number
    }
  }
  'quiz/completed': {
    data: {
      userId: string
      quizId: string
      score: number
      passed: boolean
    }
  }
  'user/approved': {
    data: {
      userId: string
    }
  }
  'expiry/check': {
    data: Record<string, never>
  }
}

