'use client'

import { useState } from 'react'
import Link from 'next/link'
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

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

export default function DetailsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    // In a real app, save details to the DB here
    toast.success('Details saved!')
    router.push('/finish')
  }

  return (
    <AuthPanel>
      <div className="mb-8">
        <h1 className="text-[32px] font-bold leading-[42px] text-[#1C1D21]">
          Welcome to our CRM.<br />
          <span>Sign Up to getting started.</span>
        </h1>
        <p className="mt-2 text-[14px] text-[#8181A5]">Enter your details to proceed further</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <FieldInput label="Company name" id="company" name="company" placeholder="WhiteOnWhite" required />

          <FieldInput
            label="Employees"
            id="employees"
            name="employees"
            placeholder="1-10 Employees"
            rightIcon={<UsersIcon />}
          />

          {/* Business select */}
          <div className="border-b border-[#ECECF2] pb-3">
            <label htmlFor="business" className="block text-[14px] text-[#8181A5] font-normal leading-[21px]">
              Business
            </label>
            <select
              id="business"
              name="business"
              className="w-full text-[14px] font-bold text-[#1C1D21] bg-transparent outline-none pt-1 appearance-none cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled className="text-[#8181A5] font-bold">
                Select business type
              </option>
              <option value="saas">SaaS</option>
              <option value="agency">Agency</option>
              <option value="ecommerce">E-commerce</option>
              <option value="consulting">Consulting</option>
              <option value="other">Other</option>
            </select>
          </div>

          <FieldInput
            label="Phone"
            id="phone"
            name="phone"
            type="tel"
            placeholder="Start typing…"
            autoComplete="tel"
            rightIcon={<PhoneIcon />}
          />
        </div>

        <div className="flex gap-3">
          <Link
            href="/login"
            className="flex-1 h-[46px] bg-[#5E81F4]/10 text-[#5E81F4] text-[14px] font-semibold rounded-lg flex items-center justify-center hover:bg-[#5E81F4]/20 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 h-[46px] bg-[#5E81F4] text-white text-[14px] font-semibold rounded-lg hover:bg-[#4A6FE3] transition-colors disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Next'}
          </button>
        </div>
      </form>
    </AuthPanel>
  )
}
