import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { TRPCProvider } from '@/components/providers/trpc-provider'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Hello Labs',
    template: '%s | Hello Labs',
  },
  description: 'Sistema completo para gestao de laboratorios de protese dentaria.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <TRPCProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
