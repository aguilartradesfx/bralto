import { requireApiPermission } from '@/lib/panel-session'
import { error, leerJson, responder } from '@/lib/crm/api'
import { crearContacto } from '@/lib/crm/servidor'
import { validarContacto } from '@/lib/crm/validar'

// Crea un contacto desde el panel. Solo administradores
export async function POST(request: Request) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const v = validarContacto(await leerJson(request))
  if (!v.ok) return error(v.error, 400)
  return responder(await crearContacto(v.datos))
}
