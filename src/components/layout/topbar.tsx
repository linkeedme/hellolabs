'use client'

import { usePathname } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { NotificationBell } from './notification-bell'

const PATH_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cases': 'Casos',
  '/clients': 'Clientes',
  '/calendar': 'Calendario',
  '/financial/orders': 'Ordens de Servico',
  '/financial/invoices': 'Faturas',
  '/financial/cash-flow': 'Fluxo de Caixa',
  '/financial/reports': 'Relatorios',
  '/inventory': 'Estoque',
  '/equipment': 'Equipamentos',
  '/deliveries': 'Entregas',
  '/team': 'Equipe',
  '/settings/general': 'Configuracoes',
  '/notifications': 'Notificacoes',
  '/design-system': 'Design System',
}

function getPageLabel(pathname: string): string {
  // exact match first
  if (PATH_LABELS[pathname]) return PATH_LABELS[pathname]
  // prefix match for nested routes (e.g. /cases/[id])
  for (const [key, label] of Object.entries(PATH_LABELS)) {
    if (pathname.startsWith(key + '/')) return label
  }
  return 'Hello Labs'
}

export function Topbar() {
  const pathname = usePathname()
  const label = getPageLabel(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#f0f0f3] bg-white px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-[#8181a5] hover:text-[#1c1d21]" />
        <Separator orientation="vertical" className="mr-1 h-4 bg-[#f0f0f3]" />
        <span className="text-[14px] font-semibold text-[#1c1d21]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5e81f4] text-white text-[12px] font-semibold">
          U
        </div>
      </div>
    </header>
  )
}
