import { requireApiPermission } from '@/lib/panel-session'
import { leerJson, responder } from '@/lib/crm/api'
import { cambiarOportunidad } from '@/lib/crm/servidor'

// Cambia la etapa, el estado o el valor de una oportunidad; el cambio queda en el historial del contacto.
// La validación (la etapa tiene que ser de su pipeline) está en cambiarOportunidad. Solo administradores
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  return responder(await cambiarOportunidad((await params).id, await leerJson(request)))
}
