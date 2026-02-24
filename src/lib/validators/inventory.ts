/**
 * Hello Labs — Inventory Validators (Zod Schemas)
 * Products, Lots, Stock Movements, Suppliers
 */
import { z } from 'zod'
import { MovementType } from '@prisma/client'
import { paginationSchema } from './common'

// ═══════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════

export const productCreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatorio').max(255),
  category: z.string().min(1, 'Categoria obrigatoria').max(100),
  brand: z.string().max(255).optional().nullable(),
  unit: z.string().min(1, 'Unidade obrigatoria').max(20),
  sku: z.string().max(50).optional().nullable(),
  barcode: z.string().max(50).optional().nullable(),
  qtyMin: z.number().min(0).default(0),
  qtyIdeal: z.number().min(0).default(0),
  hasExpiry: z.boolean().default(false),
  notes: z.string().max(5000).optional().nullable(),
})

export type ProductCreateInput = z.infer<typeof productCreateSchema>

export const productUpdateSchema = z.object({
  id: z.string().uuid(),
}).merge(productCreateSchema.partial())

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>

export const productListSchema = paginationSchema.extend({
  search: z.string().optional(),
  category: z.string().optional(),
  active: z.boolean().optional(),
  belowMin: z.boolean().optional(),
})

export type ProductListInput = z.infer<typeof productListSchema>

// ═══════════════════════════════════════════════
// LOTS
// ═══════════════════════════════════════════════

export const lotCreateSchema = z.object({
  productId: z.string().uuid(),
  lotNumber: z.string().min(1, 'Numero do lote obrigatorio').max(100),
  expiryDate: z.coerce.date().optional().nullable(),
  qty: z.number().positive('Quantidade deve ser positiva'),
})

export type LotCreateInput = z.infer<typeof lotCreateSchema>

// ═══════════════════════════════════════════════
// STOCK MOVEMENTS
// ═══════════════════════════════════════════════

export const movementCreateSchema = z.object({
  productId: z.string().uuid(),
  lotId: z.string().uuid().optional().nullable(),
  type: z.nativeEnum(MovementType),
  qty: z.number().positive('Quantidade deve ser positiva'),
  caseId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  unitCost: z.number().min(0).optional().nullable(),
  invoiceNumber: z.string().max(50).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export type MovementCreateInput = z.infer<typeof movementCreateSchema>

export const movementListSchema = paginationSchema.extend({
  productId: z.string().uuid().optional(),
  type: z.nativeEnum(MovementType).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export type MovementListInput = z.infer<typeof movementListSchema>

// ═══════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════

export const supplierCreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatorio').max(255),
  cnpj: z.string().transform((v) => v.replace(/\D/g, '')).pipe(
    z.string().refine((v) => v.length === 0 || v.length === 14, 'CNPJ deve ter 14 digitos'),
  ).optional().nullable(),
  email: z.string().email('Email invalido').max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  contactName: z.string().max(255).optional().nullable(),
  website: z.string().max(500).optional().nullable(),
  leadDays: z.number().int().min(0).optional().nullable(),
  paymentTerms: z.string().max(255).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
})

export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>

export const supplierUpdateSchema = z.object({
  id: z.string().uuid(),
}).merge(supplierCreateSchema.partial())

export type SupplierUpdateInput = z.infer<typeof supplierUpdateSchema>

export const supplierListSchema = paginationSchema.extend({
  search: z.string().optional(),
  active: z.boolean().optional(),
})

export type SupplierListInput = z.infer<typeof supplierListSchema>

// ═══════════════════════════════════════════════
// SUPPLIER-PRODUCT LINK
// ═══════════════════════════════════════════════

export const supplierProductLinkSchema = z.object({
  supplierId: z.string().uuid(),
  productId: z.string().uuid(),
})

export type SupplierProductLinkInput = z.infer<typeof supplierProductLinkSchema>

// Re-export enum
export { MovementType }
