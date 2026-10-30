import { NextResponse } from 'next/server'
import { diaCr } from '@/lib/knox/fechas'
import { generarReporte, ultimoReporte } from '@/lib/knox/reporte'
import { requireApiPermission } from '@/lib/panel-session'

// El reporte hablado de Knox para el Inicio del panel. Lo prepara el cron cada mañana; si todavía no hay
// uno de hoy, se arma en el momento (tarda unos segundos).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const RECIENTE_MS = 5 * 60_000

function fallo(err: unknown) {
  console.error('[knox]', err instanceof Error ? err.message : err)
  return NextResponse.json({ error: 'Knox no pudo preparar el reporte. Probá de nuevo en un rato.' }, { status: 500 })
}

export async function GET() {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  try {
    const reporte = (await ultimoReporte(diaCr(new Date()))) ?? (await generarReporte())
    return NextResponse.json({ reporte })
  } catch (err) {
    return fallo(err)
  }
}

// «Actualizar»: vuelve a juntar los datos y a narrar. Si el último tiene menos de 5 minutos, se reusa.
export async function POST() {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  try {
    const ultimo = await ultimoReporte(diaCr(new Date()))
    if (ultimo && Date.now() - new Date(ultimo.creadoEn).getTime() < RECIENTE_MS) return NextResponse.json({ reporte: ultimo })
    return NextResponse.json({ reporte: await generarReporte() })
  } catch (err) {
    return fallo(err)
  }
}
