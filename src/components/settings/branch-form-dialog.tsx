'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { branchCreateSchema, type BranchCreateInput } from '@/lib/validators/branch'
import type { z } from 'zod'

type FormValues = z.input<typeof branchCreateSchema>

interface BranchFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: { id: string } & Record<string, unknown>
}

export function BranchFormDialog({ open, onOpenChange, editData }: BranchFormDialogProps) {
  const utils = trpc.useUtils()
  const isEdit = Boolean(editData)

  const form = useForm<FormValues>({
    resolver: zodResolver(branchCreateSchema),
    defaultValues: {
      name: '',
      address: '',
      managerName: '',
      cpfCnpj: '',
    },
  })

  useEffect(() => {
    if (editData) {
      form.reset({
        name: (editData.name as string) ?? '',
        address: (editData.address as string) ?? '',
        managerName: (editData.managerName as string) ?? '',
        cpfCnpj: (editData.cpfCnpj as string) ?? '',
      })
    } else {
      form.reset({ name: '', address: '', managerName: '', cpfCnpj: '' })
    }
  }, [editData, form])

  const createMutation = trpc.branch.create.useMutation({
    onSuccess: () => {
      toast.success('Filial criada!')
      utils.branch.list.invalidate()
      onOpenChange(false)
    },
    onError: (e) => toast.error(e.message),
  })

  const updateMutation = trpc.branch.update.useMutation({
    onSuccess: () => {
      toast.success('Filial atualizada!')
      utils.branch.list.invalidate()
      onOpenChange(false)
    },
    onError: (e) => toast.error(e.message),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (values: FormValues) => {
    if (isEdit && editData) {
      updateMutation.mutate({
        id: editData.id,
        name: values.name,
        address: values.address || null,
        managerName: values.managerName || null,
        cpfCnpj: values.cpfCnpj || null,
      })
    } else {
      createMutation.mutate(values as BranchCreateInput)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Filial' : 'Nova Filial'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input {...form.register('name')} placeholder="Nome da filial" />
            {form.formState.errors.name && (
              <p className="text-[12px] text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Endereco</Label>
            <Input {...form.register('address')} placeholder="Endereco completo" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responsavel</Label>
              <Input {...form.register('managerName')} placeholder="Nome do gerente" />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ</Label>
              <Input {...form.register('cpfCnpj')} placeholder="00.000.000/0001-00" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
