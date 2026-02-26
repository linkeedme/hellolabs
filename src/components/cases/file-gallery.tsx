'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Image as ImageIcon,
  Box,
  Archive,
  Download,
  Eye,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STLViewer } from './stl-viewer'

export interface FileItem {
  id: string
  fileName: string
  fileType: string
  fileSize: number | null
  version: number
  createdAt: Date | string
  uploadedBy: string
  signedUrl: string | null
}

interface FileGalleryProps {
  files: FileItem[]
  className?: string
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'model':
      return <Box className="h-5 w-5 text-blue-500" />
    case 'image':
      return <ImageIcon className="h-5 w-5 text-emerald-500" />
    case 'document':
      return <FileText className="h-5 w-5 text-orange-500" />
    case 'archive':
      return <Archive className="h-5 w-5 text-purple-500" />
    default:
      return <FileText className="h-5 w-5 text-muted-foreground" />
  }
}

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function isSTL(fileName: string): boolean {
  const ext = getFileExtension(fileName)
  return ext === 'stl' || ext === 'obj'
}

function isImage(fileName: string): boolean {
  const ext = getFileExtension(fileName)
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function FileGallery({ files, className }: FileGalleryProps) {
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)

  if (files.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Nenhum arquivo enviado ainda.
      </p>
    )
  }

  const handleDownload = (file: FileItem) => {
    if (!file.signedUrl) return
    const a = document.createElement('a')
    a.href = file.signedUrl
    a.download = file.fileName
    a.target = '_blank'
    a.click()
  }

  return (
    <>
      <div className={cn('space-y-2', className)}>
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Icon or thumbnail */}
              {isImage(file.fileName) && file.signedUrl ? (
                <div className="h-10 w-10 rounded-md overflow-hidden shrink-0 border bg-muted">
                  <img
                    src={file.signedUrl}
                    alt={file.fileName}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted shrink-0">
                  {getFileIcon(file.fileType)}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{file.fileName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>v{file.version}</span>
                  {file.fileSize && (
                    <>
                      <span>·</span>
                      <span>{formatFileSize(file.fileSize)}</span>
                    </>
                  )}
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {file.uploadedBy}
                  </span>
                  <span>·</span>
                  <span>{format(new Date(file.createdAt), 'dd/MM/yy HH:mm')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              {/* Preview button for STL and images */}
              {(isSTL(file.fileName) || isImage(file.fileName)) && file.signedUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPreviewFile(file)}
                  title="Visualizar"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}

              {/* Download */}
              {file.signedUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDownload(file)}
                  title="Baixar"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewFile && getFileIcon(previewFile.fileType)}
              {previewFile?.fileName}
            </DialogTitle>
          </DialogHeader>
          {previewFile?.signedUrl && (
            <div className="mt-2">
              {isSTL(previewFile.fileName) ? (
                <STLViewer key={previewFile.id} fileUrl={previewFile.signedUrl} className="rounded-lg" />
              ) : isImage(previewFile.fileName) ? (
                <div className="flex justify-center">
                  <img
                    src={previewFile.signedUrl}
                    alt={previewFile.fileName}
                    className="max-h-[600px] rounded-lg object-contain"
                  />
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
