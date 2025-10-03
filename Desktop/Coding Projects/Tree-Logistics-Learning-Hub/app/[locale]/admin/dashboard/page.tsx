import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Users, 
  UserCheck, 
  Shield, 
  GraduationCap, 
  FileText, 
  TrendingUp, 
  Trophy, 
  AlertCircle,
  Plus,
  Settings,
  BarChart3,
  Eye,
  Archive
} from 'lucide-react'
import { format } from 'date-fns'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const stats = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: 'DRIVER' } }),
    db.user.count({ where: { role: 'INSPECTOR' } }),
    db.course.count(),
    db.user.count({ where: { status: 'ARCHIVED' } }),
    db.document.count({ where: { status: 'PENDING_REVIEW' } }),
    db.enrollment.count({ where: { status: 'IN_PROGRESS' } }),
    db.achievement.count(),
  ])

  const [
    totalUsers,
    totalDrivers,
    totalInspectors,
    totalCourses,
    totalArchivedUsers,
    pendingDocuments,
    activeCourseEnrollments,
    totalAchievements,
  ] = stats

  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  })

  const recentAuditLogs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: {
      actor: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  const statCards = [
    {
      title: 'Total Users',
      value: totalUsers,
      description: 'All registered users',
      icon: Users,
      trend: '+12% from last month',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/admin/users',
    },
    {
      title: 'Drivers',
      value: totalDrivers,
      description: 'Active drivers',
      icon: UserCheck,
      trend: '+8% from last month',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/admin/users?role=DRIVER',
    },
    {
      title: 'Inspectors',
      value: totalInspectors,
      description: 'Active inspectors',
      icon: Shield,
      trend: 'Stable',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/admin/users?role=INSPECTOR',
    },
    {
      title: 'Courses',
      value: totalCourses,
      description: 'Available courses',
      icon: GraduationCap,
      trend: `${activeCourseEnrollments} active enrollments`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      href: '/admin/courses',
    },
    {
      title: 'Archived Users',
      value: totalArchivedUsers,
      description: 'Former employees',
      icon: Archive,
      trend: totalUsers > 0 ? `${Math.round((totalArchivedUsers / totalUsers) * 100)}% turnover rate` : '0% turnover rate',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/admin/users?status=ARCHIVED',
    },
    {
      title: 'Pending Documents',
      value: pendingDocuments,
      description: 'Awaiting review',
      icon: FileText,
      trend: pendingDocuments > 5 ? 'Needs attention' : 'Under control',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      alert: pendingDocuments > 5,
      href: '/admin/documents?status=PENDING_REVIEW',
    },
    {
      title: 'Active Enrollments',
      value: activeCourseEnrollments,
      description: 'In progress',
      icon: TrendingUp,
      trend: '+15% completion rate',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      href: '/admin/courses',
      redirectNote: '→ Courses page',
    },
    {
      title: 'Total Achievements',
      value: totalAchievements,
      description: 'Earned by users',
      icon: Trophy,
      trend: 'Engagement up 20%',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      href: '/admin/users',
      redirectNote: '→ Users page',
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            System overview and management
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/reports">
              <BarChart3 className="mr-2 h-4 w-4" />
              Reports
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link key={index} href={stat.href}>
              <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-primary/20">
                {stat.alert && (
                  <div className="absolute top-2 right-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>{stat.title}</CardDescription>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <CardTitle className="text-3xl font-bold">{stat.value}</CardTitle>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  <p className={`text-xs font-medium ${stat.alert ? 'text-red-600' : 'text-green-600'}`}>
                    {stat.trend}
                  </p>
                  {stat.redirectNote && (
                    <p className="text-xs text-muted-foreground italic">
                      {stat.redirectNote}
                    </p>
                  )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Newly registered users</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/users">
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold">
                        {user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge variant="secondary">{user.role}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(user.createdAt), 'MMM dd')}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/users/${user.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent system activities</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/audit-logs">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAuditLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.actor.name} • {log.entity}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {log.entityId.slice(0, 8)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/admin/users">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users, roles, and permissions
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/admin/courses">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Course Management
              </CardTitle>
              <CardDescription>
                Create and manage courses & quizzes
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/admin/settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system preferences
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  )
}

