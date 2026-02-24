/**
 * Hello Labs — Hierarquia de Procedures tRPC (RBAC)
 *
 * publicProcedure           → Sem auth (login, signup)
 *   └─ protectedProcedure   → Requer auth
 *       └─ tenantProcedure  → Requer auth + tenant
 *           ├─ adminProcedure
 *           ├─ supervisorProcedure
 *           ├─ financeProcedure
 *           └─ driverProcedure
 */
import { TRPCError } from '@trpc/server'
import { baseProcedure } from './init'
import { tenantContext } from '@/server/db/client'
import type { Role } from '@prisma/client'

// Procedure publica — sem autenticacao
export const publicProcedure = baseProcedure

// Procedure protegida — requer usuario autenticado
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Voce precisa estar autenticado para acessar este recurso.',
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

// Procedure de tenant — requer auth + tenant ativo
export const tenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.tenantId || !ctx.role) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Voce nao esta vinculado a nenhum laboratorio.',
    })
  }

  // Executa dentro do contexto do tenant (AsyncLocalStorage)
  return tenantContext.run({ tenantId: ctx.tenantId }, () =>
    next({
      ctx: {
        ...ctx,
        tenantId: ctx.tenantId!,
        role: ctx.role as Role,
      },
    }),
  )
})

// Helper para criar procedures com role check
function createRoleProcedure(allowedRoles: Role[]) {
  return tenantProcedure.use(async ({ ctx, next }) => {
    if (!allowedRoles.includes(ctx.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Acesso restrito. Roles permitidos: ${allowedRoles.join(', ')}`,
      })
    }
    return next({ ctx })
  })
}

// Procedure Admin — somente ADMIN
export const adminProcedure = createRoleProcedure(['ADMIN'] as Role[])

// Procedure Supervisor — ADMIN ou SUPERVISOR
export const supervisorProcedure = createRoleProcedure(['ADMIN', 'SUPERVISOR'] as Role[])

// Procedure Financeiro — ADMIN ou FINANCE
export const financeProcedure = createRoleProcedure(['ADMIN', 'FINANCE'] as Role[])

// Procedure Entregador — ADMIN, SUPERVISOR ou DRIVER
export const driverProcedure = createRoleProcedure(['ADMIN', 'SUPERVISOR', 'DRIVER'] as Role[])

// Procedure Dentista — somente DENTIST
export const dentistProcedure = createRoleProcedure(['DENTIST'] as Role[])
