'use client'

import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { getProsthesisTypeById } from '@/lib/constants/prosthesis-types'
import { getPriorityBadge, StatusBadge } from '@/components/shared/status-badge'
import { FileText, MessageSquare } from 'lucide-react'

interface KanbanCaseData {
  id: string
  caseNumber: number
  patientName: string
  prosthesisType: string
  priority: string
  slaDate: string | Date | null
  client: { id: string; name: string }
  stages: { id: string; stageName: string; status: string; stageOrder: number }[]
  _count?: { files: number; comments: number }
}

interface KanbanCardProps {
  caseData: KanbanCaseData
}

function getSlaIndicator(slaDate: string | Date | null): { color: string; label: string } {
  if (!slaDate) return { color: 'bg-muted', label: '' }

  const now = new Date()
  const sla = new Date(slaDate)
  const diffMs = sla.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { color: 'bg-red-500', label: `${Math.abs(diffDays)}d atrasado` }
  if (diffDays <= 1) return { color: 'bg-red-500', label: 'Hoje/Amanha' }
  if (diffDays <= 3) return { color: 'bg-amber-500', label: `${diffDays}d` }
  return { color: 'bg-emerald-500', label: `${diffDays}d` }
}

const priorityBorderColor: Record<string, string> = {
  NORMAL: 'border-l-transparent',
  URGENT: 'border-l-amber-500',
  CRITICAL: 'border-l-red-500',
}

export function KanbanCard({ caseData }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: caseData.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const sla = getSlaIndicator(caseData.slaDate)
  const typeName = getProsthesisTypeById(caseData.prosthesisType)?.name ?? caseData.prosthesisType
  const priorityInfo = getPriorityBadge(caseData.priority)
  const completedStages = caseData.stages.filter((s) => s.status === 'COMPLETED' || s.status === 'SKIPPED').length
  const totalStages = caseData.stages.length

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group cursor-grab rounded-lg border border-l-4 bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing',
        priorityBorderColor[caseData.priority] ?? 'border-l-transparent',
        isDragging && 'opacity-50',
      )}
    >
      <Link href={`/cases/${caseData.id}`} className="block space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">#{caseData.caseNumber}</span>
          <div className="flex items-center gap-1.5">
            {caseData.slaDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className={cn('inline-block h-2 w-2 rounded-full', sla.color)} />
                {sla.label}
              </span>
            )}
          </div>
        </div>

        {/* Patient */}
        <p className="text-sm font-medium leading-tight">{caseData.patientName}</p>

        {/* Type */}
        <p className="text-xs text-muted-foreground">{typeName}</p>

        {/* Client */}
        <p className="text-xs text-muted-foreground">{caseData.client.name}</p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          {/* Stage progress */}
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {caseData.stages.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    'h-1.5 w-3 rounded-full',
                    s.status === 'COMPLETED' ? 'bg-emerald-500' :
                    s.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                    s.status === 'SKIPPED' ? 'bg-muted' :
                    'bg-muted/50',
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">{completedStages}/{totalStages}</span>
          </div>

          {/* Priority badge for non-normal */}
          {caseData.priority !== 'NORMAL' && (
            <StatusBadge label={priorityInfo.label} variant={priorityInfo.variant} className="text-[10px] px-1.5 py-0" />
          )}
        </div>
      </Link>
    </div>
  )
}

// Overlay version for drag
export function KanbanCardOverlay({ caseData }: KanbanCardProps) {
  const sla = getSlaIndicator(caseData.slaDate)
  const typeName = getProsthesisTypeById(caseData.prosthesisType)?.name ?? caseData.prosthesisType

  return (
    <div className={cn(
      'rounded-lg border border-l-4 bg-card p-3 shadow-lg',
      priorityBorderColor[caseData.priority] ?? 'border-l-transparent',
    )}>
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">#{caseData.caseNumber}</span>
          {caseData.slaDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className={cn('inline-block h-2 w-2 rounded-full', sla.color)} />
              {sla.label}
            </span>
          )}
        </div>
        <p className="text-sm font-medium leading-tight">{caseData.patientName}</p>
        <p className="text-xs text-muted-foreground">{typeName}</p>
        <p className="text-xs text-muted-foreground">{caseData.client.name}</p>
      </div>
    </div>
  )
}
