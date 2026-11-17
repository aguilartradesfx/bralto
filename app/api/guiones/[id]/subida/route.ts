import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { pedirSubida } from '@/lib/guiones/servidor'
import { leerPedidoSubida } from '@/lib/guiones/subida'
import { esId } from '@/lib/guiones/vista'

// Pedir la subida de un video: { nombre, bytes, tipo } → { ruta, url }. La URL firmada es de Supabase Storage: el
// navegador sube el archivo directo ahí (el video nunca pasa por este servidor) y después avisa en /subida/lista.
export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied

  const { id } = await params
  if (!esId(id)) return NextResponse.json({ error: 'Ese guion ya no existe' }, { status: 404 })
  const leido = leerPedidoSubida(await request.json().catch(() => null))
  if (!leido.ok) return NextResponse.json({ error: leido.error }, { status: 400 })

  try {
    const r = await pedirSubida(id, leido.pedido)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    return NextResponse.json({ ruta: r.ruta, url: r.url })
  } catch (err) {
    console.error('[guiones] subida', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo preparar la subida. Prueba de nuevo.' }, { status: 500 })
  }
}
