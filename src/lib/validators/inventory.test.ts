import { describe, it, expect } from 'vitest'
import {
  productCreateSchema,
  productUpdateSchema,
  productListSchema,
  lotCreateSchema,
  movementCreateSchema,
  movementListSchema,
  supplierCreateSchema,
  supplierUpdateSchema,
  supplierListSchema,
  supplierProductLinkSchema,
} from './inventory'

const uuid = '550e8400-e29b-41d4-a716-446655440000'
const uuid2 = '550e8400-e29b-41d4-a716-446655440001'

// ═══════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════

describe('productCreateSchema', () => {
  const valid = {
    name: 'Ceramica IPS e.max',
    category: 'ceramica',
    unit: 'un',
    brand: 'Ivoclar',
    qtyMin: 5,
    qtyIdeal: 20,
  }

  it('aceita input valido', () => {
    const result = productCreateSchema.parse(valid)
    expect(result.name).toBe('Ceramica IPS e.max')
    expect(result.category).toBe('ceramica')
    expect(result.unit).toBe('un')
  })

  it('aplica defaults para qtyMin, qtyIdeal, hasExpiry', () => {
    const result = productCreateSchema.parse({
      name: 'Gesso',
      category: 'gesso',
      unit: 'kg',
    })
    expect(result.qtyMin).toBe(0)
    expect(result.qtyIdeal).toBe(0)
    expect(result.hasExpiry).toBe(false)
  })

  it('rejeita nome vazio', () => {
    expect(() => productCreateSchema.parse({ ...valid, name: '' })).toThrow()
  })

  it('rejeita nome > 255 chars', () => {
    expect(() => productCreateSchema.parse({ ...valid, name: 'a'.repeat(256) })).toThrow()
  })

  it('rejeita categoria vazia', () => {
    expect(() => productCreateSchema.parse({ ...valid, category: '' })).toThrow()
  })

  it('rejeita unidade vazia', () => {
    expect(() => productCreateSchema.parse({ ...valid, unit: '' })).toThrow()
  })

  it('rejeita qtyMin negativo', () => {
    expect(() => productCreateSchema.parse({ ...valid, qtyMin: -1 })).toThrow()
  })

  it('rejeita qtyIdeal negativo', () => {
    expect(() => productCreateSchema.parse({ ...valid, qtyIdeal: -5 })).toThrow()
  })

  it('aceita brand null', () => {
    const result = productCreateSchema.parse({ ...valid, brand: null })
    expect(result.brand).toBeNull()
  })

  it('aceita sku e barcode opcionais', () => {
    const result = productCreateSchema.parse({
      ...valid,
      sku: 'SKU-001',
      barcode: '7891234567890',
    })
    expect(result.sku).toBe('SKU-001')
    expect(result.barcode).toBe('7891234567890')
  })

  it('aceita notes opcional', () => {
    const result = productCreateSchema.parse({ ...valid, notes: 'Material importado' })
    expect(result.notes).toBe('Material importado')
  })

  it('rejeita notes > 5000 chars', () => {
    expect(() => productCreateSchema.parse({ ...valid, notes: 'a'.repeat(5001) })).toThrow()
  })
})

describe('productUpdateSchema', () => {
  it('requer id', () => {
    expect(() => productUpdateSchema.parse({})).toThrow()
  })

  it('aceita id + campos parciais', () => {
    const result = productUpdateSchema.parse({ id: uuid, name: 'Novo Nome' })
    expect(result.id).toBe(uuid)
    expect(result.name).toBe('Novo Nome')
  })

  it('rejeita id invalido', () => {
    expect(() => productUpdateSchema.parse({ id: 'not-uuid' })).toThrow()
  })
})

