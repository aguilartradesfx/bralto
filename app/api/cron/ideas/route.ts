import { NextResponse } from 'next/server'
import { procesarCola } from '@/lib/ideas/servidor'

// «Ideas» (Vercel Cron cada 5 minutos): analiza lo que quedó pendiente al pegar y reintenta lo que falló
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const r = await procesarCola({ limite: 6 })
    console.log('[ideas]', JSON.stringify(r))
    return NextResponse.json(r)
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err)
    console.error('[ideas]', motivo)
    return NextResponse.json({ ok: false, error: motivo }, { status: 500 })
  }
}
