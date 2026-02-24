'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

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
import { trpc } from '@/lib/trpc/client'
import { creditCreateSchema } from '@/lib/validators/financial'

type FormValues = z.input<typeof creditCreateSchema>

interface CreditFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
}

export function CreditFormDialog({ open, onOpenChange, clientId, clientName }: CreditFormDialogProps) {
  const utils = trpc.useUtils()

  const createMutation = trpc.financial.credit.create.useMutation({
    onSuccess: () => {
      toast.success('Credito adicionado!')
      utils.financial.credit.listByClient.invalidate()
      onOpenChange(false)
      reset()
    },
    onError: (e) => toast.error(e.message),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(creditCreateSchema),
    defaultValues: {
      clientId,
      amount: 0,
      reason: '',
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = form

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Credito</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Cliente: <span className="font-medium text-foreground">{clientName}</span>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              min={0.01}
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Motivo</Label>
            <Input
              placeholder="Ex: cortesia, devolucao, desconto especial..."
              {...register('reason')}
            />
            {errors.reason && (
              <p className="text-xs text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Credito
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
