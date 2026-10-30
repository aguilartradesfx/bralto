import { NextResponse } from 'next/server'
import { audioDelReporte } from '@/lib/knox/reporte'
import { requireApiPermission } from '@/lib/panel-session'

// La voz de un reporte de Knox. Pasa por aquí (mismo dominio) para que el panel pueda dibujar la onda.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: 'No existe' }, { status: 404 })
  const audio = await audioDelReporte(id)
  if (!audio) return NextResponse.json({ error: 'Ese reporte no tiene audio' }, { status: 404 })
  return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=86400' } })
}
