'use client'

import { useState } from 'react'
import { Plus, Truck, Clock, MapPin, CheckCircle2, AlertCircle, Play, Flag, Download } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'
import { downloadDeliveryReceiptPdf } from '@/components/shared/pdf-download-button'
import type { LabInfo } from '@/lib/pdf/lab-header'
import { StatusBadge, getRouteStatusBadge, getStopStatusBadge } from '@/components/shared/status-badge'
import { RouteFormDialog } from '@/components/deliveries/route-form-dialog'
import { StopFormDialog } from '@/components/deliveries/stop-form-dialog'

const STATUS_ICONS = {
  DRAFT: Clock,
  PUBLISHED: AlertCircle,
  IN_PROGRESS: Truck,
  COMPLETED: CheckCircle2,
} as const

export default function DeliveriesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [stopOpen, setStopOpen] = useState(false)
  const [selectedRouteId, setSelectedRouteId] = useState('')

  const { data: tenant } = trpc.tenant.getCurrent.useQuery()

  const { data, isLoading } = trpc.delivery.route.list.useQuery({
    page,
    perPage: 10,
    status: statusFilter ? (statusFilter as 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED') : undefined,
  })

  const utils = trpc.useUtils()

  const publishMutation = trpc.delivery.route.publish.useMutation({
    onSuccess: () => { toast.success('Rota publicada!'); utils.delivery.route.list.invalidate() },
    onError: (e) => toast.error(e.message),
  })

  const startMutation = trpc.delivery.route.start.useMutation({
    onSuccess: () => { toast.success('Rota iniciada!'); utils.delivery.route.list.invalidate() },
    onError: (e) => toast.error(e.message),
  })

  const completeMutation = trpc.delivery.route.complete.useMutation({
    onSuccess: () => { toast.success('Rota concluida!'); utils.delivery.route.list.invalidate() },
    onError: (e) => toast.error(e.message),
  })

  const items = data?.items ?? []

  const STATS = [
    { label: 'Total', value: data?.total ?? 0, icon: Truck, color: '#5e81f4', bg: 'rgba(94,129,244,0.1)' },
    { label: 'Em andamento', value: items.filter((r) => r.status === 'IN_PROGRESS').length, icon: Truck, color: '#7a5a1a', bg: 'rgba(244,190,94,0.15)' },
    { label: 'Concluidas', value: items.filter((r) => r.status === 'COMPLETED').length, icon: CheckCircle2, color: '#1a7a4a', bg: 'rgba(124,231,172,0.15)' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1c1d21]">Entregas</h1>
          <p className="text-[14px] text-[#8181a5] mt-0.5">
            Rotas de entrega e logistica.
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#5e81f4] text-white text-[13px] font-bold hover:bg-[#4a6de0] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Rota
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#f0f0f3] p-5 flex items-center gap-4">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: s.bg }}
            >
              <s.icon className="h-5 w-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[12px] text-[#8181a5]">{s.label}</p>
              <p className="text-[22px] font-bold text-[#1c1d21]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        {['', 'DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED'].map((s) => {
          const badge = s ? getRouteStatusBadge(s) : { label: 'Todas' }
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`h-8 px-3 rounded-lg text-[12px] font-medium border transition-colors ${
                statusFilter === s
                  ? 'border-[#5e81f4] bg-[rgba(94,129,244,0.08)] text-[#5e81f4]'
                  : 'border-[#f0f0f3] text-[#8181a5] hover:border-[#5e81f4]'
              }`}
            >
              {badge.label}
            </button>
          )
        })}
      </div>

      {/* Routes list */}
      {isLoading ? (
        <div className="text-center py-12 text-[#8181a5]">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#f0f0f3] p-12 text-center">
          <Truck className="h-10 w-10 mx-auto text-[#8181a5] mb-3" />
          <p className="text-[14px] text-[#8181a5]">Nenhuma rota encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((route) => {
            const badge = getRouteStatusBadge(route.status)
            const StIcon = STATUS_ICONS[route.status as keyof typeof STATUS_ICONS] ?? Clock
            return (
              <div key={route.id} className="bg-white rounded-xl border border-[#f0f0f3] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[rgba(94,129,244,0.1)] flex items-center justify-center">
                      <span className="text-[13px] font-bold text-[#5e81f4]">
                        {route.driverName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#1c1d21]">{route.driverName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-[#8181a5]" />
                        <span className="text-[12px] text-[#8181a5]">
                          {format(new Date(route.date), 'dd/MM/yyyy')}
                        </span>
                        <span className="text-[#8181a5] mx-1">&middot;</span>
                        <span className="text-[12px] text-[#8181a5]">
                          {route.stops.length} parada{route.stops.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge label={badge.label} variant={badge.variant} />
                </div>

                {/* Stops */}
                {route.stops.length > 0 && (
                  <div className="mt-4 space-y-1.5 border-t border-[#f5f5fa] pt-3">
                    {route.stops.map((stop) => {
                      const stopBadge = getStopStatusBadge(stop.status)
                      return (
                        <div key={stop.id} className="flex items-center justify-between text-[12px]">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-[#8181a5] mt-0.5 shrink-0" />
                            <span className="text-[#8181a5]">{stop.address}</span>
                          </div>
                          <StatusBadge label={stopBadge.label} variant={stopBadge.variant} className="text-[10px]" />
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 border-t border-[#f5f5fa] pt-3 flex items-center gap-2">
                  {route.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => { setSelectedRouteId(route.id); setStopOpen(true) }}
                        className="text-[11px] text-[#5e81f4] font-medium hover:underline"
                      >
                        + Parada
                      </button>
                      <span className="text-[#f0f0f3]">|</span>
                      <button
                        onClick={() => publishMutation.mutate({ id: route.id })}
                        className="text-[11px] text-[#1a7a4a] font-medium hover:underline flex items-center gap-1"
                      >
                        <Flag className="h-3 w-3" />
                        Publicar
                      </button>
                    </>
                  )}
                  {route.status === 'PUBLISHED' && (
                    <button
                      onClick={() => startMutation.mutate({ id: route.id })}
                      className="text-[11px] text-[#5e81f4] font-medium hover:underline flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" />
                      Iniciar Rota
                    </button>
                  )}
                  {route.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => completeMutation.mutate({ id: route.id })}
                      className="text-[11px] text-[#1a7a4a] font-medium hover:underline flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Concluir Rota
                    </button>
                  )}
                  {route.status === 'COMPLETED' && tenant && (
                    <>
                      <button
                        onClick={async () => {
                          const settings = (tenant.settings ?? {}) as Record<string, unknown>
                          const lab: LabInfo = {
                            name: tenant.name,
                            logoUrl: tenant.logoUrl,
                            address: (settings.address as string) ?? null,
                            phone: (settings.phone as string) ?? null,
                            email: (settings.email as string) ?? null,
                            cpfCnpj: (settings.cpfCnpj as string) ?? null,
                          }
                          try {
                            await downloadDeliveryReceiptPdf(lab, {
                              routeDate: route.date,
                              status: route.status,
                              driverName: route.driverName,
                              completedAt: route.completedAt,
                              stops: route.stops.map((s) => ({
                                order: s.order,
                                address: s.address,
                                notes: s.notes,
                                status: s.status,
                              })),
                            })
                            toast.success('Comprovante gerado!')
                          } catch {
                            toast.error('Erro ao gerar comprovante.')
                          }
                        }}
                        className="text-[11px] text-[#5e81f4] font-medium hover:underline flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Comprovante
                      </button>
                    </>
                  )}
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
      <RouteFormDialog open={formOpen} onOpenChange={setFormOpen} />

      {selectedRouteId && (
        <StopFormDialog open={stopOpen} onOpenChange={setStopOpen} routeId={selectedRouteId} />
      )}
    </div>
  )
}
