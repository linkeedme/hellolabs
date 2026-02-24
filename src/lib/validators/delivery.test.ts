import { describe, it, expect } from 'vitest'
import {
  routeCreateSchema,
  routeUpdateSchema,
  routeListSchema,
  routePublishSchema,
  routeStartSchema,
  routeCompleteSchema,
  stopCreateSchema,
  stopUpdateSchema,
  stopStatusUpdateSchema,
} from './delivery'

const uuid = '550e8400-e29b-41d4-a716-446655440000'
const uuid2 = '550e8400-e29b-41d4-a716-446655440001'

// ═══════════════════════════════════════════════
// DELIVERY ROUTES
// ═══════════════════════════════════════════════

describe('routeCreateSchema', () => {
  it('aceita input valido', () => {
    const result = routeCreateSchema.parse({ driverId: uuid, date: '2026-03-15' })
    expect(result.driverId).toBe(uuid)
    expect(result.date).toBeInstanceOf(Date)
  })

  it('rejeita driverId invalido', () => {
    expect(() => routeCreateSchema.parse({ driverId: 'abc', date: '2026-03-15' })).toThrow()
  })

  it('rejeita sem data', () => {
    expect(() => routeCreateSchema.parse({ driverId: uuid })).toThrow()
  })
})

describe('routeUpdateSchema', () => {
  it('aceita update com id', () => {
    const result = routeUpdateSchema.parse({ id: uuid, date: '2026-04-01' })
    expect(result.id).toBe(uuid)
    expect(result.date).toBeInstanceOf(Date)
  })

  it('aceita update parcial', () => {
    const result = routeUpdateSchema.parse({ id: uuid })
    expect(result.driverId).toBeUndefined()
    expect(result.date).toBeUndefined()
  })

  it('rejeita id invalido', () => {
    expect(() => routeUpdateSchema.parse({ id: 'abc' })).toThrow()
  })
})

describe('routeListSchema', () => {
  it('aplica defaults', () => {
    const result = routeListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('aceita filtros', () => {
    const result = routeListSchema.parse({
      status: 'DRAFT',
      driverId: uuid,
      dateFrom: '2026-03-01',
      dateTo: '2026-03-31',
    })
    expect(result.status).toBe('DRAFT')
    expect(result.driverId).toBe(uuid)
  })

  it('rejeita status invalido', () => {
    expect(() => routeListSchema.parse({ status: 'INVALID' })).toThrow()
  })
})

describe('routePublishSchema', () => {
  it('aceita UUID', () => {
    const result = routePublishSchema.parse({ id: uuid })
    expect(result.id).toBe(uuid)
  })

  it('rejeita id invalido', () => {
    expect(() => routePublishSchema.parse({ id: 'abc' })).toThrow()
  })
})

describe('routeStartSchema', () => {
  it('aceita UUID', () => {
    const result = routeStartSchema.parse({ id: uuid })
    expect(result.id).toBe(uuid)
  })
})

describe('routeCompleteSchema', () => {
  it('aceita UUID', () => {
    const result = routeCompleteSchema.parse({ id: uuid })
    expect(result.id).toBe(uuid)
  })
})

// ═══════════════════════════════════════════════
// DELIVERY STOPS
// ═══════════════════════════════════════════════

describe('stopCreateSchema', () => {
  const valid = {
    routeId: uuid,
    caseId: uuid2,
    address: 'Av. Paulista 1500, Sao Paulo',
    order: 1,
  }

  it('aceita input valido', () => {
    const result = stopCreateSchema.parse(valid)
    expect(result.routeId).toBe(uuid)
    expect(result.caseId).toBe(uuid2)
    expect(result.address).toBe('Av. Paulista 1500, Sao Paulo')
  })

  it('aplica default para order', () => {
    const result = stopCreateSchema.parse({ routeId: uuid, caseId: uuid2, address: 'Rua X' })
    expect(result.order).toBe(0)
  })

  it('rejeita endereco vazio', () => {
    expect(() => stopCreateSchema.parse({ ...valid, address: '' })).toThrow()
  })

  it('rejeita caseId invalido', () => {
    expect(() => stopCreateSchema.parse({ ...valid, caseId: 'abc' })).toThrow()
  })
})

describe('stopUpdateSchema', () => {
  it('aceita update parcial', () => {
    const result = stopUpdateSchema.parse({ id: uuid, address: 'Novo endereco' })
    expect(result.address).toBe('Novo endereco')
    expect(result.order).toBeUndefined()
  })

  it('rejeita id invalido', () => {
    expect(() => stopUpdateSchema.parse({ id: 'abc' })).toThrow()
  })
})

describe('stopStatusUpdateSchema', () => {
  it('aceita status DELIVERED', () => {
    const result = stopStatusUpdateSchema.parse({ id: uuid, status: 'DELIVERED' })
    expect(result.status).toBe('DELIVERED')
  })

  it('aceita status FAILED com motivo', () => {
    const result = stopStatusUpdateSchema.parse({ id: uuid, status: 'FAILED', failReason: 'Clinica fechada' })
    expect(result.status).toBe('FAILED')
    expect(result.failReason).toBe('Clinica fechada')
  })

  it('rejeita status invalido', () => {
    expect(() => stopStatusUpdateSchema.parse({ id: uuid, status: 'INVALID' })).toThrow()
  })

  it('aceita todos os status validos', () => {
    for (const status of ['PENDING', 'EN_ROUTE', 'DELIVERED', 'FAILED']) {
      const result = stopStatusUpdateSchema.parse({ id: uuid, status })
      expect(result.status).toBe(status)
    }
  })
})
