'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthPanel } from '@/components/auth/auth-panel'
import { toast } from 'sonner'

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

export default function FinishPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    toast.success('Registration complete!')
    router.push('/dashboard')
  }

  return (
    <AuthPanel>
      <div className="mb-8">
        <h1 className="text-[32px] font-bold leading-[42px] text-[#1C1D21]">
          Registration complete.<br />
          <span>Subscribe to our newsletters.</span>
        </h1>
        <p className="mt-2 text-[14px] text-[#8181A5]">
          Now you can setup your projects and teams
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <FieldInput
            label="Email"
            id="email"
            name="email"
            type="email"
            placeholder="Start typing…"
            required
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[46px] bg-[#5E81F4] text-white text-[14px] font-semibold rounded-lg hover:bg-[#4A6FE3] transition-colors disabled:opacity-60"
        >
          {loading ? 'Finishing…' : 'Finish'}
        </button>
      </form>
    </AuthPanel>
  )
}
