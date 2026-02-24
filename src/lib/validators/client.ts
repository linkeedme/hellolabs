/**
 * Hello Labs — Client Validators (Zod Schemas)
 * Client CRUD: Create, Update, List
 */
import { z } from 'zod'
import { ClientStatus } from '@prisma/client'
import { paginationSchema } from './common'

// ═══════════════════════════════════════════════
// CLIENT CREATE
// ═══════════════════════════════════════════════

export const clientCreateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  email: z.string().email('Email invalido').max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  whatsapp: z.string().max(20).optional().nullable(),
  cpfCnpj: z.string().max(18).optional().nullable(),
  cro: z.string().max(20).optional().nullable(),
  address: z.string().max(2000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  priceTableId: z.string().uuid().optional().nullable(),
  closingDay: z.number().int().min(1).max(31).optional().nullable(),
  paymentDays: z.number().int().min(0).max(120).optional().nullable(),
})

export type ClientCreateInput = z.infer<typeof clientCreateSchema>

// ═══════════════════════════════════════════════
// CLIENT UPDATE
// ═══════════════════════════════════════════════

export const clientUpdateSchema = z.object({
  id: z.string().uuid(),
}).merge(clientCreateSchema.partial())

export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>

// ═══════════════════════════════════════════════
// CLIENT LIST
// ═══════════════════════════════════════════════

export const clientListSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.nativeEnum(ClientStatus).optional(),
})

export type ClientListInput = z.infer<typeof clientListSchema>
