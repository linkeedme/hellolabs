/**
 * Hello Labs — Team Router
 * Gestao de colaboradores e roles
 */
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter } from '../init'
import { tenantProcedure, adminProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'

export const teamRouter = createTRPCRouter({
  // Listar membros da equipe
  list: tenantProcedure.query(async ({ ctx }) => {
    const members = await rawDb.tenantUser.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatarUrl,
      role: m.role,
      active: m.active,
      joinedAt: m.createdAt,
    }))
  }),

  // Atualizar role de um membro
  updateRole: adminProcedure
    .input(
      z.object({
        tenantUserId: z.string().uuid(),
        role: z.enum(['ADMIN', 'SUPERVISOR', 'TECHNICIAN', 'FINANCE', 'DRIVER', 'DENTIST']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = await rawDb.tenantUser.findUnique({
        where: { id: input.tenantUserId },
      })

      if (!member) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Membro nao encontrado.' })
      }

      // Impede remover o ultimo admin
      if (member.role === 'ADMIN' && input.role !== 'ADMIN') {
        const adminCount = await rawDb.tenantUser.count({
          where: { tenantId: ctx.tenantId, role: 'ADMIN', active: true },
        })
        if (adminCount <= 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'O laboratorio precisa ter pelo menos um administrador.',
          })
        }
      }

      return rawDb.tenantUser.update({
        where: { id: input.tenantUserId },
        data: { role: input.role },
      })
    }),

  // Desativar membro
  deactivate: adminProcedure
    .input(z.object({ tenantUserId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const member = await rawDb.tenantUser.findUnique({
        where: { id: input.tenantUserId },
      })

      if (!member) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Membro nao encontrado.' })
      }

      // Impede desativar a si mesmo
      if (member.userId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Voce nao pode desativar a si mesmo.',
        })
      }

      // Impede remover o ultimo admin
      if (member.role === 'ADMIN') {
        const adminCount = await rawDb.tenantUser.count({
          where: { tenantId: ctx.tenantId, role: 'ADMIN', active: true },
        })
        if (adminCount <= 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'O laboratorio precisa ter pelo menos um administrador.',
          })
        }
      }

      return rawDb.tenantUser.update({
        where: { id: input.tenantUserId },
        data: { active: false },
      })
    }),

  // Reativar membro
  reactivate: adminProcedure
    .input(z.object({ tenantUserId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return rawDb.tenantUser.update({
        where: { id: input.tenantUserId },
        data: { active: true },
      })
    }),
})
