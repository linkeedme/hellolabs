/**
 * Hello Labs — PDF Download Helper
 * Client-side PDF generation and download using @react-pdf/renderer
 */
import { pdf } from '@react-pdf/renderer'

/**
 * Generate a PDF from a React PDF document component and trigger download
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function downloadPdf(
  document: any,
  fileName: string,
): Promise<void> {
  const blob = await pdf(document).toBlob()
  const url = URL.createObjectURL(blob)

  const link = window.document.createElement('a')
  link.href = url
  link.download = fileName
  window.document.body.appendChild(link)
  link.click()
  window.document.body.removeChild(link)

  // Cleanup after short delay
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Generate a PDF blob for embedding or printing
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generatePdfBlob(
  document: any,
): Promise<Blob> {
  return pdf(document).toBlob()
}
