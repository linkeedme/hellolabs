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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { routeCreateSchema } from '@/lib/validators/delivery'

type FormValues = z.input<typeof routeCreateSchema>

interface RouteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RouteFormDialog({ open, onOpenChange }: RouteFormDialogProps) {
  const utils = trpc.useUtils()

  const { data: drivers } = trpc.delivery.route.drivers.useQuery(undefined, { enabled: open })

  const createMutation = trpc.delivery.route.create.useMutation({
    onSuccess: () => {
      toast.success('Rota criada!')
      utils.delivery.route.list.invalidate()
      onOpenChange(false)
      reset()
    },
    onError: (e) => toast.error(e.message),
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(routeCreateSchema),
    defaultValues: {
      driverId: '',
      date: '',
    },
  })

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Rota de Entrega</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Motorista *</Label>
            <Select value={watch('driverId')} onValueChange={(v) => setValue('driverId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motorista" />
              </SelectTrigger>
              <SelectContent>
                {(drivers ?? []).map((d: { id: string; name: string }) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.driverId && <p className="text-xs text-destructive">{errors.driverId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Data *</Label>
            <Input type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Rota
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
