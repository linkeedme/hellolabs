'use client'

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { StatusBadge, getCaseStatusBadge } from '@/components/shared/status-badge'
import { useDebounce } from '@/lib/hooks/use-debounce'

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'RECEIVED', label: 'Recebido' },
  { value: 'IN_PRODUCTION', label: 'Em Producao' },
  { value: 'WAITING_APPROVAL', label: 'Aguardando Aprovacao' },
  { value: 'APPROVED', label: 'Aprovado' },
  { value: 'READY_FOR_DELIVERY', label: 'Pronto p/ Entrega' },
  { value: 'DELIVERED', label: 'Entregue' },
]

export default function PortalCasesPage() {
  const params = useParams()
  const slug = params.slug as string

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = trpc.portal.cases.useQuery({
    page,
    perPage: 20,
    search: debouncedSearch || undefined,
    status: status || undefined,
  })

  const cases = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────── */}
      <div>
        <h1 className="text-[22px] font-bold text-[#1c1d21]">Meus Casos</h1>
        <p className="text-[13px] text-[#8181a5] mt-1">
          Acompanhe o andamento dos seus casos
        </p>
      </div>

      {/* ── Search + Filter ─────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8181a5]" />
          <input
            type="text"
            placeholder="Buscar por paciente ou tipo..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#f0f0f3] bg-white text-[13px] text-[#1c1d21] placeholder:text-[#8181a5] focus:outline-none focus:ring-2 focus:ring-[#5e81f4]/30 focus:border-[#5e81f4]"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8181a5]" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="h-10 pl-9 pr-8 rounded-lg border border-[#f0f0f3] bg-white text-[13px] text-[#1c1d21] focus:outline-none focus:ring-2 focus:ring-[#5e81f4]/30 appearance-none cursor-pointer"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Cases List ──────────────────────────── */}
      {isLoading ? (
        <div className="text-center py-12 text-[#8181a5] text-[13px]">Carregando...</div>
      ) : cases.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#f0f0f3]">
          <p className="text-[15px] font-medium text-[#1c1d21]">Nenhum caso encontrado</p>
          <p className="text-[13px] text-[#8181a5] mt-1">Tente ajustar os filtros</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const badge = getCaseStatusBadge(c.status)
            return (
              <Link
                key={c.id}
                href={`/portal/${slug}/cases/${c.id}`}
                className="block bg-white rounded-xl border border-[#f0f0f3] p-4 hover:border-[#5e81f4]/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[rgba(94,129,244,0.1)] flex items-center justify-center shrink-0">
                      <span className="text-[#5e81f4] text-[12px] font-bold">#{c.caseNumber}</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#1c1d21]">
                        {c.patientName}
                      </p>
                      <p className="text-[12px] text-[#8181a5]">
                        {c.prosthesisType} • Criado em {format(new Date(c.createdAt), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.slaDate && (
                      <span className="text-[12px] text-[#8181a5]">
                        SLA: {format(new Date(c.slaDate), 'dd/MM')}
                      </span>
                    )}
                    <StatusBadge label={badge.label} variant={badge.variant} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Pagination ──────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
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
    </div>
  )
}
