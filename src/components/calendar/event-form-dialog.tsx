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
import { calendarEventCreateSchema } from '@/lib/validators/calendar'

type FormValues = z.input<typeof calendarEventCreateSchema>

const EVENT_TYPES = [
  { value: 'entrega', label: 'Entrega', color: '#7ce7ac' },
  { value: 'producao', label: 'Producao', color: '#5e81f4' },
  { value: 'manutencao', label: 'Manutencao', color: '#f4be5e' },
  { value: 'calibracao', label: 'Calibracao', color: '#f4be5e' },
  { value: 'reuniao', label: 'Reuniao', color: '#5e81f4' },
  { value: 'outro', label: 'Outro', color: '#8181a5' },
]

const COLOR_OPTIONS = [
  { value: '#7ce7ac', label: 'Verde' },
  { value: '#5e81f4', label: 'Azul' },
  { value: '#f4be5e', label: 'Amarelo' },
  { value: '#ff808b', label: 'Vermelho' },
  { value: '#8181a5', label: 'Cinza' },
]

interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: { id: string } & Partial<FormValues>
  defaultDate?: string
}

export function EventFormDialog({ open, onOpenChange, editData, defaultDate }: EventFormDialogProps) {
  const utils = trpc.useUtils()
  const isEditing = !!editData?.id

  const createMutation = trpc.calendar.create.useMutation({
    onSuccess: () => {
      toast.success('Evento criado!')
      utils.calendar.list.invalidate()
      utils.calendar.upcoming.invalidate()
      onOpenChange(false)
      reset()
    },
    onError: (e) => toast.error(e.message),
  })

  const updateMutation = trpc.calendar.update.useMutation({
    onSuccess: () => {
      toast.success('Evento atualizado!')
      utils.calendar.list.invalidate()
      utils.calendar.upcoming.invalidate()
      onOpenChange(false)
    },
    onError: (e) => toast.error(e.message),
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(calendarEventCreateSchema),
    defaultValues: {
      title: editData?.title ?? '',
      type: editData?.type ?? 'outro',
      date: editData?.date ?? defaultDate ?? '',
      time: editData?.time ?? '',
      durationMin: editData?.durationMin ?? undefined,
      description: editData?.description ?? '',
      color: editData?.color ?? '#5e81f4',
      visibility: editData?.visibility ?? 'team',
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const selectedType = watch('type')

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateMutation.mutate({ id: editData!.id, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  // Auto-set color when type changes
  const handleTypeChange = (type: string) => {
    setValue('type', type)
    const typeConfig = EVENT_TYPES.find((t) => t.value === type)
    if (typeConfig) setValue('color', typeConfig.color)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Titulo *</Label>
            <Input placeholder="Ex: Entrega Caso #042" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <Select value={watch('color') ?? '#5e81f4'} onValueChange={(v) => setValue('color', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.value }} />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" {...register('time')} />
            </div>
            <div className="space-y-2">
              <Label>Duracao (min)</Label>
              <Input type="number" min={1} max={1440} {...register('durationMin', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descricao</Label>
            <Textarea rows={2} placeholder="Detalhes do evento..." {...register('description')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
