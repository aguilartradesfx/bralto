// «Análisis» con la base de datos: leer la tabla y las lecciones, y traer los números reales de Instagram de
// cada reel publicado. Las reglas están en calculos.ts, con pruebas. La predicción de Higgsfield y la revisión
// del inicio las escriben los scripts de producción (Bralto-redes/analisis-reels), no el sitio.
import { createServiceClient } from '@/lib/supabase/service'
import { graph } from '@/lib/redes/publicacion/servidor'
import type { Gancho, Publicacion } from '@/lib/redes/publicacion/tipos'
import type { Metricas } from '@/lib/redes/pruebas/tipos'
import { claveDe, realDeInsights, realDePrueba, tipoDe } from './calculos'
import { COLUMNAS_ANALISIS, COLUMNAS_LECCION, type AnalisisFila, type Leccion, type Real } from './tipos'

const TABLA = 'redes_analisis'
const LECCIONES = 'redes_lecciones'
const MAX_LISTA = 500
const DIAS_ATRAS = 45 // reels más viejos ya casi no cambian
const A_LA_VEZ = 4
const METRICAS = ['views', 'reach', 'reels_skip_rate', 'ig_reels_avg_watch_time', 'saved', 'likes', 'shares', 'comments']

const db = () => createServiceClient()

export async function leerAnalisis(): Promise<AnalisisFila[]> {
  const { data, error } = await db().from(TABLA).select(COLUMNAS_ANALISIS).order('publicado_en', { ascending: false, nullsFirst: true }).limit(MAX_LISTA)
  if (error) throw new Error(`${TABLA}: ${error.message}`)
  return (data ?? []) as AnalisisFila[]
}

export async function leerLecciones(): Promise<Leccion[]> {
  const { data, error } = await db().from(LECCIONES).select(COLUMNAS_LECCION).order('actualizada_en', { ascending: false })
  if (error) throw new Error(`${LECCIONES}: ${error.message}`)
  return (data ?? []) as Leccion[]
}

type Valores = { data?: { name: string; values?: { value?: number }[]; total_value?: { value?: number } }[] }

// Todas las métricas en una llamada; si Meta rechaza alguna, una por una (las que fallen quedan en null)
async function insights(media: string): Promise<Record<string, number | null> | null> {
  const leer = (r: Valores) => Object.fromEntries((r.data ?? []).map((d) => [d.name, d.values?.[0]?.value ?? d.total_value?.value ?? null]))
  try {
    return leer(await graph<Valores>(`${media}/insights`, { metric: METRICAS.join(',') }, 'GET'))
  } catch {
    const sueltas: Record<string, number | null> = {}
    for (const m of METRICAS) {
      try {
        Object.assign(sueltas, leer(await graph<Valores>(`${media}/insights`, { metric: m }, 'GET')))
      } catch {
        sueltas[m] = null
      }
    }
    return sueltas.views === null || sueltas.views === undefined ? null : sueltas
  }
}

type ReelPublicado = Pick<Publicacion, 'id' | 'titulo' | 'video_url' | 'prueba' | 'grupo' | 'version' | 'publicar_en' | 'resultado'> & {
  gancho: Gancho | null
}

// Una pasada: cada reel publicado de los últimos DIAS_ATRAS días queda en la tabla con sus números de hoy.
// Si una versión de prueba ya se borró, se usan los números que guardó la decisión
export async function actualizarReales(ahora = new Date()): Promise<Record<string, unknown>> {
  const desde = new Date(ahora.getTime() - DIAS_ATRAS * 86_400_000).toISOString()
  const { data: reels, error } = await db()
    .from('redes_publicaciones')
    .select('id, titulo, video_url, prueba, grupo, version, gancho, publicar_en, resultado')
    .eq('tipo', 'reel')
    .eq('estado', 'publicado')
    .gte('publicar_en', desde)
  if (error) throw new Error(`redes_publicaciones: ${error.message}`)
  const lista = (reels ?? []) as ReelPublicado[]

  const { data: existentes, error: e2 } = await db().from(TABLA).select('clave, rehecho_de').in(
    'publicacion_id',
    lista.map((r) => r.id),
  )
  if (e2) throw new Error(`${TABLA}: ${e2.message}`)
  const rehechoDe = new Map((existentes ?? []).map((f) => [f.clave as string, (f.rehecho_de as string | null) ?? null]))

  const grupos = [...new Set(lista.filter((r) => r.prueba && r.grupo).map((r) => r.grupo as string))]
  const guardadas = new Map<string, Metricas>()
  if (grupos.length) {
    const { data: pruebas, error: e3 } = await db().from('redes_pruebas').select('grupo, resultado').in('grupo', grupos)
    if (e3) throw new Error(`redes_pruebas: ${e3.message}`)
    for (const p of pruebas ?? []) {
      for (const [id, m] of Object.entries(((p.resultado ?? {}) as { metricas?: Record<string, Metricas | string> }).metricas ?? {})) {
        if (typeof m === 'object') guardadas.set(id, m)
      }
    }
  }

  const leidoEn = ahora.toISOString()
  const cola = [...lista]
  let actualizados = 0
  const errores: string[] = []
  async function trabajador() {
    for (let r = cola.shift(); r; r = cola.shift()) {
      const clave = r.video_url ? claveDe(r.video_url, r.prueba ? r.version : null) : null
      if (!clave) continue
      const ig = r.resultado?.instagram
      let real: Real | null = null
      if (ig?.id) {
        const v = await insights(ig.id).catch(() => null)
        if (v) real = realDeInsights(v, leidoEn)
      }
      if (!real && guardadas.has(r.id)) real = realDePrueba(guardadas.get(r.id)!)
      const rehecho = rehechoDe.get(clave) ?? null
      const fila: Record<string, unknown> = {
        clave,
        publicacion_id: r.id,
        titulo: r.titulo,
        tipo: tipoDe(r, rehecho),
        grupo: r.grupo,
        version: r.version,
        gancho: r.gancho?.pantalla || r.gancho?.frase || null,
        video_url: r.video_url,
        publicado_en: ig?.en ?? r.publicar_en,
        actualizado_en: leidoEn,
      }
      if (real) fila.real = real
      const { error: e4 } = await db().from(TABLA).upsert(fila, { onConflict: 'clave' })
      if (e4) errores.push(`${clave}: ${e4.message}`)
      else actualizados++
    }
  }
  await Promise.all(Array.from({ length: A_LA_VEZ }, trabajador))
  return { ok: errores.length === 0, reels: lista.length, actualizados, errores }
}
