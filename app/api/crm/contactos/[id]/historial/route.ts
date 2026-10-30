import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { error } from '@/lib/crm/api'
import { leerHistorial } from '@/lib/crm/servidor'
import { leerCursor, UUID } from '@/lib/crm/validar'

export const dynamic = 'force-dynamic'

// «Ver más» del historial: los 30 mensajes que siguen después de ?antes=<fecha>&id=<id>. Solo administradores
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const { id } = await params
  if (!UUID.test(id)) return error('Ese contacto no existe', 404)
  const url = new URL(request.url)
  const cursor = leerCursor(url.searchParams.get('antes'), url.searchParams.get('id'))
  if (!cursor) return error('Falta desde dónde seguir', 400)
  return NextResponse.json(await leerHistorial(id, cursor))
}
