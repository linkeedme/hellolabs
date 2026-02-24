/**
 * Hello Labs — Delivery Validators (Zod Schemas)
 * Routes, Stops, State Machines
 */
import { z } from 'zod'
import { RouteStatus, StopStatus } from '@prisma/client'
import { paginationSchema } from './common'

// ═══════════════════════════════════════════════
// DELIVERY ROUTES
// ═══════════════════════════════════════════════

export const routeCreateSchema = z.object({
  driverId: z.string().uuid('Motorista obrigatorio'),
  date: z.coerce.date(),
})

export type RouteCreateInput = z.infer<typeof routeCreateSchema>

export const routeUpdateSchema = z.object({
  id: z.string().uuid(),
  driverId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
})

export type RouteUpdateInput = z.infer<typeof routeUpdateSchema>

export const routeListSchema = paginationSchema.extend({
  status: z.nativeEnum(RouteStatus).optional(),
  driverId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export type RouteListInput = z.infer<typeof routeListSchema>

// State transitions
export const routePublishSchema = z.object({
  id: z.string().uuid(),
})

export const routeStartSchema = z.object({
  id: z.string().uuid(),
})

export const routeCompleteSchema = z.object({
  id: z.string().uuid(),
})

// ═══════════════════════════════════════════════
// DELIVERY STOPS
// ═══════════════════════════════════════════════

export const stopCreateSchema = z.object({
  routeId: z.string().uuid(),
  caseId: z.string().uuid('Caso obrigatorio'),
  address: z.string().min(1, 'Endereco obrigatorio').max(2000),
  order: z.number().int().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
})

export type StopCreateInput = z.infer<typeof stopCreateSchema>

export const stopUpdateSchema = z.object({
  id: z.string().uuid(),
  address: z.string().min(1).max(2000).optional(),
  order: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional().nullable(),
})

export type StopUpdateInput = z.infer<typeof stopUpdateSchema>

// Stop state transitions
export const stopStatusUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(StopStatus),
  failReason: z.string().max(255).optional().nullable(),
})

export type StopStatusUpdateInput = z.infer<typeof stopStatusUpdateSchema>

// Re-export enums
export { RouteStatus, StopStatus }
