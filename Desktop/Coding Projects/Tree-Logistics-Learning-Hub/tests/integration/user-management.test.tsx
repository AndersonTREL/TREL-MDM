import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserManagementClient } from '@/components/user-management-client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'DRIVER' as const,
    status: 'ACTIVE' as const,
    createdAt: new Date('2024-01-01'),
    _count: { documents: 0, enrollments: 0 },
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'INSPECTOR' as const,
    status: 'INACTIVE' as const,
    createdAt: new Date('2024-01-02'),
    _count: { documents: 1, enrollments: 2 },
  },
]

describe('User Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('User Creation', () => {
    it('should create a user and display it immediately in the list', async () => {
      const user = userEvent.setup()
      
      // Mock successful API response
      const newUser = {
        id: '3',
        name: 'Test User',
        email: 'test@example.com',
        role: 'DRIVER',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-03'),
        _count: { documents: 0, enrollments: 0 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newUser,
      })

      render(<UserManagementClient users={mockUsers} />)

      // Click "Add New User" button
      const addButton = screen.getByText('Add New User')
      await user.click(addButton)

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Create New User')).toBeInTheDocument()
      })

      // Fill out the form
      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.selectOptions(screen.getByLabelText(/role/i), 'DRIVER')
      await user.selectOptions(screen.getByLabelText(/status/i), 'ACTIVE')

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)

      // Verify API was called correctly
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            role: 'DRIVER',
            status: 'ACTIVE',
          }),
        })
      })

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText('User created successfully!')).toBeInTheDocument()
      })

      // Verify new user appears in the list immediately
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })
    })

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock API error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'User with this email already exists' }),
      })

      render(<UserManagementClient users={mockUsers} />)

      // Click "Add New User" button
      const addButton = screen.getByText('Add New User')
      await user.click(addButton)

      // Fill out the form
      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com') // Existing email
      await user.selectOptions(screen.getByLabelText(/role/i), 'DRIVER')
      await user.selectOptions(screen.getByLabelText(/status/i), 'ACTIVE')

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/Error: User with this email already exists/)).toBeInTheDocument()
      })

      // Verify user is not added to the list
      expect(screen.queryByText('Test User')).not.toBeInTheDocument()
    })
  })

  describe('User Updates', () => {
    it('should update a user and reflect changes immediately', async () => {
      const user = userEvent.setup()
      
      // Mock successful API response
      const updatedUser = {
        ...mockUsers[0],
        name: 'John Updated',
        status: 'INACTIVE',
        updatedAt: new Date('2024-01-03'),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedUser,
      })

      render(<UserManagementClient users={mockUsers} />)

      // Find and click the edit button for the first user
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0]) // Edit John Doe

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Edit User')).toBeInTheDocument()
      })

      // Update the name
      const nameInput = screen.getByDisplayValue('John Doe')
      await user.clear(nameInput)
      await user.type(nameInput, 'John Updated')

      // Update the status
      await user.selectOptions(screen.getByLabelText(/status/i), 'INACTIVE')

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update user/i })
      await user.click(submitButton)

      // Verify API was called correctly
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users/1', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'John Updated',
            email: 'john@example.com',
            role: 'DRIVER',
            status: 'INACTIVE',
          }),
        })
      })

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText('User updated successfully!')).toBeInTheDocument()
      })

      // Verify updated user appears in the list immediately
      await waitFor(() => {
        expect(screen.getByText('John Updated')).toBeInTheDocument()
        expect(screen.getByText('Inactive')).toBeInTheDocument()
      })

      // Verify old values are gone
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      expect(screen.queryByText('Active')).not.toBeInTheDocument()
    })

    it('should handle update API errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock API error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'User with this email already exists' }),
      })

      render(<UserManagementClient users={mockUsers} />)

      // Find and click the edit button for the first user
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0]) // Edit John Doe

      // Update the email to an existing one
      const emailInput = screen.getByDisplayValue('john@example.com')
      await user.clear(emailInput)
      await user.type(emailInput, 'jane@example.com')

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update user/i })
      await user.click(submitButton)

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/Error: User with this email already exists/)).toBeInTheDocument()
      })

      // Verify original values are still displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  describe('Status Changes Persistence', () => {
    it('should persist status changes after page reload', async () => {
      const user = userEvent.setup()
      
      // Mock successful API response
      const updatedUser = {
        ...mockUsers[0],
        status: 'INACTIVE',
        updatedAt: new Date('2024-01-03'),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedUser,
      })

      render(<UserManagementClient users={mockUsers} />)

      // Find and click the edit button for the first user
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      // Change status to INACTIVE
      await user.selectOptions(screen.getByLabelText(/status/i), 'INACTIVE')

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update user/i })
      await user.click(submitButton)

      // Verify status change is reflected immediately
      await waitFor(() => {
        expect(screen.getByText('Inactive')).toBeInTheDocument()
      })

      // Verify API call was made with correct status
      expect(mockFetch).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(expect.objectContaining({
          status: 'INACTIVE',
        })),
      }))
    })
  })
})
