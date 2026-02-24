'use client'

import { useState } from 'react'
import {
  Plus, Loader2, MoreHorizontal, ChevronDown, ChevronRight,
  Pencil, XCircle, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { PRICE_UNITS } from '@/lib/validators/price-table'
import { formatMoney } from '@/lib/utils/format'

// ── Create table dialog ──────────────────────────────────────────
function CreateTableDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [name, setName] = useState('')
  const utils = trpc.useUtils()

  const createMutation = trpc.priceTable.create.useMutation({
    onSuccess: () => {
      toast.success('Tabela criada!')
      utils.priceTable.list.invalidate()
      onOpenChange(false)
      setName('')
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova Tabela de Preco</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tabela Padrao"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate({ name })}
              disabled={createMutation.isPending || name.length < 2}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Add item row ─────────────────────────────────────────────────
function AddItemRow({ priceTableId }: { priceTableId: string }) {
  const [serviceType, setServiceType] = useState('')
  const [description, setDescription] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [priceUnit, setPriceUnit] = useState('unit')
  const utils = trpc.useUtils()

  const addMutation = trpc.priceTable.addItem.useMutation({
    onSuccess: () => {
      toast.success('Item adicionado!')
      utils.priceTable.getById.invalidate({ id: priceTableId })
      utils.priceTable.list.invalidate()
      setServiceType('')
      setDescription('')
      setUnitPrice('')
      setPriceUnit('unit')
    },
    onError: (e) => toast.error(e.message),
  })

  const canAdd = serviceType.trim().length > 0 && description.trim().length > 0 && unitPrice.trim().length > 0

  return (
    <tr className="border-t border-[#f0f0f3] bg-[#fafafe]">
      <td className="px-3 py-2">
        <Input
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          placeholder="Tipo do servico"
          className="h-8 text-[12px]"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descricao"
          className="h-8 text-[12px]"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          placeholder="0,00"
          className="h-8 text-[12px] w-24"
        />
      </td>
      <td className="px-3 py-2">
        <Select value={priceUnit} onValueChange={setPriceUnit}>
          <SelectTrigger className="h-8 text-[12px] w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRICE_UNITS.map((u) => (
              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2 text-right">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px]"
          disabled={!canAdd || addMutation.isPending}
          onClick={() =>
            addMutation.mutate({
              priceTableId,
              serviceType: serviceType.trim(),
              description: description.trim(),
              unitPrice: Number(unitPrice),
              priceUnit,
            })
          }
        >
          {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
        </Button>
      </td>
    </tr>
  )
}

// ── Item row ─────────────────────────────────────────────────────
function ItemRow({
  item,
  priceTableId,
}: {
  item: { id: string; serviceType: string; description: string; unitPrice: number; priceUnit: string }
  priceTableId: string
}) {
  const utils = trpc.useUtils()

  const removeMutation = trpc.priceTable.removeItem.useMutation({
    onSuccess: () => {
      toast.success('Item removido!')
      utils.priceTable.getById.invalidate({ id: priceTableId })
      utils.priceTable.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  const unitLabel = PRICE_UNITS.find((u) => u.value === item.priceUnit)?.label ?? item.priceUnit

  return (
    <tr className="border-t border-[#f0f0f3] hover:bg-[#fafafe] transition-colors">
      <td className="px-3 py-2.5 text-[13px] font-medium text-[#1c1d21]">{item.serviceType}</td>
      <td className="px-3 py-2.5 text-[12px] text-[#8181a5]">{item.description}</td>
      <td className="px-3 py-2.5 text-[13px] font-medium text-[#1c1d21]">{formatMoney(item.unitPrice)}</td>
      <td className="px-3 py-2.5 text-[12px] text-[#8181a5]">{unitLabel}</td>
      <td className="px-3 py-2.5 text-right">
        <button
          onClick={() => {
            if (confirm(`Remover item "${item.serviceType}"?`)) {
              removeMutation.mutate({ id: item.id })
            }
          }}
          className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[#f5f5fa] transition-colors text-[#8181a5] hover:text-destructive"
          disabled={removeMutation.isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  )
}

// ── Expandable table card ────────────────────────────────────────
function PriceTableCard({
  table,
}: {
  table: { id: string; name: string; active: boolean; itemsCount: number; clientsCount: number }
}) {
  const [expanded, setExpanded] = useState(false)
  const utils = trpc.useUtils()

  const { data: detail, isLoading } = trpc.priceTable.getById.useQuery(
    { id: table.id },
    { enabled: expanded },
  )

  const deactivateMutation = trpc.priceTable.deactivate.useMutation({
    onSuccess: () => {
      toast.success('Tabela desativada')
      utils.priceTable.list.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="border border-[#f0f0f3] rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 bg-white hover:bg-[#fafafe] transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-[#8181a5]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#8181a5]" />
          )}
          <div>
            <span className="text-[14px] font-medium text-[#1c1d21]">{table.name}</span>
            <span className="text-[12px] text-[#8181a5] ml-3">
              {table.itemsCount} itens · {table.clientsCount} clientes
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {!table.active && (
            <span className="text-[11px] text-[#8181a5] font-medium bg-[#f5f5fa] px-2 py-0.5 rounded-full">
              Inativa
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[#f5f5fa] transition-colors">
                <MoreHorizontal className="h-4 w-4 text-[#8181a5]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setExpanded(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar Itens
              </DropdownMenuItem>
              {table.active && (
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm(`Desativar tabela "${table.name}"?`)) {
                      deactivateMutation.mutate({ id: table.id })
                    }
                  }}
                  className="text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Desativar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-[#f0f0f3]">
          {isLoading ? (
            <div className="p-4">
              <div className="h-8 bg-[#f5f5fa] rounded animate-pulse" />
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#f5f5fa] text-[11px] text-[#8181a5] font-semibold">
                  <th className="text-left px-3 py-2">Servico</th>
                  <th className="text-left px-3 py-2">Descricao</th>
                  <th className="text-left px-3 py-2">Preco</th>
                  <th className="text-left px-3 py-2">Unidade</th>
                  <th className="text-right px-3 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {(detail?.items ?? []).map((item: {
                  id: string
                  serviceType: string
                  description: string
                  unitPrice: number
                  priceUnit: string
                }) => (
                  <ItemRow key={item.id} item={item} priceTableId={table.id} />
                ))}
                <AddItemRow priceTableId={table.id} />
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────
export function PriceTableManager() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data, isLoading } = trpc.priceTable.list.useQuery({ page: 1, perPage: 50 })

  const tables = data?.items ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-[#1c1d21]">Tabelas de Preco</h3>
          <p className="text-[12px] text-[#8181a5]">Gerencie as tabelas de preco para seus clientes.</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Tabela
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-[#f5f5fa] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-8 border border-[#f0f0f3] rounded-lg">
          <p className="text-[13px] text-[#8181a5]">Nenhuma tabela de preco cadastrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tables.map((table: {
            id: string
            name: string
            active: boolean
            itemsCount: number
            clientsCount: number
          }) => (
            <PriceTableCard key={table.id} table={table} />
          ))}
        </div>
      )}

      <CreateTableDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
