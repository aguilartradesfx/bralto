// SERVER-ONLY — los contadores del menú del panel: conversaciones que esperan respuesta y tareas pendientes.
// Si algo falla, el menú sale sin números (nunca rompe la página).
import { createServiceClient } from '@/lib/supabase/service'
import { resumenBandeja } from '@/lib/crm/bandeja/servidor'
import type { Cuenta } from '@/lib/panel/navegacion'

export async function cuentasDelMenu(): Promise<Partial<Record<Cuenta, number>>> {
  const [bandeja, tareas] = await Promise.allSettled([
    resumenBandeja(),
    createServiceClient().from('crm_tareas').select('id', { count: 'exact', head: true }).eq('hecha', false),
  ])
  const cuentas: Partial<Record<Cuenta, number>> = {}
  if (bandeja.status === 'fulfilled') cuentas.mensajes = bandeja.value.porResponder
  else console.error('[panel] contador de mensajes:', bandeja.reason)
  if (tareas.status === 'fulfilled' && !tareas.value.error) cuentas.tareas = tareas.value.count ?? 0
  return cuentas
}
