'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (password !== confirm) {
      toast.error('As senhas nao coincidem.')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      toast.error('A senha deve ter no minimo 8 caracteres.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error('Erro ao redefinir senha', { description: error.message })
      setLoading(false)
      return
    }

    toast.success('Senha atualizada!', {
      description: 'Voce ja pode entrar com a nova senha.',
    })
    router.push('/login')
  }

  return (
    <AuthPanel
      title="Defina sua nova senha"
      subtitle="Escolha uma senha forte para sua conta."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <FieldInput
            label="Nova senha"
            id="password"
            name="password"
            type="password"
            placeholder="Minimo 8 caracteres"
            required
            autoComplete="new-password"
          />
          <FieldInput
            label="Confirmar senha"
            id="confirm"
            name="confirm"
            type="password"
            placeholder="Repita a senha"
            required
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[46px] bg-[#5E81F4] text-white text-[14px] font-semibold rounded-lg hover:bg-[#4A6FE3] transition-colors disabled:opacity-60"
        >
          {loading ? 'Salvando...' : 'Atualizar senha'}
        </button>
      </form>
    </AuthPanel>
  )
}
