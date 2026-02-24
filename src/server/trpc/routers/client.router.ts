/**
 * Hello Labs — Client Router
 * CRUD de clientes (dentistas/clinicas)
 */
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { ClientStatus } from '@prisma/client'
import { createTRPCRouter } from '../init'
import { tenantProcedure, supervisorProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import { paginationSchema } from '@/lib/validators/common'

const clientInput = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  whatsapp: z.string().max(20).optional().nullable(),
  cpfCnpj: z.string().max(18).optional().nullable(),
  cro: z.string().max(20).optional().nullable(),
  address: z.string().max(2000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  priceTableId: z.string().uuid().optional().nullable(),
  closingDay: z.number().int().min(1).max(31).optional().nullable(),
  paymentDays: z.number().int().min(0).max(120).optional().nullable(),
})

export const clientRouter = createTRPCRouter({
  // Listar clientes com paginacao e filtros
  list: tenantProcedure
    .input(
      paginationSchema.extend({
        search: z.string().optional(),
        status: z.nativeEnum(ClientStatus).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        tenantId: ctx.tenantId,
        ...(input.status && { status: input.status }),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' as const } },
            { email: { contains: input.search, mode: 'insensitive' as const } },
          ],
        }),
      }

      const [items, total] = await Promise.all([
        rawDb.client.findMany({
          where,
          orderBy: { name: 'asc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: {
            priceTable: { select: { id: true, name: true } },
            _count: { select: { cases: true } },
          },
        }),
        rawDb.client.count({ where }),
      ])

      return {
        items,
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),

  // Buscar cliente por ID
  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const client = await rawDb.client.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          priceTable: true,
          credits: { orderBy: { createdAt: 'desc' }, take: 10 },
          cases: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              caseNumber: true,
              patientName: true,
              status: true,
              prosthesisType: true,
              createdAt: true,
              slaDate: true,
            },
          },
        },
      })

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente nao encontrado.' })
      }

      return client
    }),

  // Criar cliente
  create: supervisorProcedure
    .input(clientInput)
    .mutation(async ({ ctx, input }) => {
      return rawDb.client.create({
        data: {
          tenantId: ctx.tenantId,
          ...input,
        },
      })
    }),

  // Atualizar cliente
  update: supervisorProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }).merge(clientInput.partial()),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const client = await rawDb.client.findFirst({
        where: { id, tenantId: ctx.tenantId },
      })

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente nao encontrado.' })
      }

      return rawDb.client.update({
        where: { id },
        data,
      })
    }),

  // Desativar cliente
  deactivate: supervisorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return rawDb.client.update({
        where: { id: input.id },
        data: { status: 'INACTIVE' },
      })
    }),
})
