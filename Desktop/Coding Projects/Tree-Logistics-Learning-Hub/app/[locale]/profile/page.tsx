import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/back-button'
import { User, Mail, Phone, Globe, Shield } from 'lucide-react'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      driverProfile: true,
    },
  })

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <BackButton href="/dashboard" label="Back to Dashboard" />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <User className="h-8 w-8" />
          My Profile
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-lg font-medium mt-1">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <p className="text-lg font-medium mt-1">{user.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-lg font-medium mt-1">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <p className="text-lg font-medium mt-1">{user.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </label>
                <p className="text-lg font-medium mt-1">{user.locale === 'de' ? 'German' : 'English'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-lg font-medium mt-1">{user.status}</p>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button type="button" onClick={() => alert('Edit profile functionality would be implemented here')}>Edit Profile</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
              </div>
              <Button variant="outline" type="button" onClick={() => alert('Change password functionality would be implemented here')}>Change Password</Button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {user.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                </p>
              </div>
              <Button variant="outline">
                {user.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
              </Button>
            </div>
          </CardContent>
        </Card>

        {user.role === 'DRIVER' && user.driverProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Driver Information</CardTitle>
              <CardDescription>Your driver-specific details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="text-lg font-medium mt-1">
                    {user.driverProfile.dateOfBirth 
                      ? new Date(user.driverProfile.dateOfBirth).toLocaleDateString()
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                  <p className="text-lg font-medium mt-1">
                    {user.driverProfile.nationality || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Marital Status</label>
                  <p className="text-lg font-medium mt-1">
                    {user.driverProfile.maritalStatus?.replace(/_/g, ' ') || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Main Employer</label>
                  <p className="text-lg font-medium mt-1">
                    {user.driverProfile.isMainEmployer ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button type="button" onClick={() => alert('View full profile functionality would be implemented here')}>View Full Profile</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

