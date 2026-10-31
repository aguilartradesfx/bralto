import { citasDeGoogle } from '@/lib/agenda/servidor'
import { diaCr, inicioDelDia, sumarDias } from '../fechas'
import type { Cita } from '../tipos'

// Las citas de Alejandro salen de Google Calendar: la agenda de Bralto (donde caen los diagnósticos con Meet) y su
// calendario personal. Reemplaza a fuentes/ghl.ts, que leía el calendario de GoHighLevel.

// Citas de hoy y mañana (días de Costa Rica)
export async function agenda(ahora: Date): Promise<Cita[]> {
  const hoy = diaCr(ahora)
  return citasDeGoogle(inicioDelDia(hoy), inicioDelDia(sumarDias(hoy, 2)))
}
