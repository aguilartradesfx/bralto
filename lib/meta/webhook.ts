import { createHmac, timingSafeEqual } from 'node:crypto'

// La puerta de los avisos de Meta (webhooks) a la app «Bralto.io»: comentarios y mensajes de Instagram
// y Facebook, y mensajes de WhatsApp. Aquí solo va lo que no tiene conexiones (con pruebas en
// webhook.test.ts); la ruta es app/api/meta/webhook/route.ts.

// Meta firma el cuerpo exacto con la clave secreta de la app: «X-Hub-Signature-256: sha256=<hex>»
export function firmaValida(cuerpo: string, firma: string | null, secreto: string): boolean {
  if (!firma?.startsWith('sha256=') || !secreto) return false
  const recibida = Buffer.from(firma.slice('sha256='.length), 'hex')
  const esperada = createHmac('sha256', secreto).update(cuerpo).digest()
  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada)
}

// Al configurar la dirección en el panel de Meta, Meta pide un GET con hub.challenge: se devuelve tal
// cual solo si el token es el que pusimos (META_WEBHOOK_VERIFY_TOKEN)
export function respuestaVerificacion(params: URLSearchParams, token: string): string | null {
  if (!token) return null
  if (params.get('hub.mode') !== 'subscribe' || params.get('hub.verify_token') !== token) return null
  return params.get('hub.challenge')
}

export type Evento = {
  objeto: string // instagram, page o whatsapp_business_account
  cuenta: string // el id de la cuenta de Instagram, la página o la cuenta de WhatsApp
  campo: string // comments, messages, feed…; los mensajes de Instagram y Messenger llegan como «messaging»
  datos: unknown
}

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

// Un aviso trae varias «entry», y cada una cambios (changes) o mensajes (messaging): uno por fila
export function leerEventos(aviso: unknown): Evento[] {
  if (!esObjeto(aviso) || typeof aviso.object !== 'string' || !Array.isArray(aviso.entry)) return []
  const objeto = aviso.object
  const eventos: Evento[] = []
  for (const entry of aviso.entry) {
    if (!esObjeto(entry)) continue
    const cuenta = String(entry.id ?? '')
    if (Array.isArray(entry.changes)) {
      for (const c of entry.changes) {
        if (esObjeto(c) && typeof c.field === 'string') eventos.push({ objeto, cuenta, campo: c.field, datos: c.value ?? null })
      }
    }
    if (Array.isArray(entry.messaging)) {
      for (const m of entry.messaging) if (esObjeto(m)) eventos.push({ objeto, cuenta, campo: 'messaging', datos: m })
    }
  }
  return eventos
}
