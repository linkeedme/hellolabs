'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Ordens de Servico', href: '/financial/orders' },
  { label: 'Cobrancas', href: '/financial/invoices' },
  { label: 'Fluxo de Caixa', href: '/financial/cash-flow' },
  { label: 'Relatorios', href: '/financial/reports' },
]

export function FinancialTabs() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 border-b">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors hover:text-foreground',
            pathname === tab.href
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
