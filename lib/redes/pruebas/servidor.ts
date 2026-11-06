import { createServiceClient } from '@/lib/supabase/service'
import { efectosReales, graph } from '@/lib/redes/publicacion/servidor'
import type { Publicacion } from '@/lib/redes/publicacion/tipos'
import { avanzarGrupo, puntaje, type CambiosPrueba, type EfectosPrueba } from './decidir'
import { resumenSemanal, type GrupoDecidido } from './resumen'
import type { EstadoPrueba, Metricas, Prueba } from './tipos'
import type { Gancho } from '@/lib/redes/publicacion/tipos'

// Conexiones reales de las pruebas: Supabase, las métricas y el borrado por la Graph API, y Facebook, el
// «Comenta» y Telegram con lo mismo que usa la publicación. La lógica está en decidir.ts, con pruebas.

const TABLA = 'redes_pruebas'
const COLUMNAS = 'grupo, titulo, origen, estado, facebook, decidir_en, ganadora, resultado, intentos, actualizado_en'
const COLUMNAS_VERSION =
  'id, titulo, tipo, estado, publicar_en, texto, laminas, video_url, portada_url, historias, colaborador, hecho_con_ia, facebook, comenta, resultado, intentos, prueba, grupo, version, gancho'
const TRABADA_MS = 15 * 60_000 // más que el tope de la función: si sigue «decidiendo», la corrida se cortó
const MAX_DECIDIR = 5 // grupos a decidir por corrida, para no pasarse del tiempo de la función
const MAX_ERRORES = 3

type Valor = { data?: { values?: { value?: number }[]; total_value?: { value?: number } }[] }
const valor = (r: Valor): number | null => r.data?.[0]?.values?.[0]?.value ?? r.data?.[0]?.total_value?.value ?? null
const noExiste = (err: unknown) => /does not exist|no existe/i.test(err instanceof Error ? err.message : String(err))

// Una métrica; las que Meta tiene «en desarrollo» pueden fallar sin tumbar las demás
async function metrica(media: string, nombre: string): Promise<number | null> {
  try {
    return valor(await graph<Valor>(`${media}/insights`, { metric: nombre }, 'GET'))
  } catch (err) {
    if (noExiste(err)) throw err
    return null
  }
}

async function leerMetricas(media: string): Promise<Metricas | 'sin_datos' | 'no_existe'> {
  let views: number | null
  try {
    views = valor(await graph<Valor>(`${media}/insights`, { metric: 'views' }, 'GET'))
  } catch (err) {
    if (noExiste(err)) return 'no_existe'
    throw err
  }
  if (views === null) return 'sin_datos'
  const [reach, skip, promedioMs, shares, saved] = await Promise.all(
    ['reach', 'reels_skip_rate', 'ig_reels_avg_watch_time', 'shares', 'saved'].map((m) => metrica(media, m)),
  )
  return { views, reach, skip, promedioMs, shares: shares ?? 0, saved: saved ?? 0, leidas_en: new Date().toISOString() }
}

// dueño: el estado y los intentos con que esta corrida tomó el grupo. Cada guardado exige que el grupo siga así
// (Vercel a veces entrega el cron dos veces); si el guardado cambia el estado, el dueño pasa a ese estado
function efectosPruebas(dueño: { estado: EstadoPrueba; intentos: number }): EfectosPrueba {
  const pub = efectosReales()
  return {
    metricas: leerMetricas,
    async borrar(media) {
      await graph(media, {}, 'DELETE')
    },
    publicarFacebook: (p) => pub.publicarFacebook(p),
    crearComentaFb: (postId, p) => pub.crearComenta('fb', postId, p),
    async guardar(grupo, cambios: CambiosPrueba) {
      const { data, error } = await createServiceClient()
        .from(TABLA)
        .update(cambios)
        .eq('grupo', grupo)
        .eq('estado', dueño.estado)
        .eq('intentos', dueño.intentos)
        .select('grupo')
      if (error) throw new Error(`${TABLA}: ${error.message}`)
      if (!data?.length) throw new Error('otra corrida tomó esta prueba: esta se detiene')
      if (cambios.estado) dueño.estado = cambios.estado
    },
    avisar: (texto) => pub.avisar(texto),
    ahora: () => Date.now(),
  }
}

