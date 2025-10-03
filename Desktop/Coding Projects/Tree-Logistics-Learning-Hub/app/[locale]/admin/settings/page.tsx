import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/back-button'
import { Settings, Database, Mail, Bell, Shield, Globe } from 'lucide-react'

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const settings = await db.setting.findMany()

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <BackButton href="/admin/dashboard" label="Back to Dashboard" />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          System Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure system preferences and options
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Basic system configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Max File Size</p>
                <p className="text-sm text-muted-foreground">
                  Maximum upload size for documents
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">10 MB</span>
                <Button variant="outline" size="sm" type="button" onClick={() => alert('Edit functionality would be implemented here')}>Edit</Button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">Session Timeout</p>
                <p className="text-sm text-muted-foreground">
                  User session duration
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">30 days</span>
                <Button variant="outline" size="sm" type="button" onClick={() => alert('Edit functionality would be implemented here')}>Edit</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Settings
            </CardTitle>
            <CardDescription>
              Configure email notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Provider</p>
                <p className="text-sm text-muted-foreground">
                  Current: Resend
                </p>
              </div>
                <Button variant="outline" size="sm" type="button" onClick={() => alert('Configure functionality would be implemented here')}>Configure</Button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">From Email</p>
                <p className="text-sm text-muted-foreground">
                  noreply@treelogistics.com
                </p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Manage system notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Document Expiry Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Days before expiry: 30, 14, 7, 1
                </p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Twilio integration
                </p>
              </div>
                <Button variant="outline" size="sm" type="button" onClick={() => alert('Configure functionality would be implemented here')}>Configure</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Authentication and security options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for admin/inspector roles
                </p>
              </div>
                <Button variant="outline" size="sm" type="button" onClick={() => alert('Toggle functionality would be implemented here')}>Enabled</Button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">Password Policy</p>
                <p className="text-sm text-muted-foreground">
                  Min 8 chars, uppercase, lowercase, number
                </p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Localization
            </CardTitle>
            <CardDescription>
              Language and regional settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Supported Languages</p>
                <p className="text-sm text-muted-foreground">
                  English, German
                </p>
              </div>
                <Button variant="outline" size="sm" type="button" onClick={() => alert('Manage functionality would be implemented here')}>Manage</Button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">Default Language</p>
                <p className="text-sm text-muted-foreground">
                  English
                </p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" type="button" onClick={() => alert('Reset to defaults functionality would be implemented here')}>Reset to Defaults</Button>
          <Button type="button" onClick={() => alert('Save all changes functionality would be implemented here')}>Save All Changes</Button>
        </div>
      </div>
    </div>
  )
}

