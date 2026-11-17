import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { error, leerJson, responder } from '@/lib/crm/api'
import { ajustesKnox, cambiarKnox, leerConversacion, marcarLeidaSiEntroAlgo } from '@/lib/crm/bandeja/servidor'

export const dynamic = 'force-dynamic'

// La conversación abierta, para ponerla al día sin recargar la página (?leida=1: la estás viendo; si entró algo nuevo,
// queda leída).
// Solo administradores
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const { id } = await params
  try {
    const [c, ajustes] = await Promise.all([leerConversacion(id), ajustesKnox()])
    if (!c) return error('Esa conversación no existe', 404)
    if (new URL(request.url).searchParams.get('leida') === '1') await marcarLeidaSiEntroAlgo(c.id, c.ultimoEntranteEn)
    return NextResponse.json({ c, modo: ajustes.modo }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[bandeja] no se pudo leer la conversación:', err instanceof Error ? err.message : err)
    return error('No se pudo cargar la conversación. Prueba de nuevo.', 500)
  }
}

// El interruptor «Knox en esta conversación» ({ knox: true | false }). Solo administradores
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const e = (await leerJson(request)) as { knox?: unknown } | null
  if (typeof e?.knox !== 'boolean') return error('Falta decir si Knox contesta aquí', 400)
  return responder(await cambiarKnox((await params).id, e.knox))
}
