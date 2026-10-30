import { requireApiPermission } from '@/lib/panel-session'
import { responder } from '@/lib/crm/api'
import { guardarComoContacto } from '@/lib/crm/bandeja/servidor'

// «Guardar como contacto»: crea el contacto con lo que se sabe de la persona (o usa el que ya tiene ese número o esa
// cuenta) y le pasa la conversación. Solo administradores
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied
  return responder(await guardarComoContacto((await params).id))
}
