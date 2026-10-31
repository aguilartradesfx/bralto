// Números, horas y fechas del Centro de mando como se leen en Costa Rica: 4.445 · 18,4 mil · ₡455,44 · 17:42.
// La hora siempre es la de Costa Rica (UTC−6), aunque la compu esté en otra zona. Puro, con pruebas.
import { diaCR, horaCR } from '../../calendario/fechas.ts'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const OFFSET_MS = 6 * 3600_000

const miles = (digitos: string) => digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const dos = (n: number) => String(n).padStart(2, '0')
const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
// El instante corrido a Costa Rica: sus campos UTC son los de la hora local
const enCR = (instante: Date) => new Date(instante.getTime() - OFFSET_MS)

// 4.445
export function entero(n: number): string {
  const r = Math.round(n)
  return `${r < 0 ? '-' : ''}${miles(String(Math.abs(r)))}`
}

// 1,5 · 2 (sin «,0»)
export function decimal(n: number, decimales = 1): string {
  const [e, d = ''] = Math.abs(n).toFixed(decimales).split('.')
  const resto = d.replace(/0+$/, '')
  const s = `${miles(e)}${resto ? `,${resto}` : ''}`
  return n < 0 && s !== '0' ? `-${s}` : s
}

// 9.870 · 18,4 mil · 1,2 M (hasta 9.999 va completo)
export function compacto(n: number): string {
  const a = Math.abs(n)
  if (a < 10_000) return entero(n)
  if (Math.round(a / 100) < 10_000) return `${decimal(n / 1000)} mil`
  return `${decimal(n / 1_000_000)} M`
}

// ₡455,44
export function colones(n: number): string {
  const [e, d] = Math.abs(n).toFixed(2).split('.')
  return `₡${miles(e)},${d}`
}

// '17:42' y ':08' (los segundos van aparte, más tenues)
export function reloj(ahora: Date): { hora: string; segundos: string } {
  const d = enCR(ahora)
  return { hora: `${dos(d.getUTCHours())}:${dos(d.getUTCMinutes())}`, segundos: `:${dos(d.getUTCSeconds())}` }
}

// 'Vie 30 oct 2026'
export function fechaCabecera(ahora: Date): string {
  const d = enCR(ahora)
  return `${mayuscula(DIAS[d.getUTCDay()].slice(0, 3))} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

// 'Viernes 30'
export function tituloDia(ahora: Date): string {
  const d = enCR(ahora)
  return `${mayuscula(DIAS[d.getUTCDay()])} ${d.getUTCDate()}`
}

// '1 oct' (de un día AAAA-MM-DD)
export function diaCorto(dia: string): string {
  const [, mes, d] = dia.split('-').map(Number)
  return `${d} ${MESES[mes - 1]}`
}

// '28 oct · 10:00'
export function diaYHora(instante: string): string {
  return `${diaCorto(diaCR(instante))} · ${horaCR(instante)}`
}

// '10:00'
export const hora = (instante: string) => horaCR(instante)

// Hace cuánto: 'ahora', '2 min', '1 h', '3 d'
export function hace(instante: string, ahora: Date): string {
  const minutos = Math.floor((ahora.getTime() - Date.parse(instante)) / 60_000)
  if (!Number.isFinite(minutos) || minutos < 1) return 'ahora'
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `${horas} h`
  return `${Math.floor(horas / 24)} d`
}

// '$1.500' (sin centavos)
export const dolares = (n: number) => `$${entero(n)}`

// '44%' (de a sobre b); null si b es cero
export function porcentaje(a: number, b: number): string | null {
  return b > 0 ? `${Math.round((a / b) * 100)}%` : null
}

const diaUtc = (dia: string) => new Date(`${dia}T12:00:00Z`)

// 'Viernes 30' (de un día AAAA-MM-DD)
export function tituloDeDia(dia: string): string {
  const d = diaUtc(dia)
  return `${mayuscula(DIAS[d.getUTCDay()])} ${d.getUTCDate()}`
}

// 'Hoy', 'Mañana' o 'Dom 1 nov'
export function nombreDia(dia: string, hoy: string): string {
  if (dia === hoy) return 'Hoy'
  const manana = new Date(Date.parse(`${hoy}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
  if (dia === manana) return 'Mañana'
  const d = diaUtc(dia)
  return `${mayuscula(DIAS[d.getUTCDay()].slice(0, 3))} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`
}

// 00:41 (del audio)
export function minutosYSegundos(segundos: number): string {
  const s = Number.isFinite(segundos) ? Math.max(0, Math.floor(segundos)) : 0
  return `${dos(Math.floor(s / 60))}:${dos(s % 60)}`
}
