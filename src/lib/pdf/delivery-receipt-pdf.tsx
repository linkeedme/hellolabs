/**
 * Hello Labs — Delivery Receipt PDF
 * Generates a printable delivery route manifest / receipt
 */
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { LabHeader, PdfFooter, type LabInfo } from './lab-header'
import { baseStyles, COLORS, pdfFormatDate } from './pdf-styles'

export interface DeliveryStop {
  order: number
  address: string
  notes?: string | null
  status: string
  patientName?: string
  clientName?: string
  caseNumber?: number
}

export interface DeliveryReceiptData {
  routeDate: Date | string
  status: string
  driverName: string
  completedAt?: Date | string | null
  stops: DeliveryStop[]
}

interface DeliveryReceiptPdfProps {
  lab: LabInfo
  delivery: DeliveryReceiptData
}

const ROUTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicada',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluida',
}

const STOP_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  EN_ROUTE: 'A Caminho',
  DELIVERED: 'Entregue',
  FAILED: 'Falhou',
}

export function DeliveryReceiptPdf({ lab, delivery }: DeliveryReceiptPdfProps) {
  const deliveredCount = delivery.stops.filter((s) => s.status === 'DELIVERED').length
  const failedCount = delivery.stops.filter((s) => s.status === 'FAILED').length

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <LabHeader
          lab={lab}
          documentTitle="Comprovante de Entrega"
          documentDate={delivery.routeDate}
        />

        {/* Route info */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Dados da Rota</Text>
          <View style={baseStyles.twoCol}>
            <View style={baseStyles.col}>
              <View style={baseStyles.row}>
                <Text style={baseStyles.label}>Data:</Text>
                <Text style={baseStyles.value}>{pdfFormatDate(delivery.routeDate)}</Text>
              </View>
              <View style={baseStyles.row}>
                <Text style={baseStyles.label}>Motorista:</Text>
                <Text style={baseStyles.value}>{delivery.driverName}</Text>
              </View>
              <View style={baseStyles.row}>
                <Text style={baseStyles.label}>Status:</Text>
                <Text style={baseStyles.value}>
                  {ROUTE_STATUS_LABELS[delivery.status] ?? delivery.status}
                </Text>
              </View>
            </View>
            <View style={baseStyles.col}>
              <View style={baseStyles.row}>
                <Text style={baseStyles.label}>Paradas:</Text>
                <Text style={baseStyles.value}>{delivery.stops.length}</Text>
              </View>
              <View style={baseStyles.row}>
                <Text style={baseStyles.label}>Entregues:</Text>
                <Text style={{ ...baseStyles.value, color: COLORS.success }}>{deliveredCount}</Text>
              </View>
              {failedCount > 0 && (
                <View style={baseStyles.row}>
                  <Text style={baseStyles.label}>Falhas:</Text>
                  <Text style={{ ...baseStyles.value, color: COLORS.danger }}>{failedCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stops table */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Paradas</Text>
          <View style={baseStyles.table}>
            <View style={baseStyles.tableHeader}>
              <Text style={{ ...baseStyles.tableCellHeader, width: 30 }}>#</Text>
              <Text style={{ ...baseStyles.tableCellHeader, flex: 2 }}>Endereco</Text>
              <Text style={{ ...baseStyles.tableCellHeader, flex: 1 }}>Caso</Text>
              <Text style={{ ...baseStyles.tableCellHeader, width: 70, textAlign: 'center' }}>Status</Text>
            </View>
            {delivery.stops.map((stop, index) => (
              <View key={index} style={baseStyles.tableRow}>
                <Text style={{ ...baseStyles.tableCell, width: 30 }}>{stop.order}</Text>
                <Text style={{ ...baseStyles.tableCell, flex: 2 }}>{stop.address}</Text>
                <Text style={{ ...baseStyles.tableCell, flex: 1 }}>
                  {stop.caseNumber ? `#${stop.caseNumber} — ${stop.patientName ?? ''}` : '—'}
                </Text>
                <Text
                  style={{
                    ...baseStyles.tableCell,
                    width: 70,
                    textAlign: 'center',
                    color: stop.status === 'DELIVERED' ? COLORS.success : stop.status === 'FAILED' ? COLORS.danger : COLORS.textSecondary,
                  }}
                >
                  {STOP_STATUS_LABELS[stop.status] ?? stop.status}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Signature area */}
        <View style={{ marginTop: 40 }}>
          <View style={baseStyles.twoCol}>
            <View style={baseStyles.col}>
              <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.text, marginBottom: 4, width: 200 }} />
              <Text style={{ fontSize: 8, color: COLORS.textSecondary }}>Assinatura do Motorista</Text>
            </View>
            <View style={baseStyles.col}>
              <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.text, marginBottom: 4, width: 200 }} />
              <Text style={{ fontSize: 8, color: COLORS.textSecondary }}>Assinatura do Recebedor</Text>
            </View>
          </View>
        </View>

        <PdfFooter labName={lab.name} />
      </Page>
    </Document>
  )
}
