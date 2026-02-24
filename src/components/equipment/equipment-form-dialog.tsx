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
import { equipmentCreateSchema } from '@/lib/validators/equipment'
import { EQUIPMENT_CATEGORIES } from '@/lib/constants/categories'

type FormValues = z.input<typeof equipmentCreateSchema>

const STATUS_OPTIONS = [
  { value: 'OPERATIONAL', label: 'Operacional' },
  { value: 'MAINTENANCE', label: 'Manutencao' },
  { value: 'INACTIVE', label: 'Inativo' },
]

interface EquipmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: { id: string } & Partial<FormValues>
}

export function EquipmentFormDialog({ open, onOpenChange, editData }: EquipmentFormDialogProps) {
  const utils = trpc.useUtils()
  const isEditing = !!editData?.id

  const createMutation = trpc.equipment.equipment.create.useMutation({
    onSuccess: () => {
      toast.success('Equipamento criado!')
      utils.equipment.equipment.list.invalidate()
      onOpenChange(false)
      reset()
    },
    onError: (e) => toast.error(e.message),
  })

  const updateMutation = trpc.equipment.equipment.update.useMutation({
    onSuccess: () => {
      toast.success('Equipamento atualizado!')
      utils.equipment.equipment.list.invalidate()
      onOpenChange(false)
    },
    onError: (e) => toast.error(e.message),
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(equipmentCreateSchema),
    defaultValues: {
      name: editData?.name ?? '',
      type: editData?.type ?? '',
      brand: editData?.brand ?? '',
      model: editData?.model ?? '',
      serialNumber: editData?.serialNumber ?? '',
      status: editData?.status ?? 'OPERATIONAL',
      notes: editData?.notes ?? '',
    },
  })

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
          <DialogTitle>{isEditing ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input placeholder="Ex: Forno Programat P510" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={watch('type')} onValueChange={(v) => setValue('type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch('status') ?? 'OPERATIONAL'} onValueChange={(v) => setValue('status', v as FormValues['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input placeholder="Ex: Ivoclar" {...register('brand')} />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input placeholder="Ex: Programat P510" {...register('model')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Numero de serie</Label>
            <Input placeholder="Ex: SN-123456" {...register('serialNumber')} />
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea rows={2} placeholder="Notas sobre o equipamento..." {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Equipamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
