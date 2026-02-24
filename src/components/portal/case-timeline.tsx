'use client'

import { Check, Clock, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Stage {
  id: string
  stageName: string
  stageOrder: number
  status: string
  startedAt: Date | string | null
  completedAt: Date | string | null
}

interface CaseTimelineProps {
  stages: Stage[]
}

function getStageIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <Check className="h-4 w-4 text-white" />
    case 'IN_PROGRESS':
      return <Clock className="h-4 w-4 text-white" />
    default:
      return <Circle className="h-3 w-3 text-[#8181a5]" />
  }
}

function getStageColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-[#7ce7ac]'
    case 'IN_PROGRESS':
      return 'bg-[#5e81f4]'
    default:
      return 'bg-[#f0f0f3]'
  }
}

function getStageLabel(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'Concluida'
    case 'IN_PROGRESS':
      return 'Em andamento'
    case 'SKIPPED':
      return 'Pulada'
    default:
      return 'Pendente'
  }
}

export function CaseTimeline({ stages }: CaseTimelineProps) {
  if (stages.length === 0) {
    return (
      <p className="text-[13px] text-[#8181a5]">Nenhuma etapa cadastrada.</p>
    )
  }

  return (
    <div className="space-y-0">
      {stages.map((stage, idx) => {
        const isLast = idx === stages.length - 1

        return (
          <div key={stage.id} className="flex gap-3">
            {/* Vertical line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center shrink-0',
                  getStageColor(stage.status),
                )}
              >
                {getStageIcon(stage.status)}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[24px]',
                    stage.status === 'COMPLETED' ? 'bg-[#7ce7ac]' : 'bg-[#f0f0f3]',
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-4">
              <p
                className={cn(
                  'text-[14px] font-medium leading-7',
                  stage.status === 'COMPLETED' ? 'text-[#1c1d21]' : 'text-[#8181a5]',
                )}
              >
                {stage.stageName}
              </p>
              <p className="text-[12px] text-[#8181a5]">
                {getStageLabel(stage.status)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