describe('productListSchema', () => {
  it('aplica defaults de paginacao', () => {
    const result = productListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('aceita todos os filtros', () => {
    const result = productListSchema.parse({
      search: 'ceramica',
      category: 'ceramica',
      active: true,
      belowMin: true,
    })
    expect(result.search).toBe('ceramica')
    expect(result.category).toBe('ceramica')
    expect(result.active).toBe(true)
    expect(result.belowMin).toBe(true)
  })

  it('aceita page e perPage customizados', () => {
    const result = productListSchema.parse({ page: 3, perPage: 50 })
    expect(result.page).toBe(3)
    expect(result.perPage).toBe(50)
  })
})

// ═══════════════════════════════════════════════
// LOTS
// ═══════════════════════════════════════════════

describe('lotCreateSchema', () => {
  const valid = {
    productId: uuid,
    lotNumber: 'LOT-2026-001',
    qty: 10,
  }

  it('aceita input valido', () => {
    const result = lotCreateSchema.parse(valid)
    expect(result.productId).toBe(uuid)
    expect(result.lotNumber).toBe('LOT-2026-001')
    expect(result.qty).toBe(10)
  })

  it('aceita expiryDate como string ISO', () => {
    const result = lotCreateSchema.parse({ ...valid, expiryDate: '2027-06-15' })
    expect(result.expiryDate).toBeInstanceOf(Date)
  })

  it('aceita expiryDate null', () => {
    const result = lotCreateSchema.parse({ ...valid, expiryDate: null })
    expect(result.expiryDate).toBeNull()
  })

  it('rejeita lotNumber vazio', () => {
    expect(() => lotCreateSchema.parse({ ...valid, lotNumber: '' })).toThrow()
  })

  it('rejeita qty zero', () => {
    expect(() => lotCreateSchema.parse({ ...valid, qty: 0 })).toThrow()
  })

  it('rejeita qty negativa', () => {
    expect(() => lotCreateSchema.parse({ ...valid, qty: -5 })).toThrow()
  })

  it('rejeita productId invalido', () => {
    expect(() => lotCreateSchema.parse({ ...valid, productId: 'abc' })).toThrow()
  })

  it('aceita qty fracionaria', () => {
    const result = lotCreateSchema.parse({ ...valid, qty: 2.5 })
    expect(result.qty).toBe(2.5)
  })
})

// ═══════════════════════════════════════════════
// STOCK MOVEMENTS
// ═══════════════════════════════════════════════

describe('movementCreateSchema', () => {
  const valid = {
    productId: uuid,
    type: 'PURCHASE' as const,
    qty: 10,
  }

  it('aceita input valido', () => {
    const result = movementCreateSchema.parse(valid)
    expect(result.productId).toBe(uuid)
    expect(result.type).toBe('PURCHASE')
    expect(result.qty).toBe(10)
  })

  it('aceita CONSUMPTION com caseId', () => {
    const result = movementCreateSchema.parse({
      ...valid,
      type: 'CONSUMPTION',
      caseId: uuid2,
    })
    expect(result.type).toBe('CONSUMPTION')
    expect(result.caseId).toBe(uuid2)
  })

  it('aceita PURCHASE com supplierId e unitCost', () => {
    const result = movementCreateSchema.parse({
      ...valid,
      supplierId: uuid2,
      unitCost: 25.5,
      invoiceNumber: 'NF-001',
    })
    expect(result.supplierId).toBe(uuid2)
    expect(result.unitCost).toBe(25.5)
    expect(result.invoiceNumber).toBe('NF-001')
  })

  it('aceita ADJUSTMENT_POSITIVE', () => {
    const result = movementCreateSchema.parse({
      ...valid,
      type: 'ADJUSTMENT_POSITIVE',
      notes: 'Inventario',
    })
    expect(result.type).toBe('ADJUSTMENT_POSITIVE')
  })

  it('aceita ADJUSTMENT_NEGATIVE', () => {
    const result = movementCreateSchema.parse({
      ...valid,
      type: 'ADJUSTMENT_NEGATIVE',
    })
    expect(result.type).toBe('ADJUSTMENT_NEGATIVE')
  })

  it('aceita TRANSFER', () => {
    const result = movementCreateSchema.parse({ ...valid, type: 'TRANSFER' })
    expect(result.type).toBe('TRANSFER')
  })

  it('aceita RETURN', () => {
    const result = movementCreateSchema.parse({ ...valid, type: 'RETURN' })
    expect(result.type).toBe('RETURN')
  })

  it('rejeita type invalido', () => {
    expect(() => movementCreateSchema.parse({ ...valid, type: 'INVALID' })).toThrow()
  })

  it('rejeita qty zero', () => {
    expect(() => movementCreateSchema.parse({ ...valid, qty: 0 })).toThrow()
  })

  it('rejeita qty negativa', () => {
    expect(() => movementCreateSchema.parse({ ...valid, qty: -3 })).toThrow()
  })

  it('rejeita unitCost negativo', () => {
    expect(() => movementCreateSchema.parse({ ...valid, unitCost: -10 })).toThrow()
  })

  it('aceita unitCost zero', () => {
    const result = movementCreateSchema.parse({ ...valid, unitCost: 0 })
    expect(result.unitCost).toBe(0)
  })

  it('aceita lotId opcional', () => {
    const result = movementCreateSchema.parse({ ...valid, lotId: uuid2 })
    expect(result.lotId).toBe(uuid2)
  })
})

describe('movementListSchema', () => {
  it('aplica defaults de paginacao', () => {
    const result = movementListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('aceita filtros', () => {
    const result = movementListSchema.parse({
      productId: uuid,
      type: 'PURCHASE',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    })
    expect(result.productId).toBe(uuid)
    expect(result.type).toBe('PURCHASE')
    expect(result.dateFrom).toBeInstanceOf(Date)
    expect(result.dateTo).toBeInstanceOf(Date)
  })

  it('rejeita type invalido', () => {
    expect(() => movementListSchema.parse({ type: 'INVALID' })).toThrow()
  })
})

// ═══════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════

describe('supplierCreateSchema', () => {
  const valid = {
    name: 'Ivoclar Vivadent',
    email: 'contato@ivoclar.com',
    phone: '11999998888',
    rating: 5,
  }

  it('aceita input valido', () => {
    const result = supplierCreateSchema.parse(valid)
    expect(result.name).toBe('Ivoclar Vivadent')
    expect(result.email).toBe('contato@ivoclar.com')
  })

  it('rejeita nome vazio', () => {
    expect(() => supplierCreateSchema.parse({ ...valid, name: '' })).toThrow()
  })

  it('rejeita nome > 255 chars', () => {
    expect(() => supplierCreateSchema.parse({ ...valid, name: 'a'.repeat(256) })).toThrow()
  })

  it('rejeita email invalido', () => {
    expect(() => supplierCreateSchema.parse({ ...valid, email: 'not-email' })).toThrow()
  })

  it('aceita email null', () => {
    const result = supplierCreateSchema.parse({ ...valid, email: null })
    expect(result.email).toBeNull()
  })

  it('rejeita rating < 1', () => {
    expect(() => supplierCreateSchema.parse({ ...valid, rating: 0 })).toThrow()
  })

  it('rejeita rating > 5', () => {
    expect(() => supplierCreateSchema.parse({ ...valid, rating: 6 })).toThrow()
  })

  it('rejeita rating fracionario', () => {
    expect(() => supplierCreateSchema.parse({ ...valid, rating: 3.5 })).toThrow()
  })

  it('aceita rating null', () => {
    const result = supplierCreateSchema.parse({ ...valid, rating: null })
    expect(result.rating).toBeNull()
  })

  it('aceita leadDays', () => {
    const result = supplierCreateSchema.parse({ ...valid, leadDays: 7 })
    expect(result.leadDays).toBe(7)
  })

  it('rejeita leadDays negativo', () => {
    expect(() => supplierCreateSchema.parse({ ...valid, leadDays: -1 })).toThrow()
  })

  it('aceita todos campos opcionais', () => {
    const result = supplierCreateSchema.parse({
      ...valid,
      contactName: 'Joao Silva',
      website: 'https://ivoclar.com',
      paymentTerms: '30/60/90',
      notes: 'Distribuidor oficial',
    })
    expect(result.contactName).toBe('Joao Silva')
    expect(result.website).toBe('https://ivoclar.com')
  })
})

describe('supplierUpdateSchema', () => {
  it('requer id', () => {
    expect(() => supplierUpdateSchema.parse({})).toThrow()
  })

  it('aceita id + campos parciais', () => {
    const result = supplierUpdateSchema.parse({ id: uuid, name: 'Novo Fornecedor' })
    expect(result.id).toBe(uuid)
    expect(result.name).toBe('Novo Fornecedor')
  })
})

describe('supplierListSchema', () => {
  it('aplica defaults', () => {
    const result = supplierListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('aceita filtros', () => {
    const result = supplierListSchema.parse({
      search: 'Ivoclar',
      active: true,
    })
    expect(result.search).toBe('Ivoclar')
    expect(result.active).toBe(true)
  })
})

// ═══════════════════════════════════════════════
// SUPPLIER-PRODUCT LINK
// ═══════════════════════════════════════════════

describe('supplierProductLinkSchema', () => {
  it('aceita UUIDs validos', () => {
    const result = supplierProductLinkSchema.parse({
      supplierId: uuid,
      productId: uuid2,
    })
    expect(result.supplierId).toBe(uuid)
    expect(result.productId).toBe(uuid2)
  })

  it('rejeita supplierId invalido', () => {
    expect(() =>
      supplierProductLinkSchema.parse({ supplierId: 'abc', productId: uuid }),
    ).toThrow()
  })

  it('rejeita productId invalido', () => {
    expect(() =>
      supplierProductLinkSchema.parse({ supplierId: uuid, productId: 'abc' }),
    ).toThrow()
  })

  it('rejeita sem supplierId', () => {
    expect(() => supplierProductLinkSchema.parse({ productId: uuid })).toThrow()
  })

  it('rejeita sem productId', () => {
    expect(() => supplierProductLinkSchema.parse({ supplierId: uuid })).toThrow()
  })
})
