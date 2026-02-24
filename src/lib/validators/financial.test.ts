import { describe, it, expect } from 'vitest'
import {
  soCreateSchema,
  soUpdateSchema,
  soListSchema,
  soIssueSchema,
  soMarkPaidSchema,
  soCancelSchema,
  invoiceCreateSchema,
  invoiceListSchema,
  invoiceSendSchema,
  invoiceCancelSchema,
  invoiceSendReminderSchema,
  paymentCreateSchema,
  paymentListSchema,
  creditCreateSchema,
  creditListSchema,
  cashFlowSchema,
  revenueReportSchema,
} from './financial'

const uuid = '550e8400-e29b-41d4-a716-446655440000'
const uuid2 = '550e8400-e29b-41d4-a716-446655440001'

// ═══════════════════════════════════════════════
// SERVICE ORDERS
// ═══════════════════════════════════════════════

describe('soCreateSchema', () => {
  const valid = {
    caseId: uuid,
    items: [{ description: 'Coroa Zirconia', quantity: 2, unitPrice: 150 }],
    discount: 10,
    notes: 'Urgente',
  }

  it('aceita input valido', () => {
    const result = soCreateSchema.parse(valid)
    expect(result.caseId).toBe(uuid)
    expect(result.items).toHaveLength(1)
    expect(result.discount).toBe(10)
  })

  it('aplica default discount = 0', () => {
    const { discount: _, ...rest } = valid
    const result = soCreateSchema.parse(rest)
    expect(result.discount).toBe(0)
  })

  it('rejeita caseId invalido', () => {
    expect(() => soCreateSchema.parse({ ...valid, caseId: 'not-uuid' })).toThrow()
  })

  it('rejeita items vazio', () => {
    expect(() => soCreateSchema.parse({ ...valid, items: [] })).toThrow()
  })

  it('rejeita item sem description', () => {
    expect(() =>
      soCreateSchema.parse({
        ...valid,
        items: [{ description: '', quantity: 1, unitPrice: 100 }],
      }),
    ).toThrow()
  })

  it('rejeita quantity 0', () => {
    expect(() =>
      soCreateSchema.parse({
        ...valid,
        items: [{ description: 'Item', quantity: 0, unitPrice: 100 }],
      }),
    ).toThrow()
  })

  it('rejeita quantity fracionaria', () => {
    expect(() =>
      soCreateSchema.parse({
        ...valid,
        items: [{ description: 'Item', quantity: 1.5, unitPrice: 100 }],
      }),
    ).toThrow()
  })

  it('rejeita unitPrice negativo', () => {
    expect(() =>
      soCreateSchema.parse({
        ...valid,
        items: [{ description: 'Item', quantity: 1, unitPrice: -10 }],
      }),
    ).toThrow()
  })

  it('aceita unitPrice 0', () => {
    const result = soCreateSchema.parse({
      ...valid,
      items: [{ description: 'Item cortesia', quantity: 1, unitPrice: 0 }],
    })
    expect(result.items[0].unitPrice).toBe(0)
  })

  it('rejeita discount negativo', () => {
    expect(() => soCreateSchema.parse({ ...valid, discount: -5 })).toThrow()
  })

  it('aceita notes null', () => {
    const result = soCreateSchema.parse({ ...valid, notes: null })
    expect(result.notes).toBeNull()
  })

  it('aceita multiplos items', () => {
    const result = soCreateSchema.parse({
      ...valid,
      items: [
        { description: 'Coroa', quantity: 1, unitPrice: 200 },
        { description: 'Ponte', quantity: 3, unitPrice: 150 },
        { description: 'Faceta', quantity: 2, unitPrice: 180 },
      ],
    })
    expect(result.items).toHaveLength(3)
  })
})

describe('soUpdateSchema', () => {
  it('requer id', () => {
    expect(() => soUpdateSchema.parse({})).toThrow()
  })

  it('aceita id + campos parciais', () => {
    const result = soUpdateSchema.parse({ id: uuid, discount: 20 })
    expect(result.id).toBe(uuid)
    expect(result.discount).toBe(20)
  })
})

