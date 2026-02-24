'use client'

import { cn } from '@/lib/utils'

interface TeethSelectorProps {
  value: string[]
  onChange: (teeth: string[]) => void
  disabled?: boolean
}

// FDI notation: quadrant (1-4) + tooth position (1-8)
// Q1: upper right (18-11), Q2: upper left (21-28)
// Q3: lower left (31-38), Q4: lower right (41-48)
const QUADRANTS = {
  1: { teeth: [18, 17, 16, 15, 14, 13, 12, 11], label: 'Sup. Dir.' },
  2: { teeth: [21, 22, 23, 24, 25, 26, 27, 28], label: 'Sup. Esq.' },
  3: { teeth: [31, 32, 33, 34, 35, 36, 37, 38], label: 'Inf. Esq.' },
  4: { teeth: [48, 47, 46, 45, 44, 43, 42, 41], label: 'Inf. Dir.' },
} as const

export function TeethSelector({ value, onChange, disabled }: TeethSelectorProps) {
  const toggle = (tooth: string) => {
    if (disabled) return
    if (value.includes(tooth)) {
      onChange(value.filter((t) => t !== tooth))
    } else {
      onChange([...value, tooth])
    }
  }

  const selectAll = () => {
    if (disabled) return
    const all = Object.values(QUADRANTS).flatMap((q) => q.teeth.map(String))
    onChange(all)
  }

  const clearAll = () => {
    if (disabled) return
    onChange([])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {value.length > 0 ? `${value.length} dente(s) selecionado(s)` : 'Nenhum dente selecionado'}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={disabled}
            className="text-xs text-primary hover:underline disabled:opacity-50"
          >
            Todos
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled}
            className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Dental chart */}
      <div className="rounded-lg border bg-card p-4">
        {/* Upper jaw */}
        <div className="flex justify-center gap-0.5">
          {/* Q1: upper right */}
          <div className="flex gap-0.5">
            {QUADRANTS[1].teeth.map((tooth) => (
              <ToothButton
                key={tooth}
                tooth={String(tooth)}
                selected={value.includes(String(tooth))}
                onClick={toggle}
                disabled={disabled}
              />
            ))}
          </div>
          <div className="mx-1 w-px bg-border" />
          {/* Q2: upper left */}
          <div className="flex gap-0.5">
            {QUADRANTS[2].teeth.map((tooth) => (
              <ToothButton
                key={tooth}
                tooth={String(tooth)}
                selected={value.includes(String(tooth))}
                onClick={toggle}
                disabled={disabled}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-2 h-px bg-border" />

        {/* Lower jaw */}
        <div className="flex justify-center gap-0.5">
          {/* Q4: lower right */}
          <div className="flex gap-0.5">
            {QUADRANTS[4].teeth.map((tooth) => (
              <ToothButton
                key={tooth}
                tooth={String(tooth)}
                selected={value.includes(String(tooth))}
                onClick={toggle}
                disabled={disabled}
              />
            ))}
          </div>
          <div className="mx-1 w-px bg-border" />
          {/* Q3: lower left */}
          <div className="flex gap-0.5">
            {QUADRANTS[3].teeth.map((tooth) => (
              <ToothButton
                key={tooth}
                tooth={String(tooth)}
                selected={value.includes(String(tooth))}
                onClick={toggle}
                disabled={disabled}
              />
            ))}
          </div>
        </div>

        {/* Labels */}
        <div className="mt-2 flex justify-center gap-0.5 text-[10px] text-muted-foreground">
          <span className="w-[calc(8*2rem+7*2px)] text-center">Direito</span>
          <span className="mx-1 w-px" />
          <span className="w-[calc(8*2rem+7*2px)] text-center">Esquerdo</span>
        </div>
      </div>
    </div>
  )
}

function ToothButton({
  tooth,
  selected,
  onClick,
  disabled,
}: {
  tooth: string
  selected: boolean
  onClick: (tooth: string) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(tooth)}
      disabled={disabled}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-colors',
        'hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        selected
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-muted/50 text-muted-foreground',
      )}
    >
      {tooth}
    </button>
  )
}
