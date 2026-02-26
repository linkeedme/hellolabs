/**
 * Hello Labs — Payment Receipt PDF
 * Generates a printable receipt for a recorded payment
 */
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { LabHeader, PdfFooter, type LabInfo } from './lab-header'
import { baseStyles, COLORS, pdfFormatMoney, pdfFormatDate } from './pdf-styles'

export interface PaymentReceiptData {
  invoiceNumber: number
  paymentDate: Date | string
  amount: number | string
  method: string
  notes?: string | null
  client: {
    name: string
    cpfCnpj?: string | null
  }
  invoiceTotal: number | string
  invoicePaidAmount: number | string
}

interface PaymentReceiptPdfProps {
  lab: LabInfo
  payment: PaymentReceiptData
}

export function PaymentReceiptPdf({ lab, payment }: PaymentReceiptPdfProps) {
  const remaining = Number(payment.invoiceTotal) - Number(payment.invoicePaidAmount)

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <LabHeader
          lab={lab}
          documentTitle="Recibo de Pagamento"
          documentDate={payment.paymentDate}
        />

        {/* Payment details */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Dados do Pagamento</Text>
          <View style={baseStyles.row}>
            <Text style={baseStyles.label}>Referencia:</Text>
            <Text style={baseStyles.value}>Cobranca #{payment.invoiceNumber}</Text>
          </View>
          <View style={baseStyles.row}>
            <Text style={baseStyles.label}>Data:</Text>
            <Text style={baseStyles.value}>{pdfFormatDate(payment.paymentDate)}</Text>
          </View>
          <View style={baseStyles.row}>
            <Text style={baseStyles.label}>Metodo:</Text>
            <Text style={baseStyles.value}>{payment.method}</Text>
          </View>
          <View style={baseStyles.row}>
            <Text style={baseStyles.label}>Valor Pago:</Text>
            <Text style={{ ...baseStyles.value, fontSize: 14, color: COLORS.primary }}>
              {pdfFormatMoney(Number(payment.amount))}
            </Text>
          </View>
        </View>

        {/* Client */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Pagador</Text>
          <View style={baseStyles.row}>
            <Text style={baseStyles.label}>Nome:</Text>
            <Text style={baseStyles.value}>{payment.client.name}</Text>
          </View>
          {payment.client.cpfCnpj && (
            <View style={baseStyles.row}>
              <Text style={baseStyles.label}>CPF/CNPJ:</Text>
              <Text style={baseStyles.value}>{payment.client.cpfCnpj}</Text>
            </View>
          )}
        </View>

        {/* Invoice summary */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Resumo da Cobranca</Text>
          <View style={baseStyles.row}>
            <Text style={baseStyles.label}>Total:</Text>
            <Text style={baseStyles.value}>{pdfFormatMoney(Number(payment.invoiceTotal))}</Text>
          </View>
          <View style={baseStyles.row}>
            <Text style={baseStyles.label}>Total Pago:</Text>
            <Text style={{ ...baseStyles.value, color: COLORS.success }}>
              {pdfFormatMoney(Number(payment.invoicePaidAmount))}
            </Text>
          </View>
          {remaining > 0 && (
            <View style={baseStyles.row}>
              <Text style={baseStyles.label}>Saldo Restante:</Text>
              <Text style={{ ...baseStyles.value, color: COLORS.danger }}>
                {pdfFormatMoney(remaining)}
              </Text>
            </View>
          )}
          {remaining <= 0 && (
            <View style={{ ...baseStyles.notesBox, backgroundColor: '#ecfdf5', marginTop: 8 }}>
              <Text style={{ ...baseStyles.notesText, color: COLORS.success, fontFamily: 'Helvetica-Bold' }}>
                COBRANCA QUITADA
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {payment.notes && (
          <View style={baseStyles.section}>
            <Text style={baseStyles.sectionTitle}>Observacoes</Text>
            <View style={baseStyles.notesBox}>
              <Text style={baseStyles.notesText}>{payment.notes}</Text>
            </View>
          </View>
        )}

        <PdfFooter labName={lab.name} />
      </Page>
    </Document>
  )
}
