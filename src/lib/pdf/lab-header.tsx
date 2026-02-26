/**
 * Hello Labs — PDF Lab Header Component
 * Reusable header with lab name, info, and document title
 */
import { View, Text, Image } from '@react-pdf/renderer'
import { baseStyles, COLORS, pdfFormatDate } from './pdf-styles'

export interface LabInfo {
  name: string
  logoUrl?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  cpfCnpj?: string | null
}

interface LabHeaderProps {
  lab: LabInfo
  documentTitle: string
  documentNumber?: string | number
  documentDate?: Date | string
  qrDataUrl?: string
}

export function LabHeader({
  lab,
  documentTitle,
  documentNumber,
  documentDate,
  qrDataUrl,
}: LabHeaderProps) {
  return (
    <View style={baseStyles.header}>
      <View style={baseStyles.headerLeft}>
        {lab.logoUrl ? (
          <Image src={lab.logoUrl} style={{ width: 120, height: 40, marginBottom: 4 }} />
        ) : (
          <Text style={baseStyles.labName}>{lab.name}</Text>
        )}
        <Text style={baseStyles.labInfo}>
          {[lab.address, lab.phone, lab.email, lab.cpfCnpj].filter(Boolean).join(' | ')}
        </Text>
      </View>

      <View style={baseStyles.headerRight}>
        <Text style={baseStyles.title}>{documentTitle}</Text>
        {documentNumber !== undefined && (
          <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.primary, marginBottom: 2 }}>
            #{documentNumber}
          </Text>
        )}
        {documentDate && (
          <Text style={{ fontSize: 9, color: COLORS.textSecondary }}>
            {pdfFormatDate(documentDate)}
          </Text>
        )}
        {qrDataUrl && (
          <Image src={qrDataUrl} style={baseStyles.qrCodeSmall} />
        )}
      </View>
    </View>
  )
}

interface PdfFooterProps {
  labName: string
}

export function PdfFooter({ labName }: PdfFooterProps) {
  return (
    <View style={baseStyles.footer}>
      <Text style={baseStyles.footerText}>
        {labName} — Gerado em {pdfFormatDate(new Date())}
      </Text>
      <Text style={baseStyles.footerText}>
        Powered by Hello Doctor LAB
      </Text>
    </View>
  )
}
