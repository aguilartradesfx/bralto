import { resumirBandeja, type ConversacionZernio } from '../bandeja'
import type { Conversaciones } from '../tipos'

// La bandeja de Zernio: desde el 29/10 ahí entran los mensajes de Instagram, Messenger y WhatsApp.
// GoHighLevel ya no recibe conversaciones nuevas (y se va a apagar).
export async function conversaciones(ahora: Date): Promise<Conversaciones> {
  const clave = process.env.ZERNIO_API_KEY
  if (!clave) throw new Error('falta ZERNIO_API_KEY')
  const res = await fetch('https://zernio.com/api/v1/inbox/conversations?status=active&limit=50', {
    headers: { Authorization: `Bearer ${clave}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Zernio respondió ${res.status}`)
  const j = (await res.json()) as { data?: ConversacionZernio[] }
  return resumirBandeja(j.data ?? [], ahora)
}
