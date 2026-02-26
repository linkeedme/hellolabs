'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ArrowUpRight, AlertTriangle, Clock, Plus, Users, Kanban, Receipt, Package } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { StatusBadge, getCaseStatusBadge } from '@/components/shared/status-badge'
import { formatMoney } from '@/lib/utils/format'

// ── Componentes internos ────────────────────────────────────────────────────
function StatCard({
  title,
  subtitle,
  value,
  progress,
  progressColor,
  loading,
}: {
  title: string
  subtitle: string
  value: string
  progress: number
  progressColor: string
  loading?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-[#f0f0f3] p-5 flex flex-col gap-2">
      <div>
        <p className="text-[18px] font-bold text-[#1c1d21] leading-tight">{title}</p>
        <p className="text-[13px] text-[#8181a5] mt-0.5">{subtitle}</p>
      </div>
      <p className="text-[26px] font-bold text-[#1c1d21] leading-none">
        {loading ? '...' : value}
      </p>
      <div className="mt-1 h-1.5 w-full rounded-full bg-[#f5f5fa]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: progressColor }}
        />
      </div>
    </div>
  )
}

function SectionHeader({
  title,
  action,
  href,
}: {
  title: string
  action?: string
  href?: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[18px] font-bold text-[#1c1d21]">{title}</h2>
      {action && href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-[13px] font-semibold text-[#5e81f4] hover:underline"
        >
          {action}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  )
}

// ── Quick Actions ───────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Novo Caso', href: '/cases/new', icon: Plus, color: '#5e81f4' },
  { label: 'Clientes', href: '/clients', icon: Users, color: '#7ce7ac' },
  { label: 'Kanban', href: '/cases', icon: Kanban, color: '#f4be5e' },
  { label: 'Financeiro', href: '/financial/orders', icon: Receipt, color: '#ff808b' },
  { label: 'Estoque', href: '/inventory', icon: Package, color: '#8b5cf6' },
]

// ── Page ───────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: me } = trpc.auth.me.useQuery(undefined, { retry: false, staleTime: 5 * 60 * 1000 })
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery()
  const { data: monthlyData } = trpc.dashboard.monthlyCases.useQuery()
  const { data: recentCases } = trpc.dashboard.recentCases.useQuery()
  const { data: lowStock } = trpc.dashboard.lowStockAlerts.useQuery()
  const { data: slaAlerts } = trpc.dashboard.slaAlerts.useQuery()

  const chartData = monthlyData ?? []
  const totalCasesYear = chartData.reduce((sum, m) => sum + m.pedidos, 0)
  const totalRevenueYear = chartData.reduce((sum, m) => sum + m.faturamento, 0)

  const firstName = me?.name?.split(' ')[0] || 'Usuario'

  return (
    <div className="space-y-6 min-h-full bg-[#f5f5fa] -m-6 p-6">
      {/* ── Welcome + Quick Actions ─────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1c1d21]">
            Ola, {firstName}!
          </h1>
          <p className="text-[13px] text-[#8181a5]">
            {me?.tenants?.[0]?.name ? `${me.tenants[0].name} — ` : ''}
            Veja o resumo do seu laboratorio.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: action.color }}
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Casos Ativos"
          subtitle="Em producao"
          value={String(stats?.activeCases ?? 0)}
          progress={Math.min((stats?.activeCases ?? 0) * 2, 100)}
          progressColor="#5e81f4"
          loading={statsLoading}
        />
        <StatCard
          title="Clientes"
          subtitle="Dentistas ativos"
          value={String(stats?.activeClients ?? 0)}
          progress={Math.min((stats?.activeClients ?? 0) * 5, 100)}
          progressColor="#7ce7ac"
          loading={statsLoading}
        />
        <StatCard
          title="Faturamento"
          subtitle="Este mes"
          value={formatMoney(stats?.monthlyRevenue ?? 0)}
          progress={78}
          progressColor="#5e81f4"
          loading={statsLoading}
        />
        <StatCard
          title="Alertas"
          subtitle="SLA, estoque"
          value={String(stats?.alertCount ?? 0)}
          progress={Math.min((stats?.alertCount ?? 0) * 10, 100)}
          progressColor="#ff808b"
          loading={statsLoading}
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Area Chart — Pedidos */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#f0f0f3] p-5">
          <SectionHeader title="Pedidos" action="Ver todos" href="/cases" />
          <div className="flex gap-6 mb-4">
            <div>
              <p className="text-[22px] font-bold text-[#1c1d21]">{totalCasesYear}</p>
              <p className="text-[13px] text-[#8181a5]">Total de casos (12 meses)</p>
            </div>
            <div>
              <p className="text-[22px] font-bold text-[#5e81f4]">
                {totalRevenueYear > 0 ? `R$ ${totalRevenueYear.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : 'R$ 0'}
              </p>
              <p className="text-[13px] text-[#8181a5]">Faturamento acumulado</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradPedidos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5e81f4" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#5e81f4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7ce7ac" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#7ce7ac" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f3" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 12, fill: '#8181a5' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12, fill: '#8181a5' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #f0f0f3',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Area
                type="monotone"
                dataKey="pedidos"
                stroke="#5e81f4"
                strokeWidth={2.5}
                fill="url(#gradPedidos)"
                dot={false}
                activeDot={{ r: 5, fill: '#5e81f4' }}
                name="Pedidos"
              />
              <Area
                type="monotone"
                dataKey="faturamento"
                stroke="#7ce7ac"
                strokeWidth={2}
                fill="url(#gradFat)"
                dot={false}
                activeDot={{ r: 4, fill: '#7ce7ac' }}
                name="Faturamento (R$)"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[12px] text-[#8181a5]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#5e81f4]" />
              Pedidos
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-[#8181a5]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#7ce7ac]" />
              Faturamento
            </span>
          </div>
        </div>

        {/* Alerts sidebar */}
        <div className="lg:col-span-2 space-y-5">
          {/* Low stock alerts */}
          <div className="bg-white rounded-xl border border-[#f0f0f3] p-5">
            <SectionHeader title="Estoque Baixo" action="Ver estoque" href="/inventory" />
            {(lowStock ?? []).length === 0 ? (
              <p className="text-[13px] text-[#8181a5]">Nenhum alerta de estoque</p>
            ) : (
              <div className="space-y-2">
                {lowStock?.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-[#ff808b]" />
                      <span className="text-[#1c1d21] font-medium">{p.name}</span>
                    </div>
                    <span className="text-[#cc2d3a] font-bold">
                      {Number(p.qtyCurrent)} / {Number(p.qtyMin)} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SLA alerts */}
          <div className="bg-white rounded-xl border border-[#f0f0f3] p-5">
            <SectionHeader title="Prazos SLA" action="Ver casos" href="/cases" />
            {(slaAlerts ?? []).length === 0 ? (
              <p className="text-[13px] text-[#8181a5]">Nenhum prazo proximo</p>
            ) : (
              <div className="space-y-2">
                {slaAlerts?.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <Clock className={`h-3.5 w-3.5 ${c.overdue ? 'text-[#cc2d3a]' : 'text-[#f4be5e]'}`} />
                      <div>
                        <span className="text-[#1c1d21] font-medium">#{c.caseNumber}</span>
                        <span className="text-[#8181a5] ml-1">{c.clientName}</span>
                      </div>
                    </div>
                    <span className={`font-bold ${c.overdue ? 'text-[#cc2d3a]' : 'text-[#7a5a1a]'}`}>
                      {c.slaDate ? format(new Date(c.slaDate), 'dd/MM') : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Cases Table ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#f0f0f3] p-5">
        <SectionHeader title="Ultimos Casos" action="Ver todos" href="/cases" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#f5f5fa] rounded-lg">
                <th className="text-left font-semibold text-[#8181a5] px-4 py-2.5 rounded-l-lg">
                  # / Dentista
                </th>
                <th className="text-left font-semibold text-[#8181a5] px-4 py-2.5">
                  Tipo
                </th>
                <th className="text-left font-semibold text-[#8181a5] px-4 py-2.5">
                  Dentista
                </th>
                <th className="text-right font-semibold text-[#8181a5] px-4 py-2.5">
                  Criado em
                </th>
                <th className="text-right font-semibold text-[#8181a5] px-4 py-2.5 rounded-r-lg">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {(recentCases ?? []).map((c) => {
                const badge = getCaseStatusBadge(c.status)
                return (
                  <tr
                    key={c.id}
                    className="border-b border-[#f5f5fa] last:border-0 hover:bg-[#fafafa] transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-[rgba(94,129,244,0.1)] shrink-0">
                          <span className="text-[#5e81f4] text-[11px] font-bold">#{c.caseNumber}</span>
                        </div>
                        <div>
                          <p className="font-bold text-[#1c1d21] leading-snug">Caso #{c.caseNumber}</p>
                          <p className="text-[#8181a5] text-[12px]">{c.clientName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[#1c1d21] font-medium">{c.prosthesisType}</td>
                    <td className="px-4 py-3.5 text-[#8181a5]">{c.clientName}</td>
                    <td className="px-4 py-3.5 text-right text-[#8181a5]">
                      {format(new Date(c.createdAt), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <StatusBadge label={badge.label} variant={badge.variant} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f5f5fa]">
          <p className="text-[13px] text-[#8181a5]">
            {stats?.activeCases ?? 0} casos ativos
          </p>
          <Link
            href="/cases"
            className="h-9 px-4 rounded-lg bg-[#5e81f4] text-white text-[13px] font-bold hover:bg-[#4d70e0] transition-colors flex items-center"
          >
            Ver Todos os Casos
          </Link>
        </div>
      </div>
    </div>
  )
}
