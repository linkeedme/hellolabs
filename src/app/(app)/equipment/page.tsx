'use client'

import { useState } from 'react'
import { Plus, CheckCircle2, AlertTriangle, XCircle, Calendar, Search, ClipboardList, Wrench } from 'lucide-react'
import { format } from 'date-fns'
import { trpc } from '@/lib/trpc/client'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { StatusBadge, getEquipmentStatusBadge } from '@/components/shared/status-badge'
import { EquipmentFormDialog } from '@/components/equipment/equipment-form-dialog'
import { LogFormDialog } from '@/components/equipment/log-form-dialog'
import { EQUIPMENT_CATEGORIES } from '@/lib/constants/categories'

const STATUS_CONFIG = {
  OPERATIONAL: { icon: CheckCircle2, color: '#1a7a4a', bg: 'rgba(124,231,172,0.15)', border: '#7ce7ac', label: 'Operacional' },
  MAINTENANCE: { icon: AlertTriangle, color: '#7a5a1a', bg: 'rgba(244,190,94,0.15)', border: '#f4be5e', label: 'Manutencao' },
  INACTIVE: { icon: XCircle, color: '#cc2d3a', bg: 'rgba(255,128,139,0.15)', border: '#ff808b', label: 'Inativo' },
} as const

export default function EquipmentPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<{ id: string } & Record<string, unknown> | undefined>()
  const [logOpen, setLogOpen] = useState(false)
  const [logEquipmentId, setLogEquipmentId] = useState('')

  const { data, isLoading } = trpc.equipment.equipment.list.useQuery({
    page,
    perPage: 12,
    search: debouncedSearch || undefined,
    status: statusFilter ? (statusFilter as 'OPERATIONAL' | 'MAINTENANCE' | 'INACTIVE') : undefined,
    type: typeFilter || undefined,
  })

  const deleteMutation = trpc.equipment.equipment.delete.useMutation({
    onSuccess: () => {
      utils.equipment.equipment.list.invalidate()
    },
  })

  const utils = trpc.useUtils()

  const items = data?.items ?? []

  // Count by status
  const counts = {
    OPERATIONAL: items.filter((e) => e.status === 'OPERATIONAL').length,
    MAINTENANCE: items.filter((e) => e.status === 'MAINTENANCE').length,
    INACTIVE: items.filter((e) => e.status === 'INACTIVE').length,
  }

  const getCategoryName = (typeId: string) => {
    return EQUIPMENT_CATEGORIES.find((c) => c.id === typeId)?.name ?? typeId
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1c1d21]">Equipamentos</h1>
          <p className="text-[14px] text-[#8181a5] mt-0.5">
            Fornos, fresadoras, impressoras 3D e mais.
          </p>
        </div>
        <button
          onClick={() => { setEditData(undefined); setFormOpen(true) }}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#5e81f4] text-white text-[13px] font-bold hover:bg-[#4a6de0] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([status, cfg]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            className={`bg-white rounded-xl border p-5 flex items-center gap-4 text-left transition-all ${
              statusFilter === status ? 'border-[#5e81f4] ring-1 ring-[#5e81f4]' : 'border-[#f0f0f3]'
            }`}
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: cfg.bg }}
            >
              <cfg.icon className="h-5 w-5" style={{ color: cfg.color }} />
            </div>
            <div>
              <p className="text-[12px] text-[#8181a5]">{cfg.label}</p>
              <p className="text-[22px] font-bold text-[#1c1d21]">{counts[status]}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8181a5]" />
          <input
            type="text"
            placeholder="Buscar equipamento..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#f0f0f3] bg-white text-[13px] text-[#1c1d21] placeholder:text-[#8181a5] focus:outline-none focus:border-[#5e81f4]"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="h-9 px-3 rounded-lg border border-[#f0f0f3] bg-white text-[13px] text-[#1c1d21] focus:outline-none focus:border-[#5e81f4]"
        >
          <option value="">Todas categorias</option>
          {EQUIPMENT_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Equipment grid */}
      {isLoading ? (
        <div className="text-center py-12 text-[#8181a5]">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#f0f0f3] p-12 text-center">
          <Wrench className="h-10 w-10 mx-auto text-[#8181a5] mb-3" />
          <p className="text-[14px] text-[#8181a5]">Nenhum equipamento encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {items.map((eq) => {
            const statusCfg = STATUS_CONFIG[eq.status as keyof typeof STATUS_CONFIG]
            const badge = getEquipmentStatusBadge(eq.status)
            return (
              <div key={eq.id} className="bg-white rounded-xl border border-[#f0f0f3] p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[14px] font-bold text-[#1c1d21]">{eq.name}</p>
                    <p className="text-[12px] text-[#8181a5] mt-0.5">{getCategoryName(eq.type)}</p>
                    {eq.brand && (
                      <p className="text-[11px] text-[#8181a5] mt-0.5">{eq.brand}{eq.model ? ` - ${eq.model}` : ''}</p>
                    )}
                  </div>
                  <StatusBadge label={badge.label} variant={badge.variant} />
                </div>
                <div className="border-t border-[#f5f5fa] pt-3 space-y-1.5">
                  {eq.lastMaintenance && (
                    <div className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-1.5 text-[#8181a5]">
                        <Calendar className="h-3.5 w-3.5" />
                        Ultima manut.
                      </div>
                      <span className="font-medium text-[#1c1d21]">
                        {format(new Date(eq.lastMaintenance), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  )}
                  {eq.nextMaintenance && (
                    <div className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-1.5 text-[#8181a5]">
                        <Calendar className="h-3.5 w-3.5" />
                        Proxima manut.
                      </div>
                      <span className={`font-medium ${new Date(eq.nextMaintenance) < new Date() ? 'text-[#cc2d3a]' : 'text-[#1c1d21]'}`}>
                        {format(new Date(eq.nextMaintenance), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  )}
                  {eq.serialNumber && (
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[#8181a5]">Nr. serie</span>
                      <span className="font-medium text-[#1c1d21]">{eq.serialNumber}</span>
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="border-t border-[#f5f5fa] pt-3 mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditData({ id: eq.id, name: eq.name, type: eq.type, brand: eq.brand ?? '', model: eq.model ?? '', serialNumber: eq.serialNumber ?? '', status: eq.status as 'OPERATIONAL' | 'MAINTENANCE' | 'INACTIVE', notes: eq.notes ?? '' }); setFormOpen(true) }}
                    className="text-[11px] text-[#5e81f4] font-medium hover:underline"
                  >
                    Editar
                  </button>
                  <span className="text-[#f0f0f3]">|</span>
                  <button
                    onClick={() => { setLogEquipmentId(eq.id); setLogOpen(true) }}
                    className="text-[11px] text-[#8181a5] font-medium hover:underline flex items-center gap-1"
                  >
                    <ClipboardList className="h-3 w-3" />
                    Registro
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="h-8 px-3 rounded-lg border border-[#f0f0f3] text-[12px] text-[#8181a5] disabled:opacity-40 hover:border-[#5e81f4] hover:text-[#5e81f4]"
          >
            Anterior
          </button>
          <span className="text-[12px] text-[#8181a5]">
            {page} / {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage(page + 1)}
            className="h-8 px-3 rounded-lg border border-[#f0f0f3] text-[12px] text-[#8181a5] disabled:opacity-40 hover:border-[#5e81f4] hover:text-[#5e81f4]"
          >
            Proximo
          </button>
        </div>
      )}

      {/* Dialogs */}
      <EquipmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editData={editData}
      />

      {logEquipmentId && (
        <LogFormDialog
          open={logOpen}
          onOpenChange={setLogOpen}
          equipmentId={logEquipmentId}
        />
      )}
    </div>
  )
}
