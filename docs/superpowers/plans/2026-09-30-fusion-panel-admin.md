# Fusión del panel admin — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el repo Bralto sirva el sitio público en `www.bralto.io` y el panel de colaboradores en `admin.bralto.io`, absorbiendo lo útil de Linkedin React y eliminando LinkedIn, Social Parasite y Nala.

**Architecture:** Un middleware decide por host (función pura `lib/host-routing.ts`) y protege el panel con sesión + permisos por sección (`lib/panel-access.ts`, tabla `user_profiles`). Se portan solicitudes, generador de propuestas y usuarios desde Linkedin React; la lista de propuestas se unifica sobre `generated_proposals`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind, Supabase (`@supabase/ssr`), next-intl, Resend, Node 24 (`node --test` con TS nativo).

**Spec:** `docs/superpowers/specs/2026-09-30-fusion-panel-admin-design.md`

## Global Constraints

- Repo de trabajo: Bralto, rama `feat/fusion-panel-admin`. Linkedin React (`/Users/alejandro/Documents/Visual Studio Code/Linkedin React`) es **solo lectura**.
- No commitear cambios ajenos a la fusión (borrado de Quickhire, `Frames 2/`, `_para-revisar/`, `Samples/`, `.vercelignore`, `tsconfig.tsbuildinfo`): siempre `git add <rutas explícitas>`, nunca `git add -A`/`.`.
- No push, no merge a `main`, no cambios en Vercel ni en la DB.
- Estilo del panel: fondo `#060607`, superficie `#131316`, acento `#5bb6ff` (no el naranja de Linkedin React). Emails y plantilla HTML de propuestas conservan su naranja.
- Hosts: panel `admin.bralto.io`; público `www.bralto.io` (canónico) y `bralto.io`; cualquier otro host sirve todo sin redirecciones cruzadas.
- Redirecciones cruzadas con 307 (temporales) para que un rollback del dominio no quede cacheado.

## Review Focus

1. Links viejos de contratos `admin.bralto.io/c/<slug>` deben terminar en una página de firma que funcione (`www.bralto.io/c/<slug>` sin redirigir a `/es/c/...`). → test en Task 3 + curl en Task 5.
2. Propuestas ya enviadas hacen POST a `admin.bralto.io/api/proposals/<id>/accept`: nunca se redirige `/api/*`. → test en Task 3 + curl en Task 5.
3. Colaborador sin fila en `user_profiles`: ve solo "Inicio", las secciones lo mandan a `/admin`, nada revienta. → tests en Task 4.
4. Redirecciones entre hosts conservan el query string (`/solicitudes?success=1`). → test en Task 3.
5. Host con mayúsculas o puerto (`Admin.Bralto.io:443`) se reconoce. → test en Task 3.

---

### Task 1: Eliminar Nala (con respaldo)

Nala nunca se commiteó: sus archivos están sin trackear y los cambios en `admin/page.tsx`, `internal-nav.tsx` y `middleware.ts` son solo de Nala. No produce commit.

**Files:**
- Delete: `app/adopcion-nala/`, `app/api/nala/`, `app/(internal)/submissions-nala/`, `components/nala/`, `lib/nala/`, `public/nala-cover.webp`, `NALA.jpg`, `supabase/migrations/20260714_001_nala_submissions.sql`
- Restore to HEAD: `app/(internal)/admin/page.tsx`, `components/internal/internal-nav.tsx`, `middleware.ts`

- [ ] **Step 1: Respaldar**

```bash
cd "/Users/alejandro/Documents/Visual Studio Code/Bralto"
git diff -- "app/(internal)/admin/page.tsx" components/internal/internal-nav.tsx middleware.ts > .local-backups/nala-tracked-changes.diff
tar -czf .local-backups/nala-2026-09-30.tar.gz app/adopcion-nala app/api/nala "app/(internal)/submissions-nala" components/nala lib/nala public/nala-cover.webp NALA.jpg supabase/migrations/20260714_001_nala_submissions.sql .local-backups/nala-tracked-changes.diff
tar -tzf .local-backups/nala-2026-09-30.tar.gz | head -30
```
Expected: el listado incluye los 8 orígenes y el `.diff`.

- [ ] **Step 2: Borrar y restaurar**

```bash
rm -rf app/adopcion-nala app/api/nala "app/(internal)/submissions-nala" components/nala lib/nala public/nala-cover.webp NALA.jpg supabase/migrations/20260714_001_nala_submissions.sql
git checkout -- "app/(internal)/admin/page.tsx" components/internal/internal-nav.tsx middleware.ts
grep -rni "nala\|nahla" app components lib middleware.ts
```
Expected: grep sin resultados.

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: exit 0.

---

### Task 2: Eliminar LinkedIn de Bralto

**Files:**
- Delete: `app/(internal)/linkedin-pipeline/`, `components/linkedin/`, `types/linkedin.ts`
- Modify: `app/(internal)/admin/page.tsx` (quitar tarjeta LinkedIn), `components/internal/internal-nav.tsx` (quitar ítem LinkedIn)

- [ ] **Step 1: Borrar archivos**

```bash
git rm -r -q "app/(internal)/linkedin-pipeline" components/linkedin types/linkedin.ts
grep -rn "linkedin" app components lib types --include=*.ts --include=*.tsx -i
```
Expected: solo quedan referencias en `admin/page.tsx`, `internal-nav.tsx` (se quitan abajo). `middleware.ts` también menciona `/linkedin-pipeline`; se reescribe completo en Task 5.

- [ ] **Step 2: Quitar tarjeta del inicio** — en `app/(internal)/admin/page.tsx` eliminar el objeto `{ href: '/linkedin-pipeline', ... }` del array `sections` y `Network` del import de `lucide-react`.

