import { describe, it, expect } from 'vitest'
import {
  caseCreateSchema,
  caseUpdateSchema,
  caseListSchema,
  caseKanbanSchema,
  moveStageSchema,
  updateStatusSchema,
  commentSchema,
  fileMetadataSchema,
  deliverSchema,
  cancelSchema,
} from './case'

describe('caseCreateSchema', () => {
  const validInput = {
    clientId: '550e8400-e29b-41d4-a716-446655440000',
    patientName: 'Joao Silva',
    prosthesisType: 'coroa-zirconia',
  }

  it('aceita input valido minimo', () => {
    const result = caseCreateSchema.parse(validInput)
    expect(result.clientId).toBe(validInput.clientId)
    expect(result.patientName).toBe(validInput.patientName)
    expect(result.modality).toBe('ANALOG')
    expect(result.teeth).toEqual([])
    expect(result.priority).toBe('NORMAL')
  })

  it('aceita input completo', () => {
    const result = caseCreateSchema.parse({
      ...validInput,
      patientDob: '1990-01-15',
      subtype: 'e.max',
      modality: 'DIGITAL',
      teeth: ['11', '12', '21'],
      shade: 'A2',
      priority: 'URGENT',
      slaDate: '2026-03-01',
      assignedTo: '550e8400-e29b-41d4-a716-446655440001',
      osValue: 150.00,
      materialCost: 50.00,
      notes: 'Caso urgente',
      branchId: '550e8400-e29b-41d4-a716-446655440002',
    })
    expect(result.modality).toBe('DIGITAL')
    expect(result.priority).toBe('URGENT')
    expect(result.teeth).toEqual(['11', '12', '21'])
  })

  it('rejeita clientId invalido', () => {
    expect(() => caseCreateSchema.parse({ ...validInput, clientId: 'not-uuid' })).toThrow()
  })

  it('rejeita patientName vazio', () => {
    expect(() => caseCreateSchema.parse({ ...validInput, patientName: '' })).toThrow()
  })

  it('rejeita patientName com 1 caractere', () => {
    expect(() => caseCreateSchema.parse({ ...validInput, patientName: 'A' })).toThrow()
  })

  it('rejeita prosthesisType vazio', () => {
    expect(() => caseCreateSchema.parse({ ...validInput, prosthesisType: '' })).toThrow()
  })

  it('rejeita modality invalida', () => {
    expect(() => caseCreateSchema.parse({ ...validInput, modality: 'INVALID' })).toThrow()
  })

  it('rejeita priority invalida', () => {
    expect(() => caseCreateSchema.parse({ ...validInput, priority: 'LOW' })).toThrow()
  })

  it('rejeita dente FDI invalido (quadrante 5)', () => {
    expect(() => caseCreateSchema.parse({ ...validInput, teeth: ['51'] })).toThrow()
  })

  it('rejeita dente FDI invalido (posicao 9)', () => {
    expect(() => caseCreateSchema.parse({ ...validInput, teeth: ['19'] })).toThrow()
  })

  it('aceita dente FDI valido (todos os quadrantes)', () => {
    const result = caseCreateSchema.parse({
      ...validInput,
      teeth: ['11', '28', '31', '48'],
    })
    expect(result.teeth).toEqual(['11', '28', '31', '48'])
  })

  it('rejeita osValue negativo', () => {
    expect(() => caseCreateSchema.parse({ ...validInput, osValue: -10 })).toThrow()
  })

  it('aceita notes com ate 5000 caracteres', () => {
    const result = caseCreateSchema.parse({
      ...validInput,
      notes: 'a'.repeat(5000),
    })
    expect(result.notes?.length).toBe(5000)
  })

  it('rejeita notes com mais de 5000 caracteres', () => {
    expect(() => caseCreateSchema.parse({ ...validInput, notes: 'a'.repeat(5001) })).toThrow()
  })
})

describe('caseUpdateSchema', () => {
  it('requer id', () => {
    expect(() => caseUpdateSchema.parse({})).toThrow()
  })

  it('aceita id + campos parciais', () => {
    const result = caseUpdateSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      patientName: 'Nome Atualizado',
    })
    expect(result.id).toBeDefined()
    expect(result.patientName).toBe('Nome Atualizado')
  })
})

