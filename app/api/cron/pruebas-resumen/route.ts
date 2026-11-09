import { NextResponse } from 'next/server'
import { mandarResumen } from '@/lib/redes/pruebas/servidor'

// El resumen de los domingos (Vercel Cron, 9:00 de Costa Rica): qué gancho y qué hora ganan en las pruebas, con una
// propuesta que Alejandro aprueba o no. No cambia nada solo.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const r = await mandarResumen()
    console.log('[pruebas-resumen]', JSON.stringify(r))
    return NextResponse.json(r)
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err)
    console.error('[pruebas-resumen]', motivo)
    return NextResponse.json({ ok: false, error: motivo }, { status: 500 })
  }
}