- [ ] **Step 3: Quitar ítem del menú** — en `components/internal/internal-nav.tsx` eliminar `{ href: '/linkedin-pipeline', label: 'LinkedIn Pipeline', icon: Network },` y `Network` del import.

- [ ] **Step 4: Verificar y commitear**

```bash
npx tsc --noEmit
git add "app/(internal)/admin/page.tsx" components/internal/internal-nav.tsx
git commit -m "chore(panel): eliminar LinkedIn Pipeline"
```

---

### Task 3: Ruteo por host (función pura + tests)

**Files:**
- Create: `lib/host-routing.ts`, `lib/host-routing.test.ts`
- Modify: `package.json` (script `test`), `tsconfig.json` (excluir tests)

**Interfaces:**
- Produces: `ADMIN_ORIGIN = 'https://admin.bralto.io'`, `PUBLIC_ORIGIN = 'https://www.bralto.io'`, `type HostKind = 'admin' | 'public' | 'other'`, `hostKind(host: string | null): HostKind`, `isPanelPath(pathname: string): boolean`, `type HostDecision = { action: 'next' } | { action: 'redirect'; url: string }`, `resolveHostRouting(host: string | null, pathname: string, search?: string): HostDecision`

- [ ] **Step 1: Test que falla** — `lib/host-routing.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hostKind, isPanelPath, resolveHostRouting } from './host-routing.ts'

test('hostKind reconoce hosts con mayúsculas y puerto', () => {
  assert.equal(hostKind('Admin.Bralto.io:443'), 'admin')
  assert.equal(hostKind('admin.bralto.io'), 'admin')
  assert.equal(hostKind('www.bralto.io'), 'public')
  assert.equal(hostKind('bralto.io'), 'public')
  assert.equal(hostKind('localhost:3000'), 'other')
  assert.equal(hostKind('bralto-git-feat-fusion.vercel.app'), 'other')
  assert.equal(hostKind(null), 'other')
})

test('isPanelPath: secciones del panel y login', () => {
  for (const p of ['/admin', '/contratos', '/contratos/nuevo', '/contratos/abc/editar', '/clientes',
    '/solicitudes', '/solicitudes/nueva', '/usuarios', '/login', '/propuestas']) {
    assert.equal(isPanelPath(p), true, p)
  }
})

test('isPanelPath: rutas públicas y falsos prefijos', () => {
  for (const p of ['/', '/es', '/es/precios', '/c/abc', '/propuestas/abc123', '/contratosx', '/loginx', '/admin-foo']) {
    assert.equal(isPanelPath(p), false, p)
  }
})

test('admin: la raíz va a /admin', () => {
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/'), { action: 'redirect', url: 'https://admin.bralto.io/admin' })
})

test('admin: las rutas del panel pasan', () => {
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/contratos/abc'), { action: 'next' })
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/login'), { action: 'next' })
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/propuestas'), { action: 'next' })
})

test('admin: links viejos de contratos y propuestas van al sitio público', () => {
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/c/acme-x1y2'), { action: 'redirect', url: 'https://www.bralto.io/c/acme-x1y2' })
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/c/acme-x1y2/firmado'), { action: 'redirect', url: 'https://www.bralto.io/c/acme-x1y2/firmado' })
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/propuestas/abc123'), { action: 'redirect', url: 'https://www.bralto.io/propuestas/abc123' })
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/es/precios', '?plan=87'), { action: 'redirect', url: 'https://www.bralto.io/es/precios?plan=87' })
})

test('admin: /api nunca se redirige (aceptación de propuestas viejas)', () => {
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/api/proposals/123/accept'), { action: 'next' })
})

test('público: el panel redirige a admin conservando el query', () => {
  assert.deepEqual(resolveHostRouting('www.bralto.io', '/solicitudes', '?success=1'), { action: 'redirect', url: 'https://admin.bralto.io/solicitudes?success=1' })
  assert.deepEqual(resolveHostRouting('bralto.io', '/login'), { action: 'redirect', url: 'https://admin.bralto.io/login' })
  assert.deepEqual(resolveHostRouting('www.bralto.io', '/propuestas'), { action: 'redirect', url: 'https://admin.bralto.io/propuestas' })
})

test('público: sitio y páginas de cliente pasan', () => {
  for (const p of ['/', '/es', '/en/pricing', '/c/acme-x1y2', '/propuestas/abc123']) {
    assert.deepEqual(resolveHostRouting('www.bralto.io', p), { action: 'next' }, p)
  }
})

test('otros hosts (localhost, previews): todo pasa', () => {
  assert.deepEqual(resolveHostRouting('localhost:3000', '/contratos'), { action: 'next' })
  assert.deepEqual(resolveHostRouting('localhost:3000', '/es'), { action: 'next' })
  assert.deepEqual(resolveHostRouting('bralto-git-x.vercel.app', '/login'), { action: 'next' })
})
```

- [ ] **Step 2: Script y exclusión de tests**

`package.json` → en `scripts` agregar `"test": "node --test lib/*.test.ts"`.
`tsconfig.json` → `"exclude": ["node_modules", "**/*.test.ts"]` (los tests importan con extensión `.ts`, que `tsc` rechaza).

Run: `npm test`
Expected: FAIL — `Cannot find module .../lib/host-routing.ts`.
(Si Node reporta error de sintaxis ESM en `.ts`, renombrar el test a `lib/host-routing.test.mts` y el script a `node --test lib/*.test.mts`, y excluir `**/*.test.mts`.)

- [ ] **Step 3: Implementar** — `lib/host-routing.ts`:

