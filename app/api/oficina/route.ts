import { NextResponse } from 'next/server'
import { leerOficina } from '@/lib/oficina/servidor'
import { requireApiPermission } from '@/lib/panel-session'

// La foto de la Oficina de Knox: se pide al abrirla y mientras está abierta. Solo administradores
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  try {
    return NextResponse.json(await leerOficina(new Date()), { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[oficina] leer:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo leer la oficina. Prueba de nuevo en un rato.' }, { status: 500 })
  }
}
