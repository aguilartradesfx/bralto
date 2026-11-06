import { NextResponse } from 'next/server'
import { correrPruebas } from '@/lib/redes/pruebas/servidor'

// Los reels de prueba (Vercel Cron cada hora): cuando las 5 versiones de un reel cumplen 72 h, elige la ganadora,
// borra las demás, saca la ganadora en Facebook y avisa por Telegram para compartirla con los seguidores.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const r = await correrPruebas()
    console.log('[pruebas]', JSON.stringify(r))
    return NextResponse.json(r)
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err)
    console.error('[pruebas]', motivo)
    return NextResponse.json({ ok: false, error: motivo }, { status: 500 })
  }
}
