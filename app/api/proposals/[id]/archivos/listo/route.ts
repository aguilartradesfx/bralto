import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireApiPermission } from '@/lib/panel-session'
import { registrarPdf } from '@/lib/proposals/archivos'

// El PDF ya subió: { ruta, nombre } → se revisa que esté en el bucket y queda en la propuesta
export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('can_view_proposals')
  if (denied) return denied

  const { id } = await params
  const body = (await request.json().catch(() => null)) as { ruta?: unknown; nombre?: unknown } | null
  const ruta = typeof body?.ruta === 'string' ? body.ruta : ''
  const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : ''
  if (!ruta || !nombre) return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })

  try {
    const r = await registrarPdf(id, ruta, nombre)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    revalidatePath('/propuestas')
    return NextResponse.json({ ok: true, archivo: r.archivo })
  } catch (err) {
    console.error('[propuestas] subida lista', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo guardar el PDF. Prueba de nuevo.' }, { status: 500 })
  }
}
