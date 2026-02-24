'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { KanbanCard } from './kanban-card'
import { cn } from '@/lib/utils'
import { getCaseStatusBadge } from '@/components/shared/status-badge'

interface KanbanColumnProps {
  status: string
  cases: Array<{
    id: string
    caseNumber: number
    patientName: string
    prosthesisType: string
    priority: string
    slaDate: string | Date | null
    client: { id: string; name: string }
    stages: { id: string; stageName: string; status: string; stageOrder: number }[]
  }>
}

export function KanbanColumn({ status, cases }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const statusInfo = getCaseStatusBadge(status)

  return (
    <div className="flex min-w-[280px] max-w-[280px] flex-col rounded-lg border bg-muted/30">
      {/* Column header */}
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <span className="text-sm font-medium">{statusInfo.label}</span>
        <Badge variant="secondary" className="text-xs">
          {cases.length}
        </Badge>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 transition-colors',
          isOver && 'bg-primary/5',
        )}
      >
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <SortableContext items={cases.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 p-2">
              {cases.map((caseData) => (
                <KanbanCard key={caseData.id} caseData={caseData} />
              ))}
              {cases.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  Nenhum caso
                </p>
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  )
}
