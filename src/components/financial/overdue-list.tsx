'use client'

import { AlertTriangle, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc/client'
import { formatMoney, formatDate } from '@/lib/utils/format'

function getDaysOverdue(dueDate: Date | string): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const now = new Date()
  const diff = now.getTime() - due.getTime()
  return Math.max(0, Math.floor(diff / 86400000))
}

function getOverdueColor(days: number): string {
  if (days <= 7) return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
  if (days <= 30) return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
  return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
}

function getOverdueLabel(days: number): string {
  if (days <= 7) return `${days}d atraso`
  if (days <= 30) return `${days}d atraso`
  return `${days}d atraso`
}

interface OverdueListProps {
  className?: string
  limit?: number
}

export function OverdueList({ className, limit }: OverdueListProps) {
  const utils = trpc.useUtils()

  const { data } = trpc.financial.invoice.list.useQuery({
    page: 1,
    perPage: limit ?? 50,
    status: 'OVERDUE',
  })

  const sendReminderMutation = trpc.financial.invoice.sendReminder.useMutation({
    onSuccess: () => {
      toast.success('Lembrete enviado!')
      utils.financial.invoice.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const overdueInvoices = (data?.items ?? []).filter((inv) => {
    const days = getDaysOverdue(inv.dueDate)
    return days > 0 || inv.status === 'OVERDUE'
  })

  if (overdueInvoices.length === 0) {
    return (
      <div className={cn('rounded-lg border p-4 text-center text-sm text-muted-foreground', className)}>
        Nenhuma cobranca vencida.
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {overdueInvoices.map((inv) => {
        const days = getDaysOverdue(inv.dueDate)
        const colorClass = getOverdueColor(days)

        return (
          <div
            key={inv.id}
            className={cn('rounded-lg border p-3 flex items-center gap-3', colorClass)}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                #{inv.invoiceNumber} — {inv.client?.name}
              </p>
              <p className="text-xs opacity-80">
                Vencida em {formatDate(inv.dueDate)} ({getOverdueLabel(days)})
              </p>
            </div>
            <span className="text-sm font-semibold shrink-0">
              {formatMoney(Number(inv.total))}
            </span>
            <Select
              onValueChange={(template) =>
                sendReminderMutation.mutate({
                  id: inv.id,
                  template: template as 'cordial' | 'firme' | 'urgente',
                })
              }
            >
              <SelectTrigger className="w-auto h-8 gap-1 bg-background">
                <Send className="h-3 w-3" />
                <SelectValue placeholder="Lembrete" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cordial">Cordial</SelectItem>
                <SelectItem value="firme">Firme</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      })}
    </div>
  )
}
