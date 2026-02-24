/**
 * Hello Labs — Auth Router
 * Signup do laboratorio (cria Tenant + TenantUser)
 * Login e geracao de convite
 */
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter } from '../init'
import { publicProcedure, protectedProcedure, tenantProcedure, adminProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import { generateUniqueSlug } from '@/lib/utils/slug'
import { randomBytes, createHash } from 'crypto'

export const authRouter = createTRPCRouter({
  // Criar tenant apos signup no Supabase Auth
  createTenant: protectedProcedure
    .input(
      z.object({
        labName: z.string().min(2).max(255),
        document: z.string().optional(), // CPF ou CNPJ
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verifica se usuario ja tem tenant
      const existing = await rawDb.tenantUser.findFirst({
        where: { userId: ctx.user.id, role: 'ADMIN' },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Voce ja possui um laboratorio cadastrado.',
        })
      }

      const slug = generateUniqueSlug(input.labName)

      // Cria tenant + vincula usuario como ADMIN
      const tenant = await rawDb.tenant.create({
        data: {
          slug,
          name: input.labName,
          plan: 'SOLO',
          settings: {
            document: input.document || null,
            workHours: { start: '08:00', end: '18:00' },
            workDays: [1, 2, 3, 4, 5], // seg-sex
            holidays: [],
          },
          users: {
            create: {
              userId: ctx.user.id,
              role: 'ADMIN',
            },
          },
          sequences: {
            create: [
              { sequenceType: 'case_number' },
              { sequenceType: 'order_number' },
              { sequenceType: 'invoice_number' },
            ],
          },
        },
        include: {
          users: true,
        },
      })

      return { tenantId: tenant.id, slug: tenant.slug }
    }),

  // Informacoes do usuario logado
  me: protectedProcedure.query(async ({ ctx }) => {
    const tenantUsers = await rawDb.tenantUser.findMany({
      where: { userId: ctx.user.id, active: true },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true, logoUrl: true, plan: true },
        },
      },
    })

    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.user_metadata?.full_name || '',
      tenants: tenantUsers.map((tu) => ({
        tenantId: tu.tenant.id,
        name: tu.tenant.name,
        slug: tu.tenant.slug,
        logo: tu.tenant.logoUrl,
        plan: tu.tenant.plan,
        role: tu.role,
      })),
    }
  }),

  // Gerar link de convite
  generateInvite: adminProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        role: z.enum(['DENTIST', 'TECHNICIAN', 'SUPERVISOR', 'FINANCE', 'DRIVER']),
        expiresInDays: z.number().int().min(1).max(30).default(7),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const token = randomBytes(32).toString('hex')
      const tokenHash = createHash('sha256').update(token).digest('hex')

      await rawDb.inviteToken.create({
        data: {
          tenantId: ctx.tenantId,
          tokenHash,
          email: input.email || null,
          role: input.role,
          expiresAt: new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000),
        },
      })

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const inviteUrl = `${baseUrl}/invite/${token}`

      return { inviteUrl, token }
    }),

  // Aceitar convite
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const tokenHash = createHash('sha256').update(input.token).digest('hex')

      const invite = await rawDb.inviteToken.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      })

      if (!invite) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Convite invalido ou expirado.',
        })
      }

      // Verifica se email bate (se especificado no convite)
      if (invite.email && invite.email !== ctx.user.email) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Este convite foi enviado para outro email.',
        })
      }

      // Verifica se ja esta vinculado
      const existing = await rawDb.tenantUser.findFirst({
        where: { userId: ctx.user.id, tenantId: invite.tenantId },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Voce ja esta vinculado a este laboratorio.',
        })
      }

      // Cria vinculo e marca convite como usado
      await rawDb.$transaction([
        rawDb.tenantUser.create({
          data: {
            userId: ctx.user.id,
            tenantId: invite.tenantId,
            role: invite.role,
          },
        }),
        rawDb.inviteToken.update({
          where: { id: invite.id },
          data: { usedAt: new Date() },
        }),
      ])

      return { tenantId: invite.tenantId, role: invite.role }
    }),
})
