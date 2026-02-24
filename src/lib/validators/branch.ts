/**
 * Hello Labs — Branch Validators
 */
import { z } from 'zod'
import { paginationSchema } from './common'

export const branchCreateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  address: z.string().max(500).optional(),
  managerName: z.string().max(255).optional(),
  cpfCnpj: z.string().max(18).optional(),
})

export const branchUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255).optional(),
  address: z.string().max(500).optional().nullable(),
  managerName: z.string().max(255).optional().nullable(),
  cpfCnpj: z.string().max(18).optional().nullable(),
})

export const branchListSchema = paginationSchema.extend({
  search: z.string().max(200).optional(),
})

export type BranchCreateInput = z.infer<typeof branchCreateSchema>
export type BranchUpdateInput = z.infer<typeof branchUpdateSchema>
export type BranchListInput = z.infer<typeof branchListSchema>
