/**
 * Hello Labs — QR Code Generation Helper
 * Generates QR codes as data URLs for embedding in PDFs and components
 */
import QRCode from 'qrcode'

/**
 * Generate a QR code as a base64 data URL (PNG)
 * Suitable for embedding in @react-pdf/renderer Image components
 */
export async function generateQRDataURL(
  content: string,
  options?: {
    width?: number
    margin?: number
    color?: { dark?: string; light?: string }
  },
): Promise<string> {
  return QRCode.toDataURL(content, {
    width: options?.width ?? 200,
    margin: options?.margin ?? 1,
    color: {
      dark: options?.color?.dark ?? '#1c1d21',
      light: options?.color?.light ?? '#ffffff',
    },
    errorCorrectionLevel: 'M',
  })
}

/**
 * Generate a QR code pointing to a case detail page
 */
export async function generateCaseQR(caseId: string): Promise<string> {
  const url = `${getBaseUrl()}/cases/${caseId}`
  return generateQRDataURL(url)
}

/**
 * Generate a QR code pointing to a service order
 */
export async function generateSOQR(soId: string): Promise<string> {
  const url = `${getBaseUrl()}/financial/orders?so=${soId}`
  return generateQRDataURL(url)
}

/**
 * Generate a QR code pointing to an invoice
 */
export async function generateInvoiceQR(invoiceId: string): Promise<string> {
  const url = `${getBaseUrl()}/financial/invoices?inv=${invoiceId}`
  return generateQRDataURL(url)
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://lab.hellodoctor.com'
}
