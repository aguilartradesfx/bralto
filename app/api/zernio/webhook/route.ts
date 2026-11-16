import { NextResponse, after } from 'next/server'
import { firmaValida } from '@/lib/crm/bandeja/firma'
import { procesarWebhook } from '@/lib/crm/bandeja/servidor'
import { sumarEcho } from '@/lib/oficina/envoltorio'

// El webhook de la bandeja de Zernio (Instagram, Messenger y WhatsApp). Revisa la firma con ZERNIO_WEBHOOK_SECRET,
// contesta 200 al instante (Zernio espera menos de 5 s) y procesa después: guardar, y que Knox espere la ráfaga y
// decida. /api/* pasa en todos los hosts (lib/host-routing.ts) y el middleware no lo toca.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Zernio reintenta hasta 7 veces con el mismo id: los que ya pasaron por esta instancia ni se miran (lo que de verdad
// evita repetir es el unique del mensaje en la base)
const vistos = new Set<string>()
const MAX_VISTOS = 500

export async function POST(request: Request) {
  const crudo = Buffer.from(await request.arrayBuffer())
  if (!firmaValida(crudo, request.headers.get('x-zernio-signature'), process.env.ZERNIO_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }
  let cuerpo: { id?: unknown; event?: unknown }
  try {
    cuerpo = JSON.parse(crudo.toString('utf8'))
  } catch {
    return NextResponse.json({ error: 'El cuerpo no es JSON' }, { status: 400 })
  }
  const id = request.headers.get('x-zernio-event-id') ?? (typeof cuerpo?.id === 'string' ? cuerpo.id : null)
  const evento = typeof cuerpo?.event === 'string' ? cuerpo.event : 'sin evento'
  if (id && vistos.has(id)) return NextResponse.json({ ok: true, repetido: true })
  if (id) {
    vistos.add(id)
    if (vistos.size > MAX_VISTOS) vistos.delete(vistos.values().next().value as string)
  }

  // Echo sigue despierto aunque la oficina duerma: cada comentario recibido suma a su marca de la hora (nunca lanza)
  if (evento === 'comment.received') after(() => sumarEcho())
  after(async () => {
    try {
      console.log(`[zernio] ${evento} ${id ?? ''}: ${await procesarWebhook(cuerpo)}`)
    } catch (err) {
      // Ya se contestó 200: si algo falla aquí, queda en el registro
      if (id) vistos.delete(id)
      console.error(`[zernio] ${evento} ${id ?? ''} falló:`, err instanceof Error ? err.message : err)
    }
  })
  return NextResponse.json({ ok: true })
}
