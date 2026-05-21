import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Spanish-speaking countries → es, everything else → en
const SPANISH_COUNTRIES = new Set([
  'MX', 'ES', 'AR', 'CO', 'PE', 'CL', 'EC', 'VE', 'GT', 'CU', 'BO',
  'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'GQ', 'PR',
])

function getPreferredLocale(request: NextRequest): string {
  const country = request.headers.get('x-vercel-ip-country') ?? ''
  if (SPANISH_COUNTRIES.has(country)) return 'es'
  // Fallback: check Accept-Language header
  const acceptLang = request.headers.get('accept-language') ?? ''
  if (acceptLang.toLowerCase().startsWith('es')) return 'es'
  return 'en'
}

const intlMiddleware = createIntlMiddleware({
  ...routing,
  localeDetection: false, // we handle detection ourselves via geo
})

const INTERNAL_ROUTES = ['/admin', '/contratos', '/clientes', '/linkedin-pipeline']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Auth check for internal routes ────────────────────────────────────────
  const isInternalRoute = INTERNAL_ROUTES.some((p) => pathname.startsWith(p))
  if (isInternalRoute) {
    let response = NextResponse.next({ request })
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll() },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              response = NextResponse.next({ request })
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            },
          },
        }
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.redirect(new URL('/login', request.url))
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // ── Locale redirect for root and non-prefixed public paths ────────────────
  // If no locale prefix yet, inject the preferred one
  const hasLocalePrefix = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )

  // Routes that live outside the locale tree — skip locale redirect
  if (pathname.startsWith('/propuestas/') || pathname.startsWith('/Proposal-')) {
    return NextResponse.next()
  }

  if (!hasLocalePrefix) {
    const preferred = getPreferredLocale(request)
    // Preserve query and hash
    const url = request.nextUrl.clone()
    url.pathname = `/${preferred}${pathname}`
    return NextResponse.redirect(url)
  }

  // ── next-intl handles locale cookie, alternate links, etc. ────────────────
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Internal authenticated routes
    '/admin/:path*',
    '/contratos/:path*',
    '/clientes/:path*',
    '/linkedin-pipeline/:path*',
    // Public routes that need locale handling (exclude API, _next, static files)
    '/((?!api|_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|otf|eot)).*)',
  ],
}
