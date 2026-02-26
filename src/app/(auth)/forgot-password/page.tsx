'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
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

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    })

    if (error) {
      toast.error('Erro ao enviar email', { description: error.message })
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <AuthPanel
        title="Email enviado!"
        subtitle="Se este email estiver cadastrado, voce recebera um link para redefinir sua senha."
      >
        <Link
          href="/login"
          className="w-full h-[46px] bg-[#5E81F4] text-white text-[14px] font-semibold rounded-lg flex items-center justify-center hover:bg-[#4A6FE3] transition-colors"
        >
          Voltar para o login
        </Link>
      </AuthPanel>
    )
  }

  return (
    <AuthPanel
      title="Esqueceu sua senha?"
      subtitle="Informe seu email e enviaremos um link para redefinicao."
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[46px] bg-[#5E81F4] text-white text-[14px] font-semibold rounded-lg hover:bg-[#4A6FE3] transition-colors disabled:opacity-60"
        >
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>

        <div className="text-center">
          <Link
            href="/login"
            className="text-[13px] text-[#5E81F4] font-medium hover:underline"
          >
            Voltar para o login
          </Link>
        </div>
      </form>
    </AuthPanel>
  )
}
