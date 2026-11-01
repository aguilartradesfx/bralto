import { NextResponse } from 'next/server'
import { prepararDia, prepararFijos } from '@/lib/knox/arranque/preparar'
import { diaCr, sumarDias } from '@/lib/knox/fechas'

// Knox deja listos la noche anterior los arranques de mañana: el saludo y lo que trae en la cabeza, ya narrados, para
// que al abrir el centro de mando suenen al instante. Vercel Cron a las 22:00 de Costa Rica. Con ?hoy prepara también
// los de hoy (el primer día, o si una noche falló).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const hoy = diaCr(new Date())
  const dias = new URL(req.url).searchParams.has('hoy') ? [hoy, sumarDias(hoy, 1)] : [sumarDias(hoy, 1)]
  const resultado: Record<string, unknown> = {}
  for (const dia of dias) {
    try {
      resultado[dia] = (await prepararDia(dia)) ?? 'ya estaban'
    } catch (err) {
      resultado[dia] = `error: ${err instanceof Error ? err.message : String(err)}`
    }
  }
  try {
    await prepararFijos()
    resultado.fijos = 'listos'
  } catch (err) {
    resultado.fijos = `error: ${err instanceof Error ? err.message : String(err)}`
  }
  console.log('[knox-arranques]', JSON.stringify(resultado))
  return NextResponse.json(resultado)
}
