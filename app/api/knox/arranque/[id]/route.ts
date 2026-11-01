import { NextResponse } from 'next/server'
import { audioArranque } from '@/lib/knox/arranque/preparar'
import { esFijo } from '@/lib/knox/arranque/textos'
import { requireApiPermission } from '@/lib/panel-session'

// La voz de un arranque, «Ahora sí…», «Ya casi…» o el sonido de arranque. Pasa por aquí (mismo dominio y con la
// sesión) para que la pantalla pueda dibujar la onda.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id) && !esFijo(id) && id !== 'sonido') return NextResponse.json({ error: 'No existe' }, { status: 404 })
  try {
    const audio = await audioArranque(id)
    if (!audio) return NextResponse.json({ error: 'No existe' }, { status: 404 })
    return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=86400' } })
  } catch (err) {
    console.error('[knox-arranque]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo leer' }, { status: 500 })
  }
}
