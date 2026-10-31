// La cola de citas por crear: diagnósticos pagados que Google no dejó agendar. Qué hacer con cada una en el barrido
// y cuándo volver a avisar. Puro, con pruebas (cola.test.ts); Redis lo maneja servidor.ts.
import type { DiagnosticBooking } from '../diagnostic/diagnostic.ts'
import { inicioYFin } from './reglas.ts'

export type Pendiente = {
  ref: string
  booking: DiagnosticBooking
  creadoEn: number
  intentos: number // los que fallaron
  avisadoEn?: number // último aviso a Alejandro
  error?: string
}

// Mientras siga sin cita, se le vuelve a avisar cada 2 horas
export const AVISAR_CADA_MS = 2 * 3_600_000
// Las de menos de 2 minutos pueden estar creándose todavía
export const ESPERA_MS = 2 * 60_000

/** Recién pagada, antes de ir a Google: si la función se corta a la mitad, el barrido la termina */
export function nuevaPendiente(ref: string, booking: DiagnosticBooking, ahora: number): Pendiente {
  return { ref, booking, creadoEn: ahora, intentos: 0 }
}

/** Google falló y ya se le avisó a Alejandro (avisarSinCita) */
export function trasElAviso(previa: Pendiente | null, ref: string, booking: DiagnosticBooking, ahora: number, error?: string): Pendiente {
  return { ref, booking, creadoEn: previa?.creadoEn ?? ahora, intentos: (previa?.intentos ?? 0) + 1, avisadoEn: ahora, error }
}

/** En el barrido: si ya empezó la hora de la llamada no se crea (Alejandro le escribe); si no, se reintenta */
export function queHacer(p: Pendiente, ahora: number): 'vencida' | 'reintentar' {
  return inicioYFin(p.booking.slot).inicio <= ahora ? 'vencida' : 'reintentar'
}

/** Un reintento que falló: cuenta el intento y dice si toca avisar (el primero o, si ya se avisó, el recordatorio) */
export function trasFallar(p: Pendiente, ahora: number, error: string): { pendiente: Pendiente; aviso: 'primero' | 'recordatorio' | null } {
  const aviso = !p.avisadoEn ? 'primero' : ahora - p.avisadoEn >= AVISAR_CADA_MS ? 'recordatorio' : null
  return { pendiente: { ...p, intentos: p.intentos + 1, error, ...(aviso ? { avisadoEn: ahora } : {}) }, aviso }
}

/** Una que se logró después de fallar se avisa como resuelta; si nunca falló, como una cita nueva */
export const yaHabiaFallado = (p: Pendiente) => p.intentos > 0
