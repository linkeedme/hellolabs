/**
 * Hello Labs — tRPC Initialization
 * Setup do contexto e instancia base do tRPC.
 */
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { createClient } from '@/lib/supabase/server'
import { rawDb } from '@/server/db/client'

/**
 * Context criado para cada request tRPC.
 * Contem o usuario autenticado e informacoes do tenant.
 */
export async function createTRPCContext(opts: { headers: Headers }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let tenantId: string | null = null
  let role: string | null = null

  if (user) {
    // Busca tenant ativo do usuario
    const tenantUser = await rawDb.tenantUser.findFirst({
      where: {
        userId: user.id,
        active: true,
      },
      select: {
        tenantId: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (tenantUser) {
      tenantId = tenantUser.tenantId
      role = tenantUser.role
    }
  }

  return {
    user,
    tenantId,
    role,
    headers: opts.headers,
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

/**
 * Instancia tRPC com superjson para serializar datas, etc.
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error
            ? undefined
            : undefined,
      },
    }
  },
})

export const createCallerFactory = t.createCallerFactory
export const createTRPCRouter = t.router
export const baseProcedure = t.procedure
