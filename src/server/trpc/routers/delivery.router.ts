/**
 * Hello Labs — Delivery Router
 * Routes, Stops, State Machine transitions
 */
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter } from '../init'
import { tenantProcedure, supervisorProcedure, driverProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import {
  routeCreateSchema,
  routeUpdateSchema,
  routeListSchema,
  routePublishSchema,
  routeStartSchema,
  routeCompleteSchema,
  stopCreateSchema,
  stopUpdateSchema,
  stopStatusUpdateSchema,
} from '@/lib/validators/delivery'

// ═══════════════════════════════════════════════
// ROUTE SUB-ROUTER
// ═══════════════════════════════════════════════

const routeRouter = createTRPCRouter({
  list: tenantProcedure
    .input(routeListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
      }

      if (input.status) where.status = input.status
      if (input.driverId) where.driverId = input.driverId

      if (input.dateFrom || input.dateTo) {
        const dateFilter: Record<string, unknown> = {}
        if (input.dateFrom) dateFilter.gte = input.dateFrom
        if (input.dateTo) dateFilter.lte = input.dateTo
        where.date = dateFilter
      }

      const [items, total] = await Promise.all([
        rawDb.deliveryRoute.findMany({
          where,
          orderBy: { date: 'desc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: {
            stops: {
              orderBy: { order: 'asc' },
            },
          },
        }),
        rawDb.deliveryRoute.count({ where }),
      ])

      // Enrich with driver name
      const driverIds = [...new Set(items.map((r) => r.driverId))]
      const drivers = await rawDb.user.findMany({
        where: { id: { in: driverIds } },
        select: { id: true, name: true },
      })
      const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d.name]))

      const enrichedItems = items.map((r) => ({
        ...r,
        driverName: driverMap[r.driverId] ?? 'Desconhecido',
      }))

      return {
        items: enrichedItems,
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const route = await rawDb.deliveryRoute.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          stops: { orderBy: { order: 'asc' } },
          deliveries: true,
        },
      })

      if (!route) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Rota nao encontrada' })
      }

      // Get driver name
      const driver = await rawDb.user.findUnique({
        where: { id: route.driverId },
        select: { name: true },
      })

      return { ...route, driverName: driver?.name ?? 'Desconhecido' }
    }),

  create: supervisorProcedure
    .input(routeCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return rawDb.deliveryRoute.create({
        data: {
          tenantId: ctx.tenantId,
          driverId: input.driverId,
          date: input.date,
        },
      })
    }),

  update: supervisorProcedure
    .input(routeUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const existing = await rawDb.deliveryRoute.findFirst({
        where: { id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Rota nao encontrada' })
      }

      if (existing.status !== 'DRAFT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Somente rotas em rascunho podem ser editadas' })
      }

      return rawDb.deliveryRoute.update({ where: { id }, data })
    }),

  delete: supervisorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.deliveryRoute.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Rota nao encontrada' })
      }

      if (existing.status !== 'DRAFT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Somente rotas em rascunho podem ser excluidas' })
      }

      await rawDb.deliveryRoute.delete({ where: { id: input.id } })
      return { success: true }
    }),

  // State machine transitions: DRAFT → PUBLISHED → IN_PROGRESS → COMPLETED
  publish: supervisorProcedure
    .input(routePublishSchema)
    .mutation(async ({ ctx, input }) => {
      const route = await rawDb.deliveryRoute.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { stops: true },
      })

      if (!route) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Rota nao encontrada' })
      }

      if (route.status !== 'DRAFT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Somente rotas em rascunho podem ser publicadas' })
      }

      if (route.stops.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Adicione pelo menos uma parada antes de publicar' })
      }

      return rawDb.deliveryRoute.update({
        where: { id: input.id },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      })
    }),

  start: driverProcedure
    .input(routeStartSchema)
    .mutation(async ({ ctx, input }) => {
      const route = await rawDb.deliveryRoute.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!route) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Rota nao encontrada' })
      }

      if (route.status !== 'PUBLISHED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Somente rotas publicadas podem ser iniciadas' })
      }

      return rawDb.deliveryRoute.update({
        where: { id: input.id },
        data: { status: 'IN_PROGRESS' },
      })
    }),

  complete: driverProcedure
    .input(routeCompleteSchema)
    .mutation(async ({ ctx, input }) => {
      const route = await rawDb.deliveryRoute.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!route) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Rota nao encontrada' })
      }

      if (route.status !== 'IN_PROGRESS') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Somente rotas em andamento podem ser concluidas' })
      }

      return rawDb.deliveryRoute.update({
        where: { id: input.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      })
    }),

  // List available drivers (users with DRIVER role)
  drivers: tenantProcedure
    .query(async ({ ctx }) => {
      const members = await rawDb.tenantUser.findMany({
        where: { tenantId: ctx.tenantId, role: 'DRIVER', active: true },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

      return members.map((m) => m.user)
    }),
})

// ═══════════════════════════════════════════════
// STOP SUB-ROUTER
// ═══════════════════════════════════════════════

const stopRouter = createTRPCRouter({
  create: supervisorProcedure
    .input(stopCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify route belongs to tenant and is DRAFT
      const route = await rawDb.deliveryRoute.findFirst({
        where: { id: input.routeId, tenantId: ctx.tenantId },
      })

      if (!route) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Rota nao encontrada' })
      }

      if (route.status !== 'DRAFT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Somente rotas em rascunho podem receber paradas' })
      }

      return rawDb.deliveryStop.create({ data: input })
    }),

  update: supervisorProcedure
    .input(stopUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const stop = await rawDb.deliveryStop.findFirst({
        where: { id },
        include: { route: { select: { tenantId: true, status: true } } },
      })

      if (!stop || stop.route.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Parada nao encontrada' })
      }

      if (stop.route.status !== 'DRAFT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Somente paradas de rotas em rascunho podem ser editadas' })
      }

      return rawDb.deliveryStop.update({ where: { id }, data })
    }),

  updateStatus: driverProcedure
    .input(stopStatusUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const stop = await rawDb.deliveryStop.findFirst({
        where: { id: input.id },
        include: { route: { select: { tenantId: true, status: true } } },
      })

      if (!stop || stop.route.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Parada nao encontrada' })
      }

      if (stop.route.status !== 'IN_PROGRESS') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Somente paradas de rotas em andamento podem ser atualizadas' })
      }

      const updateData: Record<string, unknown> = { status: input.status }

      if (input.status === 'EN_ROUTE') {
        updateData.arrivedAt = new Date()
      } else if (input.status === 'DELIVERED') {
        updateData.deliveredAt = new Date()
      } else if (input.status === 'FAILED') {
        updateData.failReason = input.failReason ?? null
      }

      return rawDb.deliveryStop.update({ where: { id: input.id }, data: updateData })
    }),

  delete: supervisorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const stop = await rawDb.deliveryStop.findFirst({
        where: { id: input.id },
        include: { route: { select: { tenantId: true, status: true } } },
      })

      if (!stop || stop.route.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Parada nao encontrada' })
      }

      if (stop.route.status !== 'DRAFT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Somente paradas de rotas em rascunho podem ser excluidas' })
      }

      await rawDb.deliveryStop.delete({ where: { id: input.id } })
      return { success: true }
    }),
})

// ═══════════════════════════════════════════════
// MAIN DELIVERY ROUTER
// ═══════════════════════════════════════════════

export const deliveryRouter = createTRPCRouter({
  route: routeRouter,
  stop: stopRouter,
})
