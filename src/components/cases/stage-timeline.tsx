'use client'

import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Check, Circle, Play, SkipForward, Loader2 } from 'lucide-react'

interface Stage {
  id: string
  stageName: string
  stageOrder: number
  status: string
  assignedTo: string | null
  startedAt: string | Date | null
  completedAt: string | Date | null
  notes: string | null
}

interface StageTimelineProps {
  caseId: string
  stages: Stage[]
  canManage: boolean
}

export function StageTimeline({ caseId, stages, canManage }: StageTimelineProps) {
  const utils = trpc.useUtils()

  const moveStage = trpc.case.moveStage.useMutation({
    onSuccess: () => {
      utils.case.getById.invalidate({ id: caseId })
      toast.success('Etapa atualizada!')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleAction = (stageId: string, action: 'start' | 'complete' | 'skip') => {
    moveStage.mutate({ caseId, stageId, action })
  }

  return (
    <div className="space-y-0">
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1

        return (
          <div key={stage.id} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <StageIcon status={stage.status} />
              {!isLast && (
                <div className={cn(
                  'w-px flex-1 min-h-[24px]',
                  stage.status === 'COMPLETED' || stage.status === 'SKIPPED' ? 'bg-emerald-300' : 'bg-border',
                )} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    stage.status === 'SKIPPED' && 'line-through text-muted-foreground',
                  )}>
                    {stage.stageName}
                  </p>
                  {stage.startedAt && (
                    <p className="text-xs text-muted-foreground">
                      Iniciado: {formatDateTime(new Date(stage.startedAt))}
                    </p>
                  )}
                  {stage.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      Concluido: {formatDateTime(new Date(stage.completedAt))}
                    </p>
                  )}
                  {stage.notes && (
                    <p className="mt-1 text-xs text-muted-foreground italic">{stage.notes}</p>
                  )}
                </div>

                {/* Action buttons */}
                {canManage && (
                  <div className="flex gap-1">
                    {stage.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleAction(stage.id, 'start')}
                          disabled={moveStage.isPending}
                        >
                          {moveStage.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
                          Iniciar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => handleAction(stage.id, 'skip')}
                          disabled={moveStage.isPending}
                        >
                          <SkipForward className="mr-1 h-3 w-3" />
                          Pular
                        </Button>
                      </>
                    )}
                    {stage.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleAction(stage.id, 'complete')}
                        disabled={moveStage.isPending}
                      >
                        {moveStage.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                        Concluir
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StageIcon({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-3.5 w-3.5" />
      </div>
    )
  }
  if (status === 'IN_PROGRESS') {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white animate-pulse">
        <Circle className="h-3 w-3 fill-current" />
      </div>
    )
  }
  if (status === 'SKIPPED') {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SkipForward className="h-3.5 w-3.5" />
      </div>
    )
  }
  // PENDING
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted bg-background">
      <Circle className="h-2 w-2 text-muted-foreground" />
    </div>
  )
}
