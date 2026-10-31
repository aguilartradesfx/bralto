import { NextResponse } from 'next/server'
import { leerIds } from '@/lib/knox/centro/aprobar'
import { aprobarDesdeElCentro } from '@/lib/knox/centro/servidor'
import { requireApiPermission } from '@/lib/panel-session'

// «Sí, escríbeles» en el Centro de mando: { ids } son las respuestas de Knox que Ale aprobó. Cada una sale con el
// mismo «Enviar» del borrador en la bandeja, solo si sigue pendiente y dentro de las 24 horas. Solo administradores
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: Request) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const ids = leerIds(await request.json().catch(() => null))
  if (!ids) return NextResponse.json({ error: 'Faltan las respuestas para mandar' }, { status: 400 })
  try {
    return NextResponse.json(await aprobarDesdeElCentro(ids))
  } catch (err) {
    console.error('[knox-centro] aprobar:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudieron mandar. Prueba desde Mensajes.' }, { status: 500 })
  }
}