```ts
// Decide qué host sirve cada ruta:
//   admin.bralto.io          → panel interno
//   www.bralto.io, bralto.io → sitio público y páginas de clientes
//   cualquier otro host      → todo, sin redirecciones (localhost, previews de Vercel)

export const ADMIN_ORIGIN = 'https://admin.bralto.io'
export const PUBLIC_ORIGIN = 'https://www.bralto.io'

const ADMIN_HOSTS = new Set(['admin.bralto.io'])
const PUBLIC_HOSTS = new Set(['bralto.io', 'www.bralto.io'])

const PANEL_PREFIXES = ['/admin', '/contratos', '/clientes', '/solicitudes', '/usuarios']
// Sin subrutas: /propuestas/<slug> es la página pública de cada propuesta
const PANEL_EXACT = ['/login', '/propuestas']

export type HostKind = 'admin' | 'public' | 'other'

export type HostDecision = { action: 'next' } | { action: 'redirect'; url: string }

export function hostKind(host: string | null): HostKind {
  const name = (host ?? '').toLowerCase().split(':')[0]
  if (ADMIN_HOSTS.has(name)) return 'admin'
  if (PUBLIC_HOSTS.has(name)) return 'public'
  return 'other'
}

export function isPanelPath(pathname: string): boolean {
  if (PANEL_EXACT.includes(pathname)) return true
  return PANEL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function resolveHostRouting(host: string | null, pathname: string, search = ''): HostDecision {
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) return { action: 'next' }

  const kind = hostKind(host)
  if (kind === 'admin') {
    if (pathname === '/') return { action: 'redirect', url: `${ADMIN_ORIGIN}/admin` }
    if (isPanelPath(pathname)) return { action: 'next' }
    return { action: 'redirect', url: `${PUBLIC_ORIGIN}${pathname}${search}` }
  }
  if (kind === 'public' && isPanelPath(pathname)) {
    return { action: 'redirect', url: `${ADMIN_ORIGIN}${pathname}${search}` }
  }
  return { action: 'next' }
}
```

- [ ] **Step 4: Tests pasan** — Run: `npm test` → Expected: todos PASS. Run: `npx tsc --noEmit` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add lib/host-routing.ts lib/host-routing.test.ts package.json tsconfig.json
git commit -m "feat(panel): ruteo por host admin.bralto.io / www.bralto.io"
```

---

### Task 4: Permisos del panel + sesión actual

**Files:**
- Create: `types/user-profiles.ts`, `lib/panel-access.ts`, `lib/panel-access.test.ts`, `lib/panel-session.ts`

**Interfaces:**
- Produces:
  - `UserProfile`, `UserWithProfile`, `PERMISSION_LABELS` (de `types/user-profiles.ts`, sin `can_view_linkedin`)
  - `type PanelPermission = 'is_admin' | 'can_view_contracts' | 'can_view_clients' | 'can_submit_proposals' | 'can_view_proposals'`
  - `requiredPermission(pathname: string): PanelPermission | null`
  - `hasPermission(profile: Pick<UserProfile, PanelPermission> | null, permission: PanelPermission | null): boolean`
  - `getCurrentSession(): Promise<{ user: User | null; profile: UserProfile | null }>` (cacheado por request con `react.cache`)

- [ ] **Step 1: Tipos** — `types/user-profiles.ts`:

```ts
export interface UserProfile {
  id: string
  full_name: string | null
  role: string
  is_admin: boolean
  can_view_contracts: boolean
  can_manage_contracts: boolean
  can_view_clients: boolean
  can_manage_clients: boolean
  can_submit_proposals: boolean
  can_view_proposals: boolean
  created_at: string
  updated_at: string
  // Joined from auth.users
  email?: string
}

export interface UserWithProfile {
  id: string
  email: string
  created_at: string
  profile: UserProfile | null
}

export const PERMISSION_LABELS: Record<keyof Omit<UserProfile, 'id' | 'full_name' | 'role' | 'is_admin' | 'created_at' | 'updated_at' | 'email'>, string> = {
  can_view_contracts:   'Ver contratos',
  can_manage_contracts: 'Crear / editar contratos',
  can_view_clients:     'Ver clientes',
  can_manage_clients:   'Administrar clientes',
  can_submit_proposals: 'Enviar solicitudes',
  can_view_proposals:   'Ver propuestas',
}
```

- [ ] **Step 2: Test que falla** — `lib/panel-access.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hasPermission, requiredPermission } from './panel-access.ts'

function profile(overrides: Partial<Record<string, boolean>> = {}) {
  return {
    is_admin: false,
    can_view_contracts: false,
    can_view_clients: false,
    can_submit_proposals: false,
    can_view_proposals: false,
    ...overrides,
  }
}

test('requiredPermission por sección', () => {
  assert.equal(requiredPermission('/admin'), null)
  assert.equal(requiredPermission('/login'), null)
  assert.equal(requiredPermission('/contratos'), 'can_view_contracts')
  assert.equal(requiredPermission('/contratos/abc/editar'), 'can_view_contracts')
  assert.equal(requiredPermission('/clientes'), 'can_view_clients')
  assert.equal(requiredPermission('/solicitudes/nueva'), 'can_submit_proposals')
  assert.equal(requiredPermission('/propuestas'), 'can_view_proposals')
  assert.equal(requiredPermission('/usuarios'), 'is_admin')
  assert.equal(requiredPermission('/contratosx'), null)
})

test('sin fila en user_profiles: solo lo que no pide permiso', () => {
  assert.equal(hasPermission(null, null), true)
  assert.equal(hasPermission(null, 'can_view_contracts'), false)
  assert.equal(hasPermission(null, 'is_admin'), false)
})

