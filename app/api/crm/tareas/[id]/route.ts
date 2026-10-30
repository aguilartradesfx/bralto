import { requireApiPermission } from '@/lib/panel-session'
import { error, leerJson, responder } from '@/lib/crm/api'
import { marcarTarea } from '@/lib/crm/servidor'
import { validarCambioTarea } from '@/lib/crm/validar'

// Marca una tarea como hecha (o la vuelve a dejar pendiente). Solo administradores
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const v = validarCambioTarea(await leerJson(request))
  if (!v.ok) return error(v.error, 400)
  return responder(await marcarTarea((await params).id, v.datos.hecha))
}
