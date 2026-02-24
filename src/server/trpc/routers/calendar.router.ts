/**
 * Hello Labs — Calendar Router
 * Calendar Events CRUD, list by date range, upcoming
 */
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter } from '../init'
import { tenantProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import {
  calendarEventCreateSchema,
  calendarEventUpdateSchema,
  calendarListSchema,
  calendarUpcomingSchema,
} from '@/lib/validators/calendar'

export const calendarRouter = createTRPCRouter({
  list: tenantProcedure
    .input(calendarListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
        date: {
          gte: input.dateFrom,
          lte: input.dateTo,
        },
      }

      if (input.type) where.type = input.type

      const items = await rawDb.calendarEvent.findMany({
        where,
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
      })

      return items
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await rawDb.calendarEvent.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Evento nao encontrado' })
      }

      return event
    }),

  create: tenantProcedure
    .input(calendarEventCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { time, ...rest } = input

      const event = await rawDb.calendarEvent.create({
        data: {
          tenantId: ctx.tenantId,
          createdBy: ctx.user.id,
          ...rest,
          // Convert "HH:mm" string to Date for @db.Time column
          time: time ? new Date(1970, 0, 1, parseInt(time.split(':')[0]), parseInt(time.split(':')[1])) : null,
        },
      })

      return event
    }),

  update: tenantProcedure
    .input(calendarEventUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, time, ...data } = input

      const existing = await rawDb.calendarEvent.findFirst({
        where: { id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Evento nao encontrado' })
      }

      const updateData: Record<string, unknown> = { ...data }
      if (time !== undefined) {
        updateData.time = time ? new Date(1970, 0, 1, parseInt(time.split(':')[0]), parseInt(time.split(':')[1])) : null
      }

      return rawDb.calendarEvent.update({
        where: { id },
        data: updateData,
      })
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await rawDb.calendarEvent.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Evento nao encontrado' })
      }

      await rawDb.calendarEvent.delete({ where: { id: input.id } })
      return { success: true }
    }),

  upcoming: tenantProcedure
    .input(calendarUpcomingSchema)
    .query(async ({ ctx, input }) => {
      const now = new Date()
      const end = new Date()
      end.setDate(end.getDate() + input.days)

      const where = {
        tenantId: ctx.tenantId,
        date: {
          gte: now,
          lte: end,
        },
      }

      const [items, total] = await Promise.all([
        rawDb.calendarEvent.findMany({
          where,
          orderBy: [{ date: 'asc' }, { time: 'asc' }],
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
        }),
        rawDb.calendarEvent.count({ where }),
      ])

      return {
        items,
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),
})
