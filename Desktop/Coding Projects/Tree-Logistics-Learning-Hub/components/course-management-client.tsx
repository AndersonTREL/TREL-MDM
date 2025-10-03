'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Users, BookOpen, Eye, Settings } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string | null
  isActive: boolean
  pointsReward: number
  modules: Array<{
    id: string
    lessons: Array<{ id: string }>
  }>
  enrollments: Array<{
    status: string
  }>
}

interface CourseManagementClientProps {
  courses: Course[]
}

export function CourseManagementClient({ courses }: CourseManagementClientProps) {
  const router = useRouter()
  const [clientCourses, setClientCourses] = useState<Course[]>(courses)
  const [loading, setLoading] = useState<string | null>(null)
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false)
  const [showEditCourse, setShowEditCourse] = useState<Course | null>(null)
  const [showCourseDetails, setShowCourseDetails] = useState<Course | null>(null)

  // Sync client state with server data when it changes
  useEffect(() => {
    setClientCourses(courses)
  }, [courses])

  const handleCreateCourse = async () => {
    console.debug('[ACTION] Create New Course')
    setLoading('create-course')
    
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setShowCreateCourseModal(true)
      console.debug('[SUCCESS] Create course modal opened')
    } catch (error) {
      console.error('[ERROR] Failed to open create course modal', error)
      alert('Failed to open create course form. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleEditCourse = async (course: Course) => {
    console.debug('[ACTION] Edit Course', { courseId: course.id })
    setLoading(`edit-${course.id}`)
    
    try {
      // Simulate API call to fetch course data for editing
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setShowEditCourse(course)
      console.debug('[SUCCESS] Edit course modal opened', { courseId: course.id })
    } catch (error) {
      console.error('[ERROR] Failed to open edit course modal', error)
      alert('Failed to open edit form. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleViewDetails = async (course: Course) => {
    console.debug('[ACTION] View Course Details', { courseId: course.id })
    setLoading(`view-${course.id}`)
    
    try {
      // Simulate API call to fetch additional course details
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setShowCourseDetails(course)
      console.debug('[SUCCESS] Course details opened', { courseId: course.id })
    } catch (error) {
      console.error('[ERROR] Failed to load course details', error)
      alert('Failed to load course details. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleManageModules = async (course: Course) => {
    console.debug('[ACTION] Manage Modules', { courseId: course.id })
    setLoading(`modules-${course.id}`)
    
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.debug('[SUCCESS] Navigate to modules management', { courseId: course.id })
      alert(`Module management for "${course.title}" would open here.`)
    } catch (error) {
      console.error('[ERROR] Failed to open module management', error)
      alert('Failed to open module management. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleSubmitCreateCourse = async (formData: FormData) => {
    console.debug('[ACTION] Submit Create Course', { formData: Object.fromEntries(formData) })
    setLoading('submit-create-course')
    
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Create optimistic course object
      const newCourse: Course & { _count: { enrollments: number; modules: number } } = {
        id: `temp-${Date.now()}`,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        pointsReward: parseInt(formData.get('pointsReward') as string) || 0,
        isActive: formData.get('isActive') === 'true',
        _count: {
          enrollments: 0,
          modules: 0,
        },
      } as any
      
      // Immediately update client state
      setClientCourses(prev => [newCourse, ...prev])
      
      console.debug('[SUCCESS] Course created')
      alert('Course created successfully!')
      setShowCreateCourseModal(false)
      
      // Refresh the page to get the real data from server
      router.refresh()
    } catch (error) {
      console.error('[ERROR] Failed to create course', error)
      alert('Failed to create course. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleSubmitEditCourse = async (formData: FormData) => {
    console.debug('[ACTION] Submit Edit Course', { formData: Object.fromEntries(formData) })
    setLoading('submit-edit-course')
    
    const editingCourse = showEditCourse
    if (!editingCourse) return
    
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Immediately update client state with optimistic update
      setClientCourses(prev => prev.map(course => 
        course.id === editingCourse.id 
          ? {
              ...course,
              title: formData.get('title') as string,
              description: formData.get('description') as string,
              pointsReward: parseInt(formData.get('pointsReward') as string) || 0,
              isActive: formData.get('isActive') === 'true',
              updatedAt: new Date(),
            }
          : course
      ))
      
      console.debug('[SUCCESS] Course updated')
      alert('Course updated successfully!')
      setShowEditCourse(null)
      
      // Refresh the page to get the real data from server
      router.refresh()
    } catch (error) {
      console.error('[ERROR] Failed to update course', error)
      alert('Failed to update course. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            Course Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage training courses
          </p>
        </div>
        <Button 
          size="lg" 
          className="gap-2"
          onClick={handleCreateCourse}
          disabled={loading === 'create-course'}
          type="button"
        >
          <Plus className="h-4 w-4" />
          {loading === 'create-course' ? 'Loading...' : 'Create New Course'}
        </Button>
      </div>

      <div className="grid gap-6">
        {clientCourses.map((course) => {
          const totalLessons = course.modules.reduce(
            (acc, module) => acc + module.lessons.length,
            0
          )
          const activeEnrollments = course.enrollments.filter(
            (e) => e.status === 'IN_PROGRESS' || e.status === 'ASSIGNED'
          ).length
          const completedEnrollments = course.enrollments.filter(
            (e) => e.status === 'COMPLETED'
          ).length

          return (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{course.title}</CardTitle>
                      <Badge variant={course.isActive ? 'success' : 'secondary'}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription>{course.description}</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleEditCourse(course)}
                    disabled={loading === `edit-${course.id}`}
                    type="button"
                  >
                    <Edit className="h-4 w-4" />
                    {loading === `edit-${course.id}` ? 'Loading...' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">{course.modules.length}</p>
                    <p className="text-xs text-muted-foreground">Modules</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <span className="text-2xl mb-2 block">📚</span>
                    <p className="text-2xl font-bold">{totalLessons}</p>
                    <p className="text-xs text-muted-foreground">Lessons</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold">{course.enrollments.length}</p>
                    <p className="text-xs text-muted-foreground">Total Enrolled</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="h-6 w-6 mx-auto mb-2 text-yellow-600 flex items-center justify-center font-bold text-xl">
                      ⏳
                    </div>
                    <p className="text-2xl font-bold">{activeEnrollments}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="h-6 w-6 mx-auto mb-2 text-emerald-600 flex items-center justify-center font-bold text-xl">
                      ✓
                    </div>
                    <p className="text-2xl font-bold">{completedEnrollments}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Points Reward: <span className="font-semibold">{course.pointsReward}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(course)}
                      disabled={loading === `view-${course.id}`}
                      type="button"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {loading === `view-${course.id}` ? 'Loading...' : 'View Details'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleManageModules(course)}
                      disabled={loading === `modules-${course.id}`}
                      type="button"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      {loading === `modules-${course.id}` ? 'Loading...' : 'Manage Modules'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <span className="text-6xl mb-4 block">🎓</span>
              <p className="text-muted-foreground mb-4">No courses created yet</p>
              <Button
                onClick={handleCreateCourse}
                disabled={loading === 'create-course'}
                type="button"
              >
                <Plus className="mr-2 h-4 w-4" />
                {loading === 'create-course' ? 'Loading...' : 'Create Your First Course'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Course Modal */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Course</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleSubmitCreateCourse(formData)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Course Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full border rounded-md p-2"
                    placeholder="Enter course title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    className="w-full border rounded-md p-2"
                    placeholder="Enter course description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Points Reward</label>
                  <input
                    type="number"
                    name="pointsReward"
                    required
                    min="0"
                    className="w-full border rounded-md p-2"
                    placeholder="Enter points reward"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="isActive" defaultChecked />
                    <span className="text-sm font-medium">Active Course</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateCourseModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading === 'submit-create-course'}
                  className="flex-1"
                >
                  {loading === 'submit-create-course' ? 'Creating...' : 'Create Course'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Course</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleSubmitEditCourse(formData)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Course Title</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={showEditCourse.title}
                    required
                    className="w-full border rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    defaultValue={showEditCourse.description || ''}
                    required
                    rows={3}
                    className="w-full border rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Points Reward</label>
                  <input
                    type="number"
                    name="pointsReward"
                    defaultValue={showEditCourse.pointsReward}
                    required
                    min="0"
                    className="w-full border rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="isActive" defaultChecked={showEditCourse.isActive} />
                    <span className="text-sm font-medium">Active Course</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditCourse(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading === 'submit-edit-course'}
                  className="flex-1"
                >
                  {loading === 'submit-edit-course' ? 'Updating...' : 'Update Course'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      {showCourseDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Course Details</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Title:</span> {showCourseDetails.title}
              </div>
              <div>
                <span className="font-medium">Description:</span> {showCourseDetails.description}
              </div>
              <div>
                <span className="font-medium">Status:</span> {showCourseDetails.isActive ? 'Active' : 'Inactive'}
              </div>
              <div>
                <span className="font-medium">Points Reward:</span> {showCourseDetails.pointsReward}
              </div>
              <div>
                <span className="font-medium">Modules:</span> {showCourseDetails.modules.length}
              </div>
              <div>
                <span className="font-medium">Total Lessons:</span> {showCourseDetails.modules.reduce((acc, module) => acc + module.lessons.length, 0)}
              </div>
              <div>
                <span className="font-medium">Total Enrollments:</span> {showCourseDetails.enrollments.length}
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setShowCourseDetails(null)}
              className="w-full mt-6"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
