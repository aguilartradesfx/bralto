// Fechas del plan en hora de Costa Rica (UTC−6 todo el año, sin horario de verano). Fechas como 'AAAA-MM-DD'.

const CR_OFFSET_MS = 6 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

export function costaRicaToday(now: Date = new Date()): string {
  return new Date(now.getTime() - CR_OFFSET_MS).toISOString().slice(0, 10)
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

// Lunes de la semana de `date`
export function weekStart(date: string): string {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay() // 0 = domingo
  return addDays(date, dow === 0 ? -6 : 1 - dow)
}

// Domingo de la semana de `date`
export function weekEnd(date: string): string {
  return addDays(weekStart(date), 6)
}

export function isMonday(date: string): boolean {
  return isValidDate(date) && weekStart(date) === date
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS)
}

// '2026-10-16' → '16 oct'
export function formatFecha(date: string): string {
  const [, month, day] = date.split('-').map(Number)
  return `${day} ${MESES[month - 1]}`
}

// Marca de tiempo en hora CR: '13 oct, 14:05'
export function formatStamp(iso: string): string {
  const cr = new Date(Date.parse(iso) - CR_OFFSET_MS).toISOString()
  return `${formatFecha(cr.slice(0, 10))}, ${cr.slice(11, 16)}`
}

export function diasTexto(dias: number): string {
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'mañana'
  return `en ${dias} días`
}
