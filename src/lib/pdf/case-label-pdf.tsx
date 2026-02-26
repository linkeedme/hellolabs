/**
 * Hello Labs — Case Label PDF
 * Generates a printable label for physical cases with QR code
 * Designed for adhesive label paper (typically 100x70mm)
 */
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { COLORS } from './pdf-styles'

const labelStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 12,
    width: '100mm',
    height: '70mm',
  },
  container: {
    flexDirection: 'row',
    height: '100%',
  },
  left: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  right: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 6,
  },
  caseNumber: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  patientName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 8,
    color: COLORS.text,
    marginBottom: 1,
  },
  infoLabel: {
    fontSize: 7,
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  qr: {
    width: 70,
    height: 70,
  },
  priorityBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginLeft: 4,
  },
  shadeBox: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    marginTop: 4,
  },
})

export interface CaseLabelData {
  caseNumber: number
  patientName: string
  clientName: string
  prosthesisType: string
  shade?: string | null
  teeth?: string[]
  slaDate?: Date | string | null
  priority: string
  modality: string
}

interface CaseLabelPdfProps {
  lab: { name: string }
  caseData: CaseLabelData
  qrDataUrl: string
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  URGENT: { bg: '#fef3c7', text: '#d97706' },
  CRITICAL: { bg: '#fee2e2', text: '#dc2626' },
}

function formatLabelDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

export function CaseLabelPdf({ lab, caseData, qrDataUrl }: CaseLabelPdfProps) {
  const priorityColor = PRIORITY_COLORS[caseData.priority]

  return (
    <Document>
      <Page size={[283, 198]} style={labelStyles.page}>
        <View style={labelStyles.container}>
          {/* Left side: info */}
          <View style={labelStyles.left}>
            <View>
              <Text style={labelStyles.labName}>{lab.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={labelStyles.caseNumber}>#{caseData.caseNumber}</Text>
                {priorityColor && (
                  <View style={{ ...labelStyles.priorityBadge, backgroundColor: priorityColor.bg }}>
                    <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold', color: priorityColor.text }}>
                      {caseData.priority}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={labelStyles.patientName}>{caseData.patientName}</Text>
              <Text style={labelStyles.infoText}>{caseData.clientName}</Text>
            </View>

            <View>
              <Text style={labelStyles.infoText}>{caseData.prosthesisType}</Text>
              <Text style={labelStyles.infoLabel}>{caseData.modality}</Text>
              {caseData.teeth && caseData.teeth.length > 0 && (
                <Text style={labelStyles.infoText}>Dentes: {caseData.teeth.join(', ')}</Text>
              )}
              {caseData.shade && (
                <View style={labelStyles.shadeBox}>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.text }}>
                    Cor: {caseData.shade}
                  </Text>
                </View>
              )}
            </View>

            <View>
              {caseData.slaDate && (
                <View style={labelStyles.row}>
                  <Text style={labelStyles.infoLabel}>Entrega:</Text>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.text }}>
                    {formatLabelDate(caseData.slaDate)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Right side: QR code */}
          <View style={labelStyles.right}>
            <Image src={qrDataUrl} style={labelStyles.qr} />
            <Text style={{ fontSize: 6, color: COLORS.textSecondary, marginTop: 2 }}>
              #{caseData.caseNumber}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