describe('soListSchema', () => {
  it('aplica defaults de paginacao', () => {
    const result = soListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('aceita todos os filtros', () => {
    const result = soListSchema.parse({
      search: 'Joao',
      status: 'DRAFT',
      clientId: uuid,
    })
    expect(result.search).toBe('Joao')
    expect(result.status).toBe('DRAFT')
  })

  it('rejeita status invalido', () => {
    expect(() => soListSchema.parse({ status: 'INVALID' })).toThrow()
  })

  it('aceita dateFrom e dateTo como string ISO', () => {
    const result = soListSchema.parse({
      dateFrom: '2026-01-01',
      dateTo: '2026-02-28',
    })
    expect(result.dateFrom).toBeInstanceOf(Date)
    expect(result.dateTo).toBeInstanceOf(Date)
  })
})

describe('soIssueSchema', () => {
  it('aceita uuid valido', () => {
    expect(() => soIssueSchema.parse({ id: uuid })).not.toThrow()
  })

  it('rejeita uuid invalido', () => {
    expect(() => soIssueSchema.parse({ id: 'abc' })).toThrow()
  })
})

describe('soMarkPaidSchema', () => {
  it('aceita uuid valido', () => {
    expect(() => soMarkPaidSchema.parse({ id: uuid })).not.toThrow()
  })
})

describe('soCancelSchema', () => {
  it('aceita uuid valido', () => {
    expect(() => soCancelSchema.parse({ id: uuid })).not.toThrow()
  })
})

// ═══════════════════════════════════════════════
// INVOICES
// ═══════════════════════════════════════════════

describe('invoiceCreateSchema', () => {
  const valid = {
    clientId: uuid,
    serviceOrderIds: [uuid, uuid2],
    dueDate: '2026-03-15',
    notes: 'Fatura mensal',
  }

  it('aceita input valido', () => {
    const result = invoiceCreateSchema.parse(valid)
    expect(result.clientId).toBe(uuid)
    expect(result.serviceOrderIds).toHaveLength(2)
    expect(result.dueDate).toBeInstanceOf(Date)
  })

  it('rejeita serviceOrderIds vazio', () => {
    expect(() =>
      invoiceCreateSchema.parse({ ...valid, serviceOrderIds: [] }),
    ).toThrow()
  })

  it('rejeita dueDate invalido', () => {
    expect(() =>
      invoiceCreateSchema.parse({ ...valid, dueDate: 'not-a-date' }),
    ).toThrow()
  })

  it('aceita sem notes', () => {
    const { notes: _, ...rest } = valid
    const result = invoiceCreateSchema.parse(rest)
    expect(result.notes).toBeUndefined()
  })
})

describe('invoiceListSchema', () => {
  it('aplica defaults', () => {
    const result = invoiceListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('aceita status valido', () => {
    const result = invoiceListSchema.parse({ status: 'OVERDUE' })
    expect(result.status).toBe('OVERDUE')
  })

  it('rejeita status invalido', () => {
    expect(() => invoiceListSchema.parse({ status: 'INVALID' })).toThrow()
  })
})

describe('invoiceSendSchema', () => {
  it('aceita uuid valido', () => {
    expect(() => invoiceSendSchema.parse({ id: uuid })).not.toThrow()
  })
})

describe('invoiceCancelSchema', () => {
  it('aceita uuid valido', () => {
    expect(() => invoiceCancelSchema.parse({ id: uuid })).not.toThrow()
  })
})

describe('invoiceSendReminderSchema', () => {
  it('aceita template cordial', () => {
    const result = invoiceSendReminderSchema.parse({ id: uuid, template: 'cordial' })
    expect(result.template).toBe('cordial')
  })

  it('aceita template firme', () => {
    expect(() =>
      invoiceSendReminderSchema.parse({ id: uuid, template: 'firme' }),
    ).not.toThrow()
  })

  it('aceita template urgente', () => {
    expect(() =>
      invoiceSendReminderSchema.parse({ id: uuid, template: 'urgente' }),
    ).not.toThrow()
  })

  it('rejeita template invalido', () => {
    expect(() =>
      invoiceSendReminderSchema.parse({ id: uuid, template: 'amigavel' }),
    ).toThrow()
  })
})

// ═══════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════

describe('paymentCreateSchema', () => {
  const valid = {
    invoiceId: uuid,
    amount: 150.5,
    method: 'Pix',
  }

  it('aceita input valido', () => {
    const result = paymentCreateSchema.parse(valid)
    expect(result.amount).toBe(150.5)
    expect(result.method).toBe('Pix')
  })

  it('rejeita amount zero', () => {
    expect(() => paymentCreateSchema.parse({ ...valid, amount: 0 })).toThrow()
  })

  it('rejeita amount negativo', () => {
    expect(() => paymentCreateSchema.parse({ ...valid, amount: -10 })).toThrow()
  })

  it('rejeita method vazio', () => {
    expect(() => paymentCreateSchema.parse({ ...valid, method: '' })).toThrow()
  })

  it('aceita paidAt como data', () => {
    const result = paymentCreateSchema.parse({
      ...valid,
      paidAt: '2026-02-20',
    })
    expect(result.paidAt).toBeInstanceOf(Date)
  })

  it('aceita notes null', () => {
    const result = paymentCreateSchema.parse({ ...valid, notes: null })
    expect(result.notes).toBeNull()
  })
})

describe('paymentListSchema', () => {
  it('requer invoiceId', () => {
    expect(() => paymentListSchema.parse({})).toThrow()
  })

  it('aceita invoiceId valido', () => {
    const result = paymentListSchema.parse({ invoiceId: uuid })
    expect(result.invoiceId).toBe(uuid)
  })
})

// ═══════════════════════════════════════════════
// CREDITS
// ═══════════════════════════════════════════════

describe('creditCreateSchema', () => {
  const valid = {
    clientId: uuid,
    amount: 50,
    reason: 'Cortesia',
  }

  it('aceita input valido', () => {
    const result = creditCreateSchema.parse(valid)
    expect(result.amount).toBe(50)
    expect(result.reason).toBe('Cortesia')
  })

  it('rejeita amount zero', () => {
    expect(() => creditCreateSchema.parse({ ...valid, amount: 0 })).toThrow()
  })

  it('rejeita amount negativo', () => {
    expect(() => creditCreateSchema.parse({ ...valid, amount: -10 })).toThrow()
  })

  it('rejeita reason vazio', () => {
    expect(() => creditCreateSchema.parse({ ...valid, reason: '' })).toThrow()
  })

  it('rejeita reason > 500 chars', () => {
    expect(() =>
      creditCreateSchema.parse({ ...valid, reason: 'a'.repeat(501) }),
    ).toThrow()
  })
})

describe('creditListSchema', () => {
  it('requer clientId', () => {
    expect(() => creditListSchema.parse({})).toThrow()
  })

  it('aceita clientId valido', () => {
    const result = creditListSchema.parse({ clientId: uuid })
    expect(result.clientId).toBe(uuid)
  })
})

// ═══════════════════════════════════════════════
// CASH FLOW & REPORTS
// ═══════════════════════════════════════════════

describe('cashFlowSchema', () => {
  const valid = {
    dateFrom: '2026-01-01',
    dateTo: '2026-02-28',
  }

  it('aceita input valido com default groupBy', () => {
    const result = cashFlowSchema.parse(valid)
    expect(result.dateFrom).toBeInstanceOf(Date)
    expect(result.dateTo).toBeInstanceOf(Date)
    expect(result.groupBy).toBe('month')
  })

  it('aceita groupBy day', () => {
    const result = cashFlowSchema.parse({ ...valid, groupBy: 'day' })
    expect(result.groupBy).toBe('day')
  })

  it('aceita groupBy week', () => {
    const result = cashFlowSchema.parse({ ...valid, groupBy: 'week' })
    expect(result.groupBy).toBe('week')
  })

  it('rejeita groupBy invalido', () => {
    expect(() => cashFlowSchema.parse({ ...valid, groupBy: 'year' })).toThrow()
  })

  it('rejeita sem dateFrom', () => {
    expect(() => cashFlowSchema.parse({ dateTo: '2026-02-28' })).toThrow()
  })

  it('rejeita sem dateTo', () => {
    expect(() => cashFlowSchema.parse({ dateFrom: '2026-01-01' })).toThrow()
  })
})

describe('revenueReportSchema', () => {
  it('aceita input valido', () => {
    const result = revenueReportSchema.parse({
      dateFrom: '2026-01-01',
      dateTo: '2026-06-30',
    })
    expect(result.dateFrom).toBeInstanceOf(Date)
    expect(result.dateTo).toBeInstanceOf(Date)
  })

  it('rejeita sem datas', () => {
    expect(() => revenueReportSchema.parse({})).toThrow()
  })
})
