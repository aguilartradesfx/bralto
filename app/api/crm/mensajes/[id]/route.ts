import { requireApiPermission } from '@/lib/panel-session'
import { error, leerJson, responder } from '@/lib/crm/api'
import { cambiarKnox } from '@/lib/crm/bandeja/servidor'

// El interruptor «Knox en esta conversación» ({ knox: true | false }). Solo administradores
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const e = (await leerJson(request)) as { knox?: unknown } | null
  if (typeof e?.knox !== 'boolean') return error('Falta decir si Knox contesta aquí', 400)
  return responder(await cambiarKnox((await params).id, e.knox))
}
