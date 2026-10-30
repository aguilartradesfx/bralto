import type { Conversaciones } from './tipos.ts'

// La bandeja de Zernio (Instagram, Messenger y WhatsApp, desde el 29/10): Knox solo habla de lo que espera
// respuesta y es de los últimos 7 días. Lo más viejo ya no se puede contestar desde la cuenta (Meta da 7 días)
// y nombrarlo como si fuera de hoy confunde.
const DIAS = 7
const MAX_ULTIMAS = 12 // el escritor elige cuáles son de trabajo; los mensajes personales no se citan

export type ConversacionZernio = {
  platform?: string
  participantName?: string
  participantUsername?: string
  lastMessage?: string | { text?: string } | null
  updatedTime?: string
  unreadCount?: number
}

const CANAL: Record<string, string> = { instagram: 'Instagram', facebook: 'Messenger', whatsapp: 'WhatsApp' }

const texto = (c: ConversacionZernio) => {
  const t = (typeof c.lastMessage === 'string' ? c.lastMessage : c.lastMessage?.text) ?? ''
  return t.trim() === '[Attachment]' ? '(mandó un archivo o una foto)' : t.slice(0, 160)
}

export function resumirBandeja(lista: ConversacionZernio[], ahora: Date): Conversaciones {
  const desde = ahora.getTime() - DIAS * 24 * 3600_000
  const pendientes = lista
    .filter((c) => (c.unreadCount ?? 0) > 0 && Date.parse(c.updatedTime ?? '') >= desde)
    .sort((a, b) => Date.parse(b.updatedTime ?? '') - Date.parse(a.updatedTime ?? ''))
  const canal = (c: ConversacionZernio) => CANAL[c.platform ?? ''] ?? 'otros canales'
  const porCanal: Record<string, number> = {}
  for (const c of pendientes) porCanal[canal(c)] = (porCanal[canal(c)] ?? 0) + 1
  return {
    sinLeer: pendientes.length,
    porCanal,
    ultimas: pendientes.slice(0, MAX_ULTIMAS).map((c) => ({
      nombre: (c.participantName || c.participantUsername || 'Alguien').trim(),
      canal: canal(c),
      texto: texto(c),
      en: c.updatedTime,
    })),
  }
}
