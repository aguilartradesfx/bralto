// Las citas que Knox cuenta, a partir de los eventos de los calendarios de Google: solo las que tienen hora (no las de
// todo el día), ni canceladas ni rechazadas, sin los bloques automáticos (fuera de la oficina, concentración, dónde
// trabaja) y sin repetir la que aparece en los dos calendarios. Puro, con pruebas (eventos.test.ts).
import type { EventoGoogle } from './google.ts'

export type CitaDeCalendario = { titulo: string; inicio: string }

const TIPOS = new Set(['default', 'fromGmail'])

export function citasDeEventos(listas: EventoGoogle[][]): CitaDeCalendario[] {
  const vistas = new Set<string>()
  const citas: CitaDeCalendario[] = []
  for (const e of listas.flat()) {
    const hora = e.start?.dateTime
    if (!hora || e.status === 'cancelled') continue
    if (e.eventType && !TIPOS.has(e.eventType)) continue
    if (e.attendees?.some((a) => a.self && a.responseStatus === 'declined')) continue
    const inicio = new Date(hora).toISOString()
    const clave = `${e.iCalUID ?? e.id}|${inicio}`
    if (vistas.has(clave)) continue
    vistas.add(clave)
    citas.push({ titulo: e.summary?.trim() || 'Cita', inicio })
  }
  return citas.sort((a, b) => a.inicio.localeCompare(b.inicio))
}
