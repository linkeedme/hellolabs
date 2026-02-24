'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const slug = params.slug as string

  return (
    <div className="min-h-screen bg-[#f5f5fa]">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-white border-b border-[#f0f0f3] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href={`/portal/${slug}/cases`} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#5e81f4] flex items-center justify-center">
              <span className="text-white text-[12px] font-bold">HL</span>
            </div>
            <span className="text-[16px] font-bold text-[#1c1d21]">Portal do Dentista</span>
          </Link>
          <div className="flex items-center gap-3 text-[13px] text-[#8181a5]">
            <span>Meus Casos</span>
          </div>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 py-6">{children}</main>
    </div>
  )
}
