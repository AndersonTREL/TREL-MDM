import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserManagementClient } from '@/components/user-management-client'
import { vi } from 'vitest'

const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'DRIVER',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    _count: {
      documents: 3,
      enrollments: 2,
    },
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'INSPECTOR',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-02'),
    _count: {
      documents: 1,
      enrollments: 1,
    },
  },
]

describe('UserManagementClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.debug to avoid noise in tests
    vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders users correctly', () => {
    render(<UserManagementClient users={mockUsers} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('handles search functionality', () => {
    render(<UserManagementClient users={mockUsers} />)
    
    const searchInput = screen.getByPlaceholderText('Search users by name or email...')
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
  })

  it('opens add user modal when Add New User button is clicked', async () => {
    render(<UserManagementClient users={mockUsers} />)
    
    const addButton = screen.getByText('Add New User')
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument()
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
    })
  })

  it('opens user details modal when View Details is clicked', async () => {
    render(<UserManagementClient users={mockUsers} />)
    
    const viewDetailsButton = screen.getAllByText('View Details')[0]
    fireEvent.click(viewDetailsButton)
    
    await waitFor(() => {
      expect(screen.getByText('User Details')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })
  })

  it('opens edit user modal when Edit button is clicked', async () => {
    render(<UserManagementClient users={mockUsers} />)
    
    const editButton = screen.getAllByText('Edit')[0]
    fireEvent.click(editButton)
    
    await waitFor(() => {
      expect(screen.getByText('Edit User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    })
  })

  it('submits add user form correctly', async () => {
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(<UserManagementClient users={mockUsers} />)
    
    // Open add user modal
    const addButton = screen.getByText('Add New User')
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument()
    })
    
    // Fill form
    const nameInput = screen.getByLabelText('Name')
    const emailInput = screen.getByLabelText('Email')
    const roleSelect = screen.getByLabelText('Role')
    const passwordInput = screen.getByLabelText('Password')
    
    fireEvent.change(nameInput, { target: { value: 'New User' } })
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
    fireEvent.change(roleSelect, { target: { value: 'DRIVER' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    // Submit form
    const createButton = screen.getByText('Create User')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(createButton).toHaveTextContent('Creating...')
    })
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('User created successfully!')
    })
    
    mockAlert.mockRestore()
  })

  it('closes modals when cancel button is clicked', async () => {
    render(<UserManagementClient users={mockUsers} />)
    
    // Open add user modal
    const addButton = screen.getByText('Add New User')
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument()
    })
    
    // Click cancel
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Add New User')).not.toBeInTheDocument()
    })
  })
})
