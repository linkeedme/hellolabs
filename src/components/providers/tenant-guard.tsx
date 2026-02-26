'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

/**
 * Verifica se o usuario autenticado possui um tenant.
 * Se nao, redireciona para /details (onboarding).
 */
export function TenantGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: me, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (isLoading) return
    if (error) {
      // User not authenticated — middleware should handle this,
      // but just in case redirect to login
      router.push('/login')
      return
    }
    if (me && me.tenants.length === 0) {
      router.push('/details')
    }
  }, [me, isLoading, error, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5fa]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5e81f4] border-t-transparent" />
          <p className="text-[13px] text-[#8181a5]">Carregando...</p>
        </div>
      </div>
    )
  }

  if (error || (me && me.tenants.length === 0)) {
    return null
  }

  return <>{children}</>
}
