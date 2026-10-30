import { requireApiPermission } from '@/lib/panel-session'
import { error, leerJson, responder } from '@/lib/crm/api'
import { editarContacto } from '@/lib/crm/servidor'
import { validarContacto } from '@/lib/crm/validar'

// Cambia los datos de un contacto (nombre, teléfono, correo, empresa, etiquetas). Solo administradores
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const v = validarContacto(await leerJson(request), { parcial: true })
  if (!v.ok) return error(v.error, 400)
  return responder(await editarContacto((await params).id, v.datos))
}
