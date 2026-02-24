/**
 * Hello Labs — Case Validators (Zod Schemas)
 */
import { z } from 'zod'
import { CaseStatus, Modality, Priority, StageStatus } from '@prisma/client'
import { paginationSchema } from './common'

// FDI tooth notation: quadrant (1-4) + tooth (1-8)
const fdiToothSchema = z.string().regex(/^[1-4][1-8]$/, 'Dente deve seguir notacao FDI (ex: 11, 21, 38)')

// ═══ CREATE ═══
export const caseCreateSchema = z.object({
  clientId: z.string().uuid(),
  patientName: z.string().min(2).max(255),
  patientDob: z.coerce.date().optional().nullable(),
  prosthesisType: z.string().min(1).max(100),
  subtype: z.string().max(100).optional().nullable(),
  modality: z.nativeEnum(Modality).default('ANALOG'),
  teeth: z.array(fdiToothSchema).default([]),
  shade: z.string().max(20).optional().nullable(),
  priority: z.nativeEnum(Priority).default('NORMAL'),
  slaDate: z.coerce.date().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  osValue: z.number().min(0).optional().nullable(),
  materialCost: z.number().min(0).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
})

export type CaseCreateInput = z.infer<typeof caseCreateSchema>

// ═══ UPDATE ═══
export const caseUpdateSchema = z.object({
  id: z.string().uuid(),
}).merge(caseCreateSchema.partial())

export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>

// ═══ LIST (paginada) ═══
export const caseListSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.nativeEnum(CaseStatus).optional(),
  clientId: z.string().uuid().optional(),
  priority: z.nativeEnum(Priority).optional(),
  prosthesisType: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export type CaseListInput = z.infer<typeof caseListSchema>

// ═══ KANBAN (sem paginacao) ═══
export const caseKanbanSchema = z.object({
  search: z.string().optional(),
  clientId: z.string().uuid().optional(),
  priority: z.nativeEnum(Priority).optional(),
  prosthesisType: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
})

export type CaseKanbanInput = z.infer<typeof caseKanbanSchema>

// ═══ MOVE STAGE ═══
export const moveStageSchema = z.object({
  caseId: z.string().uuid(),
  stageId: z.string().uuid(),
  action: z.enum(['start', 'complete', 'skip']),
  notes: z.string().max(1000).optional(),
})

export type MoveStageInput = z.infer<typeof moveStageSchema>

// ═══ UPDATE STATUS (kanban drag) ═══
const KANBAN_STATUSES = [
  'RECEIVED',
  'IN_PRODUCTION',
  'WAITING_APPROVAL',
  'APPROVED',
  'READY_FOR_DELIVERY',
] as const

export const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(KANBAN_STATUSES),
})

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>

// ═══ COMMENT ═══
export const commentSchema = z.object({
  caseId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  isInternal: z.boolean().default(false),
})

export type CommentInput = z.infer<typeof commentSchema>

// ═══ FILE METADATA ═══
export const fileMetadataSchema = z.object({
  caseId: z.string().uuid(),
  fileUrl: z.string().min(1),
  fileType: z.string().max(20),
  fileName: z.string().max(255),
  fileSize: z.number().int().min(0).optional(),
})

export type FileMetadataInput = z.infer<typeof fileMetadataSchema>

// ═══ DELIVER ═══
export const deliverSchema = z.object({
  id: z.string().uuid(),
  deliveryMethod: z.string().min(1).max(50),
})

export type DeliverInput = z.infer<typeof deliverSchema>

// ═══ CANCEL ═══
export const cancelSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().max(1000).optional(),
})

export type CancelInput = z.infer<typeof cancelSchema>

// Re-export enums for convenience
export { CaseStatus, Modality, Priority, StageStatus }
