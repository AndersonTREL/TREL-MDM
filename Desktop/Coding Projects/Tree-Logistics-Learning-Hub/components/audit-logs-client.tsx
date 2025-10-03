'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Search, Filter, Download } from 'lucide-react'
import { format } from 'date-fns'

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  diff: any
  ipAddress: string | null
  createdAt: Date
  actor: {
    name: string | null
    email: string
    role: string
  }
}

interface AuditLogsClientProps {
  auditLogs: AuditLog[]
}

export function AuditLogsClient({ auditLogs: initialAuditLogs }: AuditLogsClientProps) {
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialAuditLogs.length >= 50)

  const actionColors: Record<string, string> = {
    VIEW_PII: 'bg-blue-100 text-blue-700',
    UPDATE_PII: 'bg-yellow-100 text-yellow-700',
    CREATE_USER: 'bg-green-100 text-green-700',
    DELETE_USER: 'bg-red-100 text-red-700',
    ARCHIVE_USER: 'bg-orange-100 text-orange-700',
    RESTORE_USER: 'bg-emerald-100 text-emerald-700',
    APPROVE_DOCUMENT: 'bg-emerald-100 text-emerald-700',
    REJECT_DOCUMENT: 'bg-orange-100 text-orange-700',
    CHANGE_ROLE: 'bg-purple-100 text-purple-700',
    CHANGE_STATUS: 'bg-indigo-100 text-indigo-700',
  }

  const [searchResults, setSearchResults] = useState<AuditLog[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchTerm.trim()) {
        setIsSearching(true)
        try {
          const response = await fetch(`/api/audit-logs?search=${encodeURIComponent(searchTerm)}`)
          if (response.ok) {
            const results = await response.json()
            setSearchResults(results)
          }
        } catch (error) {
          console.error('Search error:', error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const filteredLogs = searchTerm.trim() ? searchResults : auditLogs

  const handleExportLogs = () => {
    const csvContent = [
      ['Date', 'Time', 'Action', 'Entity', 'User', 'Email', 'Role', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.createdAt), 'yyyy-MM-dd'),
        format(new Date(log.createdAt), 'HH:mm:ss'),
        log.action.replace(/_/g, ' '),
        log.entity,
        log.actor.name || '',
        log.actor.email,
        log.actor.role,
        log.ipAddress || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleLoadMore = async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/audit-logs?skip=${auditLogs.length}&take=50`)
      if (!response.ok) {
        throw new Error('Failed to load more audit logs')
      }
      
      const newLogs = await response.json()
      
      if (newLogs.length === 0) {
        setHasMore(false)
      } else {
        setAuditLogs(prev => [...prev, ...newLogs])
        setHasMore(newLogs.length >= 50)
      }
    } catch (error) {
      console.error('Error loading more audit logs:', error)
      alert('Failed to load more audit logs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-2">
            Track all system activities and changes
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExportLogs}>
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-3 h-4 w-4 ${isSearching ? 'text-blue-500' : 'text-muted-foreground'}`} />
              <input
                type="text"
                placeholder="Search by action, user, or entity..."
                className="w-full pl-10 pr-4 py-2 border rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2 bg-muted rounded-lg">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        on {log.entity}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {log.entityId.slice(0, 8)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">{log.actor.name}</span>
                        <span className="text-muted-foreground"> ({log.actor.email})</span>
                      </p>
                      {log.ipAddress && (
                        <p className="text-xs text-muted-foreground">
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), 'HH:mm:ss')}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {log.actor.role}
                  </Badge>
                </div>
              </div>

              {log.diff && (
                <details className="mt-4 pt-4 border-t">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    View Changes
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto">
                    {JSON.stringify(log.diff, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No audit logs found matching your search' : 'No audit logs found'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredLogs.length > 0 && hasMore && (
        <div className="mt-6 flex justify-center">
          <Button 
            variant="outline" 
            type="button" 
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </>
  )
}
