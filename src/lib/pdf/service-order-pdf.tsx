/**
 * Hello Labs — Service Order PDF
 * Generates a printable/downloadable PDF for an Ordem de Servico
 */
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { LabHeader, PdfFooter, type LabInfo } from './lab-header'
import { baseStyles, pdfFormatMoney, pdfFormatDate } from './pdf-styles'

export interface SOPdfItem {
  description: string
  quantity: number
  unitPrice: number | string
  total: number | string
}

export interface SOPdfData {
  orderNumber: number
  status: string
  createdAt: Date | string
  issuedAt?: Date | string | null
  subtotal: number | string
  discount: number | string
  total: number | string
  notes?: string | null
  case: {
    caseNumber: number
    patientName: string
    prosthesisType: string
  }
  client: {
    name: string
    email?: string | null
    phone?: string | null
  }
  items: SOPdfItem[]
}

interface ServiceOrderPdfProps {
  lab: LabInfo
  so: SOPdfData
  qrDataUrl?: string
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  ISSUED: 'Emitida',
  PAID: 'Paga',
  CANCELLED: 'Cancelada',
}

export function ServiceOrderPdf({ lab, so, qrDataUrl }: ServiceOrderPdfProps) {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <LabHeader
          lab={lab}
          documentTitle="Ordem de Servico"
          documentNumber={so.orderNumber}
          documentDate={so.issuedAt ?? so.createdAt}
          qrDataUrl={qrDataUrl}
        />

        {/* Status */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 10, color: '#8181a5' }}>
            Status: {STATUS_LABELS[so.status] ?? so.status}
          </Text>
        </View>

        {/* Two columns: Case + Client */}
        <View style={baseStyles.twoCol}>
          {/* Case info */}
          <View style={baseStyles.col}>
            <Text style={baseStyles.sectionTitle}>Caso</Text>
            <View style={baseStyles.row}>
              <Text style={baseStyles.label}>Numero:</Text>
              <Text style={baseStyles.value}>#{so.case.caseNumber}</Text>
            </View>
            <View style={baseStyles.row}>
              <Text style={baseStyles.label}>Paciente:</Text>
              <Text style={baseStyles.value}>{so.case.patientName}</Text>
            </View>
            <View style={baseStyles.row}>
              <Text style={baseStyles.label}>Tipo:</Text>
              <Text style={baseStyles.value}>{so.case.prosthesisType}</Text>
            </View>
          </View>

          {/* Client info */}
          <View style={baseStyles.col}>
            <Text style={baseStyles.sectionTitle}>Cliente</Text>
            <View style={baseStyles.row}>
              <Text style={baseStyles.label}>Nome:</Text>
              <Text style={baseStyles.value}>{so.client.name}</Text>
            </View>
            {so.client.email && (
              <View style={baseStyles.row}>
                <Text style={baseStyles.label}>Email:</Text>
                <Text style={baseStyles.value}>{so.client.email}</Text>
              </View>
            )}
            {so.client.phone && (
              <View style={baseStyles.row}>
                <Text style={baseStyles.label}>Telefone:</Text>
                <Text style={baseStyles.value}>{so.client.phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items table */}
        <View style={{ ...baseStyles.section, marginTop: 16 }}>
          <Text style={baseStyles.sectionTitle}>Itens</Text>
          <View style={baseStyles.table}>
            {/* Table header */}
            <View style={baseStyles.tableHeader}>
              <Text style={{ ...baseStyles.tableCellHeader, flex: 3 }}>Descricao</Text>
              <Text style={{ ...baseStyles.tableCellHeader, width: 40, textAlign: 'center' }}>Qtd</Text>
              <Text style={{ ...baseStyles.tableCellHeader, width: 80, textAlign: 'right' }}>Preco Unit.</Text>
              <Text style={{ ...baseStyles.tableCellHeader, width: 80, textAlign: 'right' }}>Total</Text>
            </View>

            {/* Table rows */}
            {so.items.map((item, index) => (
              <View key={index} style={baseStyles.tableRow}>
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

          {/* Totals */}
          <View style={baseStyles.totalsContainer}>
            <View style={baseStyles.totalRow}>
              <Text style={baseStyles.totalLabel}>Subtotal</Text>
              <Text style={baseStyles.totalValue}>{pdfFormatMoney(Number(so.subtotal))}</Text>
            </View>
            {Number(so.discount) > 0 && (
              <View style={baseStyles.totalRow}>
                <Text style={baseStyles.totalLabel}>Desconto</Text>
                <Text style={{ ...baseStyles.totalValue, color: '#ef4444' }}>
                  - {pdfFormatMoney(Number(so.discount))}
                </Text>
              </View>
            )}
            <View style={baseStyles.grandTotalRow}>
              <Text style={baseStyles.grandTotalLabel}>Total</Text>
              <Text style={baseStyles.grandTotalValue}>{pdfFormatMoney(Number(so.total))}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {so.notes && (
          <View style={baseStyles.section}>
            <Text style={baseStyles.sectionTitle}>Observacoes</Text>
            <View style={baseStyles.notesBox}>
              <Text style={baseStyles.notesText}>{so.notes}</Text>
            </View>
          </View>
        )}

        <PdfFooter labName={lab.name} />
      </Page>
    </Document>
  )
}
