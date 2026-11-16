// La Oficina de Knox con la base de datos: leer la foto, marcar, y el interruptor de dormir.
// La lógica pura está en estado.ts. Este archivo también lo cargan scripts de Node sin Next.js,
// por eso los imports son relativos con .ts y no hay `server-only`.
// La capa de la oficina nunca debe frenar el trabajo real: marcar/revisado no lanzan y el estado falla abierto.
import { createServiceClient } from '../supabase/service.ts'
import { armarSnapshot } from './estado.ts'
import type { FilaNumeros, Pub } from './estado.ts'
import type { Agente, EstadoOficina, Marca, NuevaMarca, Snapshot } from './tipos.ts'

const HORA = 3_600_000
const DIA = 24 * HORA
const CACHE_MS = 20_000
const COLUMNAS_AGENTE = 'id,nombre,oficio,area,puesto,aspecto,personalidad,frase,horario,cada_minutos,ruta,donde,estado_fijo,despierto_siempre,dura_min,ultima_revision'
const DESPIERTA: EstadoOficina = { dormida: false, desde: null, por: null }

const db = () => createServiceClient()

export function idEstado(env: NodeJS.ProcessEnv = process.env): number {
  return env.OFICINA_ESTADO_ID === '2' ? 2 : 1
}

function ok<T>(tabla: string, r: { data: T | null, error: { message: string } | null }): T | null {
  if (r.error) throw new Error(`${tabla}: ${r.error.message}`)
  return r.data
}

function aEstado(f: { dormida: boolean, desde: string | null, por: string | null } | null): EstadoOficina {
  return f ? { dormida: !!f.dormida, desde: f.desde ?? null, por: f.por ?? null } : { ...DESPIERTA }
}

let cacheDespierta: { valor: EstadoOficina, hasta: number } | null = null
let ultimoLeido: EstadoOficina | null = null

export async function estadoOficina(): Promise<EstadoOficina> {
  if (cacheDespierta && Date.now() < cacheDespierta.hasta) return cacheDespierta.valor
  try {
    const f = ok('oficina_estado', await db().from('oficina_estado').select('dormida,desde,por').eq('id', idEstado()).maybeSingle())
    const e = aEstado(f)
    ultimoLeido = e
    cacheDespierta = e.dormida ? null : { valor: e, hasta: Date.now() + CACHE_MS }
    return e
  } catch (e) {
    console.error('[oficina] estadoOficina', e)
    return ultimoLeido ?? { ...DESPIERTA }
  }
}

export async function ponerDormida(dormida: boolean, por: string): Promise<EstadoOficina> {
  const ahora = new Date().toISOString()
  const { data, error } = await db()
    .from('oficina_estado')
    .update({ dormida, desde: dormida ? ahora : null, por, actualizado_en: ahora })
    .eq('id', idEstado())
    .select('dormida,desde,por')
    .single()
  if (error) throw new Error(`oficina_estado: ${error.message}`)
  const e = aEstado(data)
  ultimoLeido = e
  cacheDespierta = e.dormida ? null : { valor: e, hasta: Date.now() + CACHE_MS }
  return e
}

export async function marcar(m: NuevaMarca): Promise<void> {
  try {
    let dura = m.dura_seg ?? null
    if (m.tipo === 'termina' && dura == null) {
      try {
        const desde = new Date(Date.now() - DIA).toISOString()
        const previa = ok<{ tipo: string, creado_en: string }[]>('oficina_marcas', await db()
          .from('oficina_marcas').select('tipo,creado_en')
          .eq('agente', m.agente).in('tipo', ['empieza', 'termina', 'falla']).gte('creado_en', desde)
          .order('creado_en', { ascending: false }).limit(1))
        const u = previa?.[0]
        if (u?.tipo === 'empieza') dura = Math.round((Date.now() - new Date(u.creado_en).getTime()) / 1000)
      } catch (e) {
        console.error('[oficina] marcar (duración)', e)
      }
    }
    const { error } = await db().from('oficina_marcas').insert({
      agente: m.agente,
      tipo: m.tipo,
      para: m.para ?? null,
      texto: m.texto,
      enlace: m.enlace ?? null,
      ref_tabla: m.ref_tabla ?? null,
      ref_id: m.ref_id ?? null,
      dura_seg: dura,
      extra: m.extra ?? null,
    })
    if (error) throw new Error(`oficina_marcas: ${error.message}`)
  } catch (e) {
    console.error('[oficina] marcar', e)
  }
}