test('admin ve todo', () => {
  const admin = profile({ is_admin: true })
  for (const p of ['can_view_contracts', 'can_view_clients', 'can_submit_proposals', 'can_view_proposals', 'is_admin'] as const) {
    assert.equal(hasPermission(admin, p), true, p)
  }
})

test('colaborador ve solo lo asignado', () => {
  const user = profile({ can_view_clients: true, can_submit_proposals: true })
  assert.equal(hasPermission(user, 'can_view_clients'), true)
  assert.equal(hasPermission(user, 'can_submit_proposals'), true)
  assert.equal(hasPermission(user, 'can_view_contracts'), false)
  assert.equal(hasPermission(user, 'is_admin'), false)
})
```

Run: `npm test` → Expected: FAIL (`panel-access.ts` no existe). Actualizar el script a `"test": "node --test lib/*.test.ts"` si no cubre ya ambos archivos (el glob `lib/*.test.ts` los cubre).

- [ ] **Step 3: Implementar** — `lib/panel-access.ts`:

```ts
import type { UserProfile } from '@/types/user-profiles'

export type PanelPermission =
  | 'is_admin'
  | 'can_view_contracts'
  | 'can_view_clients'
  | 'can_submit_proposals'
  | 'can_view_proposals'

// Permiso requerido por sección del panel. /admin (inicio) y /login solo requieren sesión.
const ROUTE_PERMISSIONS: [prefix: string, permission: PanelPermission][] = [
  ['/contratos', 'can_view_contracts'],
  ['/clientes', 'can_view_clients'],
  ['/solicitudes', 'can_submit_proposals'],
  ['/propuestas', 'can_view_proposals'],
  ['/usuarios', 'is_admin'],
]

export function requiredPermission(pathname: string): PanelPermission | null {
  const match = ROUTE_PERMISSIONS.find(([p]) => pathname === p || pathname.startsWith(`${p}/`))
  return match ? match[1] : null
}

export function hasPermission(
  profile: Pick<UserProfile, PanelPermission> | null,
  permission: PanelPermission | null,
): boolean {
  if (permission === null) return true
  if (!profile) return false
  if (profile.is_admin) return true
  return profile[permission] === true
}
```

- [ ] **Step 4: Sesión actual** — `lib/panel-session.ts`:

```ts
import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { UserProfile } from '@/types/user-profiles'

// Usuario con sesión + su fila de user_profiles. Cacheado por request: layout y páginas lo comparten.
export const getCurrentSession = cache(
  async (): Promise<{ user: User | null; profile: UserProfile | null }> => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { user: null, profile: null }

    const { data } = await createServiceClient()
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    return { user, profile: (data as UserProfile | null) ?? null }
  },
)
```

- [ ] **Step 5: Verificar y commitear**

Run: `npm test` → todos PASS. `npx tsc --noEmit` → exit 0.

```bash
git add types/user-profiles.ts lib/panel-access.ts lib/panel-access.test.ts lib/panel-session.ts
git commit -m "feat(panel): permisos por sección con user_profiles"
```

---

### Task 5: Middleware nuevo

**Files:**
- Modify (reescritura completa): `middleware.ts`

**Interfaces:**
- Consumes: `isPanelPath`, `resolveHostRouting` (Task 3); `hasPermission`, `requiredPermission`, `PanelPermission` (Task 4); `UserProfile` (Task 4).

- [ ] **Step 1: Reescribir `middleware.ts`**

```ts
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

const PERMISSION_COLUMNS = 'is_admin, can_view_contracts, can_view_clients, can_submit_proposals, can_view_proposals'

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
```

- [ ] **Step 2: Tipos** — Run: `npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Verificar con el dev server y headers de host**

```bash
npm run dev > /tmp/bralto-dev.log 2>&1 &   # (usar el scratchpad en vez de /tmp si el ejecutor lo tiene)
# esperar a que responda http://localhost:3000
check() { printf "%-14s %-32s " "$1" "$2"; curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -H "Host: $1" "http://localhost:3000$2"; }
check admin.bralto.io /
check admin.bralto.io /contratos
check admin.bralto.io /login
check admin.bralto.io /c/acme-x1y2
check admin.bralto.io /propuestas/abc
check admin.bralto.io /es
check www.bralto.io   /contratos
check www.bralto.io   "/solicitudes?success=1"
check www.bralto.io   /login
check www.bralto.io   /c/acme-x1y2
check www.bralto.io   /
check localhost:3000  /login
check localhost:3000  /contratos
check localhost:3000  /es
curl -s -o /dev/null -w "OPTIONS accept: %{http_code}\n" -X OPTIONS -H "Host: admin.bralto.io" -H "Origin: https://www.bralto.io" http://localhost:3000/api/proposals/00000000-0000-0000-0000-000000000000/accept
```
Expected:
| Request | Resultado |
|---|---|
| admin `/` | 307 → `https://admin.bralto.io/admin` |
| admin `/contratos` (sin sesión) | 307 → `…/login` |
| admin `/login` | 200 |
| admin `/c/acme-x1y2` | 307 → `https://www.bralto.io/c/acme-x1y2` |
| admin `/propuestas/abc` | 307 → `https://www.bralto.io/propuestas/abc` |
| admin `/es` | 307 → `https://www.bralto.io/es` |
| www `/contratos` | 307 → `https://admin.bralto.io/contratos` |
| www `/solicitudes?success=1` | 307 → `https://admin.bralto.io/solicitudes?success=1` |
| www `/login` | 307 → `https://admin.bralto.io/login` |
| www `/c/acme-x1y2` | 404 (slug inexistente) **sin** redirect a `/es/c/…` |
| www `/` | 307 → `/es` o `/en` |
| localhost `/login` | 200 |
| localhost `/contratos` | 307 → `/login` |
| localhost `/es` | 200 |
| OPTIONS accept | 204 |

Dejar el dev server corriendo para las tasks siguientes.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat(panel): middleware por host con permisos; /c/ fuera del árbol de idiomas"
```

---

### Task 6: Menú, layout e inicio con permisos + Usuarios

**Files:**
- Modify: `components/internal/internal-nav.tsx`, `app/(internal)/layout.tsx`, `app/(internal)/admin/page.tsx`
- Create: `app/(auth)/layout.tsx`
- Copy from LI: `app/(internal)/usuarios/page.tsx`, `components/users/user-management.tsx`, `app/api/users/route.ts`, `app/api/users/[id]/route.ts`

**Interfaces:**
- Consumes: `hasPermission`, `requiredPermission` (Task 4), `getCurrentSession` (Task 4), `UserProfile`, `UserWithProfile`, `PERMISSION_LABELS` (Task 4).
- Produces: `InternalNav({ profile }: { profile: UserProfile | null })`.

- [ ] **Step 1: Menú** — en `components/internal/internal-nav.tsx` reemplazar imports + `navItems` + firma + el `.map` por:

```tsx
import { FileText, Users, LogOut, Menu, X, LayoutDashboard, ScrollText, ClipboardList, UserCog, type LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { hasPermission, requiredPermission } from '@/lib/panel-access'
import type { UserProfile } from '@/types/user-profiles'
import { useState } from 'react'

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
  { href: '/contratos', label: 'Contratos', icon: FileText },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/solicitudes', label: 'Solicitudes', icon: ClipboardList },
  { href: '/propuestas', label: 'Propuestas', icon: ScrollText },
  { href: '/usuarios', label: 'Usuarios', icon: UserCog },
]

export function InternalNav({ profile }: { profile: UserProfile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(profile, requiredPermission(item.href)))
```
y en el render: `{visibleItems.map(({ href, label, icon: Icon }) => {` con `const active = pathname === href || pathname.startsWith(`${href}/`)`. Mantener `Image`, `Link`, `usePathname`, `useRouter` y el resto del JSX igual.

- [ ] **Step 2: Layout** — `app/(internal)/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { InternalNav } from '@/components/internal/internal-nav'
import { getCurrentSession } from '@/lib/panel-session'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#060607] text-white">
      <InternalNav profile={profile} />
      <main className="pt-14 md:pt-0 md:ml-56 min-h-screen">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Login sin indexar** — `app/(auth)/layout.tsx`:

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ingresar',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

- [ ] **Step 4: Inicio** — `app/(internal)/admin/page.tsx`:

```tsx
import Link from 'next/link'
import { FileText, Users, ArrowRight, ClipboardList, ScrollText, UserCog } from 'lucide-react'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission, requiredPermission } from '@/lib/panel-access'

const sections = [
  { href: '/contratos', icon: FileText, label: 'Contratos', description: 'Creá, enviá y gestioná contratos de clientes.' },
  { href: '/clientes', icon: Users, label: 'Clientes', description: 'Base de datos de clientes activos e históricos.' },
  { href: '/solicitudes', icon: ClipboardList, label: 'Solicitudes', description: 'Registrá clientes potenciales y generá sus propuestas.' },
  { href: '/propuestas', icon: ScrollText, label: 'Propuestas', description: 'Propuestas publicadas, su estado y sus links.' },
  { href: '/usuarios', icon: UserCog, label: 'Usuarios', description: 'Colaboradores y permisos del panel.' },
]

export default async function AdminPage() {
  const { user, profile } = await getCurrentSession()
  const visible = sections.filter((s) => hasPermission(profile, requiredPermission(s.href)))

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Panel interno</h1>
        <p className="text-sm text-white/40 mt-1">{user?.email}</p>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-white/40">Todavía no tenés secciones asignadas. Pedile acceso a un administrador.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ href, icon: Icon, label, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-3 p-5 bg-white/[0.03] border border-white/[0.07] rounded-xl hover:border-[#5bb6ff]/30 hover:bg-white/[0.05] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#5bb6ff]/10 flex items-center justify-center">
                  <Icon size={15} className="text-[#5bb6ff]" />
                </div>
                <ArrowRight
                  size={14}
                  className="text-white/20 group-hover:text-[#5bb6ff] group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Copiar Usuarios y adaptar**

```bash
LI="/Users/alejandro/Documents/Visual Studio Code/Linkedin React"
mkdir -p "app/(internal)/usuarios" components/users "app/api/users/[id]"
cp "$LI/app/(internal)/usuarios/page.tsx" "app/(internal)/usuarios/page.tsx"
cp "$LI/components/users/user-management.tsx" components/users/user-management.tsx
cp "$LI/app/api/users/route.ts" app/api/users/route.ts
cp "$LI/app/api/users/[id]/route.ts" "app/api/users/[id]/route.ts"
sed -i '' -E 's/orange-[3-6]00/[#5bb6ff]/g; s/#111111/#131316/g' components/users/user-management.tsx
sed -i '' '/can_view_linkedin/d' components/users/user-management.tsx
grep -n "orange\|#111111\|linkedin" components/users/user-management.tsx
```
Expected: grep sin resultados.

- [ ] **Step 6: Verificar y commitear**

Run: `npx tsc --noEmit` → exit 0. Con el dev server: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/usuarios` → 307 (a `/login`, sin sesión).

```bash
git add components/internal/internal-nav.tsx "app/(internal)/layout.tsx" "app/(internal)/admin/page.tsx" "app/(auth)/layout.tsx" "app/(internal)/usuarios" components/users app/api/users
git commit -m "feat(panel): menú e inicio según permisos; sección Usuarios"
```

---

### Task 7: Backend de propuestas

**Files:**
- Create: `lib/proposals/slug.ts`, `lib/proposals/slug.test.ts`, `lib/proposals/publish.ts`
- Copy from LI: `types/proposals.ts`, `lib/proposals/render-template.ts`, `templates/proposals/template.html`, `app/api/proposals/route.ts`, `app/api/proposals/[id]/route.ts`, `app/api/proposals/[id]/accept/route.ts`, `app/api/proposals/generate/route.ts` (modificado)
- Modify: `app/api/proposals/receive/route.ts`
- Delete: `app/api/proposals/[slug]/route.ts`

**Interfaces:**
- Produces: `proposalSlugFromUrl(url: string | null | undefined): string | null`; `publicProposalUrl(slug: string): string`; `publishProposal(input: { client_name: string; project_name: string; html_content: string; created_by: string }): Promise<{ url: string; slug: string; expires_at: string }>` (lanza `Error` si falla el insert).

- [ ] **Step 1: Test que falla** — `lib/proposals/slug.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { proposalSlugFromUrl } from './slug.ts'

test('extrae el slug de la URL pública', () => {
  assert.equal(proposalSlugFromUrl('https://bralto.io/propuestas/Ab3dE5gH9jK1'), 'Ab3dE5gH9jK1')
  assert.equal(proposalSlugFromUrl('https://www.bralto.io/propuestas/abc/'), 'abc')
  assert.equal(proposalSlugFromUrl('https://bralto.io/propuestas/abc?utm=x'), 'abc')
})

test('sin URL o URL ajena → null', () => {
  assert.equal(proposalSlugFromUrl(null), null)
  assert.equal(proposalSlugFromUrl(undefined), null)
  assert.equal(proposalSlugFromUrl(''), null)
  assert.equal(proposalSlugFromUrl('https://bralto.io/es/precios'), null)
})
```
Script: `"test": "node --test lib/*.test.ts lib/**/*.test.ts"`. Run: `npm test` → FAIL (`slug.ts` no existe).

