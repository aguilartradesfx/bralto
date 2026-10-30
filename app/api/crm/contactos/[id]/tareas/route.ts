import { requireApiPermission } from '@/lib/panel-session'
import { error, leerJson, responder } from '@/lib/crm/api'
import { agregarTarea, existeContacto } from '@/lib/crm/servidor'
import { validarTarea } from '@/lib/crm/validar'

// Agrega una tarea a un contacto (con o sin fecha). Solo administradores
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const { id } = await params
  if (!(await existeContacto(id))) return error('Ese contacto no existe', 404)
  const v = validarTarea(await leerJson(request))
  if (!v.ok) return error(v.error, 400)
  return responder(await agregarTarea(id, v.datos.titulo, v.datos.vence_en))
}
