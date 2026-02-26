'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Receipt, MoreHorizontal, FileCheck, X, Loader2, Download } from 'lucide-react'

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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge, getOSStatusBadge } from '@/components/shared/status-badge'
import { FinancialTabs } from '@/components/financial/financial-tabs'
import { OrderFormDialog } from '@/components/financial/order-form-dialog'
import { PdfDownloadButton } from '@/components/shared/pdf-download-button'
import { trpc } from '@/lib/trpc/client'
import { formatMoney, formatDate } from '@/lib/utils/format'
import { useDebounce } from '@/lib/hooks/use-debounce'

export default function FinancialOrdersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 300)
  const utils = trpc.useUtils()

  const { data, isLoading } = trpc.financial.so.list.useQuery({
    page,
    perPage: 20,
    search: debouncedSearch || undefined,
    status: status ? (status as 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED') : undefined,
  })

  const issueMutation = trpc.financial.so.issue.useMutation({
    onSuccess: () => {
      toast.success('OS emitida!')
      utils.financial.so.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const cancelMutation = trpc.financial.so.cancel.useMutation({
    onSuccess: () => {
      toast.success('OS cancelada.')
      utils.financial.so.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const markPaidMutation = trpc.financial.so.markPaid.useMutation({
    onSuccess: () => {
      toast.success('OS marcada como paga!')
      utils.financial.so.list.invalidate()
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
          Nova OS
        </Button>
      </div>

      <FinancialTabs />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por paciente, cliente ou numero..."
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
            <SelectItem value="ISSUED">Emitida</SelectItem>
            <SelectItem value="PAID">Paga</SelectItem>
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
          icon={Receipt}
          title="Nenhuma ordem de servico"
          description={
            search || status
              ? 'Nenhuma OS encontrada com os filtros selecionados.'
              : 'Crie um caso e emita a primeira OS para comecar.'
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead># OS</TableHead>
                <TableHead>Caso</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((so) => {
                const badge = getOSStatusBadge(so.status)
                return (
                  <TableRow key={so.id}>
                    <TableCell className="font-medium">#{so.orderNumber}</TableCell>
                    <TableCell>
                      {so.case ? (
                        <span className="text-sm">
                          #{so.case.caseNumber} — {so.case.patientName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{so.client?.name ?? '—'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(Number(so.total))}
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={badge.label} variant={badge.variant} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(so.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <PdfDownloadButton type="so" id={so.id} label="Baixar PDF" variant="ghost" size="sm" className="w-full justify-start px-2 py-1.5 h-auto font-normal" />
                          </DropdownMenuItem>
                          {so.status === 'DRAFT' && (
                            <DropdownMenuItem
                              onClick={() => issueMutation.mutate({ id: so.id })}
                              disabled={issueMutation.isPending}
                            >
                              <FileCheck className="mr-2 h-4 w-4" />
                              Emitir
                            </DropdownMenuItem>
                          )}
                          {so.status === 'ISSUED' && (
                            <DropdownMenuItem
                              onClick={() => markPaidMutation.mutate({ id: so.id })}
                              disabled={markPaidMutation.isPending}
                            >
                              <Receipt className="mr-2 h-4 w-4" />
                              Marcar como paga
                            </DropdownMenuItem>
                          )}
                          {so.status !== 'CANCELLED' && so.status !== 'PAID' && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => cancelMutation.mutate({ id: so.id })}
                              disabled={cancelMutation.isPending}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
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

      <OrderFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
