'use client'

import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'
import { ROLE_LABELS, type RoleKey } from '@/lib/constants/roles'

const ALL_ROLES: { value: string; label: string }[] = [
  { value: 'ADMIN', label: ROLE_LABELS.ADMIN },
  { value: 'SUPERVISOR', label: ROLE_LABELS.SUPERVISOR },
  { value: 'TECHNICIAN', label: ROLE_LABELS.TECHNICIAN },
  { value: 'FINANCE', label: ROLE_LABELS.FINANCE },
  { value: 'DRIVER', label: ROLE_LABELS.DRIVER },
  { value: 'DENTIST', label: ROLE_LABELS.DENTIST },
]

interface RoleEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: { id: string; name: string; role: string } | null
}

export function RoleEditDialog({ open, onOpenChange, member }: RoleEditDialogProps) {
  const [selectedRole, setSelectedRole] = useState(member?.role ?? 'TECHNICIAN')
  const utils = trpc.useUtils()

  const updateMutation = trpc.team.updateRole.useMutation({
    onSuccess: () => {
      toast.success('Cargo atualizado!')
      utils.team.list.invalidate()
      onOpenChange(false)
    },
    onError: (e) => toast.error(e.message),
  })

  const handleSave = () => {
    if (!member) return
    updateMutation.mutate({
      tenantUserId: member.id,
      role: selectedRole as 'ADMIN' | 'SUPERVISOR' | 'TECHNICIAN' | 'FINANCE' | 'DRIVER' | 'DENTIST',
    })
  }

  // Sync state when member changes
  if (member && selectedRole !== member.role && !updateMutation.isPending) {
    setSelectedRole(member.role)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Alterar Cargo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-[13px] text-[#8181a5]">
            Alterar cargo de <span className="font-medium text-[#1c1d21]">{member?.name}</span>
          </p>

          <div className="space-y-2">
            <Label>Novo Cargo</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending || selectedRole === member?.role}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
