import { NextResponse } from 'next/server'
import { firmar, leerDestinos, repartir } from '@/lib/meta/reparto'
import { firmaValida, leerEventos, respuestaVerificacion } from '@/lib/meta/webhook'
import { createServiceClient } from '@/lib/supabase/service'

// La puerta de los avisos de Meta (webhooks) a la app «Bralto.io». En el panel de Meta va como
// https://www.bralto.io/api/meta/webhook con el token META_WEBHOOK_VERIFY_TOKEN. Lo de las cuentas de
// un cliente se le pasa a su sitio (META_REENVIOS); lo de Bralto solo se guarda en meta_eventos y nada
// se contesta desde aquí.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Meta comprueba la dirección con un GET antes de mandar avisos
export function GET(request: Request) {
  const challenge = respuestaVerificacion(new URL(request.url).searchParams, process.env.META_WEBHOOK_VERIFY_TOKEN ?? '')
  if (challenge === null) return new NextResponse('Token inválido', { status: 403 })
  return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } })
}

export async function POST(request: Request) {
  const secreto = process.env.META_APP_SECRET
  if (!secreto) {
    console.error('[meta/webhook] falta META_APP_SECRET: no se puede revisar la firma de Meta')
    return NextResponse.json({ error: 'No disponible' }, { status: 503 })
  }

  const cuerpo = await request.text()
  if (!firmaValida(cuerpo, request.headers.get('x-hub-signature-256'), secreto)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  let aviso: unknown = null
  try {
    aviso = JSON.parse(cuerpo)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Primero lo de los clientes (META_REENVIOS): si el sitio de un cliente no lo recibe, 500 y Meta vuelve
  // a mandar todo más tarde. Así no se guarda nada de Bralto dos veces; el cliente ignora lo repetido.
  const { envios, resto } = repartir(aviso, leerDestinos(process.env.META_REENVIOS))
  for (const { destino, aviso: suyo } of envios) {
    if (!(await reenviar(destino.url, JSON.stringify(suyo), secreto))) {
      console.error(`[meta/webhook] ${destino.nombre} no recibió su aviso: Meta lo va a reintentar`)
      return NextResponse.json({ error: 'No se pudo reenviar' }, { status: 500 })
    }
  }

  const eventos = leerEventos(resto)
  if (eventos.length > 0) {
    const { error } = await createServiceClient().from('meta_eventos').insert(eventos)
    // Con un 500 Meta lo vuelve a mandar más tarde: así no se pierde nada si Supabase falla un rato
    if (error) {
      console.error('[meta/webhook] no se pudieron guardar los avisos', error.message)
      return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 })
    }
  }
  return NextResponse.json({ ok: true, eventos: eventos.length, reenviados: envios.length })
}

// Se le pasa al cliente con la misma firma que pondría Meta (misma clave de la app)
async function reenviar(url: string, cuerpo: string, secreto: string): Promise<boolean> {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': firmar(cuerpo, secreto) },
      body: cuerpo,
      signal: AbortSignal.timeout(10_000),
    })
    if (!r.ok) console.error(`[meta/webhook] ${url} contestó ${r.status}`)
    return r.ok
  } catch (e) {
    console.error(`[meta/webhook] ${url} no contestó`, e instanceof Error ? e.message : e)
    return false
  }
}
