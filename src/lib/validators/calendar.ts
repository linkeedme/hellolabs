/**
 * Hello Labs — Calendar Validators (Zod Schemas)
 * Calendar Events
 */
import { z } from 'zod'
import { paginationSchema } from './common'

// ═══════════════════════════════════════════════
// CALENDAR EVENTS
// ═══════════════════════════════════════════════

export const calendarEventCreateSchema = z.object({
  title: z.string().min(1, 'Titulo obrigatorio').max(255),
  type: z.string().min(1, 'Tipo obrigatorio').max(50),
  date: z.coerce.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm').optional().nullable(),
  durationMin: z.number().int().min(1).max(1440).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  visibility: z.enum(['team', 'private']).default('team'),
  refId: z.string().uuid().optional().nullable(),
  refType: z.string().max(50).optional().nullable(),
})

export type CalendarEventCreateInput = z.infer<typeof calendarEventCreateSchema>

export const calendarEventUpdateSchema = z.object({
  id: z.string().uuid(),
}).merge(calendarEventCreateSchema.partial())

export type CalendarEventUpdateInput = z.infer<typeof calendarEventUpdateSchema>

export const calendarListSchema = z.object({
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
  type: z.string().optional(),
})

export type CalendarListInput = z.infer<typeof calendarListSchema>

export const calendarUpcomingSchema = paginationSchema.extend({
  days: z.number().int().min(1).max(90).default(14),
})

export type CalendarUpcomingInput = z.infer<typeof calendarUpcomingSchema>
