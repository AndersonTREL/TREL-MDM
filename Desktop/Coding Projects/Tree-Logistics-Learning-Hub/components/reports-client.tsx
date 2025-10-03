'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileText, Calendar, TrendingUp } from 'lucide-react'

interface Report {
  title: string
  description: string
  icon: any
  lastGenerated: string
  records: number
}

interface ReportsClientProps {
  reports: Report[]
}

export function ReportsClient({ reports }: ReportsClientProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)

  const handleExportCSV = async (reportTitle: string) => {
    console.debug('[ACTION] Export CSV', { reportTitle })
    setLoading(`export-${reportTitle}`)
    
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate CSV data based on report type
      const csvData = generateCSVData(reportTitle)
      const csv = convertToCSV(csvData)
      
      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.debug('[SUCCESS] CSV exported', { reportTitle })
    } catch (error) {
      console.error('[ERROR] CSV export failed', error)
      alert('Failed to export CSV. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handlePreview = async (reportTitle: string) => {
    console.debug('[ACTION] Preview Report', { reportTitle })
    setLoading(`preview-${reportTitle}`)
    
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Generate preview data
      const previewData = generatePreviewData(reportTitle)
      setPreviewData({ title: reportTitle, data: previewData })
      
      console.debug('[SUCCESS] Preview generated', { reportTitle })
    } catch (error) {
      console.error('[ERROR] Preview failed', error)
      alert('Failed to generate preview. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleGenerateReport = async (reportTitle: string) => {
    console.debug('[ACTION] Generate Report', { reportTitle })
    setLoading(`generate-${reportTitle}`)
    
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.debug('[SUCCESS] Report generated', { reportTitle })
      alert(`Report "${reportTitle}" has been generated successfully!`)
    } catch (error) {
      console.error('[ERROR] Report generation failed', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const generateCSVData = (reportTitle: string) => {
    // Mock data generation - replace with actual data fetching
    const baseData = {
      'User Activity Report': [
        { id: 1, name: 'John Doe', email: 'john@example.com', lastLogin: '2024-01-15', status: 'Active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', lastLogin: '2024-01-14', status: 'Active' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', lastLogin: '2024-01-13', status: 'Inactive' }
      ],
      'Course Completion Report': [
        { course: 'Safety Training', enrolled: 150, completed: 120, completionRate: '80%' },
        { course: 'Compliance Training', enrolled: 200, completed: 180, completionRate: '90%' }
      ],
      'Document Compliance Report': [
        { document: 'Driver License', total: 100, approved: 95, pending: 5, expired: 0 },
        { document: 'Work Permit', total: 80, approved: 75, pending: 3, expired: 2 }
      ],
      'Onboarding Status Report': [
        { user: 'John Doe', profile: 'Complete', documents: 'Complete', courses: 'In Progress', overall: '75%' },
        { user: 'Jane Smith', profile: 'Complete', documents: 'Pending', courses: 'Not Started', overall: '25%' }
      ]
    }
    
    return baseData[reportTitle as keyof typeof baseData] || []
  }

  const generatePreviewData = (reportTitle: string) => {
    return generateCSVData(reportTitle).slice(0, 5) // Show first 5 rows in preview
  }

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value
      }).join(',')
    )
    
    return [csvHeaders, ...csvRows].join('\n')
  }

  return (
    <>
      <div className="grid gap-6 mb-8">
        {reports.map((report, index) => {
          const Icon = report.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => handleExportCSV(report.title)}
                    disabled={loading === `export-${report.title}`}
                    type="button"
                  >
                    <Download className="h-4 w-4" />
                    {loading === `export-${report.title}` ? 'Exporting...' : 'Export CSV'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Records</p>
                      <p className="text-2xl font-bold">{report.records}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Generated</p>
                      <p className="text-sm font-medium">{report.lastGenerated}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePreview(report.title)}
                      disabled={loading === `preview-${report.title}`}
                      type="button"
                    >
                      {loading === `preview-${report.title}` ? 'Loading...' : 'Preview'}
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleGenerateReport(report.title)}
                      disabled={loading === `generate-${report.title}`}
                      type="button"
                    >
                      {loading === `generate-${report.title}` ? 'Generating...' : 'Generate Report'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Preview: {previewData.title}</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPreviewData(null)}
                type="button"
              >
                Close
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {Object.keys(previewData.data[0] || {}).map((header) => (
                      <th key={header} className="border border-gray-300 px-4 py-2 text-left">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.data.map((row: any, index: number) => (
                    <tr key={index}>
                      {Object.values(row).map((value: any, cellIndex: number) => (
                        <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
