// Al despertar la oficina: mover lo atrasado y correr una vez lo que se saltó.
// Lo cargan `node --test` y una ruta de Next.js: imports relativos con .ts, sin `server-only`,
// y ningún cliente se crea al importar.
import { createServiceClient } from '../supabase/service.ts'
import { idEstado, marcar } from './servidor.ts'

const MIN = 60_000
const HORA = 60 * MIN
const DIA = 24 * HORA
const CR = 6 * HORA // Costa Rica es UTC−6 todo el año
const SEPARACION = 30 * MIN
const MARGEN_DEFECTO = 10 * MIN
const FRECUENTE_MIN = 15

type Pub = { id: string, publicar_en: string, prueba: boolean }

// Ventanas en hora de Costa Rica, abiertas al final: posts [10:00, 20:00), pruebas [08:00, 22:00).
function ventana(prueba: boolean): [number, number] {
  return prueba ? [8 * HORA, 22 * HORA] : [10 * HORA, 20 * HORA]
}

function dentroDeVentana(t: number, prueba: boolean): number {
  const [ini, fin] = ventana(prueba)
  const cr = t - CR
  const dia = Math.floor(cr / DIA) * DIA
  const hora = cr - dia
  if (hora < ini) return dia + ini + CR
  if (hora >= fin) return dia + DIA + ini + CR
  return t
}

export function reprogramar(
  pubs: Pub[],
  desde: Date,
  ahora: Date,
  margenMs = 0,
): { id: string, publicar_en: string }[] {
  const d = desde.getTime()
  const a = ahora.getTime()
  const corrimiento = a - d
  const tomadas = pubs
    .map((p, i) => ({ p, i, t: new Date(p.publicar_en).getTime() }))
    .filter(x => Number.isFinite(x.t) && x.t >= d - margenMs && x.t < a)
    .sort((x, y) => x.t - y.t || x.i - y.i)
  const salida: { id: string, publicar_en: string }[] = []
  let previo: number | null = null
  for (const { p, t } of tomadas) {
    let nueva = dentroDeVentana(Math.max(t + corrimiento, a), p.prueba)
    if (previo !== null && nueva < previo + SEPARACION) nueva = dentroDeVentana(previo + SEPARACION, p.prueba)
    previo = nueva
    salida.push({ id: p.id, publicar_en: new Date(nueva).toISOString() })
  }
  return salida
}

// Paso 1 del despertar: se llama ANTES de dejar la oficina despierta. Lanza si la base falla.
export async function moverAtrasadas(desde: Date, ahora: Date): Promise<number> {
  const db = createServiceClient()
  const piso = new Date(desde.getTime() - MARGEN_DEFECTO).toISOString()
  const { data, error } = await db
    .from('redes_publicaciones')
    .select('id, publicar_en, prueba')
    .eq('estado', 'programado')
    .gte('publicar_en', piso)
    .lt('publicar_en', ahora.toISOString())
  if (error) throw new Error(`redes_publicaciones: ${error.message}`)
  const movidas = reprogramar((data ?? []) as Pub[], desde, ahora, MARGEN_DEFECTO)
  if (idEstado() !== 1) {
    console.info(`[oficina] simulación: moverían ${movidas.length} publicaciones atrasadas`)
    return movidas.length
  }
  let n = 0
  for (const m of movidas) {
    const r = await db
      .from('redes_publicaciones')
      .update({ publicar_en: m.publicar_en, actualizado_en: new Date().toISOString() })
      .eq('id', m.id)
      .eq('estado', 'programado')
      .select('id')
    if (r.error) throw new Error(`redes_publicaciones: ${r.error.message}`)
    if (r.data && r.data.length > 0) n++
  }
  return n
}

// Pasos 2 a 4, con la oficina ya despierta. Nunca lanza: corre en segundo plano.
export async function despertar(desde: Date, ahora: Date, base: string): Promise<string> {
  try {
    const db = createServiceClient()
    const m = await db
      .from('oficina_marcas')
      .select('agente, creado_en')
      .eq('tipo', 'saltada')
      .gte('creado_en', desde.toISOString())
      .order('creado_en', { ascending: true })
    if (m.error) throw new Error(`oficina_marcas: ${m.error.message}`)
    const orden: string[] = []
    for (const f of (m.data ?? []) as { agente: string }[]) if (!orden.includes(f.agente)) orden.push(f.agente)

    let rutas: { id: string, ruta: string | null, cada_minutos: number | null }[] = []
    if (orden.length > 0) {
      const ag = await db.from('oficina_agentes').select('id, ruta, cada_minutos').in('id', orden)
      if (ag.error) throw new Error(`oficina_agentes: ${ag.error.message}`)
      rutas = (ag.data ?? []) as typeof rutas
    }
    const aCorrer = orden
      .map(id => rutas.find(r => r.id === id))
      .filter((r): r is { id: string, ruta: string, cada_minutos: number | null } =>
        !!r && !!r.ruta && (r.cada_minutos == null || r.cada_minutos > FRECUENTE_MIN))

    if (idEstado() !== 1) {
      console.info(`[oficina] simulación: correría ${aCorrer.length} tareas: ${aCorrer.map(r => r.id).join(', ')}`)
      return aCorrer.length ? `Simulación: correría ${aCorrer.length} tareas` : 'No había tareas atrasadas'
    }

    const corridas: string[] = []
    for (const r of aCorrer) {
      try {
        const res = await fetch(new URL(r.ruta, base), {
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
          signal: AbortSignal.timeout(120_000),
        })
        if (!res.ok) console.error('[oficina]', `${r.id} respondió ${res.status}`)
        else corridas.push(r.id)
      } catch (e) {
        console.error('[oficina]', `${r.id} falló`, e instanceof Error ? e.message : e)
      }
    }
    await marcar({ agente: 'drax', tipo: 'pasa', para: 'todos', texto: 'Despertamos, a seguir donde quedamos' })
    return corridas.length
      ? `Corrí ${corridas.length} ${corridas.length === 1 ? 'tarea que se saltó' : 'tareas que se saltaron'}: ${corridas.join(', ')}`
      : 'No había tareas atrasadas'
  } catch (e) {
    console.error('[oficina]', 'despertar falló', e instanceof Error ? e.message : e)
    return 'No pude retomar las tareas atrasadas'
  }
}
