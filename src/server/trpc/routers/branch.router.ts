/**
 * Hello Labs — Branch Router
 * CRUD de filiais do laboratorio
 */
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter } from '../init'
import { adminProcedure, tenantProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import { branchCreateSchema, branchUpdateSchema, branchListSchema } from '@/lib/validators/branch'

export const branchRouter = createTRPCRouter({
  // ── List branches ────────────────────────────────────────────────
  list: tenantProcedure
    .input(branchListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
      }

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { address: { contains: input.search, mode: 'insensitive' } },
          { managerName: { contains: input.search, mode: 'insensitive' } },
        ]
      }

      const [branches, total] = await Promise.all([
        rawDb.branch.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: {
            _count: {
              select: { cases: true, equipment: true },
            },
          },
        }),
        rawDb.branch.count({ where }),
      ])

      return {
        items: branches.map((b: {
          id: string
          name: string
          address: string | null
          managerName: string | null
          cpfCnpj: string | null
          active: boolean
          createdAt: Date
          _count: { cases: number; equipment: number }
        }) => ({
          id: b.id,
          name: b.name,
          address: b.address,
          managerName: b.managerName,
          cpfCnpj: b.cpfCnpj,
          active: b.active,
          createdAt: b.createdAt,
          casesCount: b._count.cases,
          equipmentCount: b._count.equipment,
        })),
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),

  // ── Create branch ────────────────────────────────────────────────
  create: adminProcedure
    .input(branchCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const branch = await rawDb.branch.create({
        data: {
          tenantId: ctx.tenantId,
          name: input.name,
          address: input.address,
          managerName: input.managerName,
          cpfCnpj: input.cpfCnpj,
        },
      })

      return {
        id: branch.id,
        name: branch.name,
      }
    }),

  // ── Update branch ────────────────────────────────────────────────
  update: adminProcedure
    .input(branchUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.branch.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Filial nao encontrada.' })
      }

      const { id, ...data } = input
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.address !== undefined) updateData.address = data.address
      if (data.managerName !== undefined) updateData.managerName = data.managerName
      if (data.cpfCnpj !== undefined) updateData.cpfCnpj = data.cpfCnpj

      const branch = await rawDb.branch.update({
        where: { id },
        data: updateData,
      })

      return {
        id: branch.id,
        name: branch.name,
      }
    }),

  // ── Deactivate branch ────────────────────────────────────────────
  deactivate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.branch.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Filial nao encontrada.' })
      }

      await rawDb.branch.update({
        where: { id: input.id },
        data: { active: false },
      })

      return { success: true }
    }),

  // ── Reactivate branch ────────────────────────────────────────────
  reactivate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.branch.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Filial nao encontrada.' })
      }

      await rawDb.branch.update({
        where: { id: input.id },
        data: { active: true },
      })

      return { success: true }
    }),
})
