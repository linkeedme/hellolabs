'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'
import { downloadPdf } from '@/lib/pdf/download-pdf'
import { ServiceOrderPdf, type SOPdfData } from '@/lib/pdf/service-order-pdf'
import { InvoicePdf, type InvoicePdfData } from '@/lib/pdf/invoice-pdf'
import { PaymentReceiptPdf, type PaymentReceiptData } from '@/lib/pdf/payment-receipt-pdf'
import { DeliveryReceiptPdf, type DeliveryReceiptData } from '@/lib/pdf/delivery-receipt-pdf'
import { CaseLabelPdf, type CaseLabelData } from '@/lib/pdf/case-label-pdf'
import { generateSOQR, generateInvoiceQR, generateCaseQR } from '@/lib/pdf/generate-qr'
import type { LabInfo } from '@/lib/pdf/lab-header'

type PdfType = 'so' | 'invoice' | 'payment-receipt' | 'delivery-receipt' | 'case-label'

interface PdfDownloadButtonProps {
  type: PdfType
  id: string
  label?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'icon'
  className?: string
}

export function PdfDownloadButton({
  type,
  id,
  label,
  variant = 'outline',
  size = 'sm',
  className,
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const { data: tenant } = trpc.tenant.getCurrent.useQuery()

  const soQuery = trpc.financial.so.getById.useQuery(
    { id },
    { enabled: type === 'so' },
  )

  const invoiceQuery = trpc.financial.invoice.getById.useQuery(
    { id },
    { enabled: type === 'invoice' || type === 'payment-receipt' },
  )

  const handleDownload = useCallback(async () => {
    if (!tenant) {
      toast.error('Dados do laboratorio nao carregados.')
      return
    }

    setLoading(true)

    try {
      const settings = (tenant.settings ?? {}) as Record<string, unknown>
      const lab: LabInfo = {
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        address: (settings.address as string) ?? null,
        phone: (settings.phone as string) ?? null,
        email: (settings.email as string) ?? null,
        cpfCnpj: (settings.cpfCnpj as string) ?? null,
      }

      switch (type) {
        case 'so': {
          const so = soQuery.data
          if (!so) {
            toast.error('Dados da OS nao encontrados.')
            return
          }
          const qr = await generateSOQR(so.id)
          const soData: SOPdfData = {
            orderNumber: so.orderNumber,
            status: so.status,
            createdAt: so.createdAt,
            issuedAt: so.issuedAt,
            subtotal: Number(so.subtotal),
            discount: Number(so.discount),
            total: Number(so.total),
            notes: so.notes,
            case: so.case!,
            client: so.client!,
            items: so.items.map((i) => ({
              description: i.description,
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
              total: Number(i.total),
            })),
          }
          await downloadPdf(
            ServiceOrderPdf({ lab, so: soData, qrDataUrl: qr }),
            `OS-${so.orderNumber}.pdf`,
          )
          break
        }

        case 'invoice': {
          const inv = invoiceQuery.data
          if (!inv) {
            toast.error('Dados da cobranca nao encontrados.')
            return
          }
          const qr = await generateInvoiceQR(inv.id)
          const invData: InvoicePdfData = {
            invoiceNumber: inv.invoiceNumber,
            status: inv.status,
            total: Number(inv.total),
            paidAmount: Number(inv.paidAmount),
            dueDate: inv.dueDate,
            issuedAt: inv.issuedAt,
            notes: inv.notes,
            client: inv.client!,
            serviceOrders: inv.serviceOrders.map((so) => ({
              orderNumber: so.orderNumber,
              case: so.case!,
              items: so.items.map((i) => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: Number(i.unitPrice),
                total: Number(i.total),
              })),
              total: Number(so.total),
            })),
            payments: inv.payments.map((p) => ({
              amount: Number(p.amount),
              method: p.method,
              paidAt: p.paidAt,
            })),
          }
          await downloadPdf(
            InvoicePdf({ lab, invoice: invData, qrDataUrl: qr }),
            `Cobranca-${inv.invoiceNumber}.pdf`,
          )
          break
        }

        case 'payment-receipt': {
          const inv = invoiceQuery.data
          if (!inv || inv.payments.length === 0) {
            toast.error('Nenhum pagamento encontrado.')
            return
          }
          const latestPayment = inv.payments[0]!
          const receiptData: PaymentReceiptData = {
            invoiceNumber: inv.invoiceNumber,
            paymentDate: latestPayment.paidAt,
            amount: Number(latestPayment.amount),
            method: latestPayment.method,
            notes: latestPayment.notes,
            client: { name: inv.client!.name },
            invoiceTotal: Number(inv.total),
            invoicePaidAmount: Number(inv.paidAmount),
          }
          await downloadPdf(
            PaymentReceiptPdf({ lab, payment: receiptData }),
            `Recibo-Cobranca-${inv.invoiceNumber}.pdf`,
          )
          break
        }

        default:
          toast.error('Tipo de PDF nao suportado neste botao.')
      }

      toast.success('PDF gerado com sucesso!')
    } catch (error) {
      toast.error(
        `Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      )
    } finally {
      setLoading(false)
    }
  }, [tenant, type, soQuery.data, invoiceQuery.data])

  const buttonLabel = label ?? 'Baixar PDF'

  if (size === 'icon') {
    return (
      <Button
        variant={variant}
        size="icon"
        className={className}
        onClick={handleDownload}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {buttonLabel}
    </Button>
  )
}

/**
 * Standalone function to download a Case Label PDF
 * Used from the case detail page where we already have the data
 */
export async function downloadCaseLabelPdf(
  labName: string,
  caseData: CaseLabelData,
  caseId: string,
): Promise<void> {
  const qr = await generateCaseQR(caseId)
  await downloadPdf(
    CaseLabelPdf({ lab: { name: labName }, caseData, qrDataUrl: qr }),
    `Etiqueta-Caso-${caseData.caseNumber}.pdf`,
  )
}

/**
 * Standalone function to download a Delivery Receipt PDF
 * Used from the delivery detail page
 */
export async function downloadDeliveryReceiptPdf(
  lab: LabInfo,
  delivery: DeliveryReceiptData,
): Promise<void> {
  await downloadPdf(
    DeliveryReceiptPdf({ lab, delivery }),
    `Comprovante-Entrega-${typeof delivery.routeDate === 'string' ? delivery.routeDate : delivery.routeDate.toISOString().split('T')[0]}.pdf`,
  )
}