// Una corrida del cron (cada hora): rescata lo trabado, pasa a «corriendo» los grupos que ya salieron completos y
// decide los que cumplieron sus 72 h
export async function correrPruebas(): Promise<Record<string, unknown>> {
  const db = createServiceClient()
  const ahora = Date.now()
  const hecho: Record<string, string> = {}

  const { data: trabadas, error: e1 } = await db
    .from(TABLA)
    .select(COLUMNAS)
    .eq('estado', 'decidiendo')
    .lt('actualizado_en', new Date(ahora - TRABADA_MS).toISOString())
  if (e1) throw new Error(`${TABLA}: ${e1.message}`)
  for (const t of (trabadas ?? []) as Prueba[]) {
    // Condicional: si otra corrida ya la rescató, esta no la toca. Los intentos quedan contando el corte
    await db.from(TABLA).update({ estado: 'corriendo' }).eq('grupo', t.grupo).eq('estado', 'decidiendo').eq('actualizado_en', t.actualizado_en)
    hecho[t.titulo] = 'se cortó: vuelve a corriendo'
  }

  const { data, error } = await db.from(TABLA).select(COLUMNAS).in('estado', ['programada', 'corriendo']).order('creado_en').limit(50)
  if (error) throw new Error(`${TABLA}: ${error.message}`)
  let decididos = 0
  for (const g of (data ?? []) as Prueba[]) {
    const vence = g.estado === 'corriendo' && g.decidir_en !== null && Date.parse(g.decidir_en) <= ahora
    if (g.estado === 'corriendo' && !vence) continue
    if (vence && decididos >= MAX_DECIDIR) continue

    let p = g
    const dueño = { estado: g.estado, intentos: g.intentos }
    if (vence) {
      // Solo una corrida lo toma: exige que siga «corriendo» con los mismos intentos
      const { data: tomado, error: e2 } = await db
        .from(TABLA)
        .update({ estado: 'decidiendo', intentos: g.intentos + 1 })
        .eq('grupo', g.grupo)
        .eq('estado', 'corriendo')
        .eq('intentos', g.intentos)
        .select('grupo')
      if (e2) throw new Error(`${TABLA}: ${e2.message}`)
      if (!tomado?.length) continue
      decididos++
      p = { ...g, estado: 'decidiendo', intentos: g.intentos + 1 }
      dueño.estado = 'decidiendo'
      dueño.intentos = g.intentos + 1
    }

    try {
      const { data: filas, error: e3 } = await db.from('redes_publicaciones').select(COLUMNAS_VERSION).eq('grupo', g.grupo).order('version')
      if (e3) throw new Error(`redes_publicaciones: ${e3.message}`)
      hecho[g.titulo] = await avanzarGrupo(p, (filas ?? []) as Publicacion[], efectosPruebas(dueño))
      // Si todavía no se pudo decidir (faltan métricas), se suelta sin contarlo como error
      if (dueño.estado === 'decidiendo') {
        await db.from(TABLA).update({ estado: 'corriendo', intentos: g.intentos }).eq('grupo', g.grupo).eq('estado', 'decidiendo').eq('intentos', dueño.intentos)
      }
    } catch (err) {
      const motivo = (err instanceof Error ? err.message : String(err)).slice(0, 300)
      hecho[g.titulo] = `error: ${motivo}`
      if (dueño.estado !== 'decidiendo') continue
      const errores = g.intentos + 1
      const final = errores >= MAX_ERRORES
      await db
        .from(TABLA)
        .update({ estado: final ? 'error' : 'corriendo', intentos: errores, ultimo_error: motivo })
        .eq('grupo', g.grupo)
        .eq('estado', 'decidiendo')
        .eq('intentos', dueño.intentos)
      if (final) await efectosReales().avisar(`❌ No pude decidir la prueba de «${g.titulo}»: ${motivo}. Revísala en admin.bralto.io/calendario.`)
    }
  }
  return { ok: true, ...hecho }
}

// El resumen de los domingos: las pruebas decididas con ganadora y el puntaje de cada versión. Solo avisa
export async function mandarResumen(): Promise<Record<string, unknown>> {
  const db = createServiceClient()
  const { data, error } = await db.from(TABLA).select(COLUMNAS).eq('estado', 'decidida').not('ganadora', 'is', null)
  if (error) throw new Error(`${TABLA}: ${error.message}`)
  const pruebas = (data ?? []) as Prueba[]
  if (!pruebas.length) return { ok: true, resumen: 'todavía no hay pruebas decididas' }
  const { data: filas, error: e2 } = await db
    .from('redes_publicaciones')
    .select('id, grupo, publicar_en, gancho')
    .in('grupo', pruebas.map((p) => p.grupo))
  if (e2) throw new Error(`redes_publicaciones: ${e2.message}`)
  const grupos: GrupoDecidido[] = pruebas.map((p) => ({
    ganadora: p.ganadora!,
    decidida_en: p.resultado.aviso ?? p.actualizado_en,
    versiones: ((filas ?? []) as { id: string; grupo: string; publicar_en: string; gancho: Gancho | null }[])
      .filter((f) => f.grupo === p.grupo)
      .flatMap((f) => {
        const m = p.resultado.metricas?.[f.id]
        return typeof m === 'object' && m !== null ? [{ id: f.id, publicar_en: f.publicar_en, tipo: f.gancho?.tipo ?? 'otro', puntaje: puntaje(m) }] : []
      }),
  }))
  const texto = resumenSemanal(grupos, new Date())
  if (!texto) return { ok: true, resumen: 'todavía es muy pronto (menos de 2 semanas de datos)' }
  await efectosReales().avisar(texto)
  return { ok: true, resumen: 'enviado', pruebas: grupos.length }
}
