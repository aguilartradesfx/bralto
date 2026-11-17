import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { registrarSubida } from '@/lib/guiones/servidor'
import { esId } from '@/lib/guiones/vista'

// El video ya subió: { ruta } → se revisa que esté en el bucket, se suma a `videos` y el guion queda «Subido»
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
    const r = await registrarSubida(id, ruta)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    return NextResponse.json({ ok: true, estado: r.estado, videos: r.videos })
  } catch (err) {
    console.error('[guiones] subida lista', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo anotar el video. Prueba de nuevo.' }, { status: 500 })
  }
}
