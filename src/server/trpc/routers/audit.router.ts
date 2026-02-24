/**
 * Hello Labs — AuditLog Router
 * Consulta de logs de auditoria (read-only)
 */
import { createTRPCRouter } from '../init'
import { adminProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import { auditLogListSchema, auditLogByEntitySchema } from '@/lib/validators/audit'

export const auditRouter = createTRPCRouter({
  // ── List audit logs (paginated + filtered) ─────────────────────
  list: adminProcedure
    .input(auditLogListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
      }

      if (input.entity) where.entity = input.entity
      if (input.action) where.action = input.action
      if (input.userId) where.userId = input.userId
      if (input.dateFrom || input.dateTo) {
        const createdAt: Record<string, unknown> = {}
        if (input.dateFrom) createdAt.gte = input.dateFrom
        if (input.dateTo) createdAt.lte = input.dateTo
        where.createdAt = createdAt
      }

      const [logs, total] = await Promise.all([
        rawDb.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        }),
        rawDb.auditLog.count({ where }),
      ])

      return {
        items: logs.map((log: {
          id: string
          entity: string
          entityId: string
          action: string
          payloadBefore: unknown
          payloadAfter: unknown
          createdAt: Date
          user: { id: string; name: string; email: string } | null
        }) => ({
          id: log.id,
          entity: log.entity,
          entityId: log.entityId,
          action: log.action,
          createdAt: log.createdAt,
          userName: log.user?.name ?? 'Sistema',
          userEmail: log.user?.email ?? '',
          hasChanges: Boolean(log.payloadBefore || log.payloadAfter),
        })),
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),

  // ── Get all logs for a specific entity ─────────────────────────
  getByEntity: adminProcedure
    .input(auditLogByEntitySchema)
    .query(async ({ ctx, input }) => {
      const logs = await rawDb.auditLog.findMany({
        where: {
          tenantId: ctx.tenantId,
          entity: input.entity,
          entityId: input.entityId,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      })

      return logs.map((log: {
        id: string
        entity: string
        entityId: string
        action: string
        payloadBefore: unknown
        payloadAfter: unknown
        ipAddress: string | null
        createdAt: Date
        user: { id: string; name: string; email: string } | null
      }) => ({
        id: log.id,
        entity: log.entity,
        entityId: log.entityId,
        action: log.action,
        payloadBefore: log.payloadBefore,
        payloadAfter: log.payloadAfter,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
        userName: log.user?.name ?? 'Sistema',
        userEmail: log.user?.email ?? '',
      }))
    }),
})
