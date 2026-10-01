import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { isPanelPath, resolveHostRouting } from './lib/host-routing'
import { hasPermission, requiredPermission, type PanelPermission } from './lib/panel-access'
import type { UserProfile } from './types/user-profiles'

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

// Public routes that live outside the locale tree (no /es or /en prefix)
const NON_LOCALE_PREFIXES = [
  '/propuestas/',
  '/c/',
  '/Proposal-',
  '/AO-Guidelines',
  '/brand/',
  '/Diagnostico-',
  '/87-payment',
  '/payment-info',
]

const PERMISSION_COLUMNS = 'is_admin, can_view_contracts, can_view_clients, can_submit_proposals, can_view_proposals, can_view_tasks'

// Session + section permission check for panel routes
async function guardPanel(request: NextRequest): Promise<NextResponse> {
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

    const permission = requiredPermission(request.nextUrl.pathname)
    if (permission) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select(PERMISSION_COLUMNS)
        .eq('id', user.id)
        .maybeSingle()
      if (!hasPermission(profile as Pick<UserProfile, PanelPermission> | null, permission)) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // ── Host routing: admin.bralto.io = panel, www.bralto.io = public site ────
  const decision = resolveHostRouting(request.headers.get('host'), pathname, search)
  if (decision.action === 'redirect') return NextResponse.redirect(decision.url)

  // ── Panel: /login is open, everything else needs session + permission ─────
  if (isPanelPath(pathname)) {
    return pathname === '/login' ? NextResponse.next() : guardPanel(request)
  }

  // ── Public routes outside the locale tree ────────────────────────────────
  if (NON_LOCALE_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Locale redirect for root and non-prefixed public paths ───────────────
  const hasLocalePrefix = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )
  if (!hasLocalePrefix) {
    const url = request.nextUrl.clone()
    url.pathname = `/${getPreferredLocale(request)}${pathname}`
    return NextResponse.redirect(url)
  }

  // ── next-intl handles locale cookie, alternate links, etc. ────────────────
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Everything except API, Next internals and static files
    '/((?!api|_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|otf|eot)).*)',
  ],
}
