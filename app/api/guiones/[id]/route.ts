import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { leerAccion } from '@/lib/guiones/reglas'
import { aplicarAccion } from '@/lib/guiones/servidor'
import { esId } from '@/lib/guiones/vista'

// «Descartar» y «Volver a abrir» un guion: { accion: 'descartar' | 'reabrir' }
export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied

  const { id } = await params
  if (!esId(id)) return NextResponse.json({ error: 'Ese guion ya no existe' }, { status: 404 })
  const leida = leerAccion(await request.json().catch(() => null))
  if (!leida.ok) return NextResponse.json({ error: leida.error }, { status: 400 })

  try {
    const r = await aplicarAccion(id, leida.accion)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    return NextResponse.json({ ok: true, estado: r.estado })
  } catch (err) {
    console.error('[guiones]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo guardar. Prueba de nuevo.' }, { status: 500 })
  }
}
