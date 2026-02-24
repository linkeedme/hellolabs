/**
 * Hello Labs — Equipment Router
 * Equipment CRUD, Logs, Furnace Programs, Calibrations, Printer Config
 */
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter } from '../init'
import { tenantProcedure, supervisorProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import {
  equipmentCreateSchema,
  equipmentUpdateSchema,
  equipmentListSchema,
  logCreateSchema,
  logListSchema,
  furnaceProgramCreateSchema,
  furnaceProgramUpdateSchema,
  furnaceCalibrationCreateSchema,
  printerConfigUpdateSchema,
} from '@/lib/validators/equipment'

// ═══════════════════════════════════════════════
// EQUIPMENT SUB-ROUTER
// ═══════════════════════════════════════════════

const equipmentCrudRouter = createTRPCRouter({
  list: tenantProcedure
    .input(equipmentListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
      }

      if (input.status) where.status = input.status
      if (input.type) where.type = input.type

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { brand: { contains: input.search, mode: 'insensitive' } },
          { model: { contains: input.search, mode: 'insensitive' } },
          { serialNumber: { contains: input.search, mode: 'insensitive' } },
        ]
      }

      const [items, total] = await Promise.all([
        rawDb.equipment.findMany({
          where,
          orderBy: { name: 'asc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
        }),
        rawDb.equipment.count({ where }),
      ])

      return {
        items,
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const eq = await rawDb.equipment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          programs: { orderBy: { name: 'asc' } },
          calibrations: { orderBy: { date: 'desc' }, take: 10 },
          printerConfig: true,
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { user: { select: { name: true } } },
          },
        },
      })

      if (!eq) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento nao encontrado' })
      }

      return eq
    }),

  create: supervisorProcedure
    .input(equipmentCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const eq = await rawDb.equipment.create({
        data: {
          tenantId: ctx.tenantId,
          ...input,
        },
      })

      return eq
    }),

  update: supervisorProcedure
    .input(equipmentUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const existing = await rawDb.equipment.findFirst({
        where: { id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento nao encontrado' })
      }

      const updated = await rawDb.equipment.update({
        where: { id },
        data,
      })

      return updated
    }),

  delete: supervisorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.equipment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento nao encontrado' })
      }

      await rawDb.equipment.delete({ where: { id: input.id } })

      return { success: true }
    }),
})

// ═══════════════════════════════════════════════
// LOG SUB-ROUTER
// ═══════════════════════════════════════════════

const logRouter = createTRPCRouter({
  list: tenantProcedure
    .input(logListSchema)
    .query(async ({ ctx, input }) => {
      // Verify equipment belongs to tenant
      const eq = await rawDb.equipment.findFirst({
        where: { id: input.equipmentId, tenantId: ctx.tenantId },
        select: { id: true },
      })

      if (!eq) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento nao encontrado' })
      }

      const where = { equipmentId: input.equipmentId }

      const [items, total] = await Promise.all([
        rawDb.equipmentLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: { user: { select: { name: true } } },
        }),
        rawDb.equipmentLog.count({ where }),
      ])

      return {
        items,
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),

  create: tenantProcedure
    .input(logCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify equipment belongs to tenant
      const eq = await rawDb.equipment.findFirst({
        where: { id: input.equipmentId, tenantId: ctx.tenantId },
        select: { id: true },
      })

      if (!eq) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento nao encontrado' })
      }

      const log = await rawDb.equipmentLog.create({
        data: {
          equipmentId: input.equipmentId,
          userId: ctx.user.id,
          type: input.type,
          description: input.description,
        },
      })

      return log
    }),
})

// ═══════════════════════════════════════════════
// FURNACE PROGRAM SUB-ROUTER
// ═══════════════════════════════════════════════

const furnaceProgramRouter = createTRPCRouter({
  list: tenantProcedure
    .input(z.object({ equipmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const eq = await rawDb.equipment.findFirst({
        where: { id: input.equipmentId, tenantId: ctx.tenantId },
        select: { id: true },
      })

      if (!eq) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento nao encontrado' })
      }

      return rawDb.furnaceProgram.findMany({
        where: { equipmentId: input.equipmentId },
        orderBy: { name: 'asc' },
      })
    }),

  create: supervisorProcedure
    .input(furnaceProgramCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const eq = await rawDb.equipment.findFirst({
        where: { id: input.equipmentId, tenantId: ctx.tenantId },
        select: { id: true },
      })

      if (!eq) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento nao encontrado' })
      }

      return rawDb.furnaceProgram.create({ data: input })
    }),

  update: supervisorProcedure
    .input(furnaceProgramUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const program = await rawDb.furnaceProgram.findFirst({
        where: { id },
        include: { equipment: { select: { tenantId: true } } },
      })

      if (!program || program.equipment.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Programa nao encontrado' })
      }

      return rawDb.furnaceProgram.update({ where: { id }, data })
    }),

  delete: supervisorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const program = await rawDb.furnaceProgram.findFirst({
        where: { id: input.id },
        include: { equipment: { select: { tenantId: true } } },
      })

      if (!program || program.equipment.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Programa nao encontrado' })
      }

      await rawDb.furnaceProgram.delete({ where: { id: input.id } })
      return { success: true }
    }),
})

// ═══════════════════════════════════════════════
// FURNACE CALIBRATION SUB-ROUTER
// ═══════════════════════════════════════════════

const furnaceCalibrationRouter = createTRPCRouter({
  list: tenantProcedure
    .input(z.object({ equipmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const eq = await rawDb.equipment.findFirst({
        where: { id: input.equipmentId, tenantId: ctx.tenantId },
        select: { id: true },
      })

      if (!eq) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento nao encontrado' })
      }

      return rawDb.furnaceCalibration.findMany({
        where: { equipmentId: input.equipmentId },
        orderBy: { date: 'desc' },
      })
    }),

  create: supervisorProcedure
    .input(furnaceCalibrationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const eq = await rawDb.equipment.findFirst({
        where: { id: input.equipmentId, tenantId: ctx.tenantId },
        select: { id: true },
      })

      if (!eq) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento nao encontrado' })
      }

      return rawDb.furnaceCalibration.create({ data: input })
    }),
})

// ═══════════════════════════════════════════════
// PRINTER CONFIG SUB-ROUTER
// ═══════════════════════════════════════════════

const printerConfigRouter = createTRPCRouter({
  get: tenantProcedure
    .input(z.object({ equipmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const eq = await rawDb.equipment.findFirst({
        where: { id: input.equipmentId, tenantId: ctx.tenantId },
        select: { id: true },
      })

      if (!eq) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento nao encontrado' })
      }

      return rawDb.printerConfig.findUnique({
        where: { equipmentId: input.equipmentId },
      })
    }),

  upsert: supervisorProcedure
    .input(printerConfigUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const eq = await rawDb.equipment.findFirst({
        where: { id: input.equipmentId, tenantId: ctx.tenantId },
        select: { id: true },
      })

      if (!eq) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento nao encontrado' })
      }

      const { equipmentId, ...data } = input

      return rawDb.printerConfig.upsert({
        where: { equipmentId },
        create: { equipmentId, ...data },
        update: data,
      })
    }),
})

// ═══════════════════════════════════════════════
// MAIN EQUIPMENT ROUTER
// ═══════════════════════════════════════════════

export const equipmentRouter = createTRPCRouter({
  equipment: equipmentCrudRouter,
  log: logRouter,
  furnaceProgram: furnaceProgramRouter,
  furnaceCalibration: furnaceCalibrationRouter,
  printerConfig: printerConfigRouter,
})
