'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, Eye, Edit, Archive, RotateCcw, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { getMissingDocuments, getDocumentComplianceStatus } from '@/lib/required-documents'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  status: string
  createdAt: Date
  _count: {
    documents: number
    enrollments: number
  }
}

interface UserManagementClientProps {
  users: User[]
  initialFilter?: {
    role?: string
    status?: string
  }
}

export function UserManagementClient({ users, initialFilter }: UserManagementClientProps) {
  const router = useRouter()
  const [clientUsers, setClientUsers] = useState<User[]>(users)
  const [loading, setLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showArchived, setShowArchived] = useState(initialFilter?.status === 'ARCHIVED')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showUserDetails, setShowUserDetails] = useState<User | null>(null)
  const [showEditUser, setShowEditUser] = useState<User | null>(null)
  const [showArchiveModal, setShowArchiveModal] = useState<User | null>(null)
  const [showRestoreModal, setShowRestoreModal] = useState<User | null>(null)

  // Sync client state with server data when it changes
  useEffect(() => {
    setClientUsers(users)
  }, [users])


  const roleColors = {
    ADMIN: 'bg-red-100 text-red-700',
    INSPECTOR: 'bg-blue-100 text-blue-700',
    DRIVER: 'bg-green-100 text-green-700',
  }

  const statusColors = {
    ACTIVE: 'success',
    INACTIVE: 'secondary',
    BLOCKED: 'destructive',
    ARCHIVED: 'outline',
  } as const

  const filteredUsers = clientUsers.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesArchiveFilter = showArchived ? true : user.status !== 'ARCHIVED'
    return matchesSearch && matchesArchiveFilter
  })

  const handleAddUser = async () => {
    console.debug('[ACTION] Add New User')
    setLoading('add-user')
    
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setShowAddUserModal(true)
      console.debug('[SUCCESS] Add user modal opened')
    } catch (error) {
      console.error('[ERROR] Failed to open add user modal', error)
      alert('Failed to open add user form. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleViewDetails = (user: User) => {
    console.debug('[ACTION] Navigate to User Profile', { userId: user.id })
    router.push(`/admin/users/${user.id}`)
  }


  const handleEditUser = async (user: User) => {
    console.debug('[ACTION] Edit User', { userId: user.id })
    setLoading(`edit-${user.id}`)
    
    try {
      // Simulate API call to fetch user data for editing
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setShowEditUser(user)
      console.debug('[SUCCESS] Edit user modal opened', { userId: user.id })
    } catch (error) {
      console.error('[ERROR] Failed to open edit user modal', error)
      alert('Failed to open edit form. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleSubmitAddUser = async (formData: FormData) => {
    console.debug('[ACTION] Submit Add User', { formData: Object.fromEntries(formData) })
    setLoading('submit-add-user')
    
    try {
      // Prepare data for API
      const userData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        role: formData.get('role') as 'ADMIN' | 'INSPECTOR' | 'DRIVER',
        status: formData.get('status') as 'ACTIVE' | 'INACTIVE',
        password: formData.get('password') as string,
      }

      // Call the API endpoint
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      const newUser = await response.json()
      
      // Immediately update client state with real data from server
      setClientUsers(prev => [newUser, ...prev])
      
      console.debug('[SUCCESS] User created', newUser)
      alert('User created successfully!')
      setShowAddUserModal(false)
      
    } catch (error) {
      console.error('[ERROR] Failed to create user', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user. Please try again.'
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(null)
    }
  }

  const handleSubmitEditUser = async (formData: FormData) => {
    console.debug('[ACTION] Submit Edit User', { formData: Object.fromEntries(formData) })
    setLoading('submit-edit-user')
    
    const editingUser = showEditUser
    if (!editingUser) return
    
    try {
      // Prepare data for API
      const userData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        role: formData.get('role') as 'ADMIN' | 'INSPECTOR' | 'DRIVER',
        status: formData.get('status') as 'ACTIVE' | 'INACTIVE' || editingUser.status, // Use existing status if not provided
      }

      // Call the API endpoint
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }

      const updatedUser = await response.json()
      
      // Immediately update client state with real data from server
      setClientUsers(prev => prev.map(user => 
        user.id === editingUser.id ? updatedUser : user
      ))
      
      console.debug('[SUCCESS] User updated', updatedUser)
      alert('User updated successfully!')
      setShowEditUser(null)
      
    } catch (error) {
      console.error('[ERROR] Failed to update user', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user. Please try again.'
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(null)
    }
  }

  const handleArchiveUser = async (user: User) => {
    console.debug('[ACTION] Archive User', { userId: user.id })
    setShowArchiveModal(user)
  }

  const handleSubmitArchiveUser = async (formData: FormData) => {
    console.debug('[ACTION] Submit Archive User', { formData: Object.fromEntries(formData) })
    setLoading('archive-user')
    
    const userToArchive = showArchiveModal
    if (!userToArchive) return
    
    try {
      const archiveReason = formData.get('archiveReason') as string

      // Call the API endpoint
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userToArchive.id,
          archiveReason: archiveReason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to archive user')
      }

      const archivedUser = await response.json()
      
      // Update client state
      setClientUsers(prev => prev.map(user => 
        user.id === archivedUser.id ? archivedUser : user
      ))
      
      console.debug('[SUCCESS] User archived', archivedUser)
      alert('User archived successfully!')
      setShowArchiveModal(null)
      
    } catch (error) {
      console.error('[ERROR] Failed to archive user', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to archive user. Please try again.'
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(null)
    }
  }

  const handleRestoreUser = async (user: User) => {
    console.debug('[ACTION] Restore User', { userId: user.id })
    setShowRestoreModal(user)
  }

  const handleSubmitRestoreUser = async (formData: FormData) => {
    console.debug('[ACTION] Submit Restore User', { formData: Object.fromEntries(formData) })
    setLoading('restore-user')
    
    const userToRestore = showRestoreModal
    if (!userToRestore) return
    
    try {
      const newStatus = formData.get('newStatus') as 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
      const restoreReason = formData.get('restoreReason') as string

      // Call the API endpoint
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userToRestore.id,
          newStatus: newStatus,
          restoreReason: restoreReason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to restore user')
      }

      const restoredUser = await response.json()
      
      // Update client state
      setClientUsers(prev => prev.map(user => 
        user.id === restoredUser.id ? restoredUser : user
      ))
      
      console.debug('[SUCCESS] User restored', restoredUser)
      alert(`User restored successfully as ${newStatus}!`)
      setShowRestoreModal(null)
      
    } catch (error) {
      console.error('[ERROR] Failed to restore user', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore user. Please try again.'
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-2xl">👥</span>
            User Management
            {initialFilter && (
              <Badge variant="secondary" className="ml-2">
                {initialFilter.role && `Role: ${initialFilter.role}`}
                {initialFilter.status && `Status: ${initialFilter.status}`}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all users in the system
          </p>
        </div>
        <Button 
          size="lg" 
          className="gap-2"
          onClick={handleAddUser}
          disabled={loading === 'add-user'}
          type="button"
        >
          <Plus className="h-4 w-4" />
          {loading === 'add-user' ? 'Loading...' : 'Add New User'}
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 border rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant={showArchived ? "default" : "outline"} 
              className="gap-2" 
              type="button" 
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className="h-4 w-4" />
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 relative">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={() => handleViewDetails(user)}
                      className="font-semibold text-lg hover:text-primary transition-colors cursor-pointer text-left"
                    >
                      {user.name}
                    </button>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${roleColors[user.role as keyof typeof roleColors]}`}>
                        {user.role}
                      </span>
                      <Badge variant={statusColors[user.status as keyof typeof statusColors]}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{user._count.documents}</p>
                    <p className="text-xs text-muted-foreground">Documents</p>
                    {/* Missing Documents Indicator */}
                    {(() => {
                      const missingDocs = getMissingDocuments(user.role, [])
                      const requiredMissing = missingDocs.filter(doc => doc.required)
                      if (requiredMissing.length > 0) {
                        return (
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-600">
                              {requiredMissing.length} missing
                            </span>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{user._count.enrollments}</p>
                    <p className="text-xs text-muted-foreground">Courses</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        disabled={loading === `edit-${user.id}`}
                        type="button"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {loading === `edit-${user.id}` ? 'Loading...' : 'Edit'}
                      </Button>
                      {user.status !== 'ARCHIVED' ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleArchiveUser(user)}
                          disabled={loading === 'archive-user'}
                          type="button"
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <Archive className="h-4 w-4 mr-1" />
                          Archive
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRestoreUser(user)}
                          disabled={loading === 'restore-user'}
                          type="button"
                          className="text-green-600 hover:text-green-700"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <span className="text-6xl mb-4 block">👥</span>
              <p className="text-muted-foreground">
                {searchTerm ? 'No users found matching your search' : 'No users found'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleSubmitAddUser(formData)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border rounded-md p-2"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full border rounded-md p-2"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select name="role" required className="w-full border rounded-md p-2">
                    <option value="">Select role</option>
                    <option value="DRIVER">Driver</option>
                    <option value="INSPECTOR">Inspector</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select name="status" required className="w-full border rounded-md p-2">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full border rounded-md p-2"
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading === 'submit-add-user'}
                  className="flex-1"
                >
                  {loading === 'submit-add-user' ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">User Details</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Name:</span> {showUserDetails.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {showUserDetails.email}
              </div>
              <div>
                <span className="font-medium">Role:</span> {showUserDetails.role}
              </div>
              <div>
                <span className="font-medium">Status:</span> {showUserDetails.status}
              </div>
              <div>
                <span className="font-medium">Documents:</span> {showUserDetails._count.documents}
              </div>
              <div>
                <span className="font-medium">Courses:</span> {showUserDetails._count.enrollments}
              </div>
              <div>
                <span className="font-medium">Joined:</span> {format(new Date(showUserDetails.createdAt), 'MMM dd, yyyy')}
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setShowUserDetails(null)}
              className="w-full mt-6"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleSubmitEditUser(formData)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={showEditUser.name || ''}
                    required
                    className="w-full border rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={showEditUser.email}
                    required
                    className="w-full border rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select name="role" defaultValue={showEditUser.role} required className="w-full border rounded-md p-2">
                    <option value="DRIVER">Driver</option>
                    <option value="INSPECTOR">Inspector</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select name="status" defaultValue={showEditUser.status} required className="w-full border rounded-md p-2">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditUser(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading === 'submit-edit-user'}
                  className="flex-1"
                >
                  {loading === 'submit-edit-user' ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive User Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-orange-600">Archive User</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to archive <strong>{showArchiveModal.name}</strong>? 
              This will preserve all their data and documents for archival purposes.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleSubmitArchiveUser(formData)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Archive Reason</label>
                  <textarea
                    name="archiveReason"
                    required
                    className="w-full border rounded-md p-2"
                    placeholder="e.g., Employee left company, Contract ended, etc."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowArchiveModal(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading === 'archive-user'}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {loading === 'archive-user' ? 'Archiving...' : 'Archive User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore User Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-green-600">Restore User</h3>
            <p className="text-muted-foreground mb-4">
              Restore <strong>{showRestoreModal.name}</strong> back to active status. 
              Choose their new status and provide a reason for restoration.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleSubmitRestoreUser(formData)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">New Status</label>
                  <select name="newStatus" required className="w-full border rounded-md p-2">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Restore Reason</label>
                  <textarea
                    name="restoreReason"
                    required
                    className="w-full border rounded-md p-2"
                    placeholder="e.g., Employee returned to work, Contract renewed, etc."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRestoreModal(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading === 'restore-user'}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {loading === 'restore-user' ? 'Restoring...' : 'Restore User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

