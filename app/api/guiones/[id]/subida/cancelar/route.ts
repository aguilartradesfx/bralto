import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { cancelarSubida } from '@/lib/guiones/servidor'
import { esId } from '@/lib/guiones/vista'

// «Cancelar» o «Quitar» una subida: { ruta } → sale de pendientes (el servidor ya no la espera) y, si el archivo alcanzó
// a llegar sin anotarse, se borra. Un video ya anotado nunca se borra.
export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied

  const { id } = await params
  if (!esId(id)) return NextResponse.json({ error: 'Ese guion ya no existe' }, { status: 404 })
  const body = (await request.json().catch(() => null)) as { ruta?: unknown } | null
  const ruta = typeof body?.ruta === 'string' ? body.ruta : ''
  if (!ruta) return NextResponse.json({ error: 'Falta la ruta del video' }, { status: 400 })

  try {
    const r = await cancelarSubida(id, ruta)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[guiones] subida cancelar', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo cancelar. Prueba de nuevo.' }, { status: 500 })
  }
}
