import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'
import { CourseManagementClient } from '@/components/course-management-client'

export default async function AdminCoursesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const courses = await db.course.findMany({
    orderBy: { order: 'asc' },
    include: {
      modules: {
        include: {
          lessons: true,
        },
      },
      enrollments: {
        select: {
          status: true,
        },
      },
    },
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <BackButton href="/admin/dashboard" label="Back to Dashboard" />
      </div>

      <CourseManagementClient courses={courses} />
    </div>
  )
}

