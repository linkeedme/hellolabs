'use client'

import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { trpc } from '@/lib/trpc/client'
import { formatRelativeDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

const NOTIFICATION_ICONS: Record<string, string> = {
  SLA_ALERT: '!',
  CASE_UPDATE: '#',
  PAYMENT_DUE: '$',
  INVOICE_SENT: '@',
  PAYMENT_RECEIVED: '$',
}

const NOTIFICATION_LINKS: Record<string, string> = {
  Case: '/cases',
  Invoice: '/financial/invoices',
  ServiceOrder: '/financial/orders',
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<string>('all')

  const utils = trpc.useUtils()

  const { data, isLoading } = trpc.notification.list.useQuery({
    page,
    perPage: 20,
    unreadOnly: filter === 'unread',
  })

  const markAllMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success('Todas marcadas como lidas.')
      utils.notification.list.invalidate()
      utils.notification.getUnreadCount.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const markOneMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate()
      utils.notification.getUnreadCount.invalidate()
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1c1d21]">Notificacoes</h1>
          <p className="text-[14px] text-[#8181a5] mt-0.5">
            Todas as notificacoes do laboratorio.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Marcar todas como lidas
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="unread">Nao lidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nenhuma notificacao"
          description={
            filter === 'unread'
              ? 'Voce esta em dia! Nenhuma notificacao nao lida.'
              : 'Voce sera notificado sobre SLA, aprovacoes, estoque e cobrancas.'
          }
        />
      ) : (
        <>
          <div className="rounded-xl border border-[#f0f0f3] bg-white divide-y divide-[#f5f5fa]">
            {data.items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-4 px-4 py-3 hover:bg-[#fafafa] cursor-pointer transition-colors',
                  !n.read && 'bg-[rgba(94,129,244,0.04)]',
                )}
                onClick={() => {
                  if (!n.read) markOneMutation.mutate({ id: n.id })
                }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(94,129,244,0.1)] text-[#5e81f4] text-sm font-bold">
                  {NOTIFICATION_ICONS[n.type] ?? '!'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm', !n.read && 'font-semibold')}>{n.title}</p>
                    {!n.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#5e81f4]" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeDate(n.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data.total} notificacao{data.total !== 1 ? 'es' : ''}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="flex items-center text-sm text-muted-foreground px-2">
                  {page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Proximo
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
