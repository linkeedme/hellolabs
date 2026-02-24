'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Shield, ChevronDown, ChevronRight, User, Clock } from 'lucide-react'
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
import { AUDIT_ENTITIES, AUDIT_ACTIONS } from '@/lib/validators/audit'

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criacao',
  UPDATE: 'Atualizacao',
  DELETE: 'Exclusao',
  STATUS_CHANGE: 'Mudanca de Status',
}

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  CREATE: { bg: 'rgba(124,231,172,0.15)', text: '#1a7a4a' },
  UPDATE: { bg: 'rgba(94,129,244,0.1)', text: '#5e81f4' },
  DELETE: { bg: 'rgba(255,128,139,0.15)', text: '#cc2d3a' },
  STATUS_CHANGE: { bg: 'rgba(244,190,94,0.15)', text: '#7a5a1a' },
}

// ── Expandable row for payload diff ──────────────────────────────
function AuditLogRow({
  log,
}: {
  log: {
    id: string
    entity: string
    entityId: string
    action: string
    createdAt: Date
    userName: string
    userEmail: string
    hasChanges: boolean
  }
}) {
  const [expanded, setExpanded] = useState(false)

  const { data: detail } = trpc.audit.getByEntity.useQuery(
    { entity: log.entity, entityId: log.entityId },
    { enabled: expanded },
  )

  const actionStyle = ACTION_COLORS[log.action] ?? { bg: '#f5f5fa', text: '#8181a5' }
  const actionLabel = ACTION_LABELS[log.action] ?? log.action
  const createdAt = log.createdAt instanceof Date ? log.createdAt : new Date(log.createdAt)

  // Find this specific log entry from the detail response
  const fullEntry = detail?.find((d: { id: string }) => d.id === log.id)

  return (
    <>
      <tr
        className="border-t border-[#f0f0f3] hover:bg-[#fafafe] transition-colors cursor-pointer"
        onClick={() => log.hasChanges && setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-[12px] text-[#8181a5]">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(createdAt, 'dd/MM/yy HH:mm', { locale: ptBR })}
          </div>
        </td>
        <td className="px-4 py-3 text-[13px] text-[#1c1d21]">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-[#8181a5]" />
            {log.userName}
          </div>
        </td>
        <td className="px-4 py-3 text-[13px] font-medium text-[#1c1d21]">{log.entity}</td>
        <td className="px-4 py-3">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: actionStyle.bg, color: actionStyle.text }}
          >
            {actionLabel}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          {log.hasChanges && (
            expanded
              ? <ChevronDown className="h-4 w-4 text-[#8181a5] inline" />
              : <ChevronRight className="h-4 w-4 text-[#8181a5] inline" />
          )}
        </td>
      </tr>

      {expanded && fullEntry && (
        <tr>
          <td colSpan={5} className="px-4 py-3 bg-[#fafafe]">
            <div className="grid grid-cols-2 gap-4 text-[12px]">
              <div>
                <p className="font-semibold text-[#8181a5] mb-1">Antes</p>
                <pre className="bg-white border border-[#f0f0f3] rounded-lg p-3 overflow-auto max-h-48 text-[11px] text-[#1c1d21]">
                  {fullEntry.payloadBefore
                    ? JSON.stringify(fullEntry.payloadBefore, null, 2)
                    : '(vazio)'}
                </pre>
              </div>
              <div>
                <p className="font-semibold text-[#8181a5] mb-1">Depois</p>
                <pre className="bg-white border border-[#f0f0f3] rounded-lg p-3 overflow-auto max-h-48 text-[11px] text-[#1c1d21]">
                  {fullEntry.payloadAfter
                    ? JSON.stringify(fullEntry.payloadAfter, null, 2)
                    : '(vazio)'}
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main page ────────────────────────────────────────────────────
export default function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [entity, setEntity] = useState<string>('')
  const [action, setAction] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading } = trpc.audit.list.useQuery({
    page,
    perPage: 20,
    entity: entity || undefined,
    action: action || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  const logs = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#1c1d21]">Log de Auditoria</h1>
        <p className="text-[14px] text-[#8181a5] mt-0.5">
          Historico de alteracoes no sistema.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#f0f0f3] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-[#5e81f4]" />
          <span className="text-[13px] font-semibold text-[#1c1d21]">Filtros</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-[#8181a5]">Entidade</Label>
            <Select value={entity} onValueChange={(v) => { setEntity(v === '_all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas</SelectItem>
                {AUDIT_ENTITIES.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-[#8181a5]">Acao</Label>
            <Select value={action} onValueChange={(v) => { setAction(v === '_all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas</SelectItem>
                {AUDIT_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>{ACTION_LABELS[a] ?? a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-[#8181a5]">Data inicio</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              className="h-8 text-[12px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-[#8181a5]">Data fim</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              className="h-8 text-[12px]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#f0f0f3] overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-[#f5f5fa] rounded animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[14px] font-medium text-[#1c1d21]">Nenhum registro encontrado</p>
            <p className="text-[13px] text-[#8181a5] mt-1">Ajuste os filtros ou aguarde novas atividades.</p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#f5f5fa] text-[12px] text-[#8181a5] font-semibold">
                <th className="text-left px-4 py-2.5">Data/Hora</th>
                <th className="text-left px-4 py-2.5">Usuario</th>
                <th className="text-left px-4 py-2.5">Entidade</th>
                <th className="text-left px-4 py-2.5">Acao</th>
                <th className="text-right px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: {
                id: string
                entity: string
                entityId: string
                action: string
                createdAt: Date
                userName: string
                userEmail: string
                hasChanges: boolean
              }) => (
                <AuditLogRow key={log.id} log={log} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[#8181a5]">
            Pagina {page} de {totalPages} ({data?.total ?? 0} registros)
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Proximo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
