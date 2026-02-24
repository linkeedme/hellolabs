import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(94,129,244,0.1)]">
        <Icon className="h-8 w-8 text-[#5e81f4]" />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-[#1c1d21]">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] text-[#8181a5]">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex h-9 items-center rounded-lg bg-[#5e81f4] px-4 text-[13px] font-bold text-white hover:bg-[#4a6de0] transition-colors"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex h-9 items-center rounded-lg bg-[#5e81f4] px-4 text-[13px] font-bold text-white hover:bg-[#4a6de0] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
