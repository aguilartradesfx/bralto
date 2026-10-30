import { getCurrentSession, requireApiPermission } from '@/lib/panel-session'
import { error, leerJson, responder } from '@/lib/crm/api'
import { agregarNota, existeContacto } from '@/lib/crm/servidor'
import { validarNota } from '@/lib/crm/validar'

// Agrega una nota a un contacto, con quién la escribió. Solo administradores
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied, user } = await requireApiPermission('is_admin')
  if (denied) return denied
  const { id } = await params
  if (!(await existeContacto(id))) return error('Ese contacto no existe', 404)
  const v = validarNota(await leerJson(request))
  if (!v.ok) return error(v.error, 400)
  const { profile } = await getCurrentSession()
  return responder(await agregarNota(id, v.datos.texto, profile?.full_name?.trim() || user.email || null))
}
