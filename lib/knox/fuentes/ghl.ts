import { ghlFetchLocation } from '@/lib/ghl/client'
import { diaCr, inicioDelDia, sumarDias } from '../fechas'
import type { Cita, Conversaciones } from '../tipos'

// Mientras exista GoHighLevel: ahí entran WhatsApp, Messenger y el correo, y ahí están las citas.
// Usa el mismo cliente que la agenda del sitio, que es el que renueva el token.
const LOC = process.env.HIGHLEVEL_BRALTO_LOCATION_ID ?? 'hdVpvshZP3RGJQbxx8GA'

const CANAL: Record<string, string> = {
  TYPE_WHATSAPP: 'WhatsApp',
  TYPE_EMAIL: 'correo',
  TYPE_FACEBOOK: 'Messenger',
  TYPE_FB: 'Messenger',
  TYPE_INSTAGRAM: 'Instagram',
  TYPE_IG: 'Instagram',
  TYPE_SMS: 'SMS',
  TYPE_CALL: 'llamadas',
  TYPE_LIVE_CHAT: 'el chat del sitio',
  TYPE_WEBCHAT: 'el chat del sitio',
}

type Conversacion = {
  fullName?: string
  contactName?: string
  lastMessageType?: string
  lastMessageBody?: string
  unreadCount?: number
}

export async function conversaciones(): Promise<Conversaciones> {
  const j = await ghlFetchLocation<{ conversations?: Conversacion[] }>(
    LOC,
    `/conversations/search?locationId=${LOC}&status=unread&limit=50&sortBy=last_message_date&sort=desc`,
  )
  const lista = (j.conversations ?? []).filter((c) => (c.unreadCount ?? 0) > 0)
  const canal = (c: Conversacion) => CANAL[c.lastMessageType ?? ''] ?? 'otros canales'
  const porCanal: Record<string, number> = {}
  for (const c of lista) porCanal[canal(c)] = (porCanal[canal(c)] ?? 0) + 1
  return {
    sinLeer: lista.length,
    porCanal,
    ultimas: lista.slice(0, 5).map((c) => ({
      nombre: (c.fullName ?? c.contactName ?? 'Sin nombre').trim(),
      canal: canal(c),
      texto: (c.lastMessageBody ?? '').slice(0, 160),
    })),
  }
}

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
