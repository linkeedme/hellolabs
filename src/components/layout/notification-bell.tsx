'use client'

import Link from 'next/link'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { trpc } from '@/lib/trpc/client'
import { formatRelativeDate } from '@/lib/utils/format'

const NOTIFICATION_ICONS: Record<string, string> = {
  SLA_ALERT: '!',
  CASE_UPDATE: '#',
  PAYMENT_DUE: '$',
  INVOICE_SENT: '@',
  PAYMENT_RECEIVED: '$',
}

export function NotificationBell() {
  const utils = trpc.useUtils()

  const { data: countData } = trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  })

  const { data: listData } = trpc.notification.list.useQuery(
    { page: 1, perPage: 5, unreadOnly: true },
    { refetchInterval: 30000 },
  )

  const markAllMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate()
      utils.notification.list.invalidate()
    },
  })

  const markOneMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate()
      utils.notification.list.invalidate()
    },
  })

  const unreadCount = countData?.count ?? 0
  const notifications = listData?.items ?? []

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notificacoes</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notificacoes</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Marcar todas
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhuma notificacao nova.
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto divide-y">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  if (!n.read) markOneMutation.mutate({ id: n.id })
                }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {NOTIFICATION_ICONS[n.type] ?? '!'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeDate(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="border-t px-4 py-2">
          <Link
            href="/notifications"
            className="block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Ver todas
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
