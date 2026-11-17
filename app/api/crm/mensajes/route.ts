import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { leerCuantas, leerVista } from '@/lib/crm/bandeja/vista'
import { leerListaBandeja } from '@/lib/crm/bandeja/servidor'

export const dynamic = 'force-dynamic'

// La lista de la bandeja (?filtro=…&red=…&q=…&cuantas=…) con los números de arriba. La pide la pantalla de Mensajes
// al cambiar un filtro y cada pocos segundos, para que lo nuevo aparezca solo. Solo administradores
export async function GET(request: Request) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const p = new URL(request.url).searchParams
  try {
    return NextResponse.json(await leerListaBandeja(leerVista(p), leerCuantas(p.get('cuantas') ?? undefined)), { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[bandeja] no se pudo leer la lista:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo cargar la bandeja. Prueba de nuevo.' }, { status: 500 })
  }
}
