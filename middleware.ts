import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { OPT_IN_REGION, REGION_COOKIE, requiresOptIn } from './lib/consent'
import { preferredLocale } from './lib/locale'
import { isPanelPath, resolveHostRouting } from './lib/host-routing'
import { hasPermission, requiredPermission, type PanelPermission } from './lib/panel-access'
import type { UserProfile } from './types/user-profiles'

// La elección guardada, después el idioma del navegador y por último el país (lib/locale.ts)
function getPreferredLocale(request: NextRequest): string {
  return preferredLocale({
    cookie: request.cookies.get('NEXT_LOCALE')?.value,
    acceptLanguage: request.headers.get('accept-language'),
    country: request.headers.get('x-vercel-ip-country'),
  })
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
  '/payment-info',
]

// Visitas de la UE, el EEE o el Reino Unido: el script de GTM no carga nada hasta que acepten
// (lib/consent.ts). La cookie es estrictamente necesaria: solo dice la región, no identifica.
function markConsentRegion(request: NextRequest, response: NextResponse): NextResponse {
  const optIn = requiresOptIn(request.headers.get('x-vercel-ip-country'))
  const current = request.cookies.get(REGION_COOKIE)?.value
  if (optIn && current !== OPT_IN_REGION) {
    response.cookies.set(REGION_COOKIE, OPT_IN_REGION, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === 'production',
    })
  } else if (!optIn && current) {
    response.cookies.delete(REGION_COOKIE)
  }
  return response
}

const PERMISSION_COLUMNS ='is_admin, can_view_contracts, can_view_clients, can_submit_proposals, can_view_proposals'

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

  // ── robots.txt y sitemap.xml van en la raíz: sin esto se mandaban a /en/… y daban 404
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') return NextResponse.next()

  // ── Public routes outside the locale tree ────────────────────────────────
  if (NON_LOCALE_PREFIXES.some((p) => pathname.startsWith(p))) {
    return markConsentRegion(request, NextResponse.next())
  }

  // ── Locale redirect for root and non-prefixed public paths ───────────────
  const hasLocalePrefix = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )
  if (!hasLocalePrefix) {
    const url = request.nextUrl.clone()
    url.pathname = `/${getPreferredLocale(request)}${pathname}`
    return markConsentRegion(request, NextResponse.redirect(url))
  }

  // ── next-intl handles locale cookie, alternate links, etc. ────────────────
  return markConsentRegion(request, intlMiddleware(request))
}

export const config = {
  matcher: [
    // Everything except API, Next internals and static files
    '/((?!api|_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|otf|eot)).*)',
  ],
}
