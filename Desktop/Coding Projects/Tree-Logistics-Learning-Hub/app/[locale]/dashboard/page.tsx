import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      driverProfile: true,
      documents: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      enrollments: {
        where: {
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        },
        include: {
          course: true,
        },
      },
      achievements: {
        orderBy: { awardedAt: 'desc' },
        take: 5,
      },
    },
  })

  const onboarding = await db.onboardingProgress.findUnique({
    where: { userId: session.user.id },
  })

  const leaderboard = await db.leaderboardSnapshot.findUnique({
    where: {
      userId_period: {
        userId: session.user.id,
        period: 'all_time',
      },
    },
  })

  if (session.user.role === 'ADMIN') {
    redirect('/admin/dashboard')
  }

  if (session.user.role === 'INSPECTOR') {
    redirect('/inspector/dashboard')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Welcome, {user?.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Points</CardDescription>
            <CardTitle className="text-3xl">{leaderboard?.points || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Achievements</CardDescription>
            <CardTitle className="text-3xl">{user?.achievements.length || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Courses</CardDescription>
            <CardTitle className="text-3xl">{user?.enrollments.length || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Documents</CardDescription>
            <CardTitle className="text-3xl">{user?.documents.length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Progress</CardTitle>
            <CardDescription>Complete all steps to get started</CardDescription>
          </CardHeader>
          <CardContent>
            {onboarding ? (
              <div className="space-y-4">
                <OnboardingStep title="Profile" status={onboarding.profileStep} />
                <OnboardingStep title="Data Forms" status={onboarding.dataFormsStep} />
                <OnboardingStep title="Documents" status={onboarding.documentsStep} />
                <OnboardingStep title="Courses" status={onboarding.coursesStep} />
                <OnboardingStep title="Assessment" status={onboarding.assessmentStep} />
                <OnboardingStep title="Review" status={onboarding.reviewStep} />
                <OnboardingStep title="Approval" status={onboarding.approvalStep} />
              </div>
            ) : (
              <p className="text-muted-foreground">No onboarding data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Your uploaded documents</CardDescription>
          </CardHeader>
          <CardContent>
            {user?.documents && user.documents.length > 0 ? (
              <div className="space-y-3">
                {user.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between">
                    <span className="text-sm">{doc.type.replace(/_/g, ' ')}</span>
                    <DocumentStatusBadge status={doc.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No documents uploaded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Courses</CardTitle>
            <CardDescription>Continue your learning</CardDescription>
          </CardHeader>
          <CardContent>
            {user?.enrollments && user.enrollments.length > 0 ? (
              <div className="space-y-4">
                {user.enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{enrollment.course.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {enrollment.status}
                      </span>
                    </div>
                    <Progress value={(enrollment.timeSpentMinutes / 60) * 100} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No active courses</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
            <CardDescription>Your latest accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            {user?.achievements && user.achievements.length > 0 ? (
              <div className="space-y-3">
                {user.achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3">
                    <span className="text-2xl">{achievement.badgeIcon || '🏆'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {achievement.points} points
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No achievements yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function OnboardingStep({ title, status }: { title: string; status: string }) {
  const statusColors = {
    NOT_STARTED: 'secondary',
    IN_PROGRESS: 'warning',
    COMPLETED: 'success',
    BLOCKED: 'destructive',
  } as const

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{title}</span>
      <Badge variant={statusColors[status as keyof typeof statusColors]}>
        {status.replace(/_/g, ' ')}
      </Badge>
    </div>
  )
}

function DocumentStatusBadge({ status }: { status: string }) {
  const statusVariants = {
    PENDING_REVIEW: 'warning',
    APPROVED: 'success',
    REJECTED: 'destructive',
  } as const

  return (
    <Badge variant={statusVariants[status as keyof typeof statusVariants]}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

