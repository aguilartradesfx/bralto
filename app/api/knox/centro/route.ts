import { NextResponse } from 'next/server'
import { leerCentro } from '@/lib/knox/centro/servidor'
import { requireApiPermission } from '@/lib/panel-session'

// Los datos del Centro de mando de Knox (/knox). La pantalla pregunta cada 60 s. Solo administradores
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  try {
    return NextResponse.json({ centro: await leerCentro(new Date()) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[knox-centro]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudieron leer los datos. Prueba de nuevo en un rato.' }, { status: 500 })
  }
}