describe('caseListSchema', () => {
  it('aplica defaults de paginacao', () => {
    const result = caseListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('aceita todos os filtros', () => {
    const result = caseListSchema.parse({
      search: 'Joao',
      status: 'RECEIVED',
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      priority: 'URGENT',
      prosthesisType: 'coroa-zirconia',
    })
    expect(result.search).toBe('Joao')
    expect(result.status).toBe('RECEIVED')
  })

  it('rejeita status invalido', () => {
    expect(() => caseListSchema.parse({ status: 'INVALID' })).toThrow()
  })
})

describe('caseKanbanSchema', () => {
  it('aceita vazio', () => {
    const result = caseKanbanSchema.parse({})
    expect(result).toBeDefined()
  })

  it('aceita filtros', () => {
    const result = caseKanbanSchema.parse({
      search: 'teste',
      priority: 'CRITICAL',
    })
    expect(result.search).toBe('teste')
    expect(result.priority).toBe('CRITICAL')
  })
})

describe('moveStageSchema', () => {
  const valid = {
    caseId: '550e8400-e29b-41d4-a716-446655440000',
    stageId: '550e8400-e29b-41d4-a716-446655440001',
    action: 'start' as const,
  }

  it('aceita action start', () => {
    expect(() => moveStageSchema.parse(valid)).not.toThrow()
  })

  it('aceita action complete', () => {
    expect(() => moveStageSchema.parse({ ...valid, action: 'complete' })).not.toThrow()
  })

  it('aceita action skip', () => {
    expect(() => moveStageSchema.parse({ ...valid, action: 'skip' })).not.toThrow()
  })

  it('rejeita action invalida', () => {
    expect(() => moveStageSchema.parse({ ...valid, action: 'pause' })).toThrow()
  })

  it('aceita notes opcional', () => {
    const result = moveStageSchema.parse({ ...valid, notes: 'Observacao' })
    expect(result.notes).toBe('Observacao')
  })
})

describe('updateStatusSchema', () => {
  it('aceita status do kanban', () => {
    const statuses = ['RECEIVED', 'IN_PRODUCTION', 'WAITING_APPROVAL', 'APPROVED', 'READY_FOR_DELIVERY'] as const
    for (const status of statuses) {
      expect(() => updateStatusSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        status,
      })).not.toThrow()
    }
  })

  it('rejeita DELIVERED (nao e status do kanban)', () => {
    expect(() => updateStatusSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'DELIVERED',
    })).toThrow()
  })

  it('rejeita CANCELLED', () => {
    expect(() => updateStatusSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'CANCELLED',
    })).toThrow()
  })
})

describe('commentSchema', () => {
  it('aceita comentario valido', () => {
    const result = commentSchema.parse({
      caseId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Comentario de teste',
    })
    expect(result.isInternal).toBe(false)
  })

  it('aceita comentario interno', () => {
    const result = commentSchema.parse({
      caseId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Interno',
      isInternal: true,
    })
    expect(result.isInternal).toBe(true)
  })

  it('rejeita conteudo vazio', () => {
    expect(() => commentSchema.parse({
      caseId: '550e8400-e29b-41d4-a716-446655440000',
      content: '',
    })).toThrow()
  })
})

describe('fileMetadataSchema', () => {
  it('aceita metadata valida', () => {
    const result = fileMetadataSchema.parse({
      caseId: '550e8400-e29b-41d4-a716-446655440000',
      fileUrl: 'tenant/case/file.stl',
      fileType: 'model',
      fileName: 'caso.stl',
      fileSize: 1024000,
    })
    expect(result.fileName).toBe('caso.stl')
  })

  it('aceita sem fileSize', () => {
    const result = fileMetadataSchema.parse({
      caseId: '550e8400-e29b-41d4-a716-446655440000',
      fileUrl: 'path/file.pdf',
      fileType: 'document',
      fileName: 'laudo.pdf',
    })
    expect(result.fileSize).toBeUndefined()
  })
})

describe('deliverSchema', () => {
  it('aceita entrega valida', () => {
    const result = deliverSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      deliveryMethod: 'Entregador',
    })
    expect(result.deliveryMethod).toBe('Entregador')
  })

  it('rejeita deliveryMethod vazio', () => {
    expect(() => deliverSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      deliveryMethod: '',
    })).toThrow()
  })
})

describe('cancelSchema', () => {
  it('aceita sem reason', () => {
    const result = cancelSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.reason).toBeUndefined()
  })

  it('aceita com reason', () => {
    const result = cancelSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'Paciente desistiu',
    })
    expect(result.reason).toBe('Paciente desistiu')
  })
})
