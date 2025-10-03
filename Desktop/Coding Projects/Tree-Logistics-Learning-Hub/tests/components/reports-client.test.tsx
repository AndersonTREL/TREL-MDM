import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReportsClient } from '@/components/reports-client'
import { vi } from 'vitest'

// Mock the CSV download functionality
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()
const mockClick = vi.fn()
const mockAppendChild = vi.fn()
const mockRemoveChild = vi.fn()

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
})

Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    href: '',
    download: '',
    click: mockClick,
  })),
})

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
})

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
})

const mockReports = [
  {
    title: 'User Activity Report',
    description: 'Comprehensive report of all user activities',
    icon: () => <div>📊</div>,
    lastGenerated: '2 hours ago',
    records: 150,
  },
  {
    title: 'Course Completion Report',
    description: 'Track course completion rates and progress',
    icon: () => <div>📈</div>,
    lastGenerated: '1 day ago',
    records: 75,
  },
]

describe('ReportsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.debug to avoid noise in tests
    vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders reports correctly', () => {
    render(<ReportsClient reports={mockReports} />)
    
    expect(screen.getByText('User Activity Report')).toBeInTheDocument()
    expect(screen.getByText('Course Completion Report')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('75')).toBeInTheDocument()
  })

  it('handles CSV export correctly', async () => {
    render(<ReportsClient reports={mockReports} />)
    
    const exportButton = screen.getAllByText('Export CSV')[0]
    fireEvent.click(exportButton)
    
    await waitFor(() => {
      expect(exportButton).toHaveTextContent('Exporting...')
    })
    
    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })

  it('handles preview functionality', async () => {
    render(<ReportsClient reports={mockReports} />)
    
    const previewButton = screen.getAllByText('Preview')[0]
    fireEvent.click(previewButton)
    
    await waitFor(() => {
      expect(previewButton).toHaveTextContent('Loading...')
    })
    
    await waitFor(() => {
      expect(screen.getByText('Preview: User Activity Report')).toBeInTheDocument()
    })
  })

  it('handles generate report functionality', async () => {
    // Mock alert
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(<ReportsClient reports={mockReports} />)
    
    const generateButton = screen.getAllByText('Generate Report')[0]
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(generateButton).toHaveTextContent('Generating...')
    })
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Report "User Activity Report" has been generated successfully!')
    })
    
    mockAlert.mockRestore()
  })

  it('closes preview modal when close button is clicked', async () => {
    render(<ReportsClient reports={mockReports} />)
    
    const previewButton = screen.getAllByText('Preview')[0]
    fireEvent.click(previewButton)
    
    await waitFor(() => {
      expect(screen.getByText('Preview: User Activity Report')).toBeInTheDocument()
    })
    
    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Preview: User Activity Report')).not.toBeInTheDocument()
    })
  })
})
