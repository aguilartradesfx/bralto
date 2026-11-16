import { NextResponse } from 'next/server'
import { generarReporte } from '@/lib/knox/reporte'
import { conOficina, cuerpoDe } from '@/lib/oficina/envoltorio'
import { resumenReporte } from '@/lib/oficina/resumenes'

// Knox prepara el reporte del día a las 6:00 de Costa Rica (Vercel Cron), así al abrir el panel ya está
// listo para hablar.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const o = await conOficina('knox', async () => {
    const r = await generarReporte()
    const resumen = { id: r.id, fecha: r.fecha, escritoPor: r.escritoPor, conAudio: r.conAudio, faltan: r.datos.faltan, secciones: r.secciones.length }
    console.log('[knox]', JSON.stringify(resumen))
    return { ...resumenReporte(), detalle: resumen }
  }, { inicio: 'Preparando el reporte de la mañana' })
  return NextResponse.json(cuerpoDe(o))
}
