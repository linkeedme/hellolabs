import { describe, it, expect } from 'vitest'
import {
  portalCaseListSchema,
  portalApproveSchema,
  portalCommentSchema,
} from './portal'

const uuid = '550e8400-e29b-41d4-a716-446655440000'

// ═══════════════════════════════════════════════
// PORTAL CASE LIST
// ═══════════════════════════════════════════════

describe('portalCaseListSchema', () => {
  it('aplica defaults de paginacao', () => {
    const result = portalCaseListSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(20)
  })

  it('aceita filtros', () => {
    const result = portalCaseListSchema.parse({ status: 'WAITING_APPROVAL', search: 'paciente' })
    expect(result.status).toBe('WAITING_APPROVAL')
    expect(result.search).toBe('paciente')
  })
})

// ═══════════════════════════════════════════════
// PORTAL APPROVE
// ═══════════════════════════════════════════════

describe('portalApproveSchema', () => {
  it('aceita approve', () => {
    const result = portalApproveSchema.parse({ caseId: uuid, action: 'approve' })
    expect(result.action).toBe('approve')
  })

  it('aceita reject com notas', () => {
    const result = portalApproveSchema.parse({ caseId: uuid, action: 'reject', notes: 'Cor incorreta' })
    expect(result.action).toBe('reject')
    expect(result.notes).toBe('Cor incorreta')
  })

  it('rejeita action invalida', () => {
    expect(() => portalApproveSchema.parse({ caseId: uuid, action: 'cancel' })).toThrow()
  })

  it('rejeita caseId invalido', () => {
    expect(() => portalApproveSchema.parse({ caseId: 'abc', action: 'approve' })).toThrow()
  })
})

// ═══════════════════════════════════════════════
// PORTAL COMMENT
// ═══════════════════════════════════════════════

describe('portalCommentSchema', () => {
  it('aceita comentario valido', () => {
    const result = portalCommentSchema.parse({ caseId: uuid, content: 'Ficou otimo!' })
    expect(result.content).toBe('Ficou otimo!')
  })

  it('rejeita comentario vazio', () => {
    expect(() => portalCommentSchema.parse({ caseId: uuid, content: '' })).toThrow()
  })

  it('rejeita caseId invalido', () => {
    expect(() => portalCommentSchema.parse({ caseId: 'abc', content: 'Teste' })).toThrow()
  })

  it('rejeita conteudo acima de 5000 caracteres', () => {
    expect(() => portalCommentSchema.parse({ caseId: uuid, content: 'x'.repeat(5001) })).toThrow()
  })
})
