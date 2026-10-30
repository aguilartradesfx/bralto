import { requireApiPermission } from '@/lib/panel-session'
import { error, leerJson, responder } from '@/lib/crm/api'
import { validarAjustes } from '@/lib/crm/bandeja/validar'
import { guardarAjustes } from '@/lib/crm/bandeja/servidor'

// Cómo trabaja Knox: el modo (apagado, ensayo o automático) y la ficha con lo que puede decir. Solo administradores
export async function PATCH(request: Request) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const v = validarAjustes(await leerJson(request))
  if (!v.ok) return error(v.error, 400)
  return responder(await guardarAjustes(v.datos))
}
