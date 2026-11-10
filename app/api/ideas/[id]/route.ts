import { NextResponse, after } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { leerAccion } from '@/lib/ideas/cola'
import { aplicarAccion, procesarCola } from '@/lib/ideas/servidor'

// Lo que él decide con una idea: «Que lo haga Knox», «Lo grabo yo», «Descartar», deshacer o reintentar
export const runtime = 'nodejs'
export const maxDuration = 300

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied

  const leida = leerAccion(await request.json().catch(() => null))
  if (!leida.ok) return NextResponse.json({ error: leida.error }, { status: 400 })
  const { id } = await params

  try {
    const r = await aplicarAccion(id, leida.accion)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    if (leida.accion === 'reintentar') {
      after(async () => {
        try {
          console.log('[ideas]', JSON.stringify(await procesarCola({ limite: 1, ids: [id] })))
        } catch (err) {
          console.error('[ideas]', err instanceof Error ? err.message : err)
        }
      })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ideas]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo guardar. Prueba de nuevo.' }, { status: 500 })
  }
}
