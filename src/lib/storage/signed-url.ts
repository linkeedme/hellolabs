/**
 * Hello Labs — Supabase Storage signed URL helpers
 * Generates temporary signed URLs for accessing files in the case-files bucket.
 */
import { createClient as createServerClient } from '@/lib/supabase/server'

const BUCKET = 'case-files'
const DEFAULT_EXPIRY = 3600 // 1 hour in seconds

/**
 * Generate a signed URL for a file in Supabase Storage (server-side).
 * The fileUrl stored in CaseFile is the storage path, not a public URL.
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = DEFAULT_EXPIRY,
): Promise<string> {
  const supabase = await createServerClient()

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, expiresIn)

  if (error || !data?.signedUrl) {
    throw new Error(`Erro ao gerar URL do arquivo: ${error?.message ?? 'URL vazia'}`)
  }

  return data.signedUrl
}

/**
 * Generate signed URLs for multiple files at once.
 */
export async function getSignedUrls(
  filePaths: string[],
  expiresIn: number = DEFAULT_EXPIRY,
): Promise<Map<string, string>> {
  if (filePaths.length === 0) return new Map()

  const supabase = await createServerClient()

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(filePaths, expiresIn)

  if (error || !data) {
    throw new Error(`Erro ao gerar URLs: ${error?.message ?? 'Dados vazios'}`)
  }

  const urlMap = new Map<string, string>()
  for (const item of data) {
    if (item.signedUrl && item.path) {
      urlMap.set(item.path, item.signedUrl)
    }
  }

  return urlMap
}
