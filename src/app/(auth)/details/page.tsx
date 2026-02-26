'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthPanel } from '@/components/auth/auth-panel'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'

function FieldInput({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  required,
  autoComplete,
  rightIcon,
}: {
  label: string
  id: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  autoComplete?: string
  rightIcon?: React.ReactNode
}) {
  return (
    <div className="border-b border-[#ECECF2] pb-3 relative">
      <label htmlFor={id} className="block text-[14px] text-[#8181A5] font-normal leading-[21px]">
        {label}
      </label>
      <div className="flex items-center">
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="flex-1 text-[14px] font-bold text-[#1C1D21] bg-transparent outline-none placeholder:text-[#8181A5] placeholder:font-bold pt-1"
        />
        {rightIcon && <span className="ml-2 text-[#8181A5]">{rightIcon}</span>}
      </div>
    </div>
  )
}

export default function DetailsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const createTenant = trpc.auth.createTenant.useMutation({
    onSuccess: (data) => {
      toast.success('Laboratorio criado com sucesso!')
      router.push('/finish')
    },
    onError: (error) => {
      toast.error('Erro ao criar laboratorio', { description: error.message })
      setLoading(false)
    },
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const labName = formData.get('labName') as string
    const document = formData.get('document') as string
    const phone = formData.get('phone') as string

    createTenant.mutate({
      labName,
      document: document || undefined,
      phone: phone || undefined,
    })
  }

  return (
    <AuthPanel
      title="Configure seu laboratorio"
      subtitle="Informe os dados do seu laboratorio para comecar."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <FieldInput
            label="Nome do laboratorio *"
            id="labName"
            name="labName"
            placeholder="Ex: Lab Dental Premium"
            required
          />

          <FieldInput
            label="CNPJ ou CPF"
            id="document"
            name="document"
            placeholder="00.000.000/0000-00"
          />

          <FieldInput
            label="Telefone"
            id="phone"
            name="phone"
            type="tel"
            placeholder="(00) 00000-0000"
            autoComplete="tel"
          />
        </div>

        <p className="text-[12px] text-[#8181A5]">
          Voce podera ajustar estes dados e adicionar mais informacoes nas configuracoes do sistema.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[46px] bg-[#5E81F4] text-white text-[14px] font-semibold rounded-lg hover:bg-[#4A6FE3] transition-colors disabled:opacity-60"
        >
          {loading ? 'Criando laboratorio...' : 'Criar laboratorio'}
        </button>
      </form>
    </AuthPanel>
  )
}
