import { describe, it, expect } from 'vitest'
import { branchCreateSchema, branchUpdateSchema, branchListSchema } from './branch'

describe('branchCreateSchema', () => {
  it('accepts valid branch with name only', () => {
    const result = branchCreateSchema.parse({ name: 'Filial Centro' })
    expect(result.name).toBe('Filial Centro')
  })

  it('accepts full branch data', () => {
    const result = branchCreateSchema.parse({
      name: 'Filial Zona Sul',
      address: 'Av. Interlagos, 1000',
      managerName: 'Carlos Silva',
      cpfCnpj: '12.345.678/0001-90',
    })
    expect(result.name).toBe('Filial Zona Sul')
    expect(result.address).toBe('Av. Interlagos, 1000')
    expect(result.managerName).toBe('Carlos Silva')
    expect(result.cpfCnpj).toBe('12.345.678/0001-90')
  })

  it('rejects name shorter than 2 chars', () => {
    expect(() => branchCreateSchema.parse({ name: 'A' })).toThrow()
  })

  it('rejects name longer than 255 chars', () => {
    expect(() => branchCreateSchema.parse({ name: 'X'.repeat(256) })).toThrow()
  })

  it('rejects missing name', () => {
    expect(() => branchCreateSchema.parse({})).toThrow()
  })

  it('allows optional fields to be absent', () => {
    const result = branchCreateSchema.parse({ name: 'Filial Norte' })
    expect(result.address).toBeUndefined()
    expect(result.managerName).toBeUndefined()
    expect(result.cpfCnpj).toBeUndefined()
  })

  it('rejects address longer than 500 chars', () => {
    expect(() =>
      branchCreateSchema.parse({ name: 'Filial', address: 'A'.repeat(501) }),
    ).toThrow()
  })
})

describe('branchUpdateSchema', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000'

  it('accepts valid update with id only', () => {
    const result = branchUpdateSchema.parse({ id: validId })
    expect(result.id).toBe(validId)
  })

  it('accepts update with all fields', () => {
    const result = branchUpdateSchema.parse({
      id: validId,
      name: 'Novo Nome',
      address: 'Novo Endereco',
      managerName: 'Novo Gerente',
      cpfCnpj: '98.765.432/0001-10',
    })
    expect(result.name).toBe('Novo Nome')
  })

  it('accepts null for optional fields (clear value)', () => {
    const result = branchUpdateSchema.parse({
      id: validId,
      address: null,
      managerName: null,
      cpfCnpj: null,
    })
    expect(result.address).toBeNull()
    expect(result.managerName).toBeNull()
    expect(result.cpfCnpj).toBeNull()
  })

  it('rejects invalid uuid', () => {
    expect(() => branchUpdateSchema.parse({ id: 'not-a-uuid' })).toThrow()
  })

  it('rejects missing id', () => {
    expect(() => branchUpdateSchema.parse({ name: 'Test' })).toThrow()
  })
})

describe('branchListSchema', () => {
  it('uses default pagination', () => {
    const result = branchListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('accepts custom pagination', () => {
    const result = branchListSchema.parse({ page: 2, perPage: 10 })
    expect(result.page).toBe(2)
    expect(result.perPage).toBe(10)
  })

  it('accepts search parameter', () => {
    const result = branchListSchema.parse({ search: 'Centro' })
    expect(result.search).toBe('Centro')
  })

  it('rejects search longer than 200 chars', () => {
    expect(() => branchListSchema.parse({ search: 'X'.repeat(201) })).toThrow()
  })

  it('rejects page less than 1', () => {
    expect(() => branchListSchema.parse({ page: 0 })).toThrow()
  })

  it('rejects perPage greater than 100', () => {
    expect(() => branchListSchema.parse({ perPage: 101 })).toThrow()
  })
})
