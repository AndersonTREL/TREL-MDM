import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BackButton } from '@/components/back-button'
import { Trophy, Medal, Award } from 'lucide-react'

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  const allTimeLeaderboard = await db.leaderboardSnapshot.findMany({
    where: { period: 'all_time' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { points: 'desc' },
    take: 10,
  })

  const thirtyDayLeaderboard = await db.leaderboardSnapshot.findMany({
    where: { period: '30_days' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { points: 'desc' },
    take: 10,
  })

  const userAchievements = await db.achievement.findMany({
    where: { userId: session.user.id },
    orderBy: { awardedAt: 'desc' },
  })

  const userTotalPoints = await db.achievement.aggregate({
    where: { userId: session.user.id },
    _sum: { points: true },
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <BackButton href="/dashboard" label="Back to Dashboard" />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2">
          See how you rank against other drivers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Time Leaders</CardTitle>
              <CardDescription>Top performers of all time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allTimeLeaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{entry.user.name}</span>
                      {entry.userId === session.user.id && (
                        <Badge variant="secondary">You</Badge>
                      )}
                    </div>
                    <span className="font-bold text-lg">{entry.points}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Last 30 Days</CardTitle>
              <CardDescription>Recent top performers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {thirtyDayLeaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{entry.user.name}</span>
                      {entry.userId === session.user.id && (
                        <Badge variant="secondary">You</Badge>
                      )}
                    </div>
                    <span className="font-bold text-lg">{entry.points}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
              <CardDescription>Your achievements and points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-3xl font-bold">{userTotalPoints._sum.points || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                  <p className="text-3xl font-bold">{userAchievements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userAchievements.slice(0, 5).map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3">
                    <span className="text-2xl">{achievement.badgeIcon || '🏆'}</span>
                    <div>
                      <p className="font-medium text-sm">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {achievement.points} points
                      </p>
                    </div>
                  </div>
                ))}
                {userAchievements.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No achievements yet. Complete courses to earn them!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

