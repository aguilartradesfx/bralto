// Los tres turnos de la tertulia (hora de Costa Rica): cuándo corre cada uno y hasta cuándo salen sus líneas.
// La mañana corre a las 8:30 y sus líneas salen hasta las 12:30; el mediodía, de 12:30 a 4:00 p. m.; la tarde, de 4:00 a
// 6:30 p. m. El servidor no le dice al script qué turno es: lo sabe por la hora.
import type { Turno } from './tipos.ts'
import { aLaHoraCR, horaDecimalCR } from './horario.ts'

export type { Turno }

// de: cómo se dice «la tertulia de…» (del mediodía, no «de el mediodía»)
export const TURNOS: Record<Turno, { corre: [number, number], hasta: [number, number], nombre: string, de: string }> = {
  manana: { corre: [8, 30], hasta: [12, 30], nombre: 'la mañana', de: 'de la mañana' },
  mediodia: { corre: [12, 30], hasta: [16, 0], nombre: 'el mediodía', de: 'del mediodía' },
  tarde: { corre: [16, 0], hasta: [18, 30], nombre: 'la tarde', de: 'de la tarde' },
}

// En el orden del día
export const ORDEN_TURNOS: Turno[] = ['manana', 'mediodia', 'tarde']

// Para los textos de la página: cuándo corre la tertulia
export const HORAS_TERTULIA = 'a las 8:30 a. m., a las 12:30 p. m. y a las 4:00 p. m.'

export const esTurno = (x: unknown): x is Turno => x === 'manana' || x === 'mediodia' || x === 'tarde'

// El turno de una hora de Costa Rica: antes de las 12:30, la mañana; antes de las 4:00 p. m., el mediodía; después, la
// tarde. Fuera de hora (para probar a mano) da el turno más cercano.
export function turnoDe(ahora: Date): Turno {
  const h = horaDecimalCR(ahora)
  if (h < 12.5) return 'manana'
  if (h < 16) return 'mediodia'
  return 'tarde'
}

// Hasta cuándo salen las líneas del turno, el mismo día de Costa Rica que `ahora`
export function finDeTurno(ahora: Date, turno: Turno): Date {
  const [h, m] = TURNOS[turno].hasta
  return aLaHoraCR(ahora, h, m)
}
