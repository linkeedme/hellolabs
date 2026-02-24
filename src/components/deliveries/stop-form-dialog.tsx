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
import { Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { stopCreateSchema } from '@/lib/validators/delivery'

type FormValues = z.input<typeof stopCreateSchema>

interface StopFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routeId: string
}

export function StopFormDialog({ open, onOpenChange, routeId }: StopFormDialogProps) {
  const utils = trpc.useUtils()

  const createMutation = trpc.delivery.stop.create.useMutation({
    onSuccess: () => {
      toast.success('Parada adicionada!')
      utils.delivery.route.list.invalidate()
      utils.delivery.route.getById.invalidate({ id: routeId })
      onOpenChange(false)
      reset()
    },
    onError: (e) => toast.error(e.message),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(stopCreateSchema),
    defaultValues: {
      routeId,
      caseId: '',
      address: '',
      order: 0,
      notes: '',
    },
  })

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Parada</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>ID do Caso *</Label>
            <Input placeholder="UUID do caso" {...register('caseId')} />
            {errors.caseId && <p className="text-xs text-destructive">{errors.caseId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Endereco *</Label>
            <Input placeholder="Av. Paulista 1500, Sao Paulo" {...register('address')} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Ordem</Label>
            <Input type="number" min={0} {...register('order', { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea rows={2} placeholder="Notas sobre a entrega..." {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Parada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
