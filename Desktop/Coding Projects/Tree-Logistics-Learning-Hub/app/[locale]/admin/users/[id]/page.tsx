import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserDocumentsClient } from '@/components/user-documents-client'
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  XCircle,
  GraduationCap
} from 'lucide-react'
import { format } from 'date-fns'
import { getRequiredDocumentsForRole, getDocumentComplianceStatus, getMissingDocuments } from '@/lib/required-documents'

interface UserDetailPageProps {
  params: { id: string }
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    include: {
      documents: {
        orderBy: { createdAt: 'desc' },
      },
      enrollments: {
        include: {
          course: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          documents: true,
          enrollments: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const requiredDocs = getRequiredDocumentsForRole(user.role)
  const missingDocs = getMissingDocuments(user.role, user.documents.map(doc => ({ type: doc.type, status: doc.status })))
  const complianceStatus = getDocumentComplianceStatus(user.role, user.documents.map(doc => ({ type: doc.type, status: doc.status })))


  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'INSPECTOR':
        return 'bg-purple-100 text-purple-800'
      case 'DRIVER':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColorForUser = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800'
      case 'BLOCKED':
        return 'bg-red-100 text-red-800'
      case 'ARCHIVED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <BackButton href="/admin/users" label="Back to Users" />
      </div>

      {/* User Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-semibold">
              {user.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex gap-2 mt-2">
              <Badge className={getRoleColor(user.role)}>
                {user.role}
              </Badge>
              <Badge className={getStatusColorForUser(user.status)}>
                {user.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Joined</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">{user.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Compliance */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Compliance</span>
                  <span className="text-sm font-medium">
                    {complianceStatus.compliancePercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${complianceStatus.compliancePercentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Required:</span>
                    <span className="ml-1 font-medium">{complianceStatus.totalRequired}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Approved:</span>
                    <span className="ml-1 font-medium text-green-600">{complianceStatus.approved}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pending:</span>
                    <span className="ml-1 font-medium text-yellow-600">{complianceStatus.pending}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Missing:</span>
                    <span className="ml-1 font-medium text-red-600">{complianceStatus.missing}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents and Missing Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Missing Required Documents */}
          {missingDocs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Missing Required Documents
                </CardTitle>
                <CardDescription>
                  {missingDocs.length} required document{missingDocs.length !== 1 ? 's' : ''} missing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {missingDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <p className="font-medium text-red-800">{doc.title}</p>
                        <p className="text-sm text-red-600">{doc.description}</p>
                        <Badge variant="outline" className="mt-1 text-red-600 border-red-300">
                          {doc.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="text-xs">
                          {doc.required ? 'Required' : 'Optional'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Folder */}
          <UserDocumentsClient 
            documents={user.documents}
            userName={user.name || 'Unknown User'}
            userId={user.id}
          />

          {/* Course Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Course Enrollments
              </CardTitle>
              <CardDescription>
                {user.enrollments.length} enrollment{user.enrollments.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.enrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No course enrollments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{enrollment.course.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(enrollment.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {enrollment.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
