import { describe, it, expect } from 'vitest'
import {
  notificationListSchema,
  notificationMarkReadSchema,
  notificationDeleteSchema,
} from './notification'

const uuid = '550e8400-e29b-41d4-a716-446655440000'

describe('notificationListSchema', () => {
  it('aplica defaults', () => {
    const result = notificationListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
    expect(result.unreadOnly).toBe(false)
  })

  it('aceita unreadOnly true', () => {
    const result = notificationListSchema.parse({ unreadOnly: true })
    expect(result.unreadOnly).toBe(true)
  })

  it('aceita paginacao custom', () => {
    const result = notificationListSchema.parse({ page: 3, perPage: 10 })
    expect(result.page).toBe(3)
    expect(result.perPage).toBe(10)
  })

  it('rejeita page negativa', () => {
    expect(() => notificationListSchema.parse({ page: -1 })).toThrow()
  })

  it('rejeita page 0', () => {
    expect(() => notificationListSchema.parse({ page: 0 })).toThrow()
  })
})

describe('notificationMarkReadSchema', () => {
  it('aceita uuid valido', () => {
    const result = notificationMarkReadSchema.parse({ id: uuid })
    expect(result.id).toBe(uuid)
  })

  it('rejeita uuid invalido', () => {
    expect(() => notificationMarkReadSchema.parse({ id: 'abc' })).toThrow()
  })

  it('rejeita sem id', () => {
    expect(() => notificationMarkReadSchema.parse({})).toThrow()
  })
})

describe('notificationDeleteSchema', () => {
  it('aceita uuid valido', () => {
    const result = notificationDeleteSchema.parse({ id: uuid })
    expect(result.id).toBe(uuid)
  })

  it('rejeita uuid invalido', () => {
    expect(() => notificationDeleteSchema.parse({ id: 'not-uuid' })).toThrow()
  })
})
