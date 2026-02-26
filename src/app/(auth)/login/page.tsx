'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { AuthPanel } from '@/components/auth/auth-panel'

/* ─── Reusable primitives ─── */

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

/* ─── Page ─── */

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Erro ao entrar', {
        description:
          error.message === 'Invalid login credentials'
            ? 'Email ou senha incorretos.'
            : error.message === 'Email not confirmed'
            ? 'Confirme seu email antes de fazer login.'
            : error.message,
      })
      setLoading(false)
      return
    }

    toast.success('Login realizado!')
    const redirect = searchParams.get('redirect') || '/dashboard'
    router.push(redirect)
    router.refresh()
  }

  return (
    <AuthPanel
      title="Bem-vindo de volta!"
      subtitle="Entre com suas credenciais para acessar o sistema."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
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
            placeholder="Digite sua senha"
            required
            autoComplete="current-password"
          />
        </div>

        {/* Lembrar + recuperar */}
        <div className="flex items-center justify-between">
          <CircleCheckbox
            id="remember"
            checked={remember}
            onChange={setRemember}
            label="Lembrar de mim"
          />
          <Link
            href="/forgot-password"
            className="text-[13px] text-[#5E81F4] font-medium hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>

        {/* Botoes */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 h-[46px] bg-[#5E81F4] text-white text-[14px] font-semibold rounded-lg hover:bg-[#4A6FE3] transition-colors disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <Link
            href="/signup"
            className="flex-1 h-[46px] bg-[#5E81F4]/10 text-[#5E81F4] text-[14px] font-semibold rounded-lg flex items-center justify-center hover:bg-[#5E81F4]/20 transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </form>
    </AuthPanel>
  )
}
