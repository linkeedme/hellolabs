'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { AuthPanel } from '@/components/auth/auth-panel'
import { trpc } from '@/lib/trpc/client'

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

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [loading, setLoading] = useState(false)
  const [isNewUser, setIsNewUser] = useState(true)

  const acceptInvite = trpc.auth.acceptInvite.useMutation({
    onSuccess: () => {
      toast.success('Vinculado ao laboratorio!')
      router.push('/dashboard')
      router.refresh()
    },
    onError: (error) => {
      toast.error('Erro ao aceitar convite', { description: error.message })
      setLoading(false)
    },
  })

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (password.length < 8) {
      toast.error('A senha deve ter no minimo 8 caracteres.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          invite_slug: slug,
        },
      },
    })

    if (error) {
      toast.error('Erro ao criar conta', { description: error.message })
      setLoading(false)
      return
    }

    toast.success('Conta criada!', {
      description: 'Verifique seu email para confirmar o vinculo com o laboratorio.',
    })
    router.push('/login')
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Erro ao fazer login', { description: error.message })
      setLoading(false)
      return
    }

    acceptInvite.mutate({ token: slug })
  }

  return (
    <AuthPanel
      title="Convite para laboratorio"
      subtitle="Voce foi convidado para se vincular a um laboratorio."
    >
      {/* Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setIsNewUser(true)}
          className={`flex-1 h-[38px] text-[13px] font-semibold rounded-lg transition-colors ${
            isNewUser
              ? 'bg-[#5E81F4] text-white'
              : 'bg-[#5E81F4]/10 text-[#5E81F4] hover:bg-[#5E81F4]/20'
          }`}
        >
          Criar conta
        </button>
        <button
          type="button"
          onClick={() => setIsNewUser(false)}
          className={`flex-1 h-[38px] text-[13px] font-semibold rounded-lg transition-colors ${
            !isNewUser
              ? 'bg-[#5E81F4] text-white'
              : 'bg-[#5E81F4]/10 text-[#5E81F4] hover:bg-[#5E81F4]/20'
          }`}
        >
          Ja tenho conta
        </button>
      </div>

      {isNewUser ? (
        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-5">
            <FieldInput
              label="Nome completo"
              id="name"
              name="name"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[46px] bg-[#5E81F4] text-white text-[14px] font-semibold rounded-lg hover:bg-[#4A6FE3] transition-colors disabled:opacity-60"
          >
            {loading ? 'Criando...' : 'Criar conta e vincular'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-5">
            <FieldInput
              label="Email"
              id="email-login"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
            <FieldInput
              label="Senha"
              id="password-login"
              name="password"
              type="password"
              placeholder="Sua senha"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[46px] bg-[#5E81F4] text-white text-[14px] font-semibold rounded-lg hover:bg-[#4A6FE3] transition-colors disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar e vincular'}
          </button>
        </form>
      )}
    </AuthPanel>
  )
}
