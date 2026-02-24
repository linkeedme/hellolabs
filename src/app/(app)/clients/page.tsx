'use client'

import { useState } from 'react'
import { Plus, Search, Phone, Mail, MoreHorizontal, Kanban, UserX } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { StatusBadge, getClientStatusBadge } from '@/components/shared/status-badge'
import { ClientFormDialog } from '@/components/clients/client-form-dialog'
import { useDebounce } from '@/lib/hooks/use-debounce'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'OVERDUE', label: 'Inadimplente' },
  { value: 'PENDING_APPROVAL', label: 'Pendente' },
]

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<{ id: string } & Record<string, unknown> | undefined>()
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = trpc.clients.list.useQuery({
    page,
    perPage: 20,
    search: debouncedSearch || undefined,
    status: status ? (status as 'ACTIVE' | 'INACTIVE' | 'OVERDUE' | 'PENDING_APPROVAL') : undefined,
  })

  const utils = trpc.useUtils()
  const deactivateMutation = trpc.clients.deactivate.useMutation({
    onSuccess: () => {
      toast.success('Cliente desativado')
      utils.clients.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const clients = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  const handleEdit = (client: Record<string, unknown>) => {
    setEditData(client as { id: string } & Record<string, unknown>)
    setFormOpen(true)
  }

  const handleNew = () => {
    setEditData(undefined)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1c1d21]">Clientes</h1>
          <p className="text-[14px] text-[#8181a5] mt-0.5">
            Dentistas e clinicas vinculadas ao laboratorio.
          </p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#5e81f4] text-white text-[13px] font-bold hover:bg-[#4a6de0] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8181a5]" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full h-9 rounded-lg border border-[#f0f0f3] bg-white pl-9 pr-3 text-[13px] text-[#1c1d21] placeholder:text-[#8181a5] outline-none focus:border-[#5e81f4] transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="h-9 rounded-lg border border-[#f0f0f3] bg-white px-3 text-[13px] text-[#1c1d21] outline-none focus:border-[#5e81f4] transition-colors"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#f0f0f3] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[13px] text-[#8181a5]">Carregando...</div>
        ) : clients.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[14px] text-[#8181a5]">
            Nenhum cliente encontrado.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#f5f5fa] border-b border-[#f0f0f3]">
                <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Nome</th>
                <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">CRO</th>
                <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Contato</th>
                <th className="text-left text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Status</th>
                <th className="text-center text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Casos</th>
                <th className="text-right text-[12px] font-semibold text-[#8181a5] px-4 py-2.5">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client: {
                id: string
                name: string
                cro: string | null
                email: string | null
                phone: string | null
                status: string
                priceTable: { id: string; name: string } | null
                _count: { cases: number }
              }) => {
                const badge = getClientStatusBadge(client.status)
                return (
                  <tr key={client.id} className="border-b border-[#f5f5fa] hover:bg-[#fafafa] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[rgba(94,129,244,0.1)] flex items-center justify-center text-[13px] font-semibold text-[#5e81f4]">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-[13px] font-medium text-[#1c1d21]">{client.name}</span>
                          {client.priceTable && (
                            <p className="text-[11px] text-[#8181a5]">{client.priceTable.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#8181a5]">{client.cro || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {client.phone && (
                          <div className="flex items-center gap-1 text-[12px] text-[#8181a5]">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1 text-[12px] text-[#8181a5]">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </div>
                        )}
                        {!client.phone && !client.email && (
                          <span className="text-[12px] text-[#8181a5]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={badge.label} variant={badge.variant} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Kanban className="h-3.5 w-3.5 text-[#8181a5]" />
                        <span className="text-[13px] font-semibold text-[#1c1d21]">{client._count.cases}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[#f5f5fa] transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-[#8181a5]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(client)}>
                            Editar
                          </DropdownMenuItem>
                          {client.status !== 'INACTIVE' && (
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm('Desativar este cliente?')) {
                                  deactivateMutation.mutate({ id: client.id })
                                }
                              }}
                              className="text-destructive"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Desativar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="h-8 px-3 rounded-lg border border-[#f0f0f3] bg-white text-[13px] text-[#8181a5] disabled:opacity-40 hover:bg-[#f5f5fa] transition-colors"
          >
            Anterior
          </button>
          <span className="text-[13px] text-[#8181a5]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="h-8 px-3 rounded-lg border border-[#f0f0f3] bg-white text-[13px] text-[#8181a5] disabled:opacity-40 hover:bg-[#f5f5fa] transition-colors"
          >
            Proximo
          </button>
        </div>
      )}

      {/* Form Dialog */}
      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editData={editData}
      />
    </div>
  )
}
