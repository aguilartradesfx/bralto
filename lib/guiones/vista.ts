// Cómo se dicen las cosas de un guion en el panel: el día, cuánto dura, los tamaños y cuándo llegó un video.
// Funciones puras y con nombres propios (sin Intl): el servidor y el teléfono escriben lo mismo.
import { ADMIN_ORIGIN } from '../host-routing.ts'
import type { Vista } from './tipos.ts'

const MIN = 60_000
const DIA_MS = 24 * 60 * MIN
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export const esId = (s: string) => UUID.test(s)

// El enlace de Telegram y de la Oficina: llega directo a ese guion
export const enlaceGuion = (id: string) => `${ADMIN_ORIGIN}/guiones#${id}`

// #<id> → id (o null si el ancla no es de un guion)
export function idDeAncla(hash: string): string | null {
  const id = hash.startsWith('#') ? hash.slice(1).toLowerCase() : ''
  return esId(id) ? id : null
}

export const ETIQUETA_VISTA: Record<Vista, string> = { usted: 'USTED', mitad: 'MITAD', motion: 'MOTION' }
// Lo que quiere decir cada etiqueta, para quien no se acuerda
export const AYUDA_VISTA: Record<Vista, string> = {
  usted: 'Solo tú, a pantalla completa',
  mitad: 'Tú abajo y la animación arriba',
  motion: 'No sales, solo se oye tu voz',
}

const sumarDias = (dia: string, n: number) => new Date(Date.parse(`${dia}T12:00:00Z`) + n * DIA_MS).toISOString().slice(0, 10)

// 2026-11-17 → «lunes 17 de noviembre» (con el año si no es el de `hoy`)
function fechaLarga(dia: string, hoy: string): string {
  const d = new Date(`${dia}T12:00:00Z`)
  const anio = dia.slice(0, 4) === hoy.slice(0, 4) ? '' : ` de ${d.getUTCFullYear()}`
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}${anio}`
}

// «Para hoy, lunes 17 de noviembre» · «Para mañana, …» · «Para el sábado 14 de noviembre»
export function diaLegible(dia: string, hoy: string): string {
  const larga = fechaLarga(dia, hoy)
  if (dia === hoy) return `Para hoy, ${larga}`
  if (dia === sumarDias(hoy, 1)) return `Para mañana, ${larga}`
  return `Para el ${larga}`
}

const cuenta = (n: number, uno: string, muchos: string) => `${n} ${n === 1 ? uno : muchos}`

export function duracionLegible(s: number | null): string | null {
  if (s === null) return null
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m === 0) return cuenta(r, 'segundo', 'segundos')
  return r ? `${cuenta(m, 'minuto', 'minutos')} y ${cuenta(r, 'segundo', 'segundos')}` : cuenta(m, 'minuto', 'minutos')
}

export function etiquetaGancho(tipo: string): string {
  const t = tipo.trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Gancho'
}

const conComa = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',')

export function tamanoLegible(bytes: number): string {
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb < 10 ? conComa(mb) : Math.round(mb)} MB`
  return `${conComa(mb / 1024)} GB`
}

// Costa Rica está en UTC−6 todo el año
const enCR = (t: number) => new Date(t - 6 * 60 * MIN)

// El día de hoy en Costa Rica, AAAA-MM-DD (para «Para hoy» y «Para mañana»)
export const diaCR = (d: Date) => enCR(d.getTime()).toISOString().slice(0, 10)

function horaCR(t: number): string {
  const d = enCR(t)
  const h = d.getUTCHours() % 12 || 12
  return `${h === 1 ? 'a la' : 'a las'} ${h}:${String(d.getUTCMinutes()).padStart(2, '0')} ${d.getUTCHours() < 12 ? 'a. m.' : 'p. m.'}`
}

// Cuándo llegó un video: «hace un momento», «hace 40 min», «hoy a la 1:05 p. m.», «ayer a las…», «el 12 de noviembre»
export function momentoLegible(iso: string, ahora: Date): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const pasaron = ahora.getTime() - t
  if (pasaron < 2 * MIN) return 'hace un momento'
  if (pasaron < 60 * MIN) return `hace ${Math.floor(pasaron / MIN)} min`
  const dia = enCR(t).toISOString().slice(0, 10)
  const hoy = enCR(ahora.getTime()).toISOString().slice(0, 10)
  if (dia === hoy) return `hoy ${horaCR(t)}`
  if (dia === sumarDias(hoy, -1)) return `ayer ${horaCR(t)}`
  const d = enCR(t)
  const anio = dia.slice(0, 4) === hoy.slice(0, 4) ? '' : ` de ${d.getUTCFullYear()}`
  return `el ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}${anio}`
}
