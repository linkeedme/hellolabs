'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { toast } from 'sonner'

import { KanbanColumn } from './kanban-column'
import { KanbanCardOverlay } from './kanban-card'
import { KanbanFilters } from './kanban-filters'
import { trpc } from '@/lib/trpc/client'
import { useDebounce } from '@/lib/hooks/use-debounce'
import type { CaseKanbanInput } from '@/lib/validators/case'

const KANBAN_STATUSES = [
  'RECEIVED',
  'IN_PRODUCTION',
  'WAITING_APPROVAL',
  'APPROVED',
  'READY_FOR_DELIVERY',
] as const

export function KanbanBoard() {
  const [filters, setFilters] = useState<CaseKanbanInput>({})
  const [activeId, setActiveId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(filters.search, 300)
  const queryFilters = { ...filters, search: debouncedSearch }

  const utils = trpc.useUtils()
  const { data: cases = [], isLoading } = trpc.case.kanban.useQuery(queryFilters)

  const updateStatus = trpc.case.updateStatus.useMutation({
    onSuccess: () => {
      utils.case.kanban.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
      utils.case.kanban.invalidate()
    },
  })

  // Group cases by status
  const grouped = useMemo(() => {
    const map: Record<string, typeof cases> = {}
    for (const status of KANBAN_STATUSES) {
      map[status] = []
    }
    for (const c of cases) {
      if (map[c.status]) {
        map[c.status].push(c)
      }
    }
    return map
  }, [cases])

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const activeCase = activeId ? cases.find((c) => c.id === activeId) : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)

    const { active, over } = event
    if (!over) return

    const caseId = active.id as string
    const targetStatus = over.id as string

    // Check if dropping on a column (status string)
    if (!KANBAN_STATUSES.includes(targetStatus as (typeof KANBAN_STATUSES)[number])) return

    // Find current case
    const currentCase = cases.find((c) => c.id === caseId)
    if (!currentCase || currentCase.status === targetStatus) return

    // Optimistically update
    updateStatus.mutate({
      id: caseId,
      status: targetStatus as (typeof KANBAN_STATUSES)[number],
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="flex gap-4 overflow-x-auto">
          {KANBAN_STATUSES.map((s) => (
            <div key={s} className="h-[60vh] min-w-[280px] animate-pulse rounded-lg bg-muted/30" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <KanbanFilters filters={filters} onFiltersChange={setFilters} />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              cases={grouped[status] ?? []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCase && <KanbanCardOverlay caseData={activeCase} />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
