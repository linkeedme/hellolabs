import { describe, it, expect } from 'vitest'
import {
  calendarEventCreateSchema,
  calendarEventUpdateSchema,
  calendarListSchema,
  calendarUpcomingSchema,
} from './calendar'

const uuid = '550e8400-e29b-41d4-a716-446655440000'

// ═══════════════════════════════════════════════
// CALENDAR EVENTS
// ═══════════════════════════════════════════════

describe('calendarEventCreateSchema', () => {
  const valid = {
    title: 'Entrega Caso #042',
    type: 'entrega',
    date: '2026-03-15',
    time: '14:30',
    durationMin: 60,
    color: '#7ce7ac',
  }

  it('aceita input valido completo', () => {
    const result = calendarEventCreateSchema.parse(valid)
    expect(result.title).toBe('Entrega Caso #042')
    expect(result.type).toBe('entrega')
    expect(result.date).toBeInstanceOf(Date)
    expect(result.time).toBe('14:30')
    expect(result.durationMin).toBe(60)
  })

  it('aceita somente campos obrigatorios', () => {
    const result = calendarEventCreateSchema.parse({
      title: 'Evento',
      type: 'outro',
      date: '2026-04-01',
    })
    expect(result.visibility).toBe('team')
    expect(result.time).toBeUndefined()
  })

  it('aplica default team para visibility', () => {
    const result = calendarEventCreateSchema.parse({
      title: 'Evento',
      type: 'outro',
      date: '2026-04-01',
    })
    expect(result.visibility).toBe('team')
  })

  it('aceita visibility private', () => {
    const result = calendarEventCreateSchema.parse({
      ...valid,
      visibility: 'private',
    })
    expect(result.visibility).toBe('private')
  })

  it('rejeita titulo vazio', () => {
    expect(() => calendarEventCreateSchema.parse({ ...valid, title: '' })).toThrow()
  })

  it('rejeita tipo vazio', () => {
    expect(() => calendarEventCreateSchema.parse({ ...valid, type: '' })).toThrow()
  })

  it('rejeita time com formato invalido', () => {
    expect(() => calendarEventCreateSchema.parse({ ...valid, time: '14:3' })).toThrow()
    expect(() => calendarEventCreateSchema.parse({ ...valid, time: '2pm' })).toThrow()
  })

  it('aceita time null', () => {
    const result = calendarEventCreateSchema.parse({ ...valid, time: null })
    expect(result.time).toBeNull()
  })

  it('rejeita durationMin negativa', () => {
    expect(() => calendarEventCreateSchema.parse({ ...valid, durationMin: 0 })).toThrow()
  })

  it('rejeita durationMin acima de 1440', () => {
    expect(() => calendarEventCreateSchema.parse({ ...valid, durationMin: 1441 })).toThrow()
  })

  it('aceita refId e refType', () => {
    const result = calendarEventCreateSchema.parse({
      ...valid,
      refId: uuid,
      refType: 'case',
    })
    expect(result.refId).toBe(uuid)
    expect(result.refType).toBe('case')
  })

  it('rejeita visibility invalida', () => {
    expect(() => calendarEventCreateSchema.parse({ ...valid, visibility: 'public' })).toThrow()
  })
})

describe('calendarEventUpdateSchema', () => {
  it('requer id UUID', () => {
    const result = calendarEventUpdateSchema.parse({ id: uuid, title: 'Novo Titulo' })
    expect(result.id).toBe(uuid)
    expect(result.title).toBe('Novo Titulo')
  })

  it('rejeita id invalido', () => {
    expect(() => calendarEventUpdateSchema.parse({ id: 'abc' })).toThrow()
  })

  it('aceita update parcial', () => {
    const result = calendarEventUpdateSchema.parse({ id: uuid, color: '#ff808b' })
    expect(result.color).toBe('#ff808b')
    expect(result.title).toBeUndefined()
  })
})

describe('calendarListSchema', () => {
  it('aceita range de datas', () => {
    const result = calendarListSchema.parse({
      dateFrom: '2026-02-01',
      dateTo: '2026-02-28',
    })
    expect(result.dateFrom).toBeInstanceOf(Date)
    expect(result.dateTo).toBeInstanceOf(Date)
  })

  it('aceita filtro por tipo', () => {
    const result = calendarListSchema.parse({
      dateFrom: '2026-02-01',
      dateTo: '2026-02-28',
      type: 'entrega',
    })
    expect(result.type).toBe('entrega')
  })

  it('rejeita sem dateFrom', () => {
    expect(() => calendarListSchema.parse({ dateTo: '2026-02-28' })).toThrow()
  })

  it('rejeita sem dateTo', () => {
    expect(() => calendarListSchema.parse({ dateFrom: '2026-02-01' })).toThrow()
  })
})

describe('calendarUpcomingSchema', () => {
  it('aplica defaults', () => {
    const result = calendarUpcomingSchema.parse({})
    expect(result.days).toBe(14)
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('aceita dias customizado', () => {
    const result = calendarUpcomingSchema.parse({ days: 30 })
    expect(result.days).toBe(30)
  })

  it('rejeita dias acima de 90', () => {
    expect(() => calendarUpcomingSchema.parse({ days: 91 })).toThrow()
  })

  it('rejeita dias abaixo de 1', () => {
    expect(() => calendarUpcomingSchema.parse({ days: 0 })).toThrow()
  })
})
