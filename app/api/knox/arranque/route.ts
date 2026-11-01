import { NextResponse } from 'next/server'
import { marcarUsado, siguienteArranque } from '@/lib/knox/arranque/preparar'
import { diaCr } from '@/lib/knox/fechas'
import { requireApiPermission } from '@/lib/panel-session'

// El arranque que toca al abrir el centro de mando (GET) y el aviso de que ya sonó (POST), para que no se repita.
// Si algo falla, no hay arranque: Knox va directo al reporte.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f-]{36}$/

export async function GET() {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  try {
    return NextResponse.json({ arranque: await siguienteArranque(diaCr(new Date())) })
  } catch (err) {
    console.error('[knox-arranque]', err instanceof Error ? err.message : err)
    return NextResponse.json({ arranque: null })
  }
}

export async function POST(req: Request) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const { id } = (await req.json().catch(() => ({}))) as { id?: string }
  if (!id || !UUID.test(id)) return NextResponse.json({ error: 'Falta el arranque' }, { status: 400 })
  try {
    await marcarUsado(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[knox-arranque]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo marcar' }, { status: 500 })
  }
}
