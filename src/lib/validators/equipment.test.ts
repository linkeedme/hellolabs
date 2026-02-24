import { describe, it, expect } from 'vitest'
import {
  equipmentCreateSchema,
  equipmentUpdateSchema,
  equipmentListSchema,
  logCreateSchema,
  logListSchema,
  furnaceProgramCreateSchema,
  furnaceProgramUpdateSchema,
  furnaceCalibrationCreateSchema,
  printerConfigUpdateSchema,
} from './equipment'

const uuid = '550e8400-e29b-41d4-a716-446655440000'

// ═══════════════════════════════════════════════
// EQUIPMENT
// ═══════════════════════════════════════════════

describe('equipmentCreateSchema', () => {
  const valid = {
    name: 'Forno Ivoclar Programat P510',
    type: 'forno-ceramica',
    brand: 'Ivoclar',
    model: 'Programat P510',
    serialNumber: 'SN-123456',
    status: 'OPERATIONAL',
  }

  it('aceita input valido completo', () => {
    const result = equipmentCreateSchema.parse(valid)
    expect(result.name).toBe('Forno Ivoclar Programat P510')
    expect(result.type).toBe('forno-ceramica')
    expect(result.brand).toBe('Ivoclar')
  })

  it('aceita somente campos obrigatorios', () => {
    const result = equipmentCreateSchema.parse({ name: 'Forno X', type: 'forno-ceramica' })
    expect(result.status).toBe('OPERATIONAL')
  })

  it('aplica default OPERATIONAL para status', () => {
    const result = equipmentCreateSchema.parse({ name: 'Forno', type: 'forno-ceramica' })
    expect(result.status).toBe('OPERATIONAL')
  })

  it('aceita status MAINTENANCE', () => {
    const result = equipmentCreateSchema.parse({ ...valid, status: 'MAINTENANCE' })
    expect(result.status).toBe('MAINTENANCE')
  })

  it('aceita status INACTIVE', () => {
    const result = equipmentCreateSchema.parse({ ...valid, status: 'INACTIVE' })
    expect(result.status).toBe('INACTIVE')
  })

  it('rejeita nome vazio', () => {
    expect(() => equipmentCreateSchema.parse({ ...valid, name: '' })).toThrow()
  })

  it('rejeita tipo vazio', () => {
    expect(() => equipmentCreateSchema.parse({ ...valid, type: '' })).toThrow()
  })

  it('rejeita status invalido', () => {
    expect(() => equipmentCreateSchema.parse({ ...valid, status: 'BROKEN' })).toThrow()
  })

  it('aceita datas de manutencao', () => {
    const result = equipmentCreateSchema.parse({
      ...valid,
      acquiredAt: '2024-01-15',
      lastMaintenance: '2025-06-01',
      nextMaintenance: '2025-12-01',
    })
    expect(result.acquiredAt).toBeInstanceOf(Date)
    expect(result.lastMaintenance).toBeInstanceOf(Date)
    expect(result.nextMaintenance).toBeInstanceOf(Date)
  })

  it('aceita campos opcionais como null', () => {
    const result = equipmentCreateSchema.parse({
      ...valid,
      brand: null,
      model: null,
      serialNumber: null,
      notes: null,
    })
    expect(result.brand).toBeNull()
  })
})

describe('equipmentUpdateSchema', () => {
  it('requer id UUID', () => {
    const result = equipmentUpdateSchema.parse({ id: uuid, name: 'Novo Nome' })
    expect(result.id).toBe(uuid)
    expect(result.name).toBe('Novo Nome')
  })

  it('rejeita id invalido', () => {
    expect(() => equipmentUpdateSchema.parse({ id: 'invalid', name: 'X' })).toThrow()
  })

  it('aceita update parcial', () => {
    const result = equipmentUpdateSchema.parse({ id: uuid, status: 'MAINTENANCE' })
    expect(result.status).toBe('MAINTENANCE')
    expect(result.name).toBeUndefined()
  })
})

