'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, X, Download, ExternalLink } from 'lucide-react'

interface DocumentViewerProps {
  document: {
    id: string
    type: string
    urls: string[]
    status: string
    createdAt: Date
    user: {
      name: string | null
      email: string
    }
  }
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Debug document URLs
  console.log('[DEBUG] Document viewer received:', {
    id: document.id,
    type: document.type,
    urls: document.urls,
    urlsLength: document.urls?.length
  })

  const handleDownload = (url: string, filename: string) => {
    const link = window.document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  const getFileExtension = (url: string) => {
    return url.split('.').pop()?.toLowerCase() || ''
  }

  const isImage = (url: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
    return imageExtensions.includes(getFileExtension(url))
  }

  const isPdf = (url: string) => {
    return getFileExtension(url) === 'pdf'
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Eye className="h-4 w-4" />
        View Document
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">{document.type}</h3>
            <p className="text-sm text-muted-foreground">
              {document.user.name} ({document.user.email})
            </p>
            <p className="text-xs text-muted-foreground">
              Uploaded: {new Date(document.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
          {document.urls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No document files available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Navigation for multiple files */}
              {document.urls.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                    disabled={currentImageIndex === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentImageIndex + 1} of {document.urls.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentImageIndex(Math.min(document.urls.length - 1, currentImageIndex + 1))}
                    disabled={currentImageIndex === document.urls.length - 1}
                  >
                    Next
                  </Button>
                </div>
              )}

              {/* Document Display */}
              <div className="flex justify-center">
                {(() => {
                  const currentUrl = document.urls[currentImageIndex]
                  
                  if (isImage(currentUrl)) {
                    return (
                      <div className="relative">
                        <img
                          src={currentUrl}
                          alt={`${document.type} - Page ${currentImageIndex + 1}`}
                          className="max-w-full max-h-[60vh] object-contain border rounded"
                          onError={(e) => {
                            console.error('Failed to load image:', currentUrl)
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const errorDiv = target.nextElementSibling as HTMLElement
                            if (errorDiv) {
                              errorDiv.classList.remove('hidden')
                            }
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', currentUrl)
                          }}
                        />
                        <div className="hidden text-center py-8 text-muted-foreground">
                          <p>Failed to load image</p>
                          <p className="text-xs mt-2">URL: {currentUrl}</p>
                          <div className="flex gap-2 justify-center mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(currentUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open in New Tab
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = window.document.createElement('a')
                                link.href = currentUrl
                                link.download = `${document.type}_${currentImageIndex + 1}.${getFileExtension(currentUrl)}`
                                link.target = '_blank'
                                window.document.body.appendChild(link)
                                link.click()
                                window.document.body.removeChild(link)
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  } else if (isPdf(currentUrl)) {
                    return (
                      <div className="w-full h-[60vh]">
                        <iframe
                          src={currentUrl}
                          className="w-full h-full border rounded"
                          title={`${document.type} - Page ${currentImageIndex + 1}`}
                        />
                      </div>
                    )
                  } else {
                    return (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          Preview not available for this file type
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => window.open(currentUrl, '_blank')}
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open in New Tab
                        </Button>
                      </div>
                    )
                  }
                })()}
              </div>

              {/* Download Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(
                    document.urls[currentImageIndex],
                    `${document.type}_${currentImageIndex + 1}.${getFileExtension(document.urls[currentImageIndex])}`
                  )}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Current File
                </Button>
              </div>

              {/* All Files List */}
              {document.urls.length > 1 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">All Files:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {document.urls.map((url, index) => (
                      <div
                        key={index}
                        className={`p-2 border rounded cursor-pointer transition-colors ${
                          index === currentImageIndex ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <p className="text-xs font-medium">
                          File {index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getFileExtension(url).toUpperCase()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
