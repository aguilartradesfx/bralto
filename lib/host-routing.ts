// Decide qué host sirve cada ruta:
//   admin.bralto.io          → panel interno
//   knox.bralto.io           → el Centro de mando de Knox (la página /knox, servida en la raíz)
//   www.bralto.io, bralto.io → sitio público y páginas de clientes
//   cualquier otro host      → todo, sin redirecciones (localhost, previews de Vercel)

export const ADMIN_ORIGIN = 'https://admin.bralto.io'
export const KNOX_ORIGIN = 'https://knox.bralto.io'
export const PUBLIC_ORIGIN = 'https://www.bralto.io'

const ADMIN_HOSTS = new Set(['admin.bralto.io'])
const KNOX_HOSTS = new Set(['knox.bralto.io'])
const PUBLIC_HOSTS = new Set(['bralto.io', 'www.bralto.io'])
// Hosts que son enteros privados (sin analítica ni banner de cookies)
const PRIVATE_HOSTS = [...ADMIN_HOSTS, ...KNOX_HOSTS]

// La página del Centro de mando dentro de la app (en knox.bralto.io se sirve en /)
export const KNOX_PATH = '/knox'

const PANEL_PREFIXES = ['/admin', '/contratos', '/clientes', '/solicitudes', '/usuarios', '/plan-q4', '/calendario', '/crm', '/knox', '/ajustes', '/pronto', '/ideas', '/analisis']
// Sin subrutas: /propuestas/<slug> es la página pública de cada propuesta
const PANEL_EXACT = ['/login', '/propuestas']

export type HostKind = 'admin' | 'knox' | 'public' | 'other'

export type HostDecision =
  | { action: 'next' }
  | { action: 'redirect'; url: string }
  // Sirve otra ruta sin cambiar la dirección (knox.bralto.io/ muestra /knox)
  | { action: 'rewrite'; pathname: string }

export function hostKind(host: string | null): HostKind {
  const name = (host ?? '').toLowerCase().split(':')[0]
  if (ADMIN_HOSTS.has(name)) return 'admin'
  if (KNOX_HOSTS.has(name)) return 'knox'
  if (PUBLIC_HOSTS.has(name)) return 'public'
  return 'other'
}

export function isPanelPath(pathname: string): boolean {
  if (PANEL_EXACT.includes(pathname)) return true
  return PANEL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

const isKnoxPath = (pathname: string) => pathname === KNOX_PATH || pathname.startsWith(`${KNOX_PATH}/`)

// /knox?hablar → https://knox.bralto.io/?hablar
const knoxUrl = (pathname: string, search: string) => `${KNOX_ORIGIN}${pathname.slice(KNOX_PATH.length) || '/'}${search}`

export function resolveHostRouting(host: string | null, pathname: string, search = ''): HostDecision {
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) return { action: 'next' }

  const kind = hostKind(host)
  if (kind === 'knox') {
    if (pathname === '/') return { action: 'rewrite', pathname: KNOX_PATH }
    if (isKnoxPath(pathname)) return { action: 'redirect', url: knoxUrl(pathname, search) }
    // Knox tiene su propio inicio de sesión (la sesión de admin.bralto.io no se comparte entre subdominios)
    if (pathname === '/login') return { action: 'next' }
    // Los enlaces del centro al CRM, al calendario o al Inicio se abren en el panel
    if (isPanelPath(pathname)) return { action: 'redirect', url: `${ADMIN_ORIGIN}${pathname}${search}` }
    return { action: 'redirect', url: `${PUBLIC_ORIGIN}${pathname}${search}` }
  }
  // Knox ya no vive en el panel: los enlaces viejos (y la app de Mac de antes) van a knox.bralto.io
  if ((kind === 'admin' || kind === 'public') && isKnoxPath(pathname)) {
    return { action: 'redirect', url: knoxUrl(pathname, search) }
  }
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

// Superficies privadas: el panel y las páginas de firma de contratos (/c/<slug>, el slug da acceso al contrato).
// Ahí no se cargan analítica ni banner de cookies, ni se indexan.
const CLIENT_PRIVATE_PREFIX = '/c/'

export function isContractSigningPath(pathname: string): boolean {
  return pathname.startsWith(CLIENT_PRIVATE_PREFIX)
}

// El enlace de «Conectar cuentas» lleva un código privado: no debe llegar a la analítica
const CONNECT_PATH = /^\/(?:es|en)\/conectar\//

export function isPrivateSurface(host: string | null, pathname: string): boolean {
  const kind = hostKind(host)
  return kind === 'admin' || kind === 'knox' || isPanelPath(pathname) || isContractSigningPath(pathname) || CONNECT_PATH.test(pathname)
}

// La misma regla como expresión JS para scripts inline (lee `location` del navegador)
export const PRIVATE_SURFACE_JS =
  `(${JSON.stringify(PRIVATE_HOSTS)}.indexOf(location.hostname.toLowerCase())>=0` +
  `||${JSON.stringify(PANEL_EXACT)}.indexOf(location.pathname)>=0` +
  `||${JSON.stringify(PANEL_PREFIXES)}.some(function(p){return location.pathname===p||location.pathname.indexOf(p+'/')===0})` +
  `||location.pathname.indexOf(${JSON.stringify(CLIENT_PRIVATE_PREFIX)})===0` +
  `||${CONNECT_PATH}.test(location.pathname))`
