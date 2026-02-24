'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check, Loader2 } from 'lucide-react'

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
import { trpc } from '@/lib/trpc/client'
import { ROLE_LABELS } from '@/lib/constants/roles'

const INVITE_ROLES = [
  { value: 'SUPERVISOR', label: ROLE_LABELS.SUPERVISOR },
  { value: 'TECHNICIAN', label: ROLE_LABELS.TECHNICIAN },
  { value: 'FINANCE', label: ROLE_LABELS.FINANCE },
  { value: 'DRIVER', label: ROLE_LABELS.DRIVER },
  { value: 'DENTIST', label: ROLE_LABELS.DENTIST },
] as const

const EXPIRES_OPTIONS = [
  { value: '3', label: '3 dias' },
  { value: '7', label: '7 dias' },
  { value: '14', label: '14 dias' },
  { value: '30', label: '30 dias' },
] as const

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMemberDialog({ open, onOpenChange }: InviteMemberDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<string>('TECHNICIAN')
  const [expiresInDays, setExpiresInDays] = useState('7')
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const inviteMutation = trpc.auth.generateInvite.useMutation({
    onSuccess: (data) => {
      setInviteUrl(data.inviteUrl)
      toast.success('Convite gerado!')
    },
    onError: (e) => toast.error(e.message),
  })

  const handleGenerate = () => {
    inviteMutation.mutate({
      email: email || undefined,
      role: role as 'DENTIST' | 'TECHNICIAN' | 'SUPERVISOR' | 'FINANCE' | 'DRIVER',
      expiresInDays: Number(expiresInDays),
    })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = (v: boolean) => {
    if (!v) {
      setEmail('')
      setRole('TECHNICIAN')
      setExpiresInDays('7')
      setInviteUrl('')
      setCopied(false)
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Membro</DialogTitle>
        </DialogHeader>

        {inviteUrl ? (
          <div className="space-y-4">
            <p className="text-[13px] text-[#8181a5]">
              Compartilhe este link com o novo membro para que ele se junte ao laboratorio.
            </p>
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly className="text-[12px]" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Fechar
              </Button>
              <Button onClick={() => { setInviteUrl(''); setCopied(false) }}>
                Gerar Novo
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email (opcional)</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-[11px] text-[#8181a5]">
                Se informado, somente este email podera usar o convite.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cargo *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITE_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expira em</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRES_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={inviteMutation.isPending}>
                {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar Convite
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
