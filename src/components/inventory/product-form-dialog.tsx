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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { productCreateSchema } from '@/lib/validators/inventory'
import { PRODUCT_CATEGORIES, UNITS } from '@/lib/constants/categories'

type FormValues = z.input<typeof productCreateSchema>

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: { id: string } & Partial<FormValues>
}

export function ProductFormDialog({ open, onOpenChange, editData }: ProductFormDialogProps) {
  const utils = trpc.useUtils()
  const isEditing = !!editData?.id

  const createMutation = trpc.inventory.product.create.useMutation({
    onSuccess: () => {
      toast.success('Produto criado!')
      utils.inventory.product.list.invalidate()
      utils.inventory.alerts.invalidate()
      onOpenChange(false)
      reset()
    },
    onError: (e) => toast.error(e.message),
  })

  const updateMutation = trpc.inventory.product.update.useMutation({
    onSuccess: () => {
      toast.success('Produto atualizado!')
      utils.inventory.product.list.invalidate()
      utils.inventory.alerts.invalidate()
      onOpenChange(false)
    },
    onError: (e) => toast.error(e.message),
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: editData?.name ?? '',
      category: editData?.category ?? '',
      brand: editData?.brand ?? '',
      unit: editData?.unit ?? '',
      sku: editData?.sku ?? '',
      barcode: editData?.barcode ?? '',
      qtyMin: editData?.qtyMin ?? 0,
      qtyIdeal: editData?.qtyIdeal ?? 0,
      hasExpiry: editData?.hasExpiry ?? false,
      notes: editData?.notes ?? '',
    },
  })

  const hasExpiry = watch('hasExpiry')
  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateMutation.mutate({ id: editData.id, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input placeholder="Ex: Ceramica IPS e.max" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={watch('category')} onValueChange={(v) => setValue('category', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Unidade *</Label>
              <Select value={watch('unit')} onValueChange={(v) => setValue('unit', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.abbr})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Marca</Label>
            <Input placeholder="Ex: Ivoclar" {...register('brand')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input placeholder="Ex: SKU-001" {...register('sku')} />
            </div>
            <div className="space-y-2">
              <Label>Codigo de barras</Label>
              <Input placeholder="Ex: 7891234567890" {...register('barcode')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Qtd. minima</Label>
              <Input type="number" min={0} step="0.001" {...register('qtyMin', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Qtd. ideal</Label>
              <Input type="number" min={0} step="0.001" {...register('qtyIdeal', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="hasExpiry"
              checked={hasExpiry}
              onCheckedChange={(v) => setValue('hasExpiry', !!v)}
            />
            <Label htmlFor="hasExpiry" className="text-sm font-normal">
              Controlar validade (lotes com data de vencimento)
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea rows={2} placeholder="Notas sobre o produto..." {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Produto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
