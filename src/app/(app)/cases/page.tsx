'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { KanbanBoard } from '@/components/cases/kanban-board'
import { Plus } from 'lucide-react'

export default function CasesPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1c1d21]">Casos</h1>
          <p className="text-[14px] text-[#8181a5] mt-0.5">
            Pipeline de producao do laboratorio.
          </p>
        </div>
        <Link href="/cases/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Caso
          </Button>
        </Link>
      </div>

      <KanbanBoard />
    </div>
  )
}
