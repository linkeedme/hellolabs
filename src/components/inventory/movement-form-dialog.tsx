'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

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
import { Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { movementCreateSchema } from '@/lib/validators/inventory'

type FormValues = z.input<typeof movementCreateSchema>

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  PURCHASE: 'Compra',
  CONSUMPTION: 'Consumo',
  ADJUSTMENT_POSITIVE: 'Ajuste (+)',
  ADJUSTMENT_NEGATIVE: 'Ajuste (-)',
  TRANSFER: 'Transferencia',
  RETURN: 'Devolucao',
}

interface MovementFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId?: string
}

export function MovementFormDialog({ open, onOpenChange, productId }: MovementFormDialogProps) {
  const utils = trpc.useUtils()

  const { data: products } = trpc.inventory.product.list.useQuery(
    { page: 1, perPage: 100, active: true },
    { enabled: open && !productId },
  )

  const { data: suppliers } = trpc.inventory.supplier.list.useQuery(
    { page: 1, perPage: 100, active: true },
    { enabled: open },
  )

  const createMutation = trpc.inventory.movement.create.useMutation({
    onSuccess: () => {
      toast.success('Movimentacao registrada!')
      utils.inventory.movement.list.invalidate()
      utils.inventory.product.list.invalidate()
      utils.inventory.alerts.invalidate()
      onOpenChange(false)
      reset()
    },
    onError: (e) => toast.error(e.message),
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(movementCreateSchema),
    defaultValues: {
      productId: productId ?? '',
      type: 'PURCHASE',
      qty: 0,
      supplierId: '',
      unitCost: 0,
      invoiceNumber: '',
      notes: '',
    },
  })

  const type = watch('type')
  const isPurchase = type === 'PURCHASE'

  const onSubmit = (data: FormValues) => {
    createMutation.mutate({
      ...data,
      supplierId: data.supplierId || undefined,
      unitCost: data.unitCost || undefined,
      invoiceNumber: data.invoiceNumber || undefined,
      notes: data.notes || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Movimentacao</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!productId && (
            <div className="space-y-2">
              <Label>Produto *</Label>
              <Select value={watch('productId')} onValueChange={(v) => setValue('productId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {products?.items.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({Number(p.qtyCurrent)} {p.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={type} onValueChange={(v) => setValue('type', v as FormValues['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MOVEMENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input type="number" min={0.001} step="0.001" {...register('qty', { valueAsNumber: true })} />
              {errors.qty && <p className="text-xs text-destructive">{errors.qty.message}</p>}
            </div>
          </div>

          {isPurchase && (
            <>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={watch('supplierId') ?? ''} onValueChange={(v) => setValue('supplierId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.items.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Custo unitario (R$)</Label>
                  <Input type="number" min={0} step="0.01" {...register('unitCost', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Nr. nota fiscal</Label>
                  <Input placeholder="NF-001" {...register('invoiceNumber')} />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea rows={2} placeholder="Motivo da movimentacao..." {...register('notes')} />
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
