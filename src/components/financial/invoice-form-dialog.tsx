'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc/client'
import { invoiceCreateSchema } from '@/lib/validators/financial'
import { formatMoney } from '@/lib/utils/format'

type FormValues = z.input<typeof invoiceCreateSchema>

interface InvoiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId?: string
}

export function InvoiceFormDialog({ open, onOpenChange, clientId }: InvoiceFormDialogProps) {
  const [selectedClientId, setSelectedClientId] = useState(clientId ?? '')
  const [clientSearch, setClientSearch] = useState('')
  const [selectedSOIds, setSelectedSOIds] = useState<string[]>([])

  const utils = trpc.useUtils()

  const { data: clientsData } = trpc.clients.list.useQuery(
    { page: 1, perPage: 50, search: clientSearch || undefined },
    { enabled: open },
  )

  // Fetch ISSUED SOs for the selected client (not yet linked to an invoice)
  const { data: sosData } = trpc.financial.so.list.useQuery(
    { page: 1, perPage: 100, status: 'ISSUED', clientId: selectedClientId || undefined },
    { enabled: open && !!selectedClientId },
  )

  const availableSOs = (sosData?.items ?? []).filter((so) => !so.invoice)

  const createMutation = trpc.financial.invoice.create.useMutation({
    onSuccess: () => {
      toast.success('Cobranca criada!')
      utils.financial.invoice.list.invalidate()
      onOpenChange(false)
      reset()
      setSelectedSOIds([])
      setSelectedClientId(clientId ?? '')
    },
    onError: (e) => toast.error(e.message),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(invoiceCreateSchema),
    defaultValues: {
      clientId: clientId ?? '',
      serviceOrderIds: [],
      dueDate: new Date(Date.now() + 30 * 86400000), // 30 days from now
      notes: '',
    },
  })

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = form

  const dueDate = watch('dueDate')

  const totalAmount = selectedSOIds.reduce((sum, soId) => {
    const so = availableSOs.find((s) => s.id === soId)
    return sum + (so ? Number(so.total) : 0)
  }, 0)

  const toggleSO = (soId: string) => {
    const next = selectedSOIds.includes(soId)
      ? selectedSOIds.filter((id) => id !== soId)
      : [...selectedSOIds, soId]
    setSelectedSOIds(next)
    setValue('serviceOrderIds', next)
  }

  const onSubmit = (data: FormValues) => {
    createMutation.mutate({
      ...data,
      clientId: selectedClientId,
      serviceOrderIds: selectedSOIds,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Cobranca</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Client selector */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            {clientId ? (
              <Input value={clientId} disabled className="text-sm" />
            ) : (
              <>
                <Input
                  placeholder="Buscar cliente..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="mb-2"
                />
                <Select
                  value={selectedClientId}
                  onValueChange={(v) => {
                    setSelectedClientId(v)
                    setSelectedSOIds([])
                    setValue('serviceOrderIds', [])
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsData?.items.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            {errors.clientId && (
              <p className="text-xs text-destructive">{errors.clientId.message}</p>
            )}
          </div>

          {/* SO selection */}
          <div className="space-y-2">
            <Label>Ordens de Servico (emitidas)</Label>
            {!selectedClientId ? (
              <p className="text-sm text-muted-foreground">Selecione um cliente primeiro.</p>
            ) : availableSOs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma OS emitida disponivel para este cliente.
              </p>
            ) : (
              <div className="rounded-lg border divide-y max-h-[240px] overflow-y-auto">
                {availableSOs.map((so) => (
                  <label
                    key={so.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedSOIds.includes(so.id)}
                      onCheckedChange={() => toggleSO(so.id)}
                    />
                    <span className="text-sm flex-1">
                      #{so.orderNumber} — {so.case?.patientName ?? 'Caso'}
                    </span>
                    <span className="text-sm font-medium">
                      {formatMoney(Number(so.total))}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {errors.serviceOrderIds && (
              <p className="text-xs text-destructive">{errors.serviceOrderIds.message}</p>
            )}
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <Label>Vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate instanceof Date ? dueDate : new Date(String(dueDate)), 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate instanceof Date ? dueDate : dueDate ? new Date(String(dueDate)) : undefined}
                  onSelect={(d) => d && setValue('dueDate', d)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {errors.dueDate && (
              <p className="text-xs text-destructive">{errors.dueDate.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea rows={2} {...register('notes')} />
          </div>

          {/* Total */}
          {selectedSOIds.length > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedSOIds.length} OS selecionada{selectedSOIds.length > 1 ? 's' : ''}
                </span>
                <span className="font-semibold text-base">{formatMoney(totalAmount)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || selectedSOIds.length === 0}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Cobranca
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
