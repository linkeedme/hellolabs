/**
 * Hello Labs — AuditLog Validators
 */
import { z } from 'zod'
import { paginationSchema } from './common'

export const AUDIT_ENTITIES = [
  'Case',
  'ServiceOrder',
  'Invoice',
  'Payment',
  'Client',
  'Product',
  'Equipment',
  'Branch',
  'PriceTable',
  'CalendarEvent',
  'DeliveryRoute',
] as const

export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'STATUS_CHANGE',
] as const

export const auditLogListSchema = paginationSchema.extend({
  entity: z.string().max(50).optional(),
  action: z.string().max(50).optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export const auditLogByEntitySchema = z.object({
  entity: z.string().min(1).max(50),
  entityId: z.string().uuid(),
})

export type AuditLogListInput = z.infer<typeof auditLogListSchema>
export type AuditLogByEntityInput = z.infer<typeof auditLogByEntitySchema>
