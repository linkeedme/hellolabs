/**
 * Hello Labs — Financial Validators (Zod Schemas)
 * Service Orders, Invoices, Payments, Credits, Cash Flow
 */
import { z } from 'zod'
import { OSStatus, InvoiceStatus } from '@prisma/client'
import { paginationSchema } from './common'

// ═══════════════════════════════════════════════
// SERVICE ORDERS
// ═══════════════════════════════════════════════

const soItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
})

export const soCreateSchema = z.object({
  caseId: z.string().uuid(),
  items: z.array(soItemSchema).min(1, 'Adicione pelo menos 1 item'),
  discount: z.number().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
})

export type SOCreateInput = z.infer<typeof soCreateSchema>

export const soUpdateSchema = z.object({
  id: z.string().uuid(),
}).merge(soCreateSchema.partial())

export type SOUpdateInput = z.infer<typeof soUpdateSchema>

export const soListSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.nativeEnum(OSStatus).optional(),
  clientId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export type SOListInput = z.infer<typeof soListSchema>

export const soIssueSchema = z.object({
  id: z.string().uuid(),
})

export const soMarkPaidSchema = z.object({
  id: z.string().uuid(),
})

export const soCancelSchema = z.object({
  id: z.string().uuid(),
})

// ═══════════════════════════════════════════════
// INVOICES
// ═══════════════════════════════════════════════

export const invoiceCreateSchema = z.object({
  clientId: z.string().uuid(),
  serviceOrderIds: z.array(z.string().uuid()).min(1, 'Selecione pelo menos 1 ordem de servico'),
  dueDate: z.coerce.date(),
  notes: z.string().max(2000).optional().nullable(),
})

export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>

export const invoiceListSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  clientId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export type InvoiceListInput = z.infer<typeof invoiceListSchema>

export const invoiceSendSchema = z.object({
  id: z.string().uuid(),
})

export const invoiceCancelSchema = z.object({
  id: z.string().uuid(),
})

const REMINDER_TEMPLATES = ['cordial', 'firme', 'urgente'] as const

export const invoiceSendReminderSchema = z.object({
  id: z.string().uuid(),
  template: z.enum(REMINDER_TEMPLATES),
})

export type InvoiceSendReminderInput = z.infer<typeof invoiceSendReminderSchema>

// ═══════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════

export const paymentCreateSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive('Valor deve ser positivo'),
  method: z.string().min(1).max(50),
  paidAt: z.coerce.date().optional(),
  notes: z.string().max(1000).optional().nullable(),
})

export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>

export const paymentListSchema = z.object({
  invoiceId: z.string().uuid(),
})

// ═══════════════════════════════════════════════
// CREDITS
// ═══════════════════════════════════════════════

export const creditCreateSchema = z.object({
  clientId: z.string().uuid(),
  amount: z.number().positive('Valor deve ser positivo'),
  reason: z.string().min(1).max(500),
})

export type CreditCreateInput = z.infer<typeof creditCreateSchema>

export const creditListSchema = z.object({
  clientId: z.string().uuid(),
})

// ═══════════════════════════════════════════════
// CASH FLOW & REPORTS
// ═══════════════════════════════════════════════

export const cashFlowSchema = z.object({
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
  groupBy: z.enum(['day', 'week', 'month']).default('month'),
})

export type CashFlowInput = z.infer<typeof cashFlowSchema>

export const revenueReportSchema = z.object({
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
})

export type RevenueReportInput = z.infer<typeof revenueReportSchema>

// Re-export enums
export { OSStatus, InvoiceStatus }
