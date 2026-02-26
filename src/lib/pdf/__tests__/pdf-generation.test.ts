import { describe, it, expect } from 'vitest'
import {
  pdfFormatMoney,
  pdfFormatDate,
  pdfFormatDocument,
  COLORS,
} from '../pdf-styles'
import { generateQRDataURL } from '../generate-qr'

// ═══════════════════════════════════════════════
// PDF FORMAT HELPERS
// ═══════════════════════════════════════════════

describe('pdfFormatMoney', () => {
  it('formata valor inteiro', () => {
    expect(pdfFormatMoney(100)).toBe('R$ 100,00')
  })

  it('formata valor com centavos', () => {
    expect(pdfFormatMoney(1234.56)).toBe('R$ 1.234,56')
  })

  it('formata valor zero', () => {
    expect(pdfFormatMoney(0)).toBe('R$ 0,00')
  })

  it('formata string numerica', () => {
    expect(pdfFormatMoney('999.99')).toBe('R$ 999,99')
  })

  it('formata valor grande com separador de milhar', () => {
    expect(pdfFormatMoney(1000000)).toBe('R$ 1.000.000,00')
  })

  it('formata valor negativo', () => {
    expect(pdfFormatMoney(-50.5)).toBe('R$ -50,50')
  })
})

describe('pdfFormatDate', () => {
  it('formata Date object', () => {
    const date = new Date(2026, 1, 25) // Feb 25, 2026
    expect(pdfFormatDate(date)).toBe('25/02/2026')
  })

  it('formata string ISO', () => {
    const result = pdfFormatDate('2026-03-15T00:00:00.000Z')
    // Note: timezone-dependent, just check format
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('dia e mes com zero a esquerda', () => {
    const date = new Date(2026, 0, 5) // Jan 5, 2026
    expect(pdfFormatDate(date)).toBe('05/01/2026')
  })
})

describe('pdfFormatDocument', () => {
  it('formata CPF', () => {
    expect(pdfFormatDocument('12345678901')).toBe('123.456.789-01')
  })

  it('formata CNPJ', () => {
    expect(pdfFormatDocument('12345678000100')).toBe('12.345.678/0001-00')
  })

  it('remove caracteres nao numericos', () => {
    expect(pdfFormatDocument('123.456.789-01')).toBe('123.456.789-01')
  })
})

describe('COLORS', () => {
  it('define cores essenciais', () => {
    expect(COLORS.primary).toBe('#5e81f4')
    expect(COLORS.text).toBe('#1c1d21')
    expect(COLORS.textSecondary).toBe('#8181a5')
    expect(COLORS.success).toBe('#34d399')
    expect(COLORS.danger).toBe('#ef4444')
  })
})

// ═══════════════════════════════════════════════
// QR CODE GENERATION
// ═══════════════════════════════════════════════

describe('generateQRDataURL', () => {
  it('gera QR code como data URL PNG', async () => {
    const result = await generateQRDataURL('https://example.com')
    expect(result).toMatch(/^data:image\/png;base64,/)
  })

  it('gera QR code com opcoes customizadas', async () => {
    const result = await generateQRDataURL('test-content', {
      width: 100,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
    expect(result).toMatch(/^data:image\/png;base64,/)
  })

  it('gera QR code para texto curto', async () => {
    const result = await generateQRDataURL('123')
    expect(result).toMatch(/^data:image\/png;base64,/)
    expect(result.length).toBeGreaterThan(100)
  })

  it('gera QR code para texto longo', async () => {
    const longText = 'https://lab.hellodoctor.com/cases/550e8400-e29b-41d4-a716-446655440000'
    const result = await generateQRDataURL(longText)
    expect(result).toMatch(/^data:image\/png;base64,/)
  })
})
