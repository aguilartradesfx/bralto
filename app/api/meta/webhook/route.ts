import { NextResponse } from 'next/server'
import { firmaValida, leerEventos, respuestaVerificacion } from '@/lib/meta/webhook'
import { createServiceClient } from '@/lib/supabase/service'

// La puerta de los avisos de Meta (webhooks) a la app «Bralto.io». En el panel de Meta va como
// https://www.bralto.io/api/meta/webhook con el token META_WEBHOOK_VERIFY_TOKEN. Por ahora solo guarda:
// cada comentario o mensaje queda en meta_eventos y nada se contesta desde aquí.
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

  const eventos = leerEventos(aviso)
  if (eventos.length > 0) {
    const { error } = await createServiceClient().from('meta_eventos').insert(eventos)
    // Con un 500 Meta lo vuelve a mandar más tarde: así no se pierde nada si Supabase falla un rato
    if (error) {
      console.error('[meta/webhook] no se pudieron guardar los avisos', error.message)
      return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 })
    }
  }
  return NextResponse.json({ ok: true, eventos: eventos.length })
}
