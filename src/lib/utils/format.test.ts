import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatCurrencyShort,
  formatPhone,
  formatCPF,
  formatCNPJ,
  formatDocument,
  formatCRO,
  formatPercent,
  formatDate,
  formatDateTime,
} from './format'

describe('formatCurrency', () => {
  it('formata centavos para BRL', () => {
    expect(formatCurrency(15000)).toBe('R$\u00a0150,00')
  })

  it('formata zero', () => {
    expect(formatCurrency(0)).toBe('R$\u00a00,00')
  })

  it('formata centavos fracionados', () => {
    expect(formatCurrency(1999)).toBe('R$\u00a019,99')
  })
})

describe('formatCurrencyShort', () => {
  it('formata sem centavos', () => {
    const result = formatCurrencyShort(15000)
    expect(result).toContain('150')
    expect(result).toContain('R$')
  })
})

describe('formatPhone', () => {
  it('formata celular (11 digitos)', () => {
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888')
  })

  it('formata fixo (10 digitos)', () => {
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
  })

  it('retorna original se formato invalido', () => {
    expect(formatPhone('123')).toBe('123')
  })

  it('remove caracteres nao-numericos antes de formatar', () => {
    expect(formatPhone('(11) 99999-8888')).toBe('(11) 99999-8888')
  })
})

describe('formatCPF', () => {
  it('formata CPF corretamente', () => {
    expect(formatCPF('12345678900')).toBe('123.456.789-00')
  })

  it('remove caracteres nao-numericos', () => {
    expect(formatCPF('123.456.789-00')).toBe('123.456.789-00')
  })
})

describe('formatCNPJ', () => {
  it('formata CNPJ corretamente', () => {
    expect(formatCNPJ('12345678000100')).toBe('12.345.678/0001-00')
  })
})

describe('formatDocument', () => {
  it('detecta CPF (11 digitos)', () => {
    expect(formatDocument('12345678900')).toBe('123.456.789-00')
  })

  it('detecta CNPJ (14 digitos)', () => {
    expect(formatDocument('12345678000100')).toBe('12.345.678/0001-00')
  })
})

describe('formatCRO', () => {
  it('formata CRO com estado', () => {
    expect(formatCRO('12345', 'sp')).toBe('CRO-SP 12345')
  })
})

describe('formatPercent', () => {
  it('formata com 1 decimal por padrao', () => {
    expect(formatPercent(95.5)).toBe('95.5%')
  })

  it('respeita casas decimais customizadas', () => {
    expect(formatPercent(33.333, 2)).toBe('33.33%')
  })
})

describe('formatDate', () => {
  it('formata Date para dd/mm/aaaa', () => {
    const result = formatDate(new Date('2026-02-23T12:00:00Z'))
    expect(result).toMatch(/23\/02\/2026/)
  })

  it('aceita string ISO', () => {
    const result = formatDate('2026-02-23T12:00:00Z')
    expect(result).toMatch(/23\/02\/2026/)
  })
})

describe('formatDateTime', () => {
  it('formata com hora e minuto', () => {
    const result = formatDateTime(new Date('2026-02-23T14:30:00Z'))
    expect(result).toContain('23/02/2026')
  })
})
