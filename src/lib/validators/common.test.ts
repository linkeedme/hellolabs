import { describe, it, expect } from 'vitest'
import {
  paginationSchema,
  uuidSchema,
  cpfSchema,
  cnpjSchema,
  documentSchema,
  phoneSchema,
  emailSchema,
  cepSchema,
  moneySchema,
  slugSchema,
  dateRangeSchema,
} from './common'

describe('paginationSchema', () => {
  it('aceita valores validos', () => {
    const result = paginationSchema.parse({ page: 2, perPage: 50 })
    expect(result.page).toBe(2)
    expect(result.perPage).toBe(50)
  })

  it('aplica defaults', () => {
    const result = paginationSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('rejeita page 0', () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow()
  })

  it('rejeita perPage > 100', () => {
    expect(() => paginationSchema.parse({ perPage: 101 })).toThrow()
  })
})

describe('uuidSchema', () => {
  it('aceita UUID v4 valido', () => {
    expect(() => uuidSchema.parse('550e8400-e29b-41d4-a716-446655440000')).not.toThrow()
  })

  it('rejeita string invalida', () => {
    expect(() => uuidSchema.parse('not-a-uuid')).toThrow()
  })
})

describe('cpfSchema', () => {
  it('aceita CPF com 11 digitos', () => {
    const result = cpfSchema.parse('123.456.789-00')
    expect(result).toBe('12345678900')
  })

  it('rejeita CPF com digitos errados', () => {
    expect(() => cpfSchema.parse('1234')).toThrow()
  })
})

describe('cnpjSchema', () => {
  it('aceita CNPJ com 14 digitos', () => {
    const result = cnpjSchema.parse('12.345.678/0001-00')
    expect(result).toBe('12345678000100')
  })

  it('rejeita CNPJ curto', () => {
    expect(() => cnpjSchema.parse('12345')).toThrow()
  })
})

describe('documentSchema', () => {
  it('aceita CPF', () => {
    const result = documentSchema.parse('12345678900')
    expect(result).toBe('12345678900')
  })

  it('aceita CNPJ', () => {
    const result = documentSchema.parse('12345678000100')
    expect(result).toBe('12345678000100')
  })

  it('rejeita documento com tamanho errado', () => {
    expect(() => documentSchema.parse('123456')).toThrow()
  })
})

describe('phoneSchema', () => {
  it('aceita celular (11 digitos)', () => {
    const result = phoneSchema.parse('(11) 99999-8888')
    expect(result).toBe('11999998888')
  })

  it('aceita fixo (10 digitos)', () => {
    const result = phoneSchema.parse('(11) 3333-4444')
    expect(result).toBe('1133334444')
  })

  it('rejeita telefone curto', () => {
    expect(() => phoneSchema.parse('123')).toThrow()
  })
})

describe('emailSchema', () => {
  it('aceita email valido', () => {
    expect(() => emailSchema.parse('user@example.com')).not.toThrow()
  })

  it('rejeita email invalido', () => {
    expect(() => emailSchema.parse('not-an-email')).toThrow()
  })
})

describe('cepSchema', () => {
  it('aceita CEP com 8 digitos', () => {
    const result = cepSchema.parse('01001-000')
    expect(result).toBe('01001000')
  })

  it('rejeita CEP curto', () => {
    expect(() => cepSchema.parse('0100')).toThrow()
  })
})

describe('moneySchema', () => {
  it('aceita inteiro positivo', () => {
    expect(() => moneySchema.parse(15000)).not.toThrow()
  })

  it('aceita zero', () => {
    expect(() => moneySchema.parse(0)).not.toThrow()
  })

  it('rejeita negativo', () => {
    expect(() => moneySchema.parse(-1)).toThrow()
  })

  it('rejeita decimal', () => {
    expect(() => moneySchema.parse(10.5)).toThrow()
  })
})

describe('slugSchema', () => {
  it('aceita slug valido', () => {
    expect(() => slugSchema.parse('meu-lab-123')).not.toThrow()
  })

  it('rejeita maiusculas', () => {
    expect(() => slugSchema.parse('Meu-Lab')).toThrow()
  })

  it('rejeita slug curto', () => {
    expect(() => slugSchema.parse('ab')).toThrow()
  })

  it('rejeita caracteres especiais', () => {
    expect(() => slugSchema.parse('lab_test!')).toThrow()
  })
})

describe('dateRangeSchema', () => {
  it('aceita range de datas', () => {
    const result = dateRangeSchema.parse({
      from: '2026-01-01',
      to: '2026-02-01',
    })
    expect(result.from).toBeInstanceOf(Date)
    expect(result.to).toBeInstanceOf(Date)
  })

  it('aceita campos opcionais', () => {
    const result = dateRangeSchema.parse({})
    expect(result.from).toBeUndefined()
    expect(result.to).toBeUndefined()
  })
})
