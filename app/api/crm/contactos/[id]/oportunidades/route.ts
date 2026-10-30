import { requireApiPermission } from '@/lib/panel-session'
import { error, leerJson, responder } from '@/lib/crm/api'
import { crearOportunidad, existeContacto } from '@/lib/crm/servidor'

// Crea una oportunidad para un contacto (la validación, con las etapas de la base, está en crearOportunidad).
// Solo administradores
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const { id } = await params
  if (!(await existeContacto(id))) return error('Ese contacto no existe', 404)
  return responder(await crearOportunidad(id, await leerJson(request)))
}
