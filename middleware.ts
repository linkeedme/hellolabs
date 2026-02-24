import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Rotas publicas (nao requerem auth)
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/invite',
  '/details',
  '/finish',
  '/api/webhooks',
  '/api/auth/callback',
]

// Rotas que requerem role ADMIN
const ADMIN_ROUTES = ['/settings', '/team']

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((route) => path.startsWith(route))
}

function isAdminRoute(path: string): boolean {
  return ADMIN_ROUTES.some((route) => path.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip static files and API routes that handle their own auth
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

  // Rota raiz: redireciona para dashboard
  if (path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
