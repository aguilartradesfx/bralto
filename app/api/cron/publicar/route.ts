import { NextResponse } from 'next/server'
import { correrCola, probar } from '@/lib/redes/publicacion/servidor'
import { conOficina, cuerpoDe, marcarPublicadas, titulosPublicados } from '@/lib/oficina/envoltorio'

// Publica lo programado en redes (Vercel Cron cada 5 minutos): carruseles y reels de Instagram con su
// collab, su «Comenta» y sus historias, y lo mismo en Facebook. Así salen a su hora sin depender de una
// compu prendida. ?probar=<id> arma el contenedor de esa publicación sin publicar nada.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Con ?probar sin id no corre la cola de verdad: pudo ser una variable vacía en una prueba
  const params = new URL(req.url).searchParams
  if (params.has('probar') && !params.get('probar')) return NextResponse.json({ error: 'falta el id en ?probar=' }, { status: 400 })
  const id = params.get('probar')
  if (id) {
    const r = await probar(id)
    console.log('[publicar]', JSON.stringify(r))
    return NextResponse.json(r)
  }
  const o = await conOficina('zap', async () => {
    const x = await correrCola()
    const n = titulosPublicados(x).length
    // Las marcas de Zap y Tiko salen de lo que devolvió la cola, después de publicar; nunca afectan la respuesta
    const tt = n > 0 ? await marcarPublicadas(x) : 0
    const resumen = `Publicó ${n} ${n === 1 ? 'post' : 'posts'}${tt > 0 ? ` y agendó ${tt} en TikTok` : ''}`
    return { hizo: n > 0, resumen, detalle: x }
  })
  const r = cuerpoDe(o)
  console.log('[publicar]', JSON.stringify(r))
  return NextResponse.json(r)
}