- [ ] **Step 2: Implementar** — `lib/proposals/slug.ts`:

```ts
// Slug de una URL pública de propuesta: https://bralto.io/propuestas/<slug>
export function proposalSlugFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const match = url.match(/\/propuestas\/([^/?#]+)/)
  return match ? match[1] : null
}
```
Run: `npm test` → PASS.

- [ ] **Step 3: Publicación compartida** — `lib/proposals/publish.ts`:

```ts
import { nanoid } from 'nanoid'
import { createServiceClient } from '@/lib/supabase/service'

const PROPOSAL_TTL_MS = 14 * 24 * 60 * 60 * 1000

export interface PublishProposalInput {
  client_name: string
  project_name: string
  html_content: string
  created_by: string
}

export interface PublishedProposal {
  url: string
  slug: string
  expires_at: string
}

export function publicProposalUrl(slug: string): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bralto.io'}/propuestas/${slug}`
}

// Guarda el HTML en generated_proposals; queda público en /propuestas/<slug> por 14 días.
export async function publishProposal(input: PublishProposalInput): Promise<PublishedProposal> {
  const slug = nanoid(12)
  const expires_at = new Date(Date.now() + PROPOSAL_TTL_MS).toISOString()

  const { error } = await createServiceClient()
    .from('generated_proposals')
    .insert({ slug, expires_at, ...input })
  if (error) throw new Error(error.message)

  return { url: publicProposalUrl(slug), slug, expires_at }
}
```

- [ ] **Step 4: `receive` usa la función compartida** — en `app/api/proposals/receive/route.ts` quitar imports de `nanoid` y `createServiceClient`, agregar `import { publishProposal } from '@/lib/proposals/publish'`, y reemplazar desde `const slug = nanoid(12)` hasta el `return` final por:

```ts
  try {
    const published = await publishProposal({ client_name, project_name, html_content, created_by })
    return NextResponse.json(published, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
```

- [ ] **Step 5: Quitar la ruta `[slug]` y copiar las de LI**

```bash
git rm -q "app/api/proposals/[slug]/route.ts"
LI="/Users/alejandro/Documents/Visual Studio Code/Linkedin React"
mkdir -p lib/proposals templates/proposals "app/api/proposals/[id]/accept" app/api/proposals/generate
cp "$LI/types/proposals.ts" types/proposals.ts
cp "$LI/lib/proposals/render-template.ts" lib/proposals/render-template.ts
cp "$LI/templates/proposals/template.html" templates/proposals/template.html
cp "$LI/app/api/proposals/route.ts" app/api/proposals/route.ts
cp "$LI/app/api/proposals/[id]/route.ts" "app/api/proposals/[id]/route.ts"
cp "$LI/app/api/proposals/[id]/accept/route.ts" "app/api/proposals/[id]/accept/route.ts"
cp "$LI/app/api/proposals/generate/route.ts" app/api/proposals/generate/route.ts
```

- [ ] **Step 6: `generate` publica directo** — en `app/api/proposals/generate/route.ts` agregar `import { publishProposal } from '@/lib/proposals/publish'` y reemplazar el bloque que va desde `// Enviar a bralto.io` hasta `const { url, slug } = await braltoRes.json() as { url: string; slug: string }` por:

```ts
  let url: string
  let slug: string
  try {
    ;({ url, slug } = await publishProposal({
      html_content: html,
      client_name: proposal.client_name,
      project_name: proposal.client_company ?? proposal.client_name,
      created_by: user.email ?? 'admin',
    }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error al publicar la propuesta: ${msg}` }, { status: 500 })
  }
