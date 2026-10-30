import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { error } from '@/lib/crm/api'
import { enlaceAdjunto } from '@/lib/crm/servidor'

export const dynamic = 'force-dynamic'

// Baja un adjunto del bucket privado «crm»: manda a un enlace firmado que dura 5 minutos. Solo administradores
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const enlace = await enlaceAdjunto((await params).id)
  if (!enlace) return error('Ese archivo no existe', 404)
  return NextResponse.redirect(enlace, { headers: { 'Cache-Control': 'private, no-store' } })
}
