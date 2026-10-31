import { NextResponse } from 'next/server'
import { esVistaConDatos } from '@/lib/knox/centro/vistas/tipos'
import { leerVistaDelCentro } from '@/lib/knox/centro/vistas/servidor'
import { requireApiPermission } from '@/lib/panel-session'

// Los datos de una vista del Centro de mando (ventas, redes, agenda o conexiones): se piden al abrirla y cada minuto
// mientras está abierta. Solo administradores
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(_request: Request, { params }: { params: Promise<{ nombre: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const { nombre } = await params
  if (!esVistaConDatos(nombre)) return NextResponse.json({ error: 'Esa vista no existe' }, { status: 404 })
  try {
    return NextResponse.json({ vista: nombre, datos: await leerVistaDelCentro(nombre, new Date()) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[knox-centro] vista:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudieron leer los datos. Prueba de nuevo en un rato.' }, { status: 500 })
  }
}
