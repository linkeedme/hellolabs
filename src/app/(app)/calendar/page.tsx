'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { trpc } from '@/lib/trpc/client'
import { EventFormDialog } from '@/components/calendar/event-form-dialog'

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const EVENT_COLOR_TEXT: Record<string, string> = {
  '#7ce7ac': '#1a7a4a',
  '#5e81f4': '#5e81f4',
  '#f4be5e': '#7a5a1a',
  '#ff808b': '#cc2d3a',
  '#8181a5': '#8181a5',
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<{ id: string } & Record<string, unknown> | undefined>()
  const [defaultDate, setDefaultDate] = useState<string>('')

  // Compute date range for the visible month
  const dateFrom = new Date(year, month, 1)
  const dateTo = new Date(year, month + 1, 0)

  const { data: events } = trpc.calendar.list.useQuery({
    dateFrom,
    dateTo,
  })

  const { data: upcoming } = trpc.calendar.upcoming.useQuery({
    days: 30,
    perPage: 8,
  })

  const deleteMutation = trpc.calendar.delete.useMutation({
    onSuccess: () => {
      utils.calendar.list.invalidate()
      utils.calendar.upcoming.invalidate()
    },
  })

  const utils = trpc.useUtils()

  // Group events by date key
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof events> = {}
    if (!events) return map
    for (const ev of events) {
      const key = format(new Date(ev.date), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key]!.push(ev)
    }
    return map
  }, [events])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const today = now.getDate()
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear()

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setDefaultDate(dateStr)
    setEditData(undefined)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1c1d21]">Calendario</h1>
          <p className="text-[14px] text-[#8181a5] mt-0.5">
            Entregas, manutencoes, calibracoes e eventos.
          </p>
        </div>
        <button
          onClick={() => { setEditData(undefined); setDefaultDate(''); setFormOpen(true) }}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#5e81f4] text-white text-[13px] font-bold hover:bg-[#4a6de0] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Evento
        </button>
      </div>

      <div className="flex gap-6">
        {/* Calendar grid */}
        <div className="flex-1 bg-white rounded-xl border border-[#f0f0f3] p-5">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#f5f5fa] text-[#8181a5] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[15px] font-bold text-[#1c1d21]">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#f5f5fa] text-[#8181a5] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-[#8181a5] uppercase py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              const dateKey = day
                ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                : ''
              const dayEvents = dateKey ? (eventsByDate[dateKey] ?? []) : []
              const isToday = isCurrentMonth && day === today

              return (
                <div
                  key={idx}
                  onClick={() => day && handleDayClick(day)}
                  className={`min-h-[80px] rounded-lg p-1.5 border transition-colors ${
                    day
                      ? 'border-[#f0f0f3] hover:border-[rgba(94,129,244,0.3)] cursor-pointer'
                      : 'border-transparent'
                  } ${isToday ? 'border-[#5e81f4] bg-[rgba(94,129,244,0.04)]' : ''}`}
                >
                  {day && (
                    <>
                      <span
                        className={`text-[12px] font-medium inline-flex h-5 w-5 items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-[#5e81f4] text-white font-bold'
                            : 'text-[#1c1d21]'
                        }`}
                      >
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => {
                          const color = ev.color ?? '#5e81f4'
                          const textColor = EVENT_COLOR_TEXT[color] ?? color
                          return (
                            <div
                              key={ev.id}
                              className="text-[10px] font-medium px-1 py-0.5 rounded truncate"
                              style={{
                                backgroundColor: `${color}25`,
                                color: textColor,
                              }}
                              onClick={(e) => { e.stopPropagation(); setEditData({ id: ev.id, title: ev.title, type: ev.type, date: format(new Date(ev.date), 'yyyy-MM-dd'), color: ev.color, description: ev.description }); setFormOpen(true) }}
                            >
                              {ev.title}
                            </div>
                          )
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-[#8181a5]">+{dayEvents.length - 2} mais</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar — upcoming events */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-xl border border-[#f0f0f3] p-4">
            <h3 className="text-[13px] font-bold text-[#1c1d21] mb-3">Proximos eventos</h3>
            <div className="space-y-3">
              {(upcoming?.items ?? []).length === 0 ? (
                <p className="text-[12px] text-[#8181a5]">Nenhum evento agendado</p>
              ) : (
                upcoming?.items.map((ev) => {
                  const color = ev.color ?? '#5e81f4'
                  return (
                    <div key={ev.id} className="flex items-start gap-3">
                      <div
                        className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <p className="text-[12px] font-medium text-[#1c1d21]">{ev.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-[#8181a5]" />
                          <span className="text-[11px] text-[#8181a5]">
                            {format(new Date(ev.date), 'dd MMM')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl border border-[#f0f0f3] p-4 mt-3">
            <h3 className="text-[13px] font-bold text-[#1c1d21] mb-3">Legenda</h3>
            <div className="space-y-2">
              {[
                { color: '#7ce7ac', label: 'Entrega' },
                { color: '#5e81f4', label: 'Producao / Reuniao' },
                { color: '#f4be5e', label: 'Manutencao / Calibracao' },
                { color: '#ff808b', label: 'Urgente' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-[12px] text-[#8181a5]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event form dialog */}
      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editData={editData}
        defaultDate={defaultDate}
      />
    </div>
  )
}
