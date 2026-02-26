import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { AsyncLocalStorage } from 'async_hooks'

// Tenant context via AsyncLocalStorage (thread-safe)
export const tenantContext = new AsyncLocalStorage<{ tenantId: string }>()

export function getCurrentTenantId(): string {
  const ctx = tenantContext.getStore()
  if (!ctx?.tenantId) {
    throw new Error('Tenant context not set. Ensure request passes through tenant middleware.')
  }
  return ctx.tenantId
}

// Tables that don't have tenant_id (system-wide)
const SYSTEM_TABLES = new Set([
  'Tenant',
  'User',
  'ProsthesisTemplate',
  'ProsthesisTemplateStage',
])

// Global singletons — survive Turbopack hot-reloads in development
const globalForPrisma = globalThis as unknown as {
  pgPool: Pool | undefined
  prisma: ReturnType<typeof createPrismaClient> | undefined
  rawPrisma: PrismaClient | undefined
}

function getPool() {
  if (globalForPrisma.pgPool) return globalForPrisma.pgPool

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.')
  }

  const pool = new Pool({ connectionString })
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pgPool = pool
  }
  return pool
}

function createPrismaClient() {
  const adapter = new PrismaPg(getPool())
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  return client.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (SYSTEM_TABLES.has(model)) return query(args)
          const tenantId = getCurrentTenantId()
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async findFirst({ model, args, query }) {
          if (SYSTEM_TABLES.has(model)) return query(args)
          const tenantId = getCurrentTenantId()
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async findUnique({ model, args, query }) {
          // findUnique doesn't support arbitrary where filters
          // Rely on RLS at DB level for isolation
          return query(args)
        },
        async create({ model, args, query }) {
          if (SYSTEM_TABLES.has(model)) return query(args)
          const tenantId = getCurrentTenantId()
          args.data = { ...args.data, tenantId } as typeof args.data
          return query(args)
        },
        async createMany({ model, args, query }) {
          if (SYSTEM_TABLES.has(model)) return query(args)
          const tenantId = getCurrentTenantId()
          if (Array.isArray(args.data)) {
            args.data = args.data.map((d: Record<string, unknown>) => ({ ...d, tenantId })) as typeof args.data
          } else {
            args.data = { ...(args.data as Record<string, unknown>), tenantId } as typeof args.data
          }
          return query(args)
        },
        async update({ model, args, query }) {
          if (SYSTEM_TABLES.has(model)) return query(args)
          const tenantId = getCurrentTenantId()
          args.where = { ...args.where, tenantId } as typeof args.where
          return query(args)
        },
        async updateMany({ model, args, query }) {
          if (SYSTEM_TABLES.has(model)) return query(args)
          const tenantId = getCurrentTenantId()
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async delete({ model, args, query }) {
          if (SYSTEM_TABLES.has(model)) return query(args)
          const tenantId = getCurrentTenantId()
          args.where = { ...args.where, tenantId } as typeof args.where
          return query(args)
        },
        async deleteMany({ model, args, query }) {
          if (SYSTEM_TABLES.has(model)) return query(args)
          const tenantId = getCurrentTenantId()
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async count({ model, args, query }) {
          if (SYSTEM_TABLES.has(model)) return query(args)
          const tenantId = getCurrentTenantId()
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async aggregate({ model, args, query }) {
          if (SYSTEM_TABLES.has(model)) return query(args)
          const tenantId = getCurrentTenantId()
          args.where = { ...args.where, tenantId }
          return query(args)
        },
      },
    },
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Raw prisma client without tenant middleware (for system operations like auth)
function createRawPrismaClient() {
  const adapter = new PrismaPg(getPool())
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const rawDb = globalForPrisma.rawPrisma ?? createRawPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.rawPrisma = rawDb
}
