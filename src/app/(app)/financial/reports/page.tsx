'use client'

import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, TrendingUp, Users, Layers } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { FinancialTabs } from '@/components/financial/financial-tabs'
import { trpc } from '@/lib/trpc/client'
import { formatMoney } from '@/lib/utils/format'

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(221, 83%, 53%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(262, 83%, 58%)',
  'hsl(180, 60%, 40%)',
  'hsl(330, 70%, 50%)',
]

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState<Date>(subMonths(new Date(), 6))
  const [dateTo, setDateTo] = useState<Date>(new Date())

  const { data: byClient, isLoading: loadingClient } =
    trpc.financial.revenueByClient.useQuery({ dateFrom, dateTo })

  const { data: byType, isLoading: loadingType } =
    trpc.financial.revenueByType.useQuery({ dateFrom, dateTo })

  const isLoading = loadingClient || loadingType

  const clientChartData = (byClient?.data ?? []).map((c) => ({
    name: c.clientName,
    total: Number(c.total),
  }))

  const typeChartData = (byType ?? []).map((t) => ({
    name: t.type,
    value: Number(t.total),
  }))

  const totalRevenue = byClient?.summary?.totalRevenue ?? 0
  const avgTicket = byClient?.summary?.avgTicket ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">
          Ordens de servico, cobrancas e fluxo de caixa.
        </p>
      </div>

      <FinancialTabs />

      {/* Date filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateFrom, 'dd/MM/yyyy', { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={(d) => d && setDateFrom(d)}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">ate</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateTo, 'dd/MM/yyyy', { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={(d) => d && setDateTo(d)}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Faturado
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatMoney(totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ticket Medio
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatMoney(avgTicket)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tipos de Protese
              </CardTitle>
              <Layers className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{typeChartData.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Client */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Cliente (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : clientChartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                Nenhum dado para o periodo.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clientChartData} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    type="number"
                    className="text-xs"
                    tickFormatter={(v) =>
                      new Intl.NumberFormat('pt-BR', {
                        notation: 'compact',
                      }).format(v)
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    className="text-xs"
                    width={100}
                    tickFormatter={(v: string) => (v.length > 15 ? v.slice(0, 15) + '...' : v)}
                  />
                  <Tooltip formatter={(value) => [formatMoney(Number(value)), 'Faturado']} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Tipo de Protese</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : typeChartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                Nenhum dado para o periodo.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${(name ?? '').length > 12 ? (name ?? '').slice(0, 12) + '...' : (name ?? '')} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {typeChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatMoney(Number(value)), 'Faturado']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
