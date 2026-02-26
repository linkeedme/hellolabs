import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Topbar } from '@/components/layout/topbar'
import { TenantGuard } from '@/components/providers/tenant-guard'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TenantGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Topbar />
          <main className="flex-1 overflow-auto p-6 bg-[#f5f5fa]">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TenantGuard>
  )
}
