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
import { logCreateSchema } from '@/lib/validators/equipment'

type FormValues = z.input<typeof logCreateSchema>

const LOG_TYPES = [
  { value: 'manutencao', label: 'Manutencao' },
  { value: 'reparo', label: 'Reparo' },
  { value: 'calibracao', label: 'Calibracao' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'inspecao', label: 'Inspecao' },
  { value: 'outro', label: 'Outro' },
]

interface LogFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipmentId: string
}

export function LogFormDialog({ open, onOpenChange, equipmentId }: LogFormDialogProps) {
  const utils = trpc.useUtils()

  const createMutation = trpc.equipment.log.create.useMutation({
    onSuccess: () => {
      toast.success('Registro adicionado!')
      utils.equipment.log.list.invalidate()
      utils.equipment.equipment.getById.invalidate({ id: equipmentId })
      onOpenChange(false)
      reset()
    },
    onError: (e) => toast.error(e.message),
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(logCreateSchema),
    defaultValues: {
      equipmentId,
      type: 'manutencao',
      description: '',
    },
  })

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Registro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={watch('type')} onValueChange={(v) => setValue('type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOG_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Descricao *</Label>
            <Textarea rows={3} placeholder="Descreva o que foi feito..." {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
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
