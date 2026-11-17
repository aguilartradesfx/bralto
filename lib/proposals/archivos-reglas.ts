// Reglas puras de la sección «Propuestas»: estados, PDF y vencimientos. Sin imports del proyecto, para que las
// pruebas de Node las carguen tal cual.

export const BUCKET_PROPUESTAS = 'propuestas'
export const MAX_PDF_BYTES = 50 * 1024 * 1024

export const ESTADOS = ['borrador', 'enviada', 'aceptada', 'rechazada'] as const
export type EstadoPropuesta = (typeof ESTADOS)[number]

export const ESTADO_LABEL: Record<EstadoPropuesta, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
}

export const esEstado = (x: unknown): x is EstadoPropuesta => typeof x === 'string' && (ESTADOS as readonly string[]).includes(x)

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const esUuid = (x: unknown): x is string => typeof x === 'string' && UUID.test(x)

// Para Storage: sin acentos ni espacios, y siempre .pdf
export function nombreSeguro(nombre: string): string {
  const base = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80)
  return `${base || 'propuesta'}.pdf`
}

// «PDF · ES» o «PDF · EN» si el nombre trae el idioma (propuesta-cliente-ES.pdf); si no, «PDF»
export function etiquetaDe(nombre: string): string {
  const m = /(?:^|[^a-z])(es|en)(?:[^a-z]|$)/i.exec(nombre.replace(/\.pdf$/i, ''))
  return m ? `PDF · ${m[1].toUpperCase()}` : 'PDF'
}

export type PedidoPdf = { nombre: string; bytes: number }

// Lo que manda el navegador antes de subir: { nombre, bytes }
export function leerPedidoPdf(body: unknown): { ok: true; pedido: PedidoPdf } | { ok: false; error: string } {
  const b = (body ?? {}) as { nombre?: unknown; bytes?: unknown }
  const nombre = typeof b.nombre === 'string' ? b.nombre.trim() : ''
  if (!nombre || !/\.pdf$/i.test(nombre)) return { ok: false, error: 'Solo se pueden subir archivos PDF.' }
  if (typeof b.bytes !== 'number' || !Number.isFinite(b.bytes) || b.bytes <= 0) return { ok: false, error: 'El archivo está vacío.' }
  if (b.bytes > MAX_PDF_BYTES) return { ok: false, error: 'El PDF pesa más de 50 MB.' }
  return { ok: true, pedido: { nombre: nombre.slice(0, 200), bytes: b.bytes } }
}

// Vencimientos: el link sirve hasta el final del día elegido en Costa Rica (UTC−6, sin horario de verano), o sea
// hasta las 00:00 del día siguiente allá = 06:00 UTC.
const CR_MS = 6 * 60 * 60 * 1000
const DIA = /^(\d{4})-(\d{2})-(\d{2})$/

// '2026-12-15' → '2026-12-16T06:00:00.000Z'. Null si la fecha no existe.
export function venceAlFinalDe(dia: string): string | null {
  const m = DIA.exec(dia)
  if (!m) return null
  const [y, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const fecha = new Date(Date.UTC(y, mes - 1, d))
  if (fecha.getUTCFullYear() !== y || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== d) return null
  return new Date(Date.UTC(y, mes - 1, d + 1, 6)).toISOString()
}

// El último día (en Costa Rica) en que el link todavía sirve: '2026-12-16T06:00:00Z' → '2026-12-15'
export function ultimoDia(expiresAt: string | Date): string {
  return new Date(new Date(expiresAt).getTime() - CR_MS - 1).toISOString().slice(0, 10)
}

export const vigente = (expiresAt: string | Date, ahora: Date) => new Date(expiresAt).getTime() > ahora.getTime()

// El día de hoy en Costa Rica, 'YYYY-MM-DD'
export const hoyCR = (ahora: Date) => new Date(ahora.getTime() - CR_MS).toISOString().slice(0, 10)

// Hoy + n días en Costa Rica, 'YYYY-MM-DD'
export function enDias(ahora: Date, n: number): string {
  return new Date(ahora.getTime() - CR_MS + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// Tamaño para mostrar: '2.3 MB', '840 KB'
export function peso(bytes: number | null): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
