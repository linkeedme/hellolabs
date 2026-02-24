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
import { clientCreateSchema } from '@/lib/validators/client'

type FormValues = z.input<typeof clientCreateSchema>

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: { id: string } & Record<string, unknown>
}

export function ClientFormDialog({ open, onOpenChange, editData }: ClientFormDialogProps) {
  const utils = trpc.useUtils()
  const isEditing = !!editData?.id
  const { data: priceTableData } = trpc.priceTable.list.useQuery({ page: 1, perPage: 100 })
  const priceTables = (priceTableData?.items ?? []).filter((t: { active: boolean }) => t.active)

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success('Cliente criado!')
      utils.clients.list.invalidate()
      onOpenChange(false)
      reset()
    },
    onError: (e) => toast.error(e.message),
  })

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success('Cliente atualizado!')
      utils.clients.list.invalidate()
      onOpenChange(false)
    },
    onError: (e) => toast.error(e.message),
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(clientCreateSchema),
    defaultValues: {
      name: (editData?.name as string) ?? '',
      email: (editData?.email as string) ?? '',
      phone: (editData?.phone as string) ?? '',
      whatsapp: (editData?.whatsapp as string) ?? '',
      cpfCnpj: (editData?.cpfCnpj as string) ?? '',
      cro: (editData?.cro as string) ?? '',
      address: (editData?.address as string) ?? '',
      notes: (editData?.notes as string) ?? '',
      priceTableId: (editData?.priceTableId as string) ?? undefined,
      closingDay: (editData?.closingDay as number) ?? undefined,
      paymentDays: (editData?.paymentDays as number) ?? undefined,
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateMutation.mutate({ id: editData!.id, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input placeholder="Ex: Dr. Carlos Mendes" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>CRO</Label>
              <Input placeholder="Ex: CRO-SP 12345" {...register('cro')} />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ</Label>
              <Input placeholder="Ex: 123.456.789-00" {...register('cpfCnpj')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="email@clinica.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input placeholder="(11) 98765-4321" {...register('phone')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input placeholder="(11) 98765-4321" {...register('whatsapp')} />
          </div>

          <div className="space-y-2">
            <Label>Endereco</Label>
            <Textarea rows={2} placeholder="Rua, numero, bairro, cidade..." {...register('address')} />
          </div>

          <div className="space-y-2">
            <Label>Tabela de Preco</Label>
            <Select
              value={watch('priceTableId') ?? ''}
              onValueChange={(v) => setValue('priceTableId', v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma tabela" />
              </SelectTrigger>
              <SelectContent>
                {priceTables.map((t: { id: string; name: string }) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Dia de fechamento</Label>
              <Input
                type="number"
                min={1}
                max={31}
                placeholder="Ex: 15"
                {...register('closingDay', { valueAsNumber: true })}
              />
              {errors.closingDay && <p className="text-xs text-destructive">{errors.closingDay.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Prazo pagamento (dias)</Label>
              <Input
                type="number"
                min={0}
                max={120}
                placeholder="Ex: 30"
                {...register('paymentDays', { valueAsNumber: true })}
              />
              {errors.paymentDays && <p className="text-xs text-destructive">{errors.paymentDays.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea rows={2} placeholder="Notas internas sobre o cliente..." {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
