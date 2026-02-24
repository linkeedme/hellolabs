'use client'

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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc/client'
import { paymentCreateSchema } from '@/lib/validators/financial'
import { formatMoney } from '@/lib/utils/format'

type FormValues = z.input<typeof paymentCreateSchema>

const PAYMENT_METHODS = [
  'Pix',
  'Dinheiro',
  'Transferencia',
  'Boleto',
  'Cartao de Credito',
  'Cartao de Debito',
  'Outro',
]

interface PaymentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
  remainingAmount: number
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  invoiceId,
  remainingAmount,
}: PaymentFormDialogProps) {
  const utils = trpc.useUtils()

  const createMutation = trpc.financial.payment.register.useMutation({
    onSuccess: () => {
      toast.success('Pagamento registrado!')
      utils.financial.invoice.list.invalidate()
      utils.financial.invoice.getById.invalidate()
      utils.financial.payment.list.invalidate()
      onOpenChange(false)
      reset()
    },
    onError: (e) => toast.error(e.message),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(paymentCreateSchema),
    defaultValues: {
      invoiceId,
      amount: remainingAmount,
      method: '',
      paidAt: new Date(),
      notes: '',
    },
  })

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = form

  const paidAt = watch('paidAt')

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              Valor restante: <span className="font-semibold text-foreground">{formatMoney(remainingAmount)}</span>
            </p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              min={0.01}
              step="0.01"
              max={remainingAmount}
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Method */}
          <div className="space-y-2">
            <Label>Metodo de Pagamento</Label>
            <Select
              value={watch('method')}
              onValueChange={(v) => setValue('method', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.method && (
              <p className="text-xs text-destructive">{errors.method.message}</p>
            )}
          </div>

          {/* Paid at */}
          <div className="space-y-2">
            <Label>Data do Pagamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !paidAt && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paidAt ? format(paidAt instanceof Date ? paidAt : new Date(String(paidAt)), 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paidAt instanceof Date ? paidAt : paidAt ? new Date(String(paidAt)) : undefined}
                  onSelect={(d) => d && setValue('paidAt', d)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
