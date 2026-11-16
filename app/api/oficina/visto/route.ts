import { NextResponse } from 'next/server'
import { verEntrega } from '@/lib/oficina/servidor'
import { requireApiPermission } from '@/lib/panel-session'

// Marca como visto un elemento de «Para ti». Solo administradores
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  let id: unknown
  try {
    id = ((await request.json()) as { id?: unknown } | null)?.id
  } catch {
    id = undefined
  }
  if (typeof id !== 'string' || !UUID.test(id)) {
    return NextResponse.json({ error: 'Falta el id de lo que abriste.' }, { status: 400 })
  }
  try {
    await verEntrega(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[oficina] visto:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo guardar. Prueba de nuevo en un rato.' }, { status: 500 })
  }
}
