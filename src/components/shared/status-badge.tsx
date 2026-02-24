import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted'

interface StatusBadgeProps {
  label: string
  variant?: StatusVariant
  className?: string
}

const variantStyles: Record<StatusVariant, string> = {
  default: 'bg-[rgba(94,129,244,0.1)] text-[#5e81f4] border-[rgba(94,129,244,0.3)]',
  success: 'bg-[rgba(124,231,172,0.15)] text-[#1a7a4a] border-[#7ce7ac]',
  warning: 'bg-[rgba(244,190,94,0.15)] text-[#7a5a1a] border-[#f4be5e]',
  error: 'bg-[rgba(255,128,139,0.15)] text-[#cc2d3a] border-[#ff808b]',
  info: 'bg-[rgba(94,129,244,0.1)] text-[#5e81f4] border-[rgba(94,129,244,0.3)]',
  muted: 'bg-[#f5f5fa] text-[#8181a5] border-[#f0f0f3]',
}

export function StatusBadge({ label, variant = 'default', className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {label}
    </Badge>
  )
}

// Mapeamento de status do caso (CaseStatus enum) para badge
export function getCaseStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: StatusVariant }> = {
    RECEIVED: { label: 'Recebido', variant: 'info' },
    IN_PRODUCTION: { label: 'Em Producao', variant: 'default' },
    WAITING_APPROVAL: { label: 'Aguardando Aprovacao', variant: 'warning' },
    APPROVED: { label: 'Aprovado', variant: 'success' },
    READY_FOR_DELIVERY: { label: 'Pronto p/ Entrega', variant: 'success' },
    DELIVERED: { label: 'Entregue', variant: 'muted' },
    CANCELLED: { label: 'Cancelado', variant: 'error' },
  }
  return map[status] || { label: status, variant: 'muted' as StatusVariant }
}

// Mapeamento de status da etapa (StageStatus enum)
export function getStageStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: StatusVariant }> = {
    PENDING: { label: 'Pendente', variant: 'muted' },
    IN_PROGRESS: { label: 'Em Andamento', variant: 'info' },
    COMPLETED: { label: 'Concluida', variant: 'success' },
    SKIPPED: { label: 'Pulada', variant: 'muted' },
  }
  return map[status] || { label: status, variant: 'muted' as StatusVariant }
}

// Mapeamento de prioridade (Priority enum)
export function getPriorityBadge(priority: string) {
  const map: Record<string, { label: string; variant: StatusVariant }> = {
    NORMAL: { label: 'Normal', variant: 'muted' },
    URGENT: { label: 'Urgente', variant: 'warning' },
    CRITICAL: { label: 'Critico', variant: 'error' },
  }
  return map[priority] || { label: priority, variant: 'muted' as StatusVariant }
}

// Mapeamento de status da fatura
export function getInvoiceStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: StatusVariant }> = {
    DRAFT: { label: 'Rascunho', variant: 'muted' },
    SENT: { label: 'Enviada', variant: 'info' },
    VIEWED: { label: 'Visualizada', variant: 'info' },
    PAID: { label: 'Paga', variant: 'success' },
    PARTIALLY_PAID: { label: 'Parcial', variant: 'warning' },
    OVERDUE: { label: 'Vencida', variant: 'error' },
    CANCELLED: { label: 'Cancelada', variant: 'muted' },
  }
  return map[status] || { label: status, variant: 'muted' as StatusVariant }
}

// Mapeamento de status da OS (OSStatus enum)
export function getOSStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: StatusVariant }> = {
    DRAFT: { label: 'Rascunho', variant: 'muted' },
    ISSUED: { label: 'Emitida', variant: 'info' },
    PAID: { label: 'Paga', variant: 'success' },
    CANCELLED: { label: 'Cancelada', variant: 'muted' },
  }
  return map[status] || { label: status, variant: 'muted' as StatusVariant }
}

// Mapeamento de status do cliente (ClientStatus enum)
export function getClientStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: StatusVariant }> = {
    ACTIVE: { label: 'Ativo', variant: 'success' },
    INACTIVE: { label: 'Inativo', variant: 'muted' },
    OVERDUE: { label: 'Inadimplente', variant: 'error' },
    PENDING_APPROVAL: { label: 'Pendente', variant: 'warning' },
  }
  return map[status] || { label: status, variant: 'muted' as StatusVariant }
}

// Mapeamento de tipo de movimentacao de estoque
export function getMovementTypeBadge(type: string) {
  const map: Record<string, { label: string; variant: StatusVariant }> = {
    PURCHASE: { label: 'Compra', variant: 'success' },
    CONSUMPTION: { label: 'Consumo', variant: 'warning' },
    ADJUSTMENT_POSITIVE: { label: 'Ajuste (+)', variant: 'info' },
    ADJUSTMENT_NEGATIVE: { label: 'Ajuste (-)', variant: 'error' },
    TRANSFER: { label: 'Transferencia', variant: 'default' },
    RETURN: { label: 'Devolucao', variant: 'muted' },
  }
  return map[type] || { label: type, variant: 'muted' as StatusVariant }
}

// Mapeamento de status de equipamento
export function getEquipmentStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: StatusVariant }> = {
    OPERATIONAL: { label: 'Operacional', variant: 'success' },
    MAINTENANCE: { label: 'Manutencao', variant: 'warning' },
    INACTIVE: { label: 'Inativo', variant: 'muted' },
  }
  return map[status] || { label: status, variant: 'muted' as StatusVariant }
}

// Mapeamento de status de rota de entrega
export function getRouteStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: StatusVariant }> = {
    DRAFT: { label: 'Rascunho', variant: 'muted' },
    PUBLISHED: { label: 'Publicada', variant: 'info' },
    IN_PROGRESS: { label: 'Em Andamento', variant: 'warning' },
    COMPLETED: { label: 'Concluida', variant: 'success' },
  }
  return map[status] || { label: status, variant: 'muted' as StatusVariant }
}

// Mapeamento de status de parada
export function getStopStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: StatusVariant }> = {
    PENDING: { label: 'Pendente', variant: 'muted' },
    EN_ROUTE: { label: 'A caminho', variant: 'info' },
    DELIVERED: { label: 'Entregue', variant: 'success' },
    FAILED: { label: 'Falhou', variant: 'error' },
  }
  return map[status] || { label: status, variant: 'muted' as StatusVariant }
}

// Mapeamento de status de entrega do caso
export function getDeliveryStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: StatusVariant }> = {
    PENDING: { label: 'Pendente', variant: 'muted' },
    IN_TRANSIT: { label: 'Em Transito', variant: 'info' },
    DELIVERED: { label: 'Entregue', variant: 'success' },
    FAILED: { label: 'Falhou', variant: 'error' },
    RETURNED: { label: 'Devolvido', variant: 'warning' },
  }
  return map[status] || { label: status, variant: 'muted' as StatusVariant }
}