export async function revisado(agente: string): Promise<void> {
  try {
    const { error } = await db().from('oficina_agentes').update({ ultima_revision: new Date().toISOString() }).eq('id', agente)
    if (error) throw new Error(`oficina_agentes: ${error.message}`)
  } catch (e) {
    console.error('[oficina] revisado', e)
  }
}

export async function ultimaSaltada(agente: string): Promise<Date | null> {
  try {
    const f = ok<{ creado_en: string }[]>('oficina_marcas', await db()
      .from('oficina_marcas').select('creado_en').eq('agente', agente).eq('tipo', 'saltada')
      .order('creado_en', { ascending: false }).limit(1))
    return f?.[0] ? new Date(f[0].creado_en) : null
  } catch (e) {
    console.error('[oficina] ultimaSaltada', e)
    return null
  }
}

export async function verEntrega(id: string): Promise<void> {
  const { error } = await db()
    .from('oficina_marcas').update({ visto_en: new Date().toISOString() })
    .eq('id', id).eq('tipo', 'entrega').is('visto_en', null)
  if (error) throw new Error(`oficina_marcas: ${error.message}`)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Ids de publicaciones a revisar: solo los que tienen formato uuid (una marca mal escrita no debe romper la lectura).
export function idsValidos(entregas: Pick<Marca, 'ref_tabla' | 'ref_id'>[]): string[] {
  return [...new Set(entregas.filter((m) => m.ref_tabla === 'redes_publicaciones' && m.ref_id && UUID.test(m.ref_id)).map((m) => m.ref_id as string))]
}

export async function leerOficina(ahora: Date): Promise<Snapshot> {
  try {
    const c = db()
    const hace24 = new Date(ahora.getTime() - DIA).toISOString()
    const hace7d = new Date(ahora.getTime() - 7 * DIA).toISOString()
    const [ag, ma, en, nu, of, pu] = await Promise.all([
      c.from('oficina_agentes').select(COLUMNAS_AGENTE).eq('activo', true).order('puesto', { ascending: true }),
      c.from('oficina_marcas').select('*').gte('creado_en', hace24).order('creado_en', { ascending: false }).limit(2000),
      c.from('oficina_marcas').select('*').eq('tipo', 'entrega').is('visto_en', null).gte('creado_en', hace7d).order('creado_en', { ascending: false }).limit(200),
      c.from('oficina_numeros').select('*'),
      c.from('oficina_estado').select('dormida,desde,por').eq('id', idEstado()).maybeSingle(),
      c.from('redes_publicaciones').select('id,titulo,publicar_en,prueba').eq('estado', 'programado').gte('publicar_en', ahora.toISOString()).order('publicar_en', { ascending: true }).limit(50),
    ])
    const agentes = (ok('oficina_agentes', ag) ?? []) as Agente[]
    const marcas = (ok('oficina_marcas', ma) ?? []) as Marca[]
    const entregas = (ok('oficina_marcas', en) ?? []) as Marca[]
    const numeros = (ok('oficina_numeros', nu) ?? []) as FilaNumeros[]
    const oficina = aEstado(ok('oficina_estado', of))
    const pubs = (ok('redes_publicaciones', pu) ?? []) as Pub[]

    const ids = idsValidos(entregas)
    const resueltas = new Set<string>()
    if (ids.length) {
      try {
        const filas = ok<{ id: string, estado: string }[]>('redes_publicaciones', await c.from('redes_publicaciones').select('id,estado').in('id', ids)) ?? []
        for (const f of filas) {
          if (f.estado === 'publicado' || f.estado === 'borrador' || f.estado === 'cancelado') resueltas.add(`redes_publicaciones:${f.id}`)
        }
      } catch (e) {
        console.error('[oficina] resueltas', e)
      }
    }
    return armarSnapshot({ agentes, marcas, entregas, numeros, oficina, pubs, resueltas }, ahora)
  } catch (e) {
    console.error('[oficina] leerOficina', e)
    return { ahora: ahora.toISOString(), oficina: { ...DESPIERTA }, agentes: [], marcas: [], paraTi: [], proximos: [] }
  }
}
