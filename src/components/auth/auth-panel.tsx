import Image from 'next/image'

interface AuthPanelProps {
  children: React.ReactNode
  illustrationSrc?: string
}

export function AuthPanel({ children, illustrationSrc }: AuthPanelProps) {
  return (
    <div className="flex min-h-screen bg-[#5E81F4]">
      {/* Left – white form panel */}
      <div className="flex w-full flex-col items-center justify-center bg-white rounded-tr-[16px] rounded-br-[16px] lg:max-w-[56%] xl:max-w-[802px] shrink-0">
        <div className="w-full max-w-[420px] px-10 py-16">
          {children}
        </div>
      </div>

      {/* Right – blue illustration panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Large outer ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-white/10" />
          {/* Medium ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-white/15" />
          {/* Inner ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full border border-white/20" />
          {/* Solid center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full bg-white/10" />
          {/* Small accent circles scattered */}
          <div className="absolute top-[18%] right-[22%] w-4 h-4 rounded-full bg-white/20" />
          <div className="absolute bottom-[22%] left-[18%] w-3 h-3 rounded-full bg-white/20" />
          <div className="absolute top-[68%] right-[14%] w-2 h-2 rounded-full bg-white/30" />
          <div className="absolute top-[28%] left-[12%] w-2.5 h-2.5 rounded-full bg-white/25" />
        </div>

        {/* Illustration */}
        {illustrationSrc && (
          <div className="relative z-10 w-[340px] h-[340px] flex items-center justify-center">
            <Image
              src={illustrationSrc}
              alt="Auth illustration"
              width={340}
              height={340}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        )}
      </div>
    </div>
  )
}
