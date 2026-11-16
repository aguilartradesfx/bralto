import { NextResponse } from 'next/server'
import { actualizarReales } from '@/lib/analisis/servidor'
import { conOficina, cuerpoDe } from '@/lib/oficina/envoltorio'
import { resumenAnalisis } from '@/lib/oficina/resumenes'

// «Análisis» (Vercel Cron, cada 6 horas): trae de Instagram los números de cada reel publicado para ponerlos al
// lado de lo que predijo Higgsfield. Lee antes de que se borren las versiones perdedoras de las pruebas (72 h)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const o = await conOficina('quark', async () => {
      const x = await actualizarReales()
      return { ...resumenAnalisis(x), detalle: x }
    }, { inicio: 'Leyendo los números de los reels' })
    const r = cuerpoDe(o)
    console.log('[analisis]', JSON.stringify(r))
    return NextResponse.json(r)
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err)
    console.error('[analisis]', motivo)
    return NextResponse.json({ ok: false, error: motivo }, { status: 500 })
  }
}
