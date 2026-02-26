'use client'

import { useRouter } from 'next/navigation'
import { AuthPanel } from '@/components/auth/auth-panel'
import { useEffect, useState } from 'react'

export default function FinishPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          router.refresh()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [router])

  return (
    <AuthPanel
      title="Tudo pronto!"
      subtitle="Seu laboratorio foi criado com sucesso. Voce sera redirecionado para o painel em instantes."
    >
      <div className="space-y-6">
        <div className="rounded-xl bg-[#F0F4FF] p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#5E81F4] flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className="text-[14px] text-[#1C1D21] font-semibold mb-1">
            Laboratorio configurado
          </p>
          <p className="text-[13px] text-[#8181A5]">
            Agora voce pode cadastrar clientes, criar casos e gerenciar sua producao.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { router.push('/dashboard'); router.refresh() }}
          className="w-full h-[46px] bg-[#5E81F4] text-white text-[14px] font-semibold rounded-lg hover:bg-[#4A6FE3] transition-colors"
        >
          Ir para o painel ({countdown}s)
        </button>
      </div>
    </AuthPanel>
  )
}
