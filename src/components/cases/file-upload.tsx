'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Upload, Loader2, Box, Image as ImageIcon, FileText, Archive } from 'lucide-react'

const ALLOWED_TYPES = ['.stl', '.obj', '.zip', '.pdf', '.jpg', '.jpeg', '.png']
const MAX_SIZE = 100 * 1024 * 1024 // 100MB

interface FileUploadProps {
  caseId: string
  tenantId: string
  onUploadComplete?: () => void
}

function getFileTypeCategory(ext: string): string {
  if (['.stl', '.obj'].includes(ext)) return 'model'
  if (['.jpg', '.jpeg', '.png'].includes(ext)) return 'image'
  if (ext === '.pdf') return 'document'
  if (ext === '.zip') return 'archive'
  return 'other'
}

function getFileIcon(ext: string) {
  const type = getFileTypeCategory(ext)
  switch (type) {
    case 'model': return <Box className="h-4 w-4 text-blue-500" />
    case 'image': return <ImageIcon className="h-4 w-4 text-emerald-500" />
    case 'document': return <FileText className="h-4 w-4 text-orange-500" />
    case 'archive': return <Archive className="h-4 w-4 text-purple-500" />
    default: return <FileText className="h-4 w-4 text-muted-foreground" />
  }
}

export function FileUpload({ caseId, tenantId, onUploadComplete }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<string>('')

  const utils = trpc.useUtils()
  const uploadFileMeta = trpc.case.uploadFile.useMutation({
    onSuccess: () => {
      utils.case.getById.invalidate({ id: caseId })
      utils.case.getFileUrls.invalidate({ caseId })
      onUploadComplete?.()
    },
  })

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    for (const file of fileArray) {
      // Validate extension
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_TYPES.includes(ext)) {
        toast.error(`Tipo nao permitido: ${ext}. Permitidos: ${ALLOWED_TYPES.join(', ')}`)
        continue
      }

      // Validate size
      if (file.size > MAX_SIZE) {
        toast.error(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximo: 100MB.`)
        continue
      }

      setUploading(true)
      setProgress(0)
      setCurrentFile(file.name)

      try {
        const supabase = createClient()

        // Generate unique path
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${tenantId}/${caseId}/${timestamp}_${safeName}`

        const { error: uploadError } = await supabase.storage
          .from('case-files')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw uploadError
        }

        setProgress(80)

        // Determine file type category
        const fileType = getFileTypeCategory(ext)

        // Save metadata
        await uploadFileMeta.mutateAsync({
          caseId,
          fileUrl: path,
          fileType,
          fileName: file.name,
          fileSize: file.size,
        })

        setProgress(100)
        toast.success(`${file.name} enviado com sucesso!`)
      } catch (error) {
        toast.error(`Erro ao enviar ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    }

    setUploading(false)
    setProgress(0)
    setCurrentFile('')
  }, [caseId, tenantId, uploadFileMeta, utils])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          uploading && 'pointer-events-none opacity-50',
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Enviando {currentFile}... {progress}%
            </p>
            <div className="h-2 w-48 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Arraste arquivos aqui</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Box className="h-3 w-3 text-blue-500" /> STL/OBJ</span>
              <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3 text-emerald-500" /> Fotos</span>
              <span className="flex items-center gap-1"><FileText className="h-3 w-3 text-orange-500" /> PDF</span>
              <span>— ate 100MB</span>
            </div>
            <label>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <span>Selecionar arquivo</span>
              </Button>
              <input
                type="file"
                className="hidden"
                accept={ALLOWED_TYPES.join(',')}
                multiple
                onChange={handleInputChange}
              />
            </label>
          </>
        )}
      </div>
    </div>
  )
}
