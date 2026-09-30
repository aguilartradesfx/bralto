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
