'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CaseForm } from '@/components/cases/case-form'
import { trpc } from '@/lib/trpc/client'
import { caseCreateSchema } from '@/lib/validators/case'
import type { z } from 'zod'

type CaseFormValues = z.input<typeof caseCreateSchema>

export default function NewCasePage() {
  const router = useRouter()
  const createCase = trpc.case.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Caso #${data.caseNumber} criado com sucesso!`)
      router.push(`/cases/${data.id}`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (data: CaseFormValues) => {
    createCase.mutate(data)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo Caso</h1>
        <p className="text-sm text-muted-foreground">Preencha os dados para criar um novo caso de protese.</p>
      </div>
      <CaseForm mode="create" onSubmit={handleSubmit} isLoading={createCase.isPending} />
    </div>
  )
}
