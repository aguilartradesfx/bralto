import type { Locale } from './primitives'

// Servicios del sitio: las claves son las de Home.nav.groups en los mensajes.
// Módulo sin 'use client' para que el nav (cliente) y las páginas (servidor) compartan las rutas.

export type MegaItem = { key: string; label: string; desc: string }
export type MegaGroup = { heading: string; items: MegaItem[] }

export const SERVICE_PATHS: Record<string, string> = {
  sitiosWeb: '/servicios/sitios-web',
  produccionContenido: '/servicios/produccion-contenido',
  campanas: '/servicios/campanas',
  asesoria: '/servicios/asesoria',
  automatizacion: '/servicios/automatizacion',
  agentesIa: '/servicios/agentes-ia',
  sistemasInternos: '/servicios/sistemas-internos',
}

export const FUNNELLAB_URL = 'https://funnellabs.bralto.io'

export function serviceHref(locale: Locale, key: string) {
  return key === 'funnelLab' ? FUNNELLAB_URL : `/${locale}${SERVICE_PATHS[key] ?? '/servicios'}`
}
