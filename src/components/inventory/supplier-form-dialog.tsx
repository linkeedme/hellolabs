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
import { supplierCreateSchema } from '@/lib/validators/inventory'

type FormValues = z.input<typeof supplierCreateSchema>

interface SupplierFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: { id: string } & Partial<FormValues>
}

export function SupplierFormDialog({ open, onOpenChange, editData }: SupplierFormDialogProps) {
  const utils = trpc.useUtils()
  const isEditing = !!editData?.id

  const createMutation = trpc.inventory.supplier.create.useMutation({
    onSuccess: () => {
      toast.success('Fornecedor criado!')
      utils.inventory.supplier.list.invalidate()
      onOpenChange(false)
      reset()
    },
    onError: (e) => toast.error(e.message),
  })

  const updateMutation = trpc.inventory.supplier.update.useMutation({
    onSuccess: () => {
      toast.success('Fornecedor atualizado!')
      utils.inventory.supplier.list.invalidate()
      onOpenChange(false)
    },
    onError: (e) => toast.error(e.message),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(supplierCreateSchema),
    defaultValues: {
      name: editData?.name ?? '',
      cnpj: editData?.cnpj ?? '',
      email: editData?.email ?? '',
      phone: editData?.phone ?? '',
      contactName: editData?.contactName ?? '',
      website: editData?.website ?? '',
      leadDays: editData?.leadDays ?? undefined,
      paymentTerms: editData?.paymentTerms ?? '',
      rating: editData?.rating ?? undefined,
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
          <DialogTitle>{isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input placeholder="Ex: Ivoclar Vivadent" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input placeholder="00.000.000/0000-00" {...register('cnpj')} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="contato@empresa.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input placeholder="(11) 99999-9999" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label>Contato</Label>
              <Input placeholder="Nome do contato" {...register('contactName')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Website</Label>
            <Input placeholder="https://..." {...register('website')} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Prazo entrega (dias)</Label>
              <Input type="number" min={0} {...register('leadDays', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Cond. pagamento</Label>
              <Input placeholder="30/60/90" {...register('paymentTerms')} />
            </div>
            <div className="space-y-2">
              <Label>Avaliacao (1-5)</Label>
              <Input type="number" min={1} max={5} {...register('rating', { valueAsNumber: true })} />
              {errors.rating && <p className="text-xs text-destructive">{errors.rating.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea rows={2} placeholder="Notas sobre o fornecedor..." {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Fornecedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
