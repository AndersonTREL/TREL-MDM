import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Nav } from '@/components/nav'
import { vi } from 'vitest'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

describe('Nav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.debug to avoid noise in tests
    vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders navigation correctly', () => {
    render(<Nav role="ADMIN" userName="Test User" />)
    
    expect(screen.getByText('Tree Learning')).toBeInTheDocument()
    expect(screen.getByText('Hub')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('shows correct navigation items for admin role', () => {
    render(<Nav role="ADMIN" userName="Test User" />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Inspector')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('shows correct navigation items for driver role', () => {
    render(<Nav role="DRIVER" userName="Test User" />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('Leaderboard')).toBeInTheDocument()
  })

  it('toggles notifications panel when bell icon is clicked', async () => {
    render(<Nav role="ADMIN" userName="Test User" />)
    
    const bellButton = screen.getByLabelText('Toggle notifications')
    fireEvent.click(bellButton)
    
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('New course assigned')).toBeInTheDocument()
    })
  })

  it('closes notifications panel when close button is clicked', async () => {
    render(<Nav role="ADMIN" userName="Test User" />)
    
    // Open notifications
    const bellButton = screen.getByLabelText('Toggle notifications')
    fireEvent.click(bellButton)
    
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument()
    })
    
    // Close notifications
    const closeButton = screen.getByRole('button', { name: '' }) // X button
    fireEvent.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
    })
  })

  it('handles notification click correctly', async () => {
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(<Nav role="ADMIN" userName="Test User" />)
    
    // Open notifications
    const bellButton = screen.getByLabelText('Toggle notifications')
    fireEvent.click(bellButton)
    
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument()
    })
    
    // Click on a notification
    const notification = screen.getByText('New course assigned')
    fireEvent.click(notification)
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Notification 1 marked as read')
    })
    
    mockAlert.mockRestore()
  })

  it('closes notifications when escape key is pressed', async () => {
    render(<Nav role="ADMIN" userName="Test User" />)
    
    // Open notifications
    const bellButton = screen.getByLabelText('Toggle notifications')
    fireEvent.click(bellButton)
    
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument()
    })
    
    // Press escape key
    fireEvent.keyDown(document, { key: 'Escape' })
    
    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
    })
  })

  it('shows user dropdown menu when user button is clicked', () => {
    render(<Nav role="ADMIN" userName="Test User" />)
    
    const userButton = screen.getByText('Test User')
    fireEvent.click(userButton)
    
    expect(screen.getByText('My Account')).toBeInTheDocument()
    expect(screen.getByText('Profile Settings')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })
})
