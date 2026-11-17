import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { pedirSubidaPdf } from '@/lib/proposals/archivos'
import { leerPedidoPdf } from '@/lib/proposals/archivos-reglas'

// Pedir la subida de un PDF: { nombre, bytes } → { ruta, url }. El navegador sube directo a Storage con esa URL y
// después avisa en /archivos/listo.
export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('can_view_proposals')
  if (denied) return denied

  const { id } = await params
  const leido = leerPedidoPdf(await request.json().catch(() => null))
  if (!leido.ok) return NextResponse.json({ error: leido.error }, { status: 400 })

  try {
    const r = await pedirSubidaPdf(id, leido.pedido)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    return NextResponse.json({ ruta: r.ruta, url: r.url })
  } catch (err) {
    console.error('[propuestas] subida', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo preparar la subida. Prueba de nuevo.' }, { status: 500 })
  }
}
