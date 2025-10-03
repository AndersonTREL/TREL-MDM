import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/back-button'
import { ReportsClient } from '@/components/reports-client'
import { BarChart3, Download, FileText, Calendar, TrendingUp } from 'lucide-react'

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  // Get summary data for reports
  const [totalUsers, totalCourses, totalDocuments, totalEnrollments] = await Promise.all([
    db.user.count(),
    db.course.count(),
    db.document.count(),
    db.enrollment.count(),
  ])

  const reports = [
    {
      title: 'User Activity Report',
      description: 'Comprehensive report of all user activities',
      icon: FileText,
      lastGenerated: '2 hours ago',
      records: totalUsers,
    },
    {
      title: 'Course Completion Report',
      description: 'Track course completion rates and progress',
      icon: TrendingUp,
      lastGenerated: '1 day ago',
      records: totalEnrollments,
    },
    {
      title: 'Document Compliance Report',
      description: 'Review document status and expiry dates',
      icon: FileText,
      lastGenerated: '3 hours ago',
      records: totalDocuments,
    },
    {
      title: 'Onboarding Status Report',
      description: 'Track driver onboarding progress',
      icon: Calendar,
      lastGenerated: '5 hours ago',
      records: totalUsers,
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <BackButton href="/admin/dashboard" label="Back to Dashboard" />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate and download system reports
        </p>
      </div>

      <ReportsClient reports={reports} />

      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>
            Create custom reports with specific date ranges and filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Report Type</label>
                <select className="w-full border rounded-md p-2">
                  <option>User Activity</option>
                  <option>Course Performance</option>
                  <option>Document Status</option>
                  <option>Compliance Overview</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <select className="w-full border rounded-md p-2">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Last 3 Months</option>
                  <option>Custom Range</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => alert('Reset functionality would be implemented here')}>Reset</Button>
              <Button className="gap-2" type="button" onClick={() => alert('Custom report generation would be implemented here')}>
                <Download className="h-4 w-4" />
                Generate Custom Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

