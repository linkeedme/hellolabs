/**
 * Hello Labs — Invoice PDF
 * Generates a printable/downloadable PDF for a Cobranca (Invoice)
 */
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { LabHeader, PdfFooter, type LabInfo } from './lab-header'
import { baseStyles, COLORS, pdfFormatMoney, pdfFormatDate } from './pdf-styles'

export interface InvoiceSOItem {
  description: string
  quantity: number
  unitPrice: number | string
  total: number | string
}

export interface InvoiceSO {
  orderNumber: number
  case: { caseNumber: number; patientName: string }
  items: InvoiceSOItem[]
  total: number | string
}

export interface InvoicePayment {
  amount: number | string
  method: string
  paidAt: Date | string
}

export interface InvoicePdfData {
  invoiceNumber: number
  status: string
  total: number | string
  paidAmount: number | string
  dueDate: Date | string
  issuedAt?: Date | string | null
  notes?: string | null
  client: {
    name: string
    email?: string | null
    phone?: string | null
    cpfCnpj?: string | null
    address?: string | null
  }
  serviceOrders: InvoiceSO[]
  payments: InvoicePayment[]
}

interface InvoicePdfProps {
  lab: LabInfo
  invoice: InvoicePdfData
  qrDataUrl?: string
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviada',
  VIEWED: 'Visualizada',
  PAID: 'Paga',
  PARTIALLY_PAID: 'Parcialmente Paga',
  OVERDUE: 'Vencida',
  CANCELLED: 'Cancelada',
}

export function InvoicePdf({ lab, invoice, qrDataUrl }: InvoicePdfProps) {
  const remaining = Number(invoice.total) - Number(invoice.paidAmount)

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <LabHeader
          lab={lab}
          documentTitle="Cobranca"
          documentNumber={invoice.invoiceNumber}
          documentDate={invoice.issuedAt ?? invoice.dueDate}
          qrDataUrl={qrDataUrl}
        />

        {/* Status + Due date */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>
            Status: {STATUS_LABELS[invoice.status] ?? invoice.status}
          </Text>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.text }}>
            Vencimento: {pdfFormatDate(invoice.dueDate)}
          </Text>
        </View>

        {/* Client info */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Cliente</Text>
          <View style={baseStyles.row}>
            <Text style={baseStyles.label}>Nome:</Text>
            <Text style={baseStyles.value}>{invoice.client.name}</Text>
          </View>
          {invoice.client.cpfCnpj && (
            <View style={baseStyles.row}>
              <Text style={baseStyles.label}>CPF/CNPJ:</Text>
              <Text style={baseStyles.value}>{invoice.client.cpfCnpj}</Text>
            </View>
          )}
          {invoice.client.email && (
            <View style={baseStyles.row}>
              <Text style={baseStyles.label}>Email:</Text>
              <Text style={baseStyles.value}>{invoice.client.email}</Text>
            </View>
          )}
          {invoice.client.phone && (
            <View style={baseStyles.row}>
              <Text style={baseStyles.label}>Telefone:</Text>
              <Text style={baseStyles.value}>{invoice.client.phone}</Text>
            </View>
          )}
          {invoice.client.address && (
            <View style={baseStyles.row}>
              <Text style={baseStyles.label}>Endereco:</Text>
              <Text style={baseStyles.value}>{invoice.client.address}</Text>
            </View>
          )}
        </View>

        {/* Service Orders */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Ordens de Servico</Text>
          {invoice.serviceOrders.map((so, soIndex) => (
            <View key={soIndex} style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.primary, marginBottom: 4 }}>
                OS #{so.orderNumber} — Caso #{so.case.caseNumber} ({so.case.patientName})
              </Text>
              <View style={baseStyles.table}>
                <View style={baseStyles.tableHeader}>
                  <Text style={{ ...baseStyles.tableCellHeader, flex: 3 }}>Descricao</Text>
                  <Text style={{ ...baseStyles.tableCellHeader, width: 40, textAlign: 'center' }}>Qtd</Text>
                  <Text style={{ ...baseStyles.tableCellHeader, width: 80, textAlign: 'right' }}>Preco Unit.</Text>
                  <Text style={{ ...baseStyles.tableCellHeader, width: 80, textAlign: 'right' }}>Total</Text>
                </View>
                {so.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={baseStyles.tableRow}>
                    <Text style={{ ...baseStyles.tableCell, flex: 3 }}>{item.description}</Text>
                    <Text style={{ ...baseStyles.tableCell, width: 40, textAlign: 'center' }}>{item.quantity}</Text>
                    <Text style={{ ...baseStyles.tableCell, width: 80, textAlign: 'right' }}>
                      {pdfFormatMoney(Number(item.unitPrice))}
                    </Text>
                    <Text style={{ ...baseStyles.tableCell, width: 80, textAlign: 'right' }}>
                      {pdfFormatMoney(Number(item.total))}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 9, color: COLORS.textSecondary }}>
                  Subtotal OS: {pdfFormatMoney(Number(so.total))}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={baseStyles.totalsContainer}>
          <View style={baseStyles.totalRow}>
            <Text style={baseStyles.totalLabel}>Total da Cobranca</Text>
            <Text style={baseStyles.totalValue}>{pdfFormatMoney(Number(invoice.total))}</Text>
          </View>
          {Number(invoice.paidAmount) > 0 && (
            <View style={baseStyles.totalRow}>
              <Text style={baseStyles.totalLabel}>Valor Pago</Text>
              <Text style={{ ...baseStyles.totalValue, color: COLORS.success }}>
                {pdfFormatMoney(Number(invoice.paidAmount))}
              </Text>
            </View>
          )}
          {remaining > 0 && invoice.status !== 'PAID' && (
            <View style={baseStyles.grandTotalRow}>
              <Text style={baseStyles.grandTotalLabel}>Saldo Devedor</Text>
              <Text style={{ ...baseStyles.grandTotalValue, color: COLORS.danger }}>
                {pdfFormatMoney(remaining)}
              </Text>
            </View>
          )}
        </View>

        {/* Payments history */}
        {invoice.payments.length > 0 && (
          <View style={{ ...baseStyles.section, marginTop: 16 }}>
            <Text style={baseStyles.sectionTitle}>Pagamentos Registrados</Text>
            <View style={baseStyles.table}>
              <View style={baseStyles.tableHeader}>
                <Text style={{ ...baseStyles.tableCellHeader, flex: 1 }}>Data</Text>
                <Text style={{ ...baseStyles.tableCellHeader, flex: 1 }}>Metodo</Text>
                <Text style={{ ...baseStyles.tableCellHeader, width: 100, textAlign: 'right' }}>Valor</Text>
              </View>
              {invoice.payments.map((payment, pIndex) => (
                <View key={pIndex} style={baseStyles.tableRow}>
                  <Text style={{ ...baseStyles.tableCell, flex: 1 }}>{pdfFormatDate(payment.paidAt)}</Text>
                  <Text style={{ ...baseStyles.tableCell, flex: 1 }}>{payment.method}</Text>
                  <Text style={{ ...baseStyles.tableCell, width: 100, textAlign: 'right' }}>
                    {pdfFormatMoney(Number(payment.amount))}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={baseStyles.section}>
            <Text style={baseStyles.sectionTitle}>Observacoes</Text>
            <View style={baseStyles.notesBox}>
              <Text style={baseStyles.notesText}>{invoice.notes}</Text>
            </View>
          </View>
        )}

        <PdfFooter labName={lab.name} />
      </Page>
    </Document>
  )
}
