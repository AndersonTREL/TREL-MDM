import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/back-button'
import { Settings, Bell, Globe, Palette, Download } from 'lucide-react'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <BackButton href="/dashboard" label="Back to Dashboard" />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Customize your experience
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choose how you want to be notified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <Button variant="outline" size="sm" type="button" onClick={() => alert('Toggle functionality would be implemented here')}>Enabled</Button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">Course Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about pending courses
                </p>
              </div>
              <Button variant="outline" size="sm" type="button" onClick={() => alert('Toggle functionality would be implemented here')}>Enabled</Button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">Document Expiry Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Alerts before documents expire
                </p>
              </div>
              <Button variant="outline" size="sm" type="button" onClick={() => alert('Toggle functionality would be implemented here')}>Enabled</Button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive important updates via SMS
                </p>
              </div>
              <Button variant="outline" size="sm" type="button" onClick={() => alert('Toggle functionality would be implemented here')}>Disabled</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language & Region
            </CardTitle>
            <CardDescription>
              Set your preferred language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Display Language</p>
                <p className="text-sm text-muted-foreground">
                  Current: English
                </p>
              </div>
              <select className="border rounded-md px-3 py-2">
                <option>English</option>
                <option>Deutsch (German)</option>
              </select>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">Time Zone</p>
                <p className="text-sm text-muted-foreground">
                  Europe/Berlin
                </p>
              </div>
              <Button variant="outline" size="sm" type="button" onClick={() => alert('Change functionality would be implemented here')}>Change</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Choose light or dark mode
                </p>
              </div>
              <select className="border rounded-md px-3 py-2">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data & Privacy
            </CardTitle>
            <CardDescription>
              Manage your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Download Your Data</p>
                <p className="text-sm text-muted-foreground">
                  Export all your personal data
                </p>
              </div>
              <Button variant="outline" type="button" onClick={() => alert('Download functionality would be implemented here')}>Download</Button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account
                </p>
              </div>
              <Button variant="destructive" type="button" onClick={() => alert('Delete account functionality would be implemented here')}>Delete</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => alert('Cancel functionality would be implemented here')}>Cancel</Button>
          <Button type="button" onClick={() => alert('Save changes functionality would be implemented here')}>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}