describe('equipmentListSchema', () => {
  it('aplica defaults de paginacao', () => {
    const result = equipmentListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('aceita filtros', () => {
    const result = equipmentListSchema.parse({ search: 'forno', type: 'forno-ceramica', status: 'OPERATIONAL' })
    expect(result.search).toBe('forno')
    expect(result.type).toBe('forno-ceramica')
    expect(result.status).toBe('OPERATIONAL')
  })

  it('rejeita status invalido', () => {
    expect(() => equipmentListSchema.parse({ status: 'INVALID' })).toThrow()
  })
})

// ═══════════════════════════════════════════════
// EQUIPMENT LOGS
// ═══════════════════════════════════════════════

describe('logCreateSchema', () => {
  const valid = {
    equipmentId: uuid,
    type: 'manutencao',
    description: 'Troca de resistencia do forno',
  }

  it('aceita input valido', () => {
    const result = logCreateSchema.parse(valid)
    expect(result.equipmentId).toBe(uuid)
    expect(result.type).toBe('manutencao')
  })

  it('rejeita tipo vazio', () => {
    expect(() => logCreateSchema.parse({ ...valid, type: '' })).toThrow()
  })

  it('rejeita descricao vazia', () => {
    expect(() => logCreateSchema.parse({ ...valid, description: '' })).toThrow()
  })

  it('rejeita equipmentId invalido', () => {
    expect(() => logCreateSchema.parse({ ...valid, equipmentId: 'abc' })).toThrow()
  })
})

describe('logListSchema', () => {
  it('aceita equipmentId com paginacao default', () => {
    const result = logListSchema.parse({ equipmentId: uuid })
    expect(result.equipmentId).toBe(uuid)
    expect(result.page).toBe(1)
  })
})

// ═══════════════════════════════════════════════
// FURNACE PROGRAMS
// ═══════════════════════════════════════════════

describe('furnaceProgramCreateSchema', () => {
  const valid = {
    equipmentId: uuid,
    name: 'IPS e.max Press LT',
    startTemp: 403,
    peakTemp: 920,
    heatingRate: 60,
    holdTime: 20,
    vacuumStartTemp: 500,
    vacuumEndTemp: 920,
  }

  it('aceita input valido completo', () => {
    const result = furnaceProgramCreateSchema.parse(valid)
    expect(result.name).toBe('IPS e.max Press LT')
    expect(result.peakTemp).toBe(920)
  })

  it('aceita somente campos obrigatorios', () => {
    const result = furnaceProgramCreateSchema.parse({ equipmentId: uuid, name: 'Programa 1' })
    expect(result.startTemp).toBeUndefined()
    expect(result.peakTemp).toBeUndefined()
  })

  it('rejeita nome vazio', () => {
    expect(() => furnaceProgramCreateSchema.parse({ equipmentId: uuid, name: '' })).toThrow()
  })

  it('rejeita temperaturas negativas', () => {
    expect(() => furnaceProgramCreateSchema.parse({ ...valid, peakTemp: -1 })).toThrow()
  })

  it('rejeita temperaturas acima de 2000', () => {
    expect(() => furnaceProgramCreateSchema.parse({ ...valid, peakTemp: 2001 })).toThrow()
  })
})

describe('furnaceProgramUpdateSchema', () => {
  it('requer id UUID, nao requer equipmentId', () => {
    const result = furnaceProgramUpdateSchema.parse({ id: uuid, name: 'Novo Programa' })
    expect(result.id).toBe(uuid)
    expect(result.name).toBe('Novo Programa')
  })

  it('aceita update parcial', () => {
    const result = furnaceProgramUpdateSchema.parse({ id: uuid, peakTemp: 950 })
    expect(result.peakTemp).toBe(950)
    expect(result.name).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════
// FURNACE CALIBRATIONS
// ═══════════════════════════════════════════════

describe('furnaceCalibrationCreateSchema', () => {
  const valid = {
    equipmentId: uuid,
    date: '2025-06-15',
    measuredTemp: 915,
    targetTemp: 920,
    deviation: -5,
    responsible: 'Joao Silva',
  }

  it('aceita input valido', () => {
    const result = furnaceCalibrationCreateSchema.parse(valid)
    expect(result.measuredTemp).toBe(915)
    expect(result.targetTemp).toBe(920)
    expect(result.deviation).toBe(-5)
    expect(result.date).toBeInstanceOf(Date)
  })

  it('aceita desvio positivo', () => {
    const result = furnaceCalibrationCreateSchema.parse({ ...valid, deviation: 3 })
    expect(result.deviation).toBe(3)
  })

  it('rejeita responsavel vazio', () => {
    expect(() => furnaceCalibrationCreateSchema.parse({ ...valid, responsible: '' })).toThrow()
  })

  it('rejeita temperaturas negativas', () => {
    expect(() => furnaceCalibrationCreateSchema.parse({ ...valid, measuredTemp: -1 })).toThrow()
  })
})

// ═══════════════════════════════════════════════
// PRINTER CONFIG
// ═══════════════════════════════════════════════

describe('printerConfigUpdateSchema', () => {
  const valid = {
    equipmentId: uuid,
    resinBrand: 'Anycubic',
    resinModel: 'Craftsman Ultra',
    resinColor: 'A2',
    layerMicrons: 50,
    exposureTime: 2.5,
  }

  it('aceita input valido', () => {
    const result = printerConfigUpdateSchema.parse(valid)
    expect(result.resinBrand).toBe('Anycubic')
    expect(result.layerMicrons).toBe(50)
    expect(result.exposureTime).toBe(2.5)
  })

  it('aceita somente equipmentId', () => {
    const result = printerConfigUpdateSchema.parse({ equipmentId: uuid })
    expect(result.equipmentId).toBe(uuid)
    expect(result.resinBrand).toBeUndefined()
  })

  it('rejeita layerMicrons acima de 500', () => {
    expect(() => printerConfigUpdateSchema.parse({ ...valid, layerMicrons: 501 })).toThrow()
  })

  it('rejeita layerMicrons abaixo de 1', () => {
    expect(() => printerConfigUpdateSchema.parse({ ...valid, layerMicrons: 0 })).toThrow()
  })

  it('aceita datas de troca de componentes', () => {
    const result = printerConfigUpdateSchema.parse({
      ...valid,
      fepLastChange: '2025-06-01',
      lcdLastChange: '2025-03-15',
    })
    expect(result.fepLastChange).toBeInstanceOf(Date)
    expect(result.lcdLastChange).toBeInstanceOf(Date)
  })
})