```
Verificar: `grep -n "BRALTO_API_URL\|braltoRes\|api/proposals/receive" app/api/proposals/generate/route.ts` → sin resultados.

- [ ] **Step 7: Verificar y commitear**

Run: `npm test` → PASS; `npx tsc --noEmit` → exit 0.

```bash
git add lib/proposals types/proposals.ts templates/proposals app/api/proposals package.json
git commit -m "feat(propuestas): generador y aceptación desde el panel; publicación directa en DB"
```

---

### Task 8: Solicitudes (UI)

**Files:**
- Copy from LI: `app/(internal)/solicitudes/page.tsx`, `app/(internal)/solicitudes/nueva/page.tsx`, `components/proposals/proposal-form.tsx`, `components/proposals/solicitudes-dashboard.tsx`

**Interfaces:**
- Consumes: `/api/proposals` (GET, POST), `/api/proposals/[id]` (PATCH, DELETE), `/api/proposals/generate` (POST) de Task 7; tipos de `types/proposals.ts`.

- [ ] **Step 1: Copiar y adaptar colores**

```bash
LI="/Users/alejandro/Documents/Visual Studio Code/Linkedin React"
mkdir -p "app/(internal)/solicitudes/nueva"
cp "$LI/app/(internal)/solicitudes/page.tsx" "app/(internal)/solicitudes/page.tsx"
cp "$LI/app/(internal)/solicitudes/nueva/page.tsx" "app/(internal)/solicitudes/nueva/page.tsx"
cp "$LI/components/proposals/proposal-form.tsx" components/proposals/proposal-form.tsx
cp "$LI/components/proposals/solicitudes-dashboard.tsx" components/proposals/solicitudes-dashboard.tsx
sed -i '' -E 's/orange-[3-6]00/[#5bb6ff]/g; s/#111111/#131316/g' components/proposals/proposal-form.tsx components/proposals/solicitudes-dashboard.tsx
grep -n "orange\|#111111\|#0d0d0d" components/proposals/proposal-form.tsx components/proposals/solicitudes-dashboard.tsx "app/(internal)/solicitudes/page.tsx" "app/(internal)/solicitudes/nueva/page.tsx"
```
Expected: grep sin resultados.

- [ ] **Step 2: Verificar y commitear**

Run: `npx tsc --noEmit` → exit 0. Dev server: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/solicitudes` → 307 (a `/login`).

