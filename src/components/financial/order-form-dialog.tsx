'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { soCreateSchema } from '@/lib/validators/financial'
import { formatMoney } from '@/lib/utils/format'

type FormValues = z.input<typeof soCreateSchema>

interface OrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId?: string
}

export function OrderFormDialog({ open, onOpenChange, caseId }: OrderFormDialogProps) {
  const [selectedCaseId, setSelectedCaseId] = useState(caseId ?? '')
  const [caseSearch, setCaseSearch] = useState('')

  const utils = trpc.useUtils()

  const { data: casesData } = trpc.case.list.useQuery(
    { page: 1, perPage: 20, search: caseSearch || undefined },
    { enabled: open },
  )

  const createMutation = trpc.financial.so.create.useMutation({
    onSuccess: () => {
      toast.success('Ordem de servico criada!')
      utils.financial.so.list.invalidate()
      onOpenChange(false)
      reset()
    },
    onError: (e) => toast.error(e.message),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(soCreateSchema),
    defaultValues: {
      caseId: caseId ?? '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      discount: 0,
      notes: '',
    },
  })

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = form

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const items = watch('items')
  const discount = watch('discount') ?? 0

  const subtotal = (items ?? []).reduce(
    (sum, item) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0),
    0,
  )
  const total = Math.max(0, subtotal - discount)

  // Sync selectedCaseId with form
  useEffect(() => {
    if (selectedCaseId) {
      setValue('caseId', selectedCaseId)
    }
  }, [selectedCaseId, setValue])

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Servico</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Case selector */}
          <div className="space-y-2">
            <Label>Caso</Label>
            {caseId ? (
              <Input value={caseId} disabled className="text-sm" />
            ) : (
              <>
                <Input
                  placeholder="Buscar caso por paciente..."
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  className="mb-2"
                />
                <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um caso" />
                  </SelectTrigger>
                  <SelectContent>
                    {casesData?.items.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        #{c.caseNumber} — {c.patientName} ({c.client.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            {errors.caseId && (
              <p className="text-xs text-destructive">{errors.caseId.message}</p>
            )}
          </div>

          {/* Items table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Itens</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
              >
                <Plus className="mr-1 h-3 w-3" /> Adicionar item
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Descricao"
                      {...register(`items.${index}.description`)}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Qtd"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Valor unit."
                      {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="w-24 text-right text-sm font-medium leading-10">
                    {formatMoney((items?.[index]?.quantity ?? 0) * (items?.[index]?.unitPrice ?? 0))}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {errors.items && (
              <p className="text-xs text-destructive">
                {typeof errors.items.message === 'string' ? errors.items.message : 'Verifique os itens'}
              </p>
            )}
          </div>

          {/* Discount */}
          <div className="space-y-2">
            <Label>Desconto (R$)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              {...register('discount', { valueAsNumber: true })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea rows={2} {...register('notes')} />
          </div>

          {/* Totals */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <span className="text-destructive">-{formatMoney(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold border-t pt-1">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar OS
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
