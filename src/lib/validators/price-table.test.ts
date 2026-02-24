import { describe, it, expect } from 'vitest'
import {
  priceTableCreateSchema,
  priceTableUpdateSchema,
  priceTableListSchema,
  priceItemCreateSchema,
  priceItemUpdateSchema,
} from './price-table'

// ── PriceTable schemas ───────────────────────────────────────────
describe('priceTableCreateSchema', () => {
  it('accepts valid name', () => {
    const result = priceTableCreateSchema.parse({ name: 'Tabela Padrao' })
    expect(result.name).toBe('Tabela Padrao')
  })

  it('rejects name shorter than 2 chars', () => {
    expect(() => priceTableCreateSchema.parse({ name: 'A' })).toThrow()
  })

  it('rejects name longer than 255 chars', () => {
    expect(() => priceTableCreateSchema.parse({ name: 'X'.repeat(256) })).toThrow()
  })

  it('rejects missing name', () => {
    expect(() => priceTableCreateSchema.parse({})).toThrow()
  })
})

describe('priceTableUpdateSchema', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000'

  it('accepts id only', () => {
    const result = priceTableUpdateSchema.parse({ id: validId })
    expect(result.id).toBe(validId)
  })

  it('accepts name update', () => {
    const result = priceTableUpdateSchema.parse({ id: validId, name: 'Novo Nome' })
    expect(result.name).toBe('Novo Nome')
  })

  it('accepts active toggle', () => {
    const result = priceTableUpdateSchema.parse({ id: validId, active: false })
    expect(result.active).toBe(false)
  })

  it('rejects invalid uuid', () => {
    expect(() => priceTableUpdateSchema.parse({ id: 'bad' })).toThrow()
  })
})

describe('priceTableListSchema', () => {
  it('uses default pagination', () => {
    const result = priceTableListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('accepts search param', () => {
    const result = priceTableListSchema.parse({ search: 'Padrao' })
    expect(result.search).toBe('Padrao')
  })

  it('rejects search longer than 200', () => {
    expect(() => priceTableListSchema.parse({ search: 'X'.repeat(201) })).toThrow()
  })
})

// ── PriceItem schemas ────────────────────────────────────────────
describe('priceItemCreateSchema', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000'

  it('accepts valid price item', () => {
    const result = priceItemCreateSchema.parse({
      priceTableId: validId,
      serviceType: 'Coroa Metalocerâmica',
      description: 'Coroa metalocerâmica unitária',
      unitPrice: 350.00,
      priceUnit: 'unit',
    })
    expect(result.serviceType).toBe('Coroa Metalocerâmica')
    expect(result.unitPrice).toBe(350)
    expect(result.priceUnit).toBe('unit')
  })

  it('uses default priceUnit', () => {
    const result = priceItemCreateSchema.parse({
      priceTableId: validId,
      serviceType: 'PPR',
      description: 'Protese parcial removivel',
      unitPrice: 800,
    })
    expect(result.priceUnit).toBe('unit')
  })

  it('accepts all price units', () => {
    for (const unit of ['unit', 'element', 'arch', 'case']) {
      const result = priceItemCreateSchema.parse({
        priceTableId: validId,
        serviceType: 'Servico',
        description: 'Desc',
        unitPrice: 100,
        priceUnit: unit,
      })
      expect(result.priceUnit).toBe(unit)
    }
  })

  it('rejects invalid priceUnit', () => {
    expect(() =>
      priceItemCreateSchema.parse({
        priceTableId: validId,
        serviceType: 'X',
        description: 'Y',
        unitPrice: 100,
        priceUnit: 'invalid',
      }),
    ).toThrow()
  })

  it('rejects negative unitPrice', () => {
    expect(() =>
      priceItemCreateSchema.parse({
        priceTableId: validId,
        serviceType: 'X',
        description: 'Y',
        unitPrice: -10,
      }),
    ).toThrow()
  })

  it('rejects empty serviceType', () => {
    expect(() =>
      priceItemCreateSchema.parse({
        priceTableId: validId,
        serviceType: '',
        description: 'Y',
        unitPrice: 100,
      }),
    ).toThrow()
  })

  it('rejects empty description', () => {
    expect(() =>
      priceItemCreateSchema.parse({
        priceTableId: validId,
        serviceType: 'X',
        description: '',
        unitPrice: 100,
      }),
    ).toThrow()
  })

  it('coerces string unitPrice to number', () => {
    const result = priceItemCreateSchema.parse({
      priceTableId: validId,
      serviceType: 'X',
      description: 'Y',
      unitPrice: '350.50',
    })
    expect(result.unitPrice).toBe(350.5)
  })
})

describe('priceItemUpdateSchema', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000'

  it('accepts id only', () => {
    const result = priceItemUpdateSchema.parse({ id: validId })
    expect(result.id).toBe(validId)
  })

  it('accepts partial update', () => {
    const result = priceItemUpdateSchema.parse({
      id: validId,
      unitPrice: 450,
    })
    expect(result.unitPrice).toBe(450)
  })

  it('rejects invalid uuid', () => {
    expect(() => priceItemUpdateSchema.parse({ id: 'bad' })).toThrow()
  })
})
