// El envoltorio de las tareas del sitio: que cada una deje su marca en la Oficina de Knox y se salte la corrida
// mientras la oficina duerme. Lo cargan `node --test`, las rutas de Next.js y la bandeja: imports relativos con .ts.
// Regla de oro: la capa de la oficina nunca frena, atrasa ni cambia el resultado del trabajo real.
import { createServiceClient } from '../supabase/service.ts'
import { estadoOficina, marcar, revisado, ultimaSaltada } from './servidor.ts'
import { titulosConError, titulosPublicados } from './resumenes.ts'
import type { NuevaMarca } from './tipos.ts'

export type Resultado = { hizo: boolean, resumen: string, fallo?: string, detalle?: unknown }
export type Salto = { salto: 'dormida' }
export type Opciones = { inicio?: string }

export type Deps = {
  dormida(agente: string): Promise<boolean>
  marcar(m: NuevaMarca): Promise<void>
  revisado(a: string): Promise<void>
  ultimaSaltada(a: string): Promise<Date | null>
  ahora(): number
}

const HORA = 3_600_000
const TEXTO_SALTADA = 'Me la salté porque la oficina estaba durmiendo'

// Cualquier fallo de la capa de la oficina se ignora: `por_defecto` es lo que se usa en su lugar
async function seguro<T>(f: () => Promise<T>, porDefecto: T): Promise<T> {
  try {
    return await f()
  } catch (e) {
    console.error('[oficina] envoltorio', e instanceof Error ? e.message : e)
    return porDefecto
  }
}

