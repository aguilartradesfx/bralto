import { requireApiPermission } from '@/lib/panel-session'
import { error, leerJson, responder } from '@/lib/crm/api'
import { descartarDecision, enviarBorrador } from '@/lib/crm/bandeja/servidor'

export const maxDuration = 60

// La tarjeta del borrador de Knox: { accion: 'enviar' } lo manda tal cual y { accion: 'descartar' } lo quita. Solo
// administradores
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const e = (await leerJson(request)) as { accion?: unknown } | null
  const { id } = await params
  if (e?.accion === 'enviar') return responder(await enviarBorrador(id))
  if (e?.accion === 'descartar') return responder(await descartarDecision(id))
  return error('Falta decir qué hacer con el borrador', 400)
}
