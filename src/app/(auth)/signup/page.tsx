'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AuthPanel } from '@/components/auth/auth-panel'

function FieldInput({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  required,
  autoComplete,
}: {
  label: string
  id: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <div className="border-b border-[#ECECF2] pb-3">
      <label htmlFor={id} className="block text-[14px] text-[#8181A5] font-normal leading-[21px]">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="w-full text-[14px] font-bold text-[#1C1D21] bg-transparent outline-none placeholder:text-[#8181A5] placeholder:font-bold pt-1"
      />
    </div>
  )
}

function CircleCheckbox({
  id,
  checked,
  onChange,
  label,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          checked ? 'bg-[#5E81F4] border-[#5E81F4]' : 'border-[#ECECF2] bg-white'
        }`}
      >
        {checked && <div className="w-2 h-2 rounded-full bg-white" />}
      </button>
      <span className="text-[13px] text-[#8181A5]">{label}</span>
    </label>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!agreed) {
      toast.error('Voce precisa aceitar os termos de uso.')
      return
    }
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (password.length < 8) {
      toast.error('A senha deve ter no minimo 8 caracteres.')
      setLoading(false)
      return
    }

    // Signup via server API (uses service_role — no email confirmation needed)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    })

    const result = await res.json()

    if (!res.ok) {
      toast.error('Erro ao criar conta', { description: result.error })
      setLoading(false)
      return
    }

    toast.success('Conta criada com sucesso!')
    router.push('/details')
    router.refresh()
  }

  return (
    <AuthPanel
      title="Crie sua conta"
      subtitle="Cadastre-se para comecar a gerenciar seu laboratorio."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <FieldInput
            label="Nome completo"
            id="fullName"
            name="fullName"
            placeholder="Seu nome"
            required
            autoComplete="name"
          />
          <FieldInput
            label="Email"
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            required
            autoComplete="email"
          />
          <FieldInput
            label="Senha"
            id="password"
            name="password"
            type="password"
            placeholder="Minimo 8 caracteres"
            required
            autoComplete="new-password"
          />
        </div>

        <CircleCheckbox
          id="terms"
          checked={agreed}
          onChange={setAgreed}
          label={
            <>
              Concordo com os{' '}
              <span className="text-[#5E81F4] font-medium">termos de uso</span>
            </>
          }
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 h-[46px] bg-[#5E81F4] text-white text-[14px] font-semibold rounded-lg hover:bg-[#4A6FE3] transition-colors disabled:opacity-60"
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
          <Link
            href="/login"
            className="flex-1 h-[46px] bg-[#5E81F4]/10 text-[#5E81F4] text-[14px] font-semibold rounded-lg flex items-center justify-center hover:bg-[#5E81F4]/20 transition-colors"
          >
            Ja tenho conta
          </Link>
        </div>
      </form>
    </AuthPanel>
  )
}
