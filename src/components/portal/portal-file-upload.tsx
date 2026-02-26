'use client'

import { useState, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Upload, Loader2 } from 'lucide-react'

const ALLOWED_TYPES = ['.stl', '.obj', '.zip', '.pdf', '.jpg', '.jpeg', '.png']
const MAX_SIZE = 100 * 1024 * 1024 // 100MB

interface PortalFileUploadProps {
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

export function PortalFileUpload({ caseId, tenantId, onUploadComplete }: PortalFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const utils = trpc.useUtils()
  const uploadFileMeta = trpc.portal.uploadFile.useMutation({
    onSuccess: () => {
      utils.portal.caseDetail.invalidate({ caseId })
      utils.portal.getFileUrls.invalidate({ caseId })
      onUploadComplete?.()
    },
  })

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    for (const file of fileArray) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_TYPES.includes(ext)) {
        toast.error(`Tipo nao permitido: ${ext}. Permitidos: ${ALLOWED_TYPES.join(', ')}`)
        continue
      }

      if (file.size > MAX_SIZE) {
        toast.error(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximo: 100MB.`)
        continue
      }

      setUploading(true)
      setProgress(0)

      try {
        const supabase = createClient()

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

        const fileType = getFileTypeCategory(ext)

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
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors',
        isDragOver ? 'border-[#5e81f4] bg-[rgba(94,129,244,0.05)]' : 'border-[#f0f0f3]',
        uploading && 'pointer-events-none opacity-50',
      )}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#5e81f4]" />
          <p className="text-[13px] text-[#8181a5]">Enviando... {progress}%</p>
          <div className="h-2 w-48 rounded-full bg-[#f0f0f3]">
            <div
              className="h-2 rounded-full bg-[#5e81f4] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <>
          <Upload className="mb-2 h-8 w-8 text-[#8181a5]" />
          <p className="text-[13px] font-medium text-[#1c1d21]">Arraste arquivos aqui</p>
          <p className="text-[12px] text-[#8181a5]">
            STL, OBJ, fotos, PDF — ate 100MB
          </p>
          <label>
            <span className="mt-3 inline-block cursor-pointer rounded-lg border border-[#f0f0f3] bg-white px-4 py-2 text-[13px] font-medium text-[#5e81f4] hover:bg-[#f5f5fa] transition-colors">
              Selecionar arquivo
            </span>
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
  )
}
