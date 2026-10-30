import { requireApiPermission } from '@/lib/panel-session'
import { error, leerJson, responder } from '@/lib/crm/api'
import { validarEnvio } from '@/lib/crm/bandeja/validar'
import { enviarComoAle } from '@/lib/crm/bandeja/servidor'

export const maxDuration = 60

// La caja de la conversación: Ale le contesta a la persona por Zernio (y Knox se aparta 12 horas). Solo administradores
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  const v = validarEnvio(await leerJson(request))
  if (!v.ok) return error(v.error, 400)
  return responder(await enviarComoAle((await params).id, v.datos.texto, v.datos.clave))
}
