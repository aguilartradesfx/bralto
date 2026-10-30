import { NextResponse } from 'next/server'
import { correrCola, probar } from '@/lib/redes/publicacion/servidor'

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
  const id = new URL(req.url).searchParams.get('probar')
  const r = id ? await probar(id) : await correrCola()
  console.log('[publicar]', JSON.stringify(r))
  return NextResponse.json(r)
}
