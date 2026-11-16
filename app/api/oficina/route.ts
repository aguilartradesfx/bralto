import { NextResponse } from 'next/server'
import { leerOficinaCompleta } from '@/lib/panel/oficina'
import { requireApiPermission } from '@/lib/panel-session'

// La foto de la Oficina de Knox con «Te toca»; el foro, las ideas y las fotos viajan solo si su firma no es la que
// manda la página en ?social=<firma>. Se pide al abrirla y cada 15 s mientras está abierta. Solo administradores
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const firma = new URL(request.url).searchParams.get('social') || null
  try {
    return NextResponse.json(await leerOficinaCompleta(new Date(), firma), { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[oficina] leer:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo leer la oficina. Prueba de nuevo en un rato.' }, { status: 500 })
  }
}
