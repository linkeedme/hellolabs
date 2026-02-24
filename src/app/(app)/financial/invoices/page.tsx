'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, FileText, MoreHorizontal, Send, X, CreditCard, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge, getInvoiceStatusBadge } from '@/components/shared/status-badge'
import { FinancialTabs } from '@/components/financial/financial-tabs'
import { InvoiceFormDialog } from '@/components/financial/invoice-form-dialog'
import { PaymentFormDialog } from '@/components/financial/payment-form-dialog'
import { OverdueList } from '@/components/financial/overdue-list'
import { trpc } from '@/lib/trpc/client'
import { formatMoney, formatDate } from '@/lib/utils/format'
import { useDebounce } from '@/lib/hooks/use-debounce'

export default function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean
    invoiceId: string
    remaining: number
  }>({ open: false, invoiceId: '', remaining: 0 })

  const debouncedSearch = useDebounce(search, 300)
  const utils = trpc.useUtils()

  const { data, isLoading } = trpc.financial.invoice.list.useQuery({
    page,
    perPage: 20,
    search: debouncedSearch || undefined,
    status: status
      ? (status as 'DRAFT' | 'SENT' | 'VIEWED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED')
      : undefined,
  })

  const sendMutation = trpc.financial.invoice.send.useMutation({
    onSuccess: () => {
      toast.success('Cobranca enviada!')
      utils.financial.invoice.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const cancelMutation = trpc.financial.invoice.cancel.useMutation({
    onSuccess: () => {
      toast.success('Cobranca cancelada.')
      utils.financial.invoice.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1c1d21]">Financeiro</h1>
          <p className="text-[14px] text-[#8181a5] mt-0.5">
            Ordens de servico, cobrancas e fluxo de caixa.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Cobranca
        </Button>
      </div>

      <FinancialTabs />

      {/* Overdue section */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Vencidas
        </h2>
        <OverdueList limit={5} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por cliente ou numero..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="max-w-sm"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v === 'ALL' ? '' : v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="DRAFT">Rascunho</SelectItem>
            <SelectItem value="SENT">Enviada</SelectItem>
            <SelectItem value="PAID">Paga</SelectItem>
            <SelectItem value="PARTIALLY_PAID">Parcial</SelectItem>
            <SelectItem value="OVERDUE">Vencida</SelectItem>
            <SelectItem value="CANCELLED">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma cobranca"
          description={
            search || status
              ? 'Nenhuma cobranca encontrada com os filtros selecionados.'
              : 'Crie uma cobranca a partir de ordens de servico emitidas.'
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead># Fatura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((inv) => {
                const badge = getInvoiceStatusBadge(inv.status)
                const remaining = Number(inv.total) - Number(inv.paidAmount)
                const isOverdue =
                  inv.status !== 'PAID' &&
                  inv.status !== 'CANCELLED' &&
                  new Date(inv.dueDate) < new Date()

                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">#{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.client?.name ?? '—'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(Number(inv.total))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(Number(inv.paidAmount))}
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={badge.label} variant={badge.variant} />
                    </TableCell>
                    <TableCell className={isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      {formatDate(inv.dueDate)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {inv.status === 'DRAFT' && (
                            <DropdownMenuItem
                              onClick={() => sendMutation.mutate({ id: inv.id })}
                              disabled={sendMutation.isPending}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Enviar
                            </DropdownMenuItem>
                          )}
                          {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                            <DropdownMenuItem
                              onClick={() =>
                                setPaymentDialog({
                                  open: true,
                                  invoiceId: inv.id,
                                  remaining,
                                })
                              }
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Registrar Pagamento
                            </DropdownMenuItem>
                          )}
                          {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => cancelMutation.mutate({ id: inv.id })}
                                disabled={cancelMutation.isPending}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancelar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data.total} resultado{data.total !== 1 ? 's' : ''}
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

      <InvoiceFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <PaymentFormDialog
        open={paymentDialog.open}
        onOpenChange={(open) => setPaymentDialog((prev) => ({ ...prev, open }))}
        invoiceId={paymentDialog.invoiceId}
        remainingAmount={paymentDialog.remaining}
      />
    </div>
  )
}
