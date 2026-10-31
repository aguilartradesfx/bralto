// «Sí, escríbeles» en el Centro de mando: manda, una por una, las respuestas de Knox que Ale aprobó. Solo las que
// siguen pendientes y solo si la persona escribió hace menos de 24 horas (lo que Meta deja a Knox). Lo de afuera (la
// base y el envío por Zernio) llega en `deps`: en las pruebas el envío es falso y nunca le escribe a nadie.
import type { CanalKnox } from '../conversar/tipos.ts'
import { planEnvio } from '../../crm/bandeja/envio.ts'

export const MAX_BORRADORES = 50

export type BorradorPendiente = { id: string; conversacionId: string; canal: CanalKnox }

export interface DepsAprobar {
  ahora(): Date
  pendientes(ids: string[]): Promise<BorradorPendiente[]> // de esos, los que siguen pendientes y tienen respuesta
  ultimoEntrante(conversacionId: string): Promise<string | null> // cuándo escribió la persona por última vez
  enviar(decisionId: string): Promise<{ ok: boolean }> // la función de la bandeja (el «Enviar» del borrador)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Los ids que mandó la pantalla: sin repetidos, con forma de id y con un máximo
export function leerIds(entrada: unknown): string[] | null {
  const ids = (entrada as { ids?: unknown } | null)?.ids
  if (!Array.isArray(ids)) return null
  const validos = [...new Set(ids.filter((x): x is string => typeof x === 'string' && UUID.test(x)))]
  return validos.length > 0 && validos.length <= MAX_BORRADORES ? validos : null
}

// enviadas: las que salieron. fallidas: las que no (Zernio no pudo o pasaron más de 24 horas). Las que ya no estaban
// pendientes (las mandó o descartó alguien mientras tanto) no cuentan
export async function aprobarBorradores(d: DepsAprobar, ids: string[]): Promise<{ enviadas: number; fallidas: number }> {
  let enviadas = 0
  let fallidas = 0
  for (const b of await d.pendientes(ids)) {
    const plan = planEnvio(b.canal, 'knox', await d.ultimoEntrante(b.conversacionId), d.ahora())
    if (!plan.ok) {
      fallidas++
      continue
    }
    try {
      if ((await d.enviar(b.id)).ok) enviadas++
      else fallidas++
    } catch {
      fallidas++
    }
  }
  return { enviadas, fallidas }
}
