/**
 * Hello Labs — Notification Validators (Zod Schemas)
 */
import { z } from 'zod'
import { paginationSchema } from './common'

export const notificationListSchema = paginationSchema.extend({
  unreadOnly: z.boolean().default(false),
})

export type NotificationListInput = z.infer<typeof notificationListSchema>

export const notificationMarkReadSchema = z.object({
  id: z.string().uuid(),
})

export type NotificationMarkReadInput = z.infer<typeof notificationMarkReadSchema>

export const notificationDeleteSchema = z.object({
  id: z.string().uuid(),
})
