import { describe, it, expect } from 'vitest'
import {
  clientCreateSchema,
  clientUpdateSchema,
  clientListSchema,
} from './client'

const uuid = '550e8400-e29b-41d4-a716-446655440000'

// ═══════════════════════════════════════════════
// CLIENT CREATE
// ═══════════════════════════════════════════════

describe('clientCreateSchema', () => {
  it('aceita dados minimos (somente nome)', () => {
    const result = clientCreateSchema.parse({ name: 'Dr. Carlos' })
    expect(result.name).toBe('Dr. Carlos')
    expect(result.email).toBeUndefined()
  })

  it('aceita todos os campos', () => {
    const result = clientCreateSchema.parse({
      name: 'Dra. Ana Paula',
      email: 'ana@clinica.com',
      phone: '11987654321',
      whatsapp: '11987654321',
      cpfCnpj: '12345678000190',
      cro: 'CRO-SP 12345',
      address: 'Rua das Flores, 100',
      notes: 'Cliente VIP',
      priceTableId: uuid,
      closingDay: 15,
      paymentDays: 30,
    })
    expect(result.name).toBe('Dra. Ana Paula')
    expect(result.priceTableId).toBe(uuid)
    expect(result.closingDay).toBe(15)
  })

  it('rejeita nome vazio', () => {
    expect(() => clientCreateSchema.parse({ name: '' })).toThrow()
  })

  it('rejeita nome com 1 caractere', () => {
    expect(() => clientCreateSchema.parse({ name: 'A' })).toThrow()
  })

  it('rejeita nome acima de 255 caracteres', () => {
    expect(() => clientCreateSchema.parse({ name: 'x'.repeat(256) })).toThrow()
  })

  it('rejeita email invalido', () => {
    expect(() => clientCreateSchema.parse({ name: 'Dr. Test', email: 'not-email' })).toThrow()
  })

  it('aceita email null', () => {
    const result = clientCreateSchema.parse({ name: 'Dr. Test', email: null })
    expect(result.email).toBeNull()
  })

  it('rejeita priceTableId invalido', () => {
    expect(() => clientCreateSchema.parse({ name: 'Dr. Test', priceTableId: 'abc' })).toThrow()
  })

  it('rejeita closingDay menor que 1', () => {
    expect(() => clientCreateSchema.parse({ name: 'Dr. Test', closingDay: 0 })).toThrow()
  })

  it('rejeita closingDay maior que 31', () => {
    expect(() => clientCreateSchema.parse({ name: 'Dr. Test', closingDay: 32 })).toThrow()
  })

  it('rejeita paymentDays negativo', () => {
    expect(() => clientCreateSchema.parse({ name: 'Dr. Test', paymentDays: -1 })).toThrow()
  })

  it('rejeita paymentDays acima de 120', () => {
    expect(() => clientCreateSchema.parse({ name: 'Dr. Test', paymentDays: 121 })).toThrow()
  })

  it('rejeita address acima de 2000 caracteres', () => {
    expect(() => clientCreateSchema.parse({ name: 'Dr. Test', address: 'x'.repeat(2001) })).toThrow()
  })

  it('rejeita notes acima de 1000 caracteres', () => {
    expect(() => clientCreateSchema.parse({ name: 'Dr. Test', notes: 'x'.repeat(1001) })).toThrow()
  })
})

// ═══════════════════════════════════════════════
// CLIENT UPDATE
// ═══════════════════════════════════════════════

describe('clientUpdateSchema', () => {
  it('aceita id + partial fields', () => {
    const result = clientUpdateSchema.parse({ id: uuid, name: 'Novo Nome' })
    expect(result.id).toBe(uuid)
    expect(result.name).toBe('Novo Nome')
  })

  it('aceita somente id (todos campos opcionais)', () => {
    const result = clientUpdateSchema.parse({ id: uuid })
    expect(result.id).toBe(uuid)
    expect(result.name).toBeUndefined()
  })

  it('rejeita id invalido', () => {
    expect(() => clientUpdateSchema.parse({ id: 'abc' })).toThrow()
  })

  it('rejeita sem id', () => {
    expect(() => clientUpdateSchema.parse({ name: 'Dr. Test' })).toThrow()
  })
})

// ═══════════════════════════════════════════════
// CLIENT LIST
// ═══════════════════════════════════════════════

describe('clientListSchema', () => {
  it('aplica defaults de paginacao', () => {
    const result = clientListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('aceita filtro de status', () => {
    const result = clientListSchema.parse({ status: 'ACTIVE' })
    expect(result.status).toBe('ACTIVE')
  })

  it('aceita filtro de search', () => {
    const result = clientListSchema.parse({ search: 'Carlos' })
    expect(result.search).toBe('Carlos')
  })

  it('rejeita status invalido', () => {
    expect(() => clientListSchema.parse({ status: 'INVALID' })).toThrow()
  })

  it('aceita todos os status validos', () => {
    for (const status of ['ACTIVE', 'INACTIVE', 'OVERDUE', 'PENDING_APPROVAL']) {
      const result = clientListSchema.parse({ status })
      expect(result.status).toBe(status)
    }
  })
})
