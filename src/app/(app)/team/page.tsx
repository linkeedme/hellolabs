'use client'

import { useState } from 'react'
import { UserPlus, Mail, Shield, CheckCircle2, XCircle, MoreHorizontal, UserCog, UserX, UserCheck } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { ROLE_LABELS, type RoleKey } from '@/lib/constants/roles'
import { InviteMemberDialog } from '@/components/team/invite-member-dialog'
import { RoleEditDialog } from '@/components/team/role-edit-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  ADMIN: { bg: 'rgba(94,129,244,0.1)', color: '#5e81f4' },
  SUPERVISOR: { bg: 'rgba(94,129,244,0.08)', color: '#3d5fd2' },
  TECHNICIAN: { bg: 'rgba(124,231,172,0.15)', color: '#1a7a4a' },
  FINANCE: { bg: 'rgba(124,231,172,0.15)', color: '#1a7a4a' },
  DRIVER: { bg: 'rgba(244,190,94,0.15)', color: '#7a5a1a' },
  DENTIST: { bg: 'rgba(255,128,139,0.15)', color: '#cc2d3a' },
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
}

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [roleEditOpen, setRoleEditOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; role: string } | null>(null)

  const { data: members, isLoading } = trpc.team.list.useQuery()
  const utils = trpc.useUtils()

  const deactivateMutation = trpc.team.deactivate.useMutation({
    onSuccess: () => {
      toast.success('Membro desativado')
      utils.team.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const reactivateMutation = trpc.team.reactivate.useMutation({
    onSuccess: () => {
      toast.success('Membro reativado')
      utils.team.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const activeCount = (members ?? []).filter((m: { active: boolean }) => m.active).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1c1d21]">Equipe</h1>
          <p className="text-[14px] text-[#8181a5] mt-0.5">
            {isLoading ? '...' : `${activeCount} colaboradores ativos no laboratorio.`}
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#5e81f4] text-white text-[13px] font-bold hover:bg-[#4a6de0] transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Convidar
        </button>
      </div>

      {/* Members grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[#f0f0f3] p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : (members ?? []).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#f0f0f3]">
          <p className="text-[15px] font-medium text-[#1c1d21]">Nenhum membro na equipe</p>
          <p className="text-[13px] text-[#8181a5] mt-1">Convide colaboradores para comecar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {(members ?? []).map((member: {
            id: string
            userId: string
            name: string
            email: string
            avatar: string | null
            role: string
            active: boolean
            joinedAt: Date
          }) => {
            const roleStyle = ROLE_COLORS[member.role] ?? { bg: 'rgba(94,129,244,0.1)', color: '#5e81f4' }
            const roleLabel = ROLE_LABELS[member.role as RoleKey] ?? member.role

            return (
              <div key={member.id} className="bg-white rounded-xl border border-[#f0f0f3] p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[rgba(94,129,244,0.1)] flex items-center justify-center text-[14px] font-bold text-[#5e81f4]">
                      {getInitials(member.name)}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#1c1d21]">{member.name}</p>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium mt-0.5"
                        style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
                      >
                        <Shield className="h-3 w-3" />
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {member.active
                      ? <CheckCircle2 className="h-4 w-4 text-[#1a7a4a]" />
                      : <XCircle className="h-4 w-4 text-[#8181a5]" />
                    }
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[#f5f5fa] transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-[#8181a5]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMember({ id: member.id, name: member.name, role: member.role })
                            setRoleEditOpen(true)
                          }}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Alterar Cargo
                        </DropdownMenuItem>
                        {member.active ? (
                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm(`Desativar ${member.name}?`)) {
                                deactivateMutation.mutate({ tenantUserId: member.id })
                              }
                            }}
                            className="text-destructive"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Desativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => reactivateMutation.mutate({ tenantUserId: member.id })}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Reativar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="border-t border-[#f5f5fa] pt-3">
                  <div className="flex items-center gap-2 text-[12px] text-[#8181a5]">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialogs */}
      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <RoleEditDialog open={roleEditOpen} onOpenChange={setRoleEditOpen} member={selectedMember} />
    </div>
  )
}
