import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getCourses } from '@/app/actions/courses'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BackButton } from '@/components/back-button'
import Link from 'next/link'
import { GraduationCap, BookOpen, Clock } from 'lucide-react'

export default async function CoursesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  const courses = await getCourses()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <BackButton href="/dashboard" label="Back to Dashboard" />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="h-8 w-8" />
          Courses
        </h1>
        <p className="text-muted-foreground mt-2">
          Continue your learning journey
        </p>
      </div>

      <div className="grid gap-6">
        {courses.map((course) => {
          const enrollment = course.enrollments[0]
          const isEnrolled = !!enrollment
          const totalLessons = course.modules.reduce(
            (acc, module) => acc + module.lessons.length,
            0
          )

          return (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {course.description}
                    </CardDescription>
                  </div>
                  <Badge variant={isEnrolled ? 'success' : 'secondary'}>
                    {isEnrolled ? enrollment.status : 'Available'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{course.modules.length} modules</span>
                    <span>•</span>
                    <span>{totalLessons} lessons</span>
                    <span>•</span>
                    <span>{course.pointsReward} points</span>
                  </div>

                  {isEnrolled && enrollment.status === 'IN_PROGRESS' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{enrollment.timeSpentMinutes} minutes</span>
                      </div>
                      <Progress value={(enrollment.timeSpentMinutes / 60) * 100} />
                    </div>
                  )}

                  {isEnrolled && enrollment.status === 'COMPLETED' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Completed</Badge>
                      {enrollment.score && (
                        <span className="text-sm text-muted-foreground">
                          Score: {enrollment.score}%
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/courses/${course.id}`}>
                      <Button>
                        {isEnrolled
                          ? enrollment.status === 'COMPLETED'
                            ? 'Review Course'
                            : 'Continue'
                          : 'Start Course'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {courses.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground">No courses available</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

