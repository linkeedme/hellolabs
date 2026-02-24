import { describe, it, expect } from 'vitest'
import { auditLogListSchema, auditLogByEntitySchema } from './audit'

describe('auditLogListSchema', () => {
  it('uses default pagination', () => {
    const result = auditLogListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('accepts all filter params', () => {
    const result = auditLogListSchema.parse({
      entity: 'Case',
      action: 'CREATE',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
      page: 2,
      perPage: 10,
    })
    expect(result.entity).toBe('Case')
    expect(result.action).toBe('CREATE')
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(result.dateFrom).toBeInstanceOf(Date)
    expect(result.dateTo).toBeInstanceOf(Date)
  })

  it('allows empty filters', () => {
    const result = auditLogListSchema.parse({ page: 1, perPage: 20 })
    expect(result.entity).toBeUndefined()
    expect(result.action).toBeUndefined()
  })

  it('rejects entity longer than 50 chars', () => {
    expect(() => auditLogListSchema.parse({ entity: 'X'.repeat(51) })).toThrow()
  })

  it('rejects invalid userId', () => {
    expect(() => auditLogListSchema.parse({ userId: 'not-a-uuid' })).toThrow()
  })

  it('coerces date strings to Date objects', () => {
    const result = auditLogListSchema.parse({ dateFrom: '2025-06-15' })
    expect(result.dateFrom).toBeInstanceOf(Date)
  })

  it('rejects page less than 1', () => {
    expect(() => auditLogListSchema.parse({ page: 0 })).toThrow()
  })

  it('rejects perPage greater than 100', () => {
    expect(() => auditLogListSchema.parse({ perPage: 101 })).toThrow()
  })
})

describe('auditLogByEntitySchema', () => {
  it('accepts valid entity and entityId', () => {
    const result = auditLogByEntitySchema.parse({
      entity: 'Case',
      entityId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.entity).toBe('Case')
    expect(result.entityId).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('rejects empty entity', () => {
    expect(() =>
      auditLogByEntitySchema.parse({
        entity: '',
        entityId: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ).toThrow()
  })

  it('rejects invalid entityId', () => {
    expect(() =>
      auditLogByEntitySchema.parse({
        entity: 'Case',
        entityId: 'bad',
      }),
    ).toThrow()
  })

  it('rejects missing fields', () => {
    expect(() => auditLogByEntitySchema.parse({})).toThrow()
    expect(() => auditLogByEntitySchema.parse({ entity: 'Case' })).toThrow()
  })
})
