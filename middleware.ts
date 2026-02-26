import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Rotas publicas (nao requerem auth)
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/invite',
  '/api/webhooks',
  '/api/auth/callback',
]

// Rotas de onboarding (requerem auth mas NAO requerem tenant)
const ONBOARDING_ROUTES = ['/details', '/finish']

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((route) => path.startsWith(route))
}

function isOnboardingRoute(path: string): boolean {
  return ONBOARDING_ROUTES.some((route) => path.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip static files
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/webhooks') ||
    path.startsWith('/api/cron') ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  // Supabase session refresh
  const { user, response } = await updateSession(request)

  // Public routes: se ja autenticado, redireciona para dashboard
  if (isPublicRoute(path)) {
    if (user && (path === '/login' || path === '/signup' || path === '/forgot-password')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // Rotas protegidas: redireciona para login se nao autenticado
  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Onboarding routes: permitir acesso para users autenticados (com ou sem tenant)
  if (isOnboardingRoute(path)) {
    return response
  }

  // Rota raiz: redireciona para dashboard
  if (path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
