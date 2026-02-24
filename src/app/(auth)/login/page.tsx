'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

function CircleCheckbox({
  id,
  name,
  checked,
  onChange,
  label,
}: {
  id: string
  name: string
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

function SocialButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="w-[46px] h-[46px] border border-[#ECECF2] rounded-lg flex items-center justify-center hover:bg-[#F5F5FA] transition-colors"
    >
      {icon}
    </button>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-[#ECECF2]" />
      <span className="text-[13px] text-[#8181A5] whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-[#ECECF2]" />
    </div>
  )
}

/* ─── Social SVG icons ─── */

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"
      fill="#1DA1F2"
    />
  </svg>
)

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill="#1877F2"
    />
  </svg>
)

/* ─── Page ─── */

export default function LoginPage() {
  const router = useRouter()
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
      toast.error('Login failed', {
        description:
          error.message === 'Invalid login credentials'
            ? 'Email or password is incorrect.'
            : error.message,
      })
      setLoading(false)
      return
    }

    toast.success('Signed in!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <AuthPanel illustrationSrc="https://www.figma.com/api/mcp/asset/913c011b-6eb3-4397-b752-4451870b89da">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-[32px] font-bold leading-[42px] text-[#1C1D21]">
          Welcome to our CRM.<br />
          <span>Sign In to see latest updates.</span>
        </h1>
        <p className="mt-2 text-[14px] text-[#8181A5]">Enter your details to proceed further</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fields */}
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
          <FieldInput
            label="Password"
            id="password"
            name="password"
            type="password"
            placeholder="Start typing…"
            required
            autoComplete="current-password"
          />
        </div>

        {/* Remember me + recover */}
        <div className="flex items-center justify-between">
          <CircleCheckbox
            id="remember"
            name="remember"
            checked={remember}
            onChange={setRemember}
            label="Remember me"
          />
          <Link
            href="/forgot-password"
            className="text-[13px] text-[#5E81F4] font-medium hover:underline"
          >
            Recover password
          </Link>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 h-[46px] bg-[#5E81F4] text-white text-[14px] font-semibold rounded-lg hover:bg-[#4A6FE3] transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          <Link
            href="/signup"
            className="flex-1 h-[46px] bg-[#5E81F4]/10 text-[#5E81F4] text-[14px] font-semibold rounded-lg flex items-center justify-center hover:bg-[#5E81F4]/20 transition-colors"
          >
            Sign Up
          </Link>
        </div>

        {/* Divider */}
        <Divider label="Or sign in with" />

        {/* Social */}
        <div className="flex items-center justify-center gap-4">
          <SocialButton icon={<TwitterIcon />} />
          <SocialButton icon={<GoogleIcon />} />
          <SocialButton icon={<FacebookIcon />} />
        </div>
      </form>
    </AuthPanel>
  )
}
