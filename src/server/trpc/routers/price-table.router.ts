/**
 * Hello Labs — PriceTable + PriceItem Router
 * CRUD de tabelas de preco e itens
 */
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter } from '../init'
import { tenantProcedure, financeProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import {
  priceTableCreateSchema,
  priceTableUpdateSchema,
  priceTableListSchema,
  priceItemCreateSchema,
  priceItemUpdateSchema,
} from '@/lib/validators/price-table'

export const priceTableRouter = createTRPCRouter({
  // ── List price tables ────────────────────────────────────────────
  list: tenantProcedure
    .input(priceTableListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
      }

      if (input.search) {
        where.name = { contains: input.search, mode: 'insensitive' }
      }

      const [tables, total] = await Promise.all([
        rawDb.priceTable.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: {
            _count: {
              select: { items: true, clients: true },
            },
          },
        }),
        rawDb.priceTable.count({ where }),
      ])

      return {
        items: tables.map((t: {
          id: string
          name: string
          active: boolean
          createdAt: Date
          _count: { items: number; clients: number }
        }) => ({
          id: t.id,
          name: t.name,
          active: t.active,
          createdAt: t.createdAt,
          itemsCount: t._count.items,
          clientsCount: t._count.clients,
        })),
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),

  // ── Get by ID (with items) ───────────────────────────────────────
  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const table = await rawDb.priceTable.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          items: {
            orderBy: { serviceType: 'asc' },
          },
        },
      })

      if (!table) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tabela de preco nao encontrada.' })
      }

      return {
        id: table.id,
        name: table.name,
        active: table.active,
        createdAt: table.createdAt,
        items: table.items.map((i: {
          id: string
          serviceType: string
          description: string
          unitPrice: { toString: () => string }
          priceUnit: string
        }) => ({
          id: i.id,
          serviceType: i.serviceType,
          description: i.description,
          unitPrice: Number(i.unitPrice.toString()),
          priceUnit: i.priceUnit,
        })),
      }
    }),

  // ── Create price table ───────────────────────────────────────────
  create: financeProcedure
    .input(priceTableCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const table = await rawDb.priceTable.create({
        data: {
          tenantId: ctx.tenantId,
          name: input.name,
        },
      })

      return { id: table.id, name: table.name }
    }),

  // ── Update price table ───────────────────────────────────────────
  update: financeProcedure
    .input(priceTableUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.priceTable.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tabela de preco nao encontrada.' })
      }

      const { id, ...data } = input
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.active !== undefined) updateData.active = data.active

      const table = await rawDb.priceTable.update({
        where: { id },
        data: updateData,
      })

      return { id: table.id, name: table.name }
    }),

  // ── Deactivate price table ───────────────────────────────────────
  deactivate: financeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.priceTable.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tabela de preco nao encontrada.' })
      }

      await rawDb.priceTable.update({
        where: { id: input.id },
        data: { active: false },
      })

      return { success: true }
    }),

  // ── Add item to table ────────────────────────────────────────────
  addItem: financeProcedure
    .input(priceItemCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify table belongs to tenant
      const table = await rawDb.priceTable.findFirst({
        where: { id: input.priceTableId, tenantId: ctx.tenantId },
      })

      if (!table) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tabela de preco nao encontrada.' })
      }

      const item = await rawDb.priceItem.create({
        data: {
          priceTableId: input.priceTableId,
          serviceType: input.serviceType,
          description: input.description,
          unitPrice: input.unitPrice,
          priceUnit: input.priceUnit,
        },
      })

      return {
        id: item.id,
        serviceType: item.serviceType,
      }
    }),

  // ── Update item ──────────────────────────────────────────────────
  updateItem: financeProcedure
    .input(priceItemUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify item exists and belongs to tenant
      const item = await rawDb.priceItem.findFirst({
        where: { id: input.id },
        include: { priceTable: { select: { tenantId: true } } },
      })

      if (!item || item.priceTable.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Item nao encontrado.' })
      }

      const { id, ...data } = input
      const updateData: Record<string, unknown> = {}
      if (data.serviceType !== undefined) updateData.serviceType = data.serviceType
      if (data.description !== undefined) updateData.description = data.description
      if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice
      if (data.priceUnit !== undefined) updateData.priceUnit = data.priceUnit

      await rawDb.priceItem.update({
        where: { id },
        data: updateData,
      })

      return { success: true }
    }),

  // ── Remove item ──────────────────────────────────────────────────
  removeItem: financeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const item = await rawDb.priceItem.findFirst({
        where: { id: input.id },
        include: { priceTable: { select: { tenantId: true } } },
      })

      if (!item || item.priceTable.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Item nao encontrado.' })
      }

      await rawDb.priceItem.delete({ where: { id: input.id } })

      return { success: true }
    }),
})
