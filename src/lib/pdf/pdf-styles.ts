/**
 * Hello Labs — PDF Shared Styles
 * Colors, fonts, and reusable style objects for @react-pdf/renderer
 */
import { StyleSheet } from '@react-pdf/renderer'

// Brand colors
export const COLORS = {
  primary: '#5e81f4',
  primaryDark: '#4060d0',
  text: '#1c1d21',
  textSecondary: '#8181a5',
  border: '#e8e8ee',
  background: '#f8f8fb',
  white: '#ffffff',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#ef4444',
}

// Shared styles
export const baseStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.text,
    padding: 40,
    paddingBottom: 60,
  },
  pageSmall: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLORS.text,
    padding: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  labName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  labInfo: {
    fontSize: 8,
    color: COLORS.textSecondary,
    lineHeight: 1.4,
  },

  // Title
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },

  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // Info rows
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontSize: 9,
    color: COLORS.textSecondary,
    width: 100,
  },
  value: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    flex: 1,
  },

  // Table
  table: {
    marginTop: 8,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.text,
  },
  tableCellHeader: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },

  // Totals
  totalsContainer: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    width: 200,
  },
  totalLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    flex: 1,
    textAlign: 'right',
    paddingRight: 12,
  },
  totalValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    width: 80,
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
    width: 200,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
    paddingRight: 12,
  },
  grandTotalValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    width: 80,
    textAlign: 'right',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.textSecondary,
  },

  // Notes
  notesBox: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  notesText: {
    fontSize: 9,
    color: COLORS.text,
    lineHeight: 1.5,
  },

  // Two-column layout
  twoCol: {
    flexDirection: 'row',
    gap: 20,
  },
  col: {
    flex: 1,
  },

  // QR code
  qrCode: {
    width: 80,
    height: 80,
  },
  qrCodeSmall: {
    width: 50,
    height: 50,
  },
})

// Format money for PDF (avoids importing format.ts which may use browser APIs)
export function pdfFormatMoney(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return `R$ ${num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

// Format date for PDF
export function pdfFormatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// Format document (CPF/CNPJ) for PDF
export function pdfFormatDocument(doc: string): string {
  const digits = doc.replace(/\D/g, '')
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}
