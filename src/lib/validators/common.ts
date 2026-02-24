/**
 * Hello Labs — Schemas Zod Reutilizaveis
 */
import { z } from 'zod'

// Paginacao padrao
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
})

export type PaginationInput = z.infer<typeof paginationSchema>

// Resposta paginada
export function paginatedResponse<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
    totalPages: z.number(),
  })
}

// ID UUID
export const uuidSchema = z.string().uuid()

// Ordenacao
export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

// Filtro de data
export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

// Busca textual
export const searchSchema = z.object({
  query: z.string().min(1).max(200).optional(),
})

// CPF (11 digitos)
export const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 11, 'CPF deve ter 11 digitos')

// CNPJ (14 digitos)
export const cnpjSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 14, 'CNPJ deve ter 14 digitos')

// CPF ou CNPJ
export const documentSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine(
    (v) => v.length === 11 || v.length === 14,
    'Documento deve ser CPF (11) ou CNPJ (14)',
  )

// Telefone brasileiro
export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine(
    (v) => v.length === 10 || v.length === 11,
    'Telefone deve ter 10 ou 11 digitos',
  )

// Email
export const emailSchema = z.string().email('Email invalido').max(255)

// CEP
export const cepSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 8, 'CEP deve ter 8 digitos')

// Valor monetario (em centavos)
export const moneySchema = z.number().int().min(0)

// Slug
export const slugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minusculas, numeros e hifens')