```bash
git add "app/(internal)/solicitudes" components/proposals/proposal-form.tsx components/proposals/solicitudes-dashboard.tsx
git commit -m "feat(panel): sección Solicitudes"
```

---

### Task 9: Lista unificada de propuestas

**Files:**
- Create: `app/(internal)/propuestas/page.tsx`, `app/(internal)/propuestas/actions.ts`
- Modify: `components/proposals/delete-proposal-button.tsx` (import de la action)
- Delete: `app/propuestas/page.tsx`, `app/propuestas/actions.ts` (se mantiene `app/propuestas/[slug]/route.ts`)

**Interfaces:**
- Consumes: `publicProposalUrl` (Task 7), `proposalSlugFromUrl` (Task 7), `getCurrentSession` + `hasPermission` (Task 4), `BRALTO_SERVICES`, `STATUS_LABELS`, `STATUS_COLORS`, `ProposalStatus` (Task 7), `CopyButton({ text, className? })` de `components/contracts/copy-button.tsx`.
- Produces: server action `deleteProposal(slug: string): Promise<void>`.

- [ ] **Step 1: Server action** — `app/(internal)/propuestas/actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'

export async function deleteProposal(slug: string) {
  const { user, profile } = await getCurrentSession()
  if (!user || !hasPermission(profile, 'can_view_proposals')) throw new Error('Sin permisos')

  const service = createServiceClient()
  await service.from('generated_proposals').delete().eq('slug', slug)
  // Si venía de una solicitud, la solicitud deja de apuntar a la página borrada
  await service
    .from('proposal_requests')
    .update({ generated_url: null, generated_at: null, updated_at: new Date().toISOString() })
    .like('generated_url', `%/propuestas/${slug}`)

  revalidatePath('/propuestas')
}
```

- [ ] **Step 2: Mover y ajustar el botón de borrar**

```bash
git rm -q app/propuestas/page.tsx app/propuestas/actions.ts
sed -i '' "s#@/app/propuestas/actions#@/app/(internal)/propuestas/actions#" components/proposals/delete-proposal-button.tsx
grep -n "actions" components/proposals/delete-proposal-button.tsx
```
Expected: `import { deleteProposal } from '@/app/(internal)/propuestas/actions'`.

- [ ] **Step 3: Página** — `app/(internal)/propuestas/page.tsx`:

