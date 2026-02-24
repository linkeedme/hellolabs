/**
 * Hello Labs — Tenant Router
 * Configuracoes do laboratorio
 */
import { z } from 'zod'
import { createTRPCRouter } from '../init'
import { tenantProcedure, adminProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import type { Prisma } from '@prisma/client'

export const tenantRouter = createTRPCRouter({
  // Dados do tenant atual
  getCurrent: tenantProcedure.query(async ({ ctx }) => {
    const tenant = await rawDb.tenant.findFirst({
      where: { id: ctx.tenantId },
      include: {
        branches: { where: { active: true } },
      },
    })

    return tenant
  }),

  // Atualizar dados do laboratorio
  update: adminProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255).optional(),
        logoUrl: z.string().url().nullable().optional(),
        settings: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const current = await rawDb.tenant.findFirst({
        where: { id: ctx.tenantId },
        select: { settings: true },
      })

      const data: Prisma.TenantUpdateInput = {}
      if (input.name) data.name = input.name
      if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl
      if (input.settings) {
        data.settings = { ...(current?.settings as Record<string, unknown>), ...input.settings } as Prisma.InputJsonValue
      }

      return rawDb.tenant.update({
        where: { id: ctx.tenantId },
        data,
      })
    }),

  // Atualizar configuracoes especificas
  updateSettings: adminProcedure
    .input(z.record(z.string(), z.unknown()))
    .mutation(async ({ ctx, input }) => {
      const current = await rawDb.tenant.findFirst({
        where: { id: ctx.tenantId },
        select: { settings: true },
      })

      const mergedSettings = { ...(current?.settings as Record<string, unknown>), ...input }

      return rawDb.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          settings: mergedSettings as Prisma.InputJsonValue,
        },
      })
    }),
})
