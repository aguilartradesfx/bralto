// Qué horarios ofrece la agenda del diagnóstico. Puro, con pruebas (reglas.test.ts).
// Del sitio: las cuatro horas fijas de Costa Rica y los cinco días hábiles desde mañana (lib/diagnostic).
// Del calendario de GoHighLevel, copiado el 30/10/2026 (antes lo decidía él):
// - 12 horas de anticipación como mínimo;
// - 10 minutos libres antes de cada llamada: algo que termina a las 8:55 ocupa la de las 9.
// Su horario de atención no quitaba ninguna de las cuatro horas (daba de 8 a. m. a 7 p. m., de lunes a viernes).
import { bookableDays } from '../diagnostic/days.ts'
import { slotStart, TIME_SLOT_IDS } from '../diagnostic/slots.ts'

export const ZONA = 'America/Costa_Rica'
export const DURACION_MIN = 30
export const ANTICIPACION_HORAS = 12
export const MARGEN_ANTES_MIN = 10

const MIN = 60_000

/** Un rato ocupado en algún calendario (ms) */
export type Ocupado = { inicio: number; fin: number }

/** Cuándo empieza y termina la llamada de un horario ("2026-11-06-9am") */
export function inicioYFin(slot: string): Ocupado {
  const inicio = slotStart(slot)
  return { inicio, fin: inicio + DURACION_MIN * MIN }
}

/** Los horarios que se pueden ofrecer, sin mirar calendarios: días hábiles por horas fijas, con la anticipación mínima */
export function horariosPosibles(ahora: number): string[] {
  const limite = ahora + ANTICIPACION_HORAS * 60 * MIN
  return bookableDays(ahora)
    .flatMap((dia) => TIME_SLOT_IDS.map((id) => `${dia}-${id}`))
    .filter((slot) => slotStart(slot) >= limite)
}

/** Si un horario choca con algo ocupado, contando el margen de antes */
export function choca(slot: string, ocupados: Ocupado[]): boolean {
  const { inicio, fin } = inicioYFin(slot)
  const desde = inicio - MARGEN_ANTES_MIN * MIN
  return ocupados.some((o) => o.inicio < fin && o.fin > desde)
}

/** Los horarios posibles que no chocan con nada */
export function horariosLibres(ahora: number, ocupados: Ocupado[]): string[] {
  return horariosPosibles(ahora).filter((slot) => !choca(slot, ocupados))
}

/** Lo que hay que preguntarle a los calendarios para revisar esos horarios (con el margen); null si no hay ninguno */
export function rangoDe(slots: string[]): Ocupado | null {
  if (!slots.length) return null
  const inicios = slots.map(slotStart)
  return { inicio: Math.min(...inicios) - MARGEN_ANTES_MIN * MIN, fin: Math.max(...inicios) + DURACION_MIN * MIN }
}

/** "2026-11-06T09:00:00-06:00": la hora de Costa Rica, que no cambia de horario (siempre UTC-6) */
export function horaCr(ms: number): string {
  return `${new Date(ms - 6 * 60 * MIN).toISOString().slice(0, 19)}-06:00`
}