```tsx
import { ExternalLink, FileText } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/service'
import { CopyButton } from '@/components/contracts/copy-button'
import { DeleteProposalButton } from '@/components/proposals/delete-proposal-button'
import { publicProposalUrl } from '@/lib/proposals/publish'
import { proposalSlugFromUrl } from '@/lib/proposals/slug'
import { BRALTO_SERVICES, STATUS_COLORS, STATUS_LABELS, type ProposalStatus } from '@/types/proposals'

export const metadata = { title: 'Propuestas' }

interface PublishedRow {
  id: string
  slug: string
  client_name: string
  project_name: string
  expires_at: string
  created_at: string
  created_by: string
}

interface RequestRow {
  id: string
  services: string[]
  status: ProposalStatus
  submitted_by: string | null
  generated_url: string | null
}

const TH = 'text-left px-4 py-3 text-xs text-white/40 font-medium'

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function serviceLabel(id: string) {
  return BRALTO_SERVICES.find((s) => s.id === id)?.label ?? id
}

export default async function PropuestasPage() {
  const service = createServiceClient()
  const [{ data: published }, { data: requests }] = await Promise.all([
    service
      .from('generated_proposals')
      .select('id, slug, client_name, project_name, expires_at, created_at, created_by')
      .order('created_at', { ascending: false }),
    service
      .from('proposal_requests')
      .select('id, services, status, submitted_by, generated_url')
      .not('generated_url', 'is', null),
  ])

  // Propuestas que salieron de una solicitud (match por slug de generated_url)
  const requestBySlug = new Map<string, RequestRow>()
  for (const r of (requests ?? []) as RequestRow[]) {
    const slug = proposalSlugFromUrl(r.generated_url)
    if (slug) requestBySlug.set(slug, r)
  }

  const submitterIds = [...new Set(
    [...requestBySlug.values()].map((r) => r.submitted_by).filter((id): id is string => !!id),
  )]
  const { data: profiles } = submitterIds.length
    ? await service.from('user_profiles').select('id, full_name').in('id', submitterIds)
    : { data: [] as { id: string; full_name: string | null }[] }
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? 'Sin nombre']))

  const rows = (published ?? []) as PublishedRow[]
  const now = new Date()

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl font-semibold text-white">Propuestas</h1>
        <p className="text-sm text-white/40 mt-0.5">{rows.length} propuesta(s) publicada(s)</p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={32} className="text-white/10 mb-3" />
          <p className="text-white/30 text-sm">No hay propuestas publicadas</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.08] overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-white/[0.03] border-b border-white/[0.06]">
              <tr>
                <th className={TH}>Cliente</th>
                <th className={TH}>Servicios</th>
                <th className={TH}>Creada por</th>
                <th className={TH}>Estado</th>
                <th className={TH}>Creada</th>
                <th className={TH}>Vence</th>
                <th className="px-4 py-3 text-xs text-white/40 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {rows.map((p) => {
                const request = requestBySlug.get(p.slug)
                const expired = new Date(p.expires_at) < now
                const url = publicProposalUrl(p.slug)
                const author = request?.submitted_by
                  ? nameById.get(request.submitted_by) ?? 'Desconocido'
                  : p.created_by

                return (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm text-white font-medium">{p.client_name}</p>
                      {p.project_name !== p.client_name && (
                        <p className="text-xs text-white/40 mt-0.5">{p.project_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {request ? (
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {request.services.map((id) => (
                            <span key={id} className="inline-block px-1.5 py-0.5 text-[10px] bg-[#5bb6ff]/10 text-[#5bb6ff]/80 rounded whitespace-nowrap">
                              {serviceLabel(id)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40">{author}</td>
                    <td className="px-4 py-3">
                      {request ? (
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${STATUS_COLORS[request.status]}`}>
                          {STATUS_LABELS[request.status]}
                        </span>
                      ) : (
                        <span className="text-xs text-white/30">Manual</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${expired ? 'text-red-400' : 'text-white/40'}`}>
                        {expired ? 'Expirada' : formatDate(p.expires_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        {!expired && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/30 hover:text-[#5bb6ff] transition-colors"
                            title="Abrir propuesta"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                        <CopyButton text={url} />
                        <DeleteProposalButton slug={p.slug} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verificar y commitear**

Run: `npx tsc --noEmit` → exit 0. Dev server: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/propuestas` → 307 (a `/login`); `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/propuestas/noexiste` → 404.

```bash
git add "app/(internal)/propuestas" components/proposals/delete-proposal-button.tsx app/propuestas
git commit -m "feat(propuestas): lista unificada de propuestas publicadas"
```

---

### Task 10: Verificación final

- [ ] **Step 1: Limpieza de referencias** — `grep -rni "linkedin\|nala\|social/generate\|BRALTO_API_URL" app components lib types middleware.ts` → solo la etiqueta del servicio `agente_ia` ("Agente IA (LinkedIn / WhatsApp)") en `types/proposals.ts`, que es un servicio que se vende, no el módulo.
- [ ] **Step 2: Tests y tipos** — `npm test` → PASS; `npx tsc --noEmit` → exit 0.
- [ ] **Step 3: Build** — detener el dev server; `npm run build` → sin errores. En la salida deben figurar `/propuestas`, `/propuestas/[slug]`, `/solicitudes`, `/usuarios`, `/api/proposals/[id]/accept`, `/api/proposals/generate`.
- [ ] **Step 4: Repetir la tabla de curl de Task 5** contra `npm run start` (build de producción).
- [ ] **Step 5: Solo lectura en DB** — listar usuarios y permisos para confirmarlos con Alejandro:
  `select p.id, u.email, p.full_name, p.is_admin, p.can_view_contracts, p.can_view_clients, p.can_submit_proposals, p.can_view_proposals from user_profiles p right join auth.users u on u.id = p.id order by u.email;` (vía el pooler, ver memoria `reference_supabase_db_access`).
- [ ] **Step 6: Actualizar el spec** con las desviaciones: `/api/proposals/[id]/generated` no se porta (lo reemplaza la server action `deleteProposal`); redirecciones con 307; `/c/` agregado a las rutas fuera del árbol de idiomas (arregla 404 actual en `www.bralto.io/c/<slug>`); destino público `https://www.bralto.io`. Commit del spec.
- [ ] **Step 7: Revisión final de la rama** (un reviewer sobre todo el diff `main...feat/fusion-panel-admin`).
