import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { enlaceDescarga } from '@/lib/proposals/archivos'

// Bajar un PDF de una propuesta: redirige a un enlace firmado que dura 5 minutos
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ archivoId: string }> }) {
  const { denied } = await requireApiPermission('can_view_proposals')
  if (denied) return denied

  const { archivoId } = await params
  try {
    const url = await enlaceDescarga(archivoId)
    if (!url) return NextResponse.json({ error: 'Ese PDF ya no existe' }, { status: 404 })
    return NextResponse.redirect(url, { status: 302, headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[propuestas] descarga', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo abrir el PDF. Prueba de nuevo.' }, { status: 500 })
  }
}
