import { requireApiPermission } from '@/lib/panel-session'
import { error, leerJson, responder } from '@/lib/crm/api'
import { validarPrueba } from '@/lib/crm/bandeja/validar'
import { probarKnox } from '@/lib/crm/bandeja/servidor'

// Claude espera hasta 60 s y reintenta una vez
export const maxDuration = 150

// «Probar a Knox»: qué contestaría a un chat inventado. No guarda ni manda nada. Solo administradores
export async function POST(request: Request) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const v = validarPrueba(await leerJson(request), new Date())
  if (!v.ok) return error(v.error, 400)
  return responder(await probarKnox(v.datos.ctx, v.datos.ficha))
}
