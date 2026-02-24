'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'
import { PROSTHESIS_TYPES } from '@/lib/constants/prosthesis-types'
import { X, Search } from 'lucide-react'
import type { CaseKanbanInput } from '@/lib/validators/case'

interface KanbanFiltersProps {
  filters: CaseKanbanInput
  onFiltersChange: (filters: CaseKanbanInput) => void
}

export function KanbanFilters({ filters, onFiltersChange }: KanbanFiltersProps) {
  const { data: clientsData } = trpc.clients.list.useQuery({ page: 1, perPage: 100 })
  const { data: teamData } = trpc.team.list.useQuery()

  const clients = clientsData?.items ?? []
  const members = teamData ?? []

  const hasFilters = filters.search || filters.clientId || filters.priority || filters.prosthesisType || filters.assignedTo

  const clearFilters = () => {
    onFiltersChange({})
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente ou #..."
          value={filters.search ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
          className="w-[200px] pl-8"
        />
      </div>

      {/* Client */}
      <Select
        value={filters.clientId ?? ''}
        onValueChange={(val) => onFiltersChange({ ...filters, clientId: val || undefined })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority */}
      <Select
        value={filters.priority ?? ''}
        onValueChange={(val) => onFiltersChange({ ...filters, priority: (val || undefined) as CaseKanbanInput['priority'] })}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todas</SelectItem>
          <SelectItem value="NORMAL">Normal</SelectItem>
          <SelectItem value="URGENT">Urgente</SelectItem>
          <SelectItem value="CRITICAL">Critico</SelectItem>
        </SelectContent>
      </Select>

      {/* Prosthesis Type */}
      <Select
        value={filters.prosthesisType ?? ''}
        onValueChange={(val) => onFiltersChange({ ...filters, prosthesisType: val || undefined })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          {PROSTHESIS_TYPES.map((t) => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assigned To */}
      <Select
        value={filters.assignedTo ?? ''}
        onValueChange={(val) => onFiltersChange({ ...filters, assignedTo: val || undefined })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Responsavel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.userId} value={m.userId}>{m.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}
