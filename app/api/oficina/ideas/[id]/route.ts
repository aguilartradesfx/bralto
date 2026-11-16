import { NextResponse } from 'next/server'
import { decidirIdea } from '@/lib/oficina/servidor'
import { leerAccionIdea } from '@/lib/oficina/social'
import { olvidarCaches } from '@/lib/panel/oficina'
import { requireApiPermission } from '@/lib/panel-session'

// «Me sirve», «No va» o deshacer una idea del equipo. Solo administradores
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: 'Esa idea no es válida' }, { status: 400 })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = null
  }
  const accion = leerAccionIdea(body)
  if (!accion.ok) return NextResponse.json({ error: accion.error }, { status: 400 })
  try {
    if (!(await decidirIdea(id, accion.estado))) {
      return NextResponse.json({ error: 'Esa idea ya no existe' }, { status: 404 })
    }
    olvidarCaches()
    return NextResponse.json({ ok: true, estado: accion.estado })
  } catch (err) {
    console.error('[oficina] idea:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo guardar. Prueba de nuevo.' }, { status: 500 })
  }
}
