/**
 * Hello Labs — Helper para criar notificacoes
 * Reutilizavel por qualquer router (financial, case, etc)
 */
import type { PrismaClient } from '@prisma/client'

// Accept both PrismaClient and $transaction client
type DbClient = Pick<PrismaClient, 'notification' | 'tenantUser'>

interface CreateNotificationParams {
  tenantId: string
  userId: string
  type: string
  title: string
  message: string
  refId?: string
  refType?: string
}

export async function createNotification(
  db: DbClient,
  params: CreateNotificationParams,
) {
  return db.notification.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      refId: params.refId,
      refType: params.refType,
    },
  })
}

export async function createNotificationsForTenantUsers(
  db: DbClient,
  params: Omit<CreateNotificationParams, 'userId'> & { excludeUserId?: string },
) {
  const tenantUsers = await db.tenantUser.findMany({
    where: {
      tenantId: params.tenantId,
      active: true,
      ...(params.excludeUserId ? { userId: { not: params.excludeUserId } } : {}),
    },
    select: { userId: true },
  })

  if (tenantUsers.length === 0) return

  await db.notification.createMany({
    data: tenantUsers.map((tu) => ({
      tenantId: params.tenantId,
      userId: tu.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      refId: params.refId,
      refType: params.refType,
    })),
  })
}
