'use client'

interface AuthPanelProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthPanel({ children, title, subtitle }: AuthPanelProps) {
  return (
    <div className="flex min-h-screen bg-[#5E81F4]">
      {/* Left – white form panel */}
      <div className="flex w-full flex-col items-center justify-center bg-white rounded-tr-[16px] rounded-br-[16px] lg:max-w-[56%] xl:max-w-[802px] shrink-0">
        <div className="w-full max-w-[420px] px-10 py-16">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#5E81F4] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-[18px] font-bold text-[#1C1D21]">Hello Labs</span>
            </div>
            <h1 className="text-[28px] font-bold leading-[36px] text-[#1C1D21]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-[14px] text-[#8181A5]">{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </div>

      {/* Right – blue illustration panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-white/15" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full border border-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full bg-white/10" />
          <div className="absolute top-[18%] right-[22%] w-4 h-4 rounded-full bg-white/20" />
          <div className="absolute bottom-[22%] left-[18%] w-3 h-3 rounded-full bg-white/20" />
          <div className="absolute top-[68%] right-[14%] w-2 h-2 rounded-full bg-white/30" />
          <div className="absolute top-[28%] left-[12%] w-2.5 h-2.5 rounded-full bg-white/25" />
        </div>

        {/* Central branding */}
        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 className="text-[24px] font-bold mb-2">Hello Labs</h2>
          <p className="text-[14px] text-white/70 max-w-[280px]">
            Gestao completa para laboratorios de protese dentaria
          </p>
        </div>
      </div>
    </div>
  )
}
