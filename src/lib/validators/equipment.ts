/**
 * Hello Labs — Equipment Validators (Zod Schemas)
 * Equipment, Logs, Furnace Programs, Furnace Calibrations, Printer Config
 */
import { z } from 'zod'
import { EquipmentStatus } from '@prisma/client'
import { paginationSchema } from './common'

// ═══════════════════════════════════════════════
// EQUIPMENT
// ═══════════════════════════════════════════════

export const equipmentCreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatorio').max(255),
  type: z.string().min(1, 'Tipo obrigatorio').max(100),
  brand: z.string().max(255).optional().nullable(),
  model: z.string().max(255).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  acquiredAt: z.coerce.date().optional().nullable(),
  lastMaintenance: z.coerce.date().optional().nullable(),
  nextMaintenance: z.coerce.date().optional().nullable(),
  status: z.nativeEnum(EquipmentStatus).default('OPERATIONAL'),
  notes: z.string().max(5000).optional().nullable(),
  photoUrl: z.string().max(2000).optional().nullable(),
  manualUrl: z.string().max(2000).optional().nullable(),
})

export type EquipmentCreateInput = z.infer<typeof equipmentCreateSchema>

export const equipmentUpdateSchema = z.object({
  id: z.string().uuid(),
}).merge(equipmentCreateSchema.partial())

export type EquipmentUpdateInput = z.infer<typeof equipmentUpdateSchema>

export const equipmentListSchema = paginationSchema.extend({
  search: z.string().optional(),
  type: z.string().optional(),
  status: z.nativeEnum(EquipmentStatus).optional(),
})

export type EquipmentListInput = z.infer<typeof equipmentListSchema>

// ═══════════════════════════════════════════════
// EQUIPMENT LOGS
// ═══════════════════════════════════════════════

export const logCreateSchema = z.object({
  equipmentId: z.string().uuid(),
  type: z.string().min(1, 'Tipo obrigatorio').max(50),
  description: z.string().min(1, 'Descricao obrigatoria').max(5000),
})

export type LogCreateInput = z.infer<typeof logCreateSchema>

export const logListSchema = paginationSchema.extend({
  equipmentId: z.string().uuid(),
})

export type LogListInput = z.infer<typeof logListSchema>

// ═══════════════════════════════════════════════
// FURNACE PROGRAMS
// ═══════════════════════════════════════════════

export const furnaceProgramCreateSchema = z.object({
  equipmentId: z.string().uuid(),
  name: z.string().min(1, 'Nome obrigatorio').max(255),
  startTemp: z.number().int().min(0).max(2000).optional().nullable(),
  peakTemp: z.number().int().min(0).max(2000).optional().nullable(),
  heatingRate: z.number().int().min(0).max(200).optional().nullable(),
  holdTime: z.number().int().min(0).max(999).optional().nullable(),
  vacuumStartTemp: z.number().int().min(0).max(2000).optional().nullable(),
  vacuumEndTemp: z.number().int().min(0).max(2000).optional().nullable(),
  preDryTemp: z.number().int().min(0).max(500).optional().nullable(),
  preDryTime: z.number().int().min(0).max(999).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
})

export type FurnaceProgramCreateInput = z.infer<typeof furnaceProgramCreateSchema>

export const furnaceProgramUpdateSchema = z.object({
  id: z.string().uuid(),
}).merge(furnaceProgramCreateSchema.omit({ equipmentId: true }).partial())

export type FurnaceProgramUpdateInput = z.infer<typeof furnaceProgramUpdateSchema>

// ═══════════════════════════════════════════════
// FURNACE CALIBRATIONS
// ═══════════════════════════════════════════════

export const furnaceCalibrationCreateSchema = z.object({
  equipmentId: z.string().uuid(),
  date: z.coerce.date(),
  measuredTemp: z.number().int().min(0).max(2000),
  targetTemp: z.number().int().min(0).max(2000),
  deviation: z.number().int(),
  responsible: z.string().min(1, 'Responsavel obrigatorio').max(255),
  notes: z.string().max(5000).optional().nullable(),
})

export type FurnaceCalibrationCreateInput = z.infer<typeof furnaceCalibrationCreateSchema>

// ═══════════════════════════════════════════════
// PRINTER CONFIG
// ═══════════════════════════════════════════════

export const printerConfigUpdateSchema = z.object({
  equipmentId: z.string().uuid(),
  resinBrand: z.string().max(255).optional().nullable(),
  resinModel: z.string().max(255).optional().nullable(),
  resinColor: z.string().max(50).optional().nullable(),
  layerMicrons: z.number().int().min(1).max(500).optional().nullable(),
  exposureTime: z.number().min(0).max(999).optional().nullable(),
  postProcessingNotes: z.string().max(5000).optional().nullable(),
  fepLastChange: z.coerce.date().optional().nullable(),
  lcdLastChange: z.coerce.date().optional().nullable(),
})

export type PrinterConfigUpdateInput = z.infer<typeof printerConfigUpdateSchema>

// Re-export enum
export { EquipmentStatus }
