'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  Trophy,
  Shield,
  Settings,
  LogOut,
  Bell,
  User,
  X,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface NavProps {
  role: string
  userName?: string
}

export function Nav({ role, userName }: NavProps) {
  const pathname = usePathname()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  const routes = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'INSPECTOR', 'DRIVER'],
    },
    {
      href: '/documents',
      label: 'Documents',
      icon: FileText,
      roles: ['DRIVER'],
    },
    {
      href: '/courses',
      label: 'Courses',
      icon: GraduationCap,
      roles: ['DRIVER'],
    },
    {
      href: '/leaderboard',
      label: 'Leaderboard',
      icon: Trophy,
      roles: ['DRIVER'],
    },
    {
      href: '/inspector/dashboard',
      label: 'Inspector',
      icon: Shield,
      roles: ['INSPECTOR', 'ADMIN'],
    },
    {
      href: '/admin/dashboard',
      label: 'Admin',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ].filter((route) => route.roles.includes(role))

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: 'New course assigned',
      message: 'Safety Training course has been assigned to you',
      time: '2 hours ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Document approved',
      message: 'Your driver license has been approved',
      time: '1 day ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Achievement unlocked',
      message: 'You earned the "Safety Pro" badge',
      time: '3 days ago',
      unread: false,
    },
  ]

  const handleNotificationToggle = () => {
    console.debug('[ACTION] Toggle Notifications', { open: !notificationsOpen })
    setNotificationsOpen(!notificationsOpen)
  }

  const handleMarkAsRead = (notificationId: number) => {
    console.debug('[ACTION] Mark Notification as Read', { notificationId })
    // In a real app, this would make an API call
    alert(`Notification ${notificationId} marked as read`)
  }

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notificationsOpen])

  // Close notifications on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false)
      }
    }

    if (notificationsOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [notificationsOpen])

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-bold">T</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-none">Tree Learning</span>
                <span className="text-xs text-muted-foreground">Hub</span>
              </div>
            </Link>
            <div className="hidden md:flex gap-1">
              {routes.map((route) => {
                const Icon = route.icon
                const isActive = pathname.startsWith(route.href)
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {route.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={notificationRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={handleNotificationToggle}
                aria-expanded={notificationsOpen}
                aria-label="Toggle notifications"
                type="button"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              </Button>

              {/* Notifications Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNotificationsOpen(false)}
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            notification.unread ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {notification.title}
                              </p>
                              <p className="text-gray-600 text-sm mt-1">
                                {notification.message}
                              </p>
                              <p className="text-gray-400 text-xs mt-2">
                                {notification.time}
                              </p>
                            </div>
                            {notification.unread && (
                              <div className="h-2 w-2 rounded-full bg-blue-500 ml-2 mt-1" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => alert('Mark all as read functionality would be implemented here')}
                        type="button"
                      >
                        Mark all as read
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{userName || 'User'}</span>
                    <Badge variant="secondary" className="text-xs">
                      {role}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}

