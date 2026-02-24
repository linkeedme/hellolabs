/**
 * Hello Labs — PriceTable + PriceItem Validators
 */
import { z } from 'zod'
import { paginationSchema } from './common'

// ── Price units ──────────────────────────────────────────────────
export const PRICE_UNITS = [
  { value: 'unit', label: 'Unidade' },
  { value: 'element', label: 'Elemento' },
  { value: 'arch', label: 'Arco' },
  { value: 'case', label: 'Caso' },
] as const

export const priceUnitValues = PRICE_UNITS.map((u) => u.value) as [string, ...string[]]

// ── PriceTable schemas ───────────────────────────────────────────
export const priceTableCreateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
})

export const priceTableUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(255).optional(),
  active: z.boolean().optional(),
})

export const priceTableListSchema = paginationSchema.extend({
  search: z.string().max(200).optional(),
})

// ── PriceItem schemas ────────────────────────────────────────────
export const priceItemCreateSchema = z.object({
  priceTableId: z.string().uuid(),
  serviceType: z.string().min(1, 'Tipo de servico obrigatorio').max(100),
  description: z.string().min(1, 'Descricao obrigatoria').max(500),
  unitPrice: z.coerce.number().min(0, 'Preco deve ser positivo'),
  priceUnit: z.enum(priceUnitValues).default('unit'),
})

export const priceItemUpdateSchema = z.object({
  id: z.string().uuid(),
  serviceType: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  priceUnit: z.enum(priceUnitValues).optional(),
})

// ── Types ────────────────────────────────────────────────────────
export type PriceTableCreateInput = z.infer<typeof priceTableCreateSchema>
export type PriceTableUpdateInput = z.infer<typeof priceTableUpdateSchema>
export type PriceTableListInput = z.infer<typeof priceTableListSchema>
export type PriceItemCreateInput = z.infer<typeof priceItemCreateSchema>
export type PriceItemUpdateInput = z.infer<typeof priceItemUpdateSchema>