function enUnaLinea(e: unknown): string {
  const m = (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim()
  return m.length > 140 ? `${m.slice(0, 139)}…` : m
}

export async function conOficinaCon<T extends Resultado>(
  deps: Deps,
  agente: string,
  trabajo: () => Promise<T>,
  op?: Opciones,
): Promise<T | Salto> {
  if (await seguro(() => deps.dormida(agente), false)) {
    await seguro(async () => {
      const ultima = await deps.ultimaSaltada(agente)
      if (ultima && deps.ahora() - ultima.getTime() < HORA) return
      await deps.marcar({ agente, tipo: 'saltada', texto: TEXTO_SALTADA })
    }, undefined)
    console.log(`[oficina] ${agente} se saltó: oficina dormida`)
    return { salto: 'dormida' }
  }

  const t0 = await seguro(async () => deps.ahora(), Date.now())
  if (op?.inicio) {
    const texto = op.inicio
    await seguro(() => deps.marcar({ agente, tipo: 'empieza', texto }), undefined)
  }

  let r: T
  try {
    r = await trabajo()
  } catch (err) {
    await seguro(() => deps.marcar({ agente, tipo: 'falla', texto: 'Algo falló y no pude terminar', extra: { error: enUnaLinea(err) } }), undefined)
    throw err
  }

  await seguro(async () => {
    if (r.fallo) {
      await deps.marcar({ agente, tipo: 'falla', texto: enUnaLinea(r.fallo) })
    } else if (r.hizo || op?.inicio) {
      await deps.marcar({ agente, tipo: 'termina', texto: r.resumen, dura_seg: Math.max(0, Math.round((deps.ahora() - t0) / 1000)) })
    }
  }, undefined)
  await seguro(() => deps.revisado(agente), undefined)
  return r
}

// Quien tiene `despierto_siempre` sigue trabajando aunque la oficina duerma (en memoria 20 s)
const cacheDespierto = new Map<string, { valor: boolean, hasta: number }>()

async function despiertoSiempre(agente: string): Promise<boolean> {
  const c = cacheDespierto.get(agente)
  if (c && Date.now() < c.hasta) return c.valor
  let valor = false
  try {
    const { data, error } = await createServiceClient().from('oficina_agentes').select('despierto_siempre').eq('id', agente).maybeSingle()
    if (error) throw new Error(error.message)
    valor = !!data?.despierto_siempre
  } catch (e) {
    console.error('[oficina] despiertoSiempre', e instanceof Error ? e.message : e)
  }
  cacheDespierto.set(agente, { valor, hasta: Date.now() + 20_000 })
  return valor
}

export function depsReales(): Deps {
  return {
    dormida: async (a) => (await estadoOficina()).dormida && !(await despiertoSiempre(a)),
    marcar,
    revisado,
    ultimaSaltada,
    ahora: () => Date.now(),
  }
}

export function conOficina<T extends Resultado>(agente: string, trabajo: () => Promise<T>, op?: Opciones): Promise<T | Salto> {
  return conOficinaCon(depsReales(), agente, trabajo, op)
}

export const esSalto = (r: unknown): r is Salto => typeof r === 'object' && r !== null && (r as Salto).salto === 'dormida' && !('hizo' in r)

// Lo que responde una ruta: lo de siempre si el trabajo corrió; si se saltó por dormir, un 200 con el aviso
export function cuerpoDe(r: Resultado | Salto): unknown {
  return esSalto(r) ? { ok: true, salto: 'dormida' } : r.detalle
}

export function textoEcho(n: number): string {
  return `Le mandé la guía a ${n} ${n === 1 ? 'persona' : 'personas'}`
}

// Suma 1 a la marca «termina» de Echo de la hora actual (UTC); si no existe la crea. Nunca lanza. Un conteo perdido
// con dos avisos a la vez se acepta.
export async function sumarEcho(): Promise<void> {
  try {
    const db = createServiceClient()
    const hora = new Date()
    hora.setUTCMinutes(0, 0, 0)
    const { data, error } = await db
      .from('oficina_marcas').select('id,extra')
      .eq('agente', 'echo').eq('tipo', 'termina').gte('creado_en', hora.toISOString())
      .order('creado_en', { ascending: false }).limit(1)
    if (error) throw new Error(error.message)
    const fila = data?.[0] as { id: string, extra: { cuenta?: unknown } | null } | undefined
    if (fila) {
      const previa = Number(fila.extra?.cuenta)
      const n = (Number.isFinite(previa) && previa > 0 ? previa : 1) + 1
      const { error: e2 } = await db.from('oficina_marcas').update({ extra: { ...(fila.extra ?? {}), cuenta: n }, texto: textoEcho(n) }).eq('id', fila.id)
      if (e2) throw new Error(e2.message)
    } else {
      await marcar({ agente: 'echo', tipo: 'termina', texto: textoEcho(1), extra: { cuenta: 1 } })
    }
  } catch (e) {
    console.error('[oficina] sumarEcho', e instanceof Error ? e.message : e)
  }
}

// Las marcas de Zap (salió un post) y de Tiko (se agendó en TikTok) a partir de lo que devolvió la cola. Solo lee.
// Nunca lanza ni toca lo publicado.
export async function marcarPublicadas(r: Record<string, unknown>): Promise<number> {
  try {
    const titulos = titulosPublicados(r)
    for (const titulo of titulosConError(r)) await marcar({ agente: 'zap', tipo: 'falla', texto: `No pude publicar «${titulo}»`, extra: { sin_reintento: true } })
    if (!titulos.length) return 0
    for (const titulo of titulos) await marcar({ agente: 'zap', tipo: 'publica', texto: `Publiqué «${titulo}»` })
    let tiktok = 0
    try {
      const desde = new Date(Date.now() - 15 * 60_000).toISOString()
      const { data, error } = await createServiceClient()
        .from('redes_publicaciones').select('titulo,resultado')
        .in('titulo', titulos).eq('estado', 'publicado').gte('actualizado_en', desde)
      if (error) throw new Error(error.message)
      const vistos = new Set<string>()
      for (const f of (data ?? []) as { titulo: string, resultado: { tiktok?: { zernioId?: string | null, programado?: string } } | null }[]) {
        const t = f.resultado?.tiktok
        if (!t?.zernioId || !t.programado || vistos.has(f.titulo)) continue
        vistos.add(f.titulo)
        await marcar({ agente: 'tiko', tipo: 'termina', texto: `Agendé «${f.titulo}» en TikTok` })
        tiktok++
      }
    } catch (e) {
      console.error('[oficina] marcarPublicadas (TikTok)', e instanceof Error ? e.message : e)
    }
    return tiktok
  } catch (e) {
    console.error('[oficina] marcarPublicadas', e instanceof Error ? e.message : e)
    return 0
  }
}
