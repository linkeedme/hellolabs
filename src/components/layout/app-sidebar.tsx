'use client'

import {
  LayoutDashboard,
  Kanban,
  Users,
  Receipt,
  Package,
  Wrench,
  CalendarDays,
  Truck,
  UsersRound,
  Settings,
  Palette,
  LogOut,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc/client'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const NAV_MAIN = [
  {
    title: 'Painel',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Producao',
    items: [
      { title: 'Casos', href: '/cases', icon: Kanban },
      { title: 'Clientes', href: '/clients', icon: Users },
      { title: 'Calendario', href: '/calendar', icon: CalendarDays },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { title: 'Financeiro', href: '/financial/orders', icon: Receipt },
    ],
  },
  {
    title: 'Recursos',
    items: [
      { title: 'Estoque', href: '/inventory', icon: Package },
      { title: 'Equipamentos', href: '/equipment', icon: Wrench },
      { title: 'Entregas', href: '/deliveries', icon: Truck },
    ],
  },
  {
    title: 'Gestao',
    items: [
      { title: 'Equipe', href: '/team', icon: UsersRound },
      { title: 'Configuracoes', href: '/settings/general', icon: Settings },
    ],
  },
]

const NAV_DEV = [
  {
    title: 'Desenvolvimento',
    items: [
      { title: 'Design System', href: '/design-system', icon: Palette },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const isDev = process.env.NODE_ENV === 'development'

  const { data: me } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const allNav = isDev ? [...NAV_MAIN, ...NAV_DEV] : NAV_MAIN

  const userName = me?.name || 'Usuario'
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const currentTenant = me?.tenants?.[0]
  const userRole = currentTenant?.role || ''

  const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    TECHNICIAN: 'Tecnico',
    FINANCE: 'Financeiro',
    DRIVER: 'Entregador',
    DENTIST: 'Dentista',
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Voce saiu do sistema.')
    router.push('/login')
    router.refresh()
  }

  return (
    <Sidebar className="border-r border-[#f0f0f3] bg-white">
      <SidebarHeader className="border-b border-[#f0f0f3] px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5e81f4] text-white text-sm font-bold shadow-sm">
            HL
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-bold text-[#1c1d21]">Hello Labs</span>
            {currentTenant && (
              <span className="text-[11px] text-[#8181a5] truncate">{currentTenant.name}</span>
            )}
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {allNav.map((group) => (
          <SidebarGroup key={group.title} className="mb-1 p-0">
            <SidebarGroupLabel className="px-3 py-1.5 text-[11px] font-semibold text-[#8181a5] uppercase tracking-wider">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                          isActive
                            ? 'bg-[rgba(94,129,244,0.1)] text-[#5e81f4] font-semibold'
                            : 'text-[#1c1d21] hover:bg-[#f5f5fa] hover:text-[#1c1d21]',
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-[#5e81f4]" />
                        )}
                        <item.icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isActive ? 'text-[#5e81f4]' : 'text-[#8181a5]',
                          )}
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-[#f0f0f3] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5e81f4] text-white text-sm font-semibold">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold text-[#1c1d21] truncate">{userName}</span>
              <span className="text-[11px] text-[#8181a5]">{ROLE_LABELS[userRole] || userRole}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-md text-[#8181a5] hover:text-[#cc2d3a] hover:bg-red-50 transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
