/**
 * Hello Labs — Portal Validators (Zod Schemas)
 * Dentist Portal: Cases, Approvals, Comments
 */
import { z } from 'zod'
import { paginationSchema } from './common'

// ═══════════════════════════════════════════════
// PORTAL CASE LIST
// ═══════════════════════════════════════════════

export const portalCaseListSchema = paginationSchema.extend({
  status: z.string().optional(),
  search: z.string().optional(),
})

export type PortalCaseListInput = z.infer<typeof portalCaseListSchema>

// ═══════════════════════════════════════════════
// PORTAL APPROVE / REJECT
// ═══════════════════════════════════════════════

export const portalApproveSchema = z.object({
  caseId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  notes: z.string().max(2000).optional().nullable(),
})

export type PortalApproveInput = z.infer<typeof portalApproveSchema>

// ═══════════════════════════════════════════════
// PORTAL COMMENT
// ═══════════════════════════════════════════════

export const portalCommentSchema = z.object({
  caseId: z.string().uuid(),
  content: z.string().min(1, 'Comentario obrigatorio').max(5000),
})

export type PortalCommentInput = z.infer<typeof portalCommentSchema>
