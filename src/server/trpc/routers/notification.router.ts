/**
 * Hello Labs — Notification Router
 * Notificacoes internas do laboratorio
 */
import { createTRPCRouter } from '../init'
import { tenantProcedure } from '../procedures'
import { rawDb } from '@/server/db/client'
import {
  notificationListSchema,
  notificationMarkReadSchema,
  notificationDeleteSchema,
} from '@/lib/validators/notification'

export const notificationRouter = createTRPCRouter({
  // List notifications for current user
  list: tenantProcedure
    .input(notificationListSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        tenantId: ctx.tenantId,
        userId: ctx.user.id,
      }

      if (input.unreadOnly) {
        where.read = false
      }

      const [items, total] = await Promise.all([
        rawDb.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
        }),
        rawDb.notification.count({ where }),
      ])

      return {
        items,
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      }
    }),

  // Unread count for badge
  getUnreadCount: tenantProcedure
    .query(async ({ ctx }) => {
      const count = await rawDb.notification.count({
        where: {
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          read: false,
        },
      })
      return { count }
    }),

  // Mark single notification as read
  markAsRead: tenantProcedure
    .input(notificationMarkReadSchema)
    .mutation(async ({ ctx, input }) => {
      await rawDb.notification.updateMany({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
        },
        data: { read: true },
      })
      return { success: true }
    }),

  // Mark all notifications as read
  markAllAsRead: tenantProcedure
    .mutation(async ({ ctx }) => {
      await rawDb.notification.updateMany({
        where: {
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          read: false,
        },
        data: { read: true },
      })
      return { success: true }
    }),

  // Delete notification
  delete: tenantProcedure
    .input(notificationDeleteSchema)
    .mutation(async ({ ctx, input }) => {
      await rawDb.notification.deleteMany({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
        },
      })
      return { success: true }
    }),
})
