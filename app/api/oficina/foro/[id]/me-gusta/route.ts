import { NextResponse } from 'next/server'
import { ponerMeGusta } from '@/lib/oficina/servidor'
import { leerMeGusta } from '@/lib/oficina/social'
import { olvidarCaches } from '@/lib/panel/oficina'
import { requireApiPermission } from '@/lib/panel-session'

// El me gusta de Alejandro en una publicación del foro. Solo administradores
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: 'Esa publicación no es válida' }, { status: 400 })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = null
  }
  const gusta = leerMeGusta(body)
  if (!gusta.ok) return NextResponse.json({ error: gusta.error }, { status: 400 })
  try {
    if (!(await ponerMeGusta(id, gusta.si))) {
      return NextResponse.json({ error: 'Esa publicación ya no existe' }, { status: 404 })
    }
    olvidarCaches()
    return NextResponse.json({ ok: true, te_gusta: gusta.si })
  } catch (err) {
    console.error('[oficina] me gusta:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo guardar. Prueba de nuevo.' }, { status: 500 })
  }
}
