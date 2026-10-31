import { ghlFetchLocation } from '@/lib/ghl/client'
import { diaCr, inicioDelDia, sumarDias } from '../fechas'
import type { Cita } from '../tipos'

// Sin usar: las citas ahora salen de Google Calendar (fuentes/google.ts). Se deja por si hay que volver.
// Mientras exista GoHighLevel: ahí están las citas del diagnóstico. Los mensajes ya se leen de Zernio.
// Usa el mismo cliente que la agenda del sitio, que es el que renueva el token.
const LOC = process.env.HIGHLEVEL_BRALTO_LOCATION_ID ?? 'hdVpvshZP3RGJQbxx8GA'

// Citas de hoy y mañana en el calendario del diagnóstico
export async function agenda(ahora: Date): Promise<Cita[]> {
  const calendario = process.env.HIGHLEVEL_BRALTO_CALENDAR_ID
  if (!calendario) throw new Error('falta HIGHLEVEL_BRALTO_CALENDAR_ID')
  const hoy = diaCr(ahora)
  const desde = inicioDelDia(hoy).getTime()
  const hasta = inicioDelDia(sumarDias(hoy, 2)).getTime()
  const j = await ghlFetchLocation<{ events?: { title?: string; startTime: string; appointmentStatus?: string; deleted?: boolean }[] }>(
    LOC,
    `/calendars/events?locationId=${LOC}&calendarId=${calendario}&startTime=${desde}&endTime=${hasta}`,
  )
  return (j.events ?? [])
    .filter((e) => !e.deleted && e.appointmentStatus !== 'cancelled' && e.appointmentStatus !== 'invalid')
    .map((e) => ({ titulo: (e.title ?? 'Cita').trim(), inicio: new Date(e.startTime).toISOString() }))
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
}
