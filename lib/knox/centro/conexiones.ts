// Cómo se dice el estado de cada conexión del Centro de mando (Hoy y la vista Conexiones). Puro, con pruebas.
import { entero } from './formato.ts'
import type { Conexion, EstadoChequeo } from './tipos.ts'

const MIN = 60_000
const HORA = 60 * MIN
const DIA = 24 * HORA

// 'hace un momento', 'hace 5 min', 'hace 2 h', 'hace 3 días'
export function haceLargo(instante: string, ahora: Date): string {
  const ms = ahora.getTime() - Date.parse(instante)
  if (!Number.isFinite(ms) || ms < MIN) return 'hace un momento'
  if (ms < HORA) return `hace ${Math.floor(ms / MIN)} min`
  if (ms < DIA) return `hace ${Math.floor(ms / HORA)} h`
  const dias = Math.floor(ms / DIA)
  return dias === 1 ? 'hace 1 día' : `hace ${dias} días`
}

// El correo de Hoy: «Conectado (2)» si responden las dos cuentas de Google; si responde una sola, se nota
export function estadoCorreo(cuentas: { ok: boolean }[]): { estado: Conexion; conectadas: number; total: number } {
  const total = cuentas.length
  const conectadas = cuentas.filter((c) => c.ok).length
  return { estado: total === 0 ? 'por-conectar' : conectadas === total ? 'conectado' : 'caido', conectadas, total }
}

export function etiquetaCorreo(c: { conectadas: number; total: number } | null | undefined): string | null {
  if (!c || c.total === 0) return null
  if (c.conectadas === c.total) return `Conectado (${c.conectadas})`
  return c.conectadas > 0 ? `${c.conectadas} de ${c.total}` : null
}

// La bandeja de Zernio: lo último que entró por el webhook. Más de dos días sin nada es raro: se avisa
const BANDEJA_QUIETA_MS = 2 * DIA

export function estadoBandeja(ultimo: string | null, ahora: Date): { estado: EstadoChequeo; detalle: string } {
  if (!ultimo) return { estado: 'por-conectar', detalle: 'Todavía no entró ningún mensaje' }
  const quieta = ahora.getTime() - Date.parse(ultimo) > BANDEJA_QUIETA_MS
  return { estado: quieta ? 'caido' : 'conectado', detalle: `Último mensaje ${haceLargo(ultimo, ahora)}` }
}

// La voz: los caracteres del mes
export function detalleVoz(usado: number, limite: number): string {
  return `${entero(usado)} de ${entero(limite)} caracteres este mes`
}

export function cuantasCuentas(n: number, que: string): string {
  return `Ve ${n} ${n === 1 ? 'cuenta' : 'cuentas'} ${que}`
}

export const ESTADO_CHEQUEO: Record<EstadoChequeo, string> = {
  conectado: 'Conectado',
  caido: 'Revisar',
  'por-conectar': 'Por conectar',
  'se-va': 'Se va a apagar',
}

// Un error de afuera nunca se muestra tal cual (puede traer enlaces con claves): solo si fue el tiempo o no
export function motivo(err: unknown): string {
  const m = err instanceof Error ? err.message : ''
  return /no respondió en/.test(m) ? 'No respondió a tiempo' : 'No respondió'
}
