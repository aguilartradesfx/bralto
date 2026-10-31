// SERVER-ONLY — los datos de las vistas Ventas, Redes, Agenda y Conexiones del Centro de mando. Cada fuente con su
// tope de tiempo: si una falla, su parte llega en null («—») y lo demás sigue. Lo de Instagram se guarda 10 minutos.
// Las cuentas están en armar.ts (puro, con pruebas). Quien llama revisa antes el permiso (la ruta de la API).
import { createServiceClient } from '@/lib/supabase/service'
import { leerEntre } from '@/lib/calendario/servidor'
import { hoyCR, rangoUtc, sumarDias } from '@/lib/calendario/fechas'
import { nombreVisible } from '@/lib/crm/tipos'
import { leads } from '@/lib/knox/fuentes/base'
import { agenda } from '@/lib/knox/fuentes/ghl'
import { fecha as fechaIg, graph, tituloDe, tipoDe, type Medio } from '@/lib/knox/fuentes/redes'
import { seguidoresDeLaSemana, serieSeguidores, type Diario, type PostDia, type TareaDia } from '@/lib/knox/centro/armar'
import { leerChequeos } from '@/lib/knox/centro/chequeos'
import { conTope, memo, MIN, valor } from '@/lib/knox/centro/memoria'
import { contactosDeLaBandeja, embudo, esperando, personaDeLead } from '@/lib/knox/centro/servidor'
import { armarMovidas, armarPipelines, comentariosRecientes, diasAgenda, leadsDelMes, programadas, topPosts } from './armar'
import type {
  ComentarioReciente,
  CuentaRedes,
  DatosVista,
  PostTop,
  VistaAgenda,
  VistaConDatos,
  VistaConexiones,
  VistaRedes,
  VistaVentas,
} from './tipos'

const db = () => createServiceClient()
const DIA_S = 86_400
// Hoy y mañana. Cuando la agenda nueva (Google Calendar) traiga la semana, basta con subir este número
export const DIAS_AGENDA = 2
const ESPERANDO_VENTAS = 12

function revisar<T>(r: { data: T; error: { message: string } | null }, donde: string): T {
  if (r.error) throw new Error(`${donde}: ${r.error.message}`)
  return r.data
}

// Trae todas las filas, de a 1000 (el máximo de la API)
async function todas<T>(consulta: (desde: number, hasta: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> {
  const filas: T[] = []
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await consulta(desde, desde + 999)
    if (error) throw new Error(error.message)
    const pagina = (data ?? []) as T[]
    filas.push(...pagina)
    if (pagina.length < 1000) return filas
  }
}

// Ventas -------------------------------------------------------------------------------------------------------------

type FilaEtapa = { id: string; nombre: string; orden: number; pipeline_id: string }

async function pipelinesYEtapas() {
  const base = db()
  const [p, e] = await Promise.all([base.from('crm_pipelines').select('id, nombre, orden'), base.from('crm_etapas').select('id, nombre, orden, pipeline_id')])
  return {
    pipelines: revisar(p, 'crm_pipelines') as { id: string; nombre: string; orden: number }[],
    etapas: revisar(e, 'crm_etapas') as FilaEtapa[],
  }
}

async function pipelines(estructura: Promise<Awaited<ReturnType<typeof pipelinesYEtapas>>>) {
  const { pipelines: lista, etapas } = await estructura
  const abiertas = await todas<{ pipeline_id: string; etapa_id: string; valor: number | string | null }>((d, h) =>
    db().from('crm_oportunidades').select('pipeline_id, etapa_id, valor').eq('estado', 'abierta').range(d, h),
  )
  return armarPipelines(lista, etapas, abiertas)
}

async function movidas(estructura: Promise<Awaited<ReturnType<typeof pipelinesYEtapas>>>) {
  const { etapas } = await estructura
  const filas = revisar(
    await db()
      .from('crm_oportunidades')
      .select('nombre, valor, estado, etapa_id, cambio_etapa_en, actualizado_en, crm_contactos(nombre, apellido, correo, telefono)')
      .order('cambio_etapa_en', { ascending: false, nullsFirst: false })
      .order('actualizado_en', { ascending: false })
      .limit(6),
    'crm_oportunidades',
  ) as unknown as ({
    nombre: string
    valor: number | string | null
    estado: 'abierta' | 'ganada' | 'perdida' | 'abandonada'
    etapa_id: string
    cambio_etapa_en: string | null
    actualizado_en: string
    crm_contactos: { nombre: string; apellido: string; correo: string | null; telefono: string | null } | null
  })[]
  return armarMovidas(
    filas.map((f) => ({ ...f, contacto: f.crm_contactos ? nombreVisible(f.crm_contactos) : null })),
    etapas,
  )
}

async function leadsDe30Dias(ahora: Date) {
  const hoy = hoyCR(ahora)
  const desde = rangoUtc(sumarDias(hoy, -29), hoy).desde
  const [lista, contactos] = await Promise.all([leads(new Date(desde)), contactosDeLaBandeja(desde)])
  return leadsDelMes([...lista.map(personaDeLead), ...contactos], ahora)
}

async function leerVentas(ahora: Date): Promise<VistaVentas> {
  const estructura = pipelinesYEtapas()
  estructura.catch(() => undefined) // si falla, cada parte lo dice
  const [rEmbudo, rPipelines, rMovidas, rLeads, rEsperando] = await Promise.allSettled([
    conTope(embudo(hoyCR(ahora))),
    conTope(pipelines(estructura)),
    conTope(movidas(estructura)),
    conTope(leadsDe30Dias(ahora), 12_000),
    conTope(esperando(ESPERANDO_VENTAS)),
  ])
  return {
    embudo: valor(rEmbudo, 'el embudo'),
    pipelines: valor(rPipelines, 'los pipelines'),
    movidas: valor(rMovidas, 'lo que se movió'),
    leads: valor(rLeads, 'los leads de 30 días'),
    esperando: valor(rEsperando, 'la bandeja'),
  }
}

// Redes --------------------------------------------------------------------------------------------------------------

type MedioIg = Medio & { thumbnail_url?: string; media_url?: string }
type Insights = { data: { name: string; values?: { value: number; end_time?: string }[]; total_value?: { value: number } }[] }

const enMs = (m: MedioIg) => fechaIg(m.timestamp ?? '').getTime()

// Una cuenta: seguidores, su línea de 30 días, lo de 30 días y sus publicaciones de 30 días
async function cuentaRedes(id: string, token: string, ahora: Date): Promise<{ cuenta: CuentaRedes; medios: MedioIg[] }> {
  const hasta = Math.floor(ahora.getTime() / 1000)
  const desde = hasta - 30 * DIA_S
  const [perfil, diarios, totales, medios] = await Promise.allSettled([
    graph<{ username: string; followers_count: number }>(`${id}?fields=username,followers_count`, token),
    graph<Insights>(`${id}/insights?metric=follower_count&period=day&since=${desde}&until=${hasta}`, token),
    graph<Insights>(`${id}/insights?metric=views,saves,shares&period=day&metric_type=total_value&since=${desde}&until=${hasta}`, token),
    graph<{ data: MedioIg[] }>(
      `${id}/media?fields=id,caption,media_type,media_product_type,timestamp,permalink,thumbnail_url,media_url,comments_count&limit=30`,
      token,
    ),
  ])
  if (perfil.status === 'rejected') throw perfil.reason
  const valores = diarios.status === 'fulfilled' ? (diarios.value.data[0]?.values ?? []) : null
  const ds: Diario[] | null = valores
    ? valores
        .filter((v) => typeof v.value === 'number' && !!v.end_time && Number.isFinite(fechaIg(v.end_time).getTime()))
        .map((v) => ({ valor: v.value, fin: fechaIg(v.end_time!).toISOString() }))
    : null
  const total = (nombre: string) => (totales.status === 'fulfilled' ? (totales.value.data.find((d) => d.name === nombre)?.total_value?.value ?? null) : null)
  const seguidores = perfil.value.followers_count
  return {
    cuenta: {
      usuario: perfil.value.username,
      seguidores,
      semana: ds && ds.length ? seguidoresDeLaSemana(ds) : null,
      serie: ds && ds.length >= 2 ? serieSeguidores(seguidores, ds) : null,
      desde: ds && ds.length >= 2 ? sumarDias(hoyCR(ahora), -ds.length) : null,
      vistas: total('views'),
      guardados: total('saves'),
      compartidos: total('shares'),
    },
    medios: (medios.status === 'fulfilled' ? medios.value.data : []).filter(
      (m) => Number.isFinite(enMs(m)) && ahora.getTime() - enMs(m) <= 30 * DIA_S * 1000,
    ),
  }
}

async function postTop(m: MedioIg, cuenta: string, token: string): Promise<PostTop> {
  let n: Record<string, number | null> = {}
  try {
    const ins = await graph<Insights>(`${m.id}/insights?metric=views,reach,saved,shares`, token)
    n = Object.fromEntries(ins.data.map((d) => [d.name, d.values?.[0]?.value ?? null]))
  } catch {
    // sin números, va al final
  }
  return {
    cuenta,
    titulo: tituloDe(m.caption),
    tipo: tipoDe(m),
    en: fechaIg(m.timestamp).toISOString(),
    imagen: m.thumbnail_url ?? m.media_url ?? null,
    enlace: m.permalink ?? null,
    vistas: n.views ?? null,
    alcance: n.reach ?? null,
    guardados: n.saved ?? null,
    compartidos: n.shares ?? null,
  }
}

async function comentariosDe(m: MedioIg, token: string): Promise<ComentarioReciente[]> {
  if (!m.comments_count) return []
  const j = await graph<{ data?: { text?: string; username?: string; timestamp: string }[] }>(`${m.id}/comments?fields=text,username,timestamp&limit=50`, token)
  return (j.data ?? [])
    .filter((c) => c.username && Number.isFinite(fechaIg(c.timestamp).getTime()))
    .map((c) => ({ usuario: c.username!, texto: (c.text ?? '').slice(0, 200), en: fechaIg(c.timestamp).toISOString(), publicacion: tituloDe(m.caption) }))
}

// Las dos cuentas, las 5 mejores de 30 días (un collab se cuenta una vez) y los comentarios de la semana
async function instagramDeRedes(ahora: Date): Promise<Pick<VistaRedes, 'cuentas' | 'top' | 'comentarios'>> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) throw new Error('falta META_ACCESS_TOKEN')
  const ids = [process.env.META_IG_USER_ID, process.env.META_IG_COLAB_USER_ID]
  const cuentas = await Promise.allSettled(ids.map((id) => (id ? conTope(cuentaRedes(id, token, ahora), 15_000) : Promise.reject(new Error('sin cuenta')))))
  const leidas = cuentas.map((c) => (c.status === 'fulfilled' ? c.value : null))
  const unicos = new Map<string, { m: MedioIg; cuenta: string }>()
  for (const c of leidas) {
    if (!c) continue
    for (const m of c.medios) if (!unicos.has(m.permalink ?? m.id)) unicos.set(m.permalink ?? m.id, { m, cuenta: c.cuenta.usuario })
  }
  const recientes = [...unicos.values()].sort((a, b) => enMs(b.m) - enMs(a.m)).slice(0, 20)
  const semana = new Date(ahora.getTime() - 7 * DIA_S * 1000)
  const propias = new Set(leidas.filter((c) => !!c).map((c) => c!.cuenta.usuario.toLowerCase()))
  const [top, comentarios] = await Promise.allSettled([
    Promise.all(recientes.map(({ m, cuenta }) => postTop(m, cuenta, token))),
    Promise.all(recientes.filter(({ m }) => enMs(m) >= semana.getTime()).map(({ m }) => comentariosDe(m, token).catch(() => []))),
  ])
  return {
    cuentas: leidas.map((c) => c?.cuenta ?? null),
    top: top.status === 'fulfilled' && leidas.some(Boolean) ? topPosts(top.value) : null,
    comentarios: comentarios.status === 'fulfilled' && leidas.some(Boolean) ? comentariosRecientes(comentarios.value.flat(), propias, semana) : null,
  }
}

async function leerRedes(ahora: Date): Promise<VistaRedes> {
  const desde = new Date(ahora.getTime() - 60 * 60_000).toISOString()
  const hasta = new Date(ahora.getTime() + 7 * DIA_S * 1000).toISOString()
  const [rIg, rProximas] = await Promise.allSettled([
    conTope(
      memo('vista-redes', 10 * MIN, () => instagramDeRedes(ahora)),
      25_000,
    ),
    conTope(leerEntre(desde, hasta)),
  ])
  const ig = valor(rIg, 'Instagram (redes)')
  const proximas = valor(rProximas, 'el calendario')
  return {
    cuentas: ig?.cuentas ?? [null, null],
    top: ig?.top ?? null,
    comentarios: ig?.comentarios ?? null,
    proximas: proximas ? programadas(proximas as PostDia[], ahora) : null,
  }
}

// Agenda -------------------------------------------------------------------------------------------------------------

async function tareasEntre(desde: string, hasta: string): Promise<TareaDia[]> {
  const filas = revisar(
    await db()
      .from('crm_tareas')
      .select('titulo, vence_en, hecha, crm_contactos(nombre, apellido, correo, telefono)')
      .gte('vence_en', desde)
      .lt('vence_en', hasta)
      .order('vence_en')
      .limit(100),
    'crm_tareas',
  ) as unknown as {
    titulo: string
    vence_en: string
    hecha: boolean
    crm_contactos: { nombre: string; apellido: string; correo: string | null; telefono: string | null } | null
  }[]
  return filas.map((t) => ({
    titulo: t.titulo,
    vence_en: new Date(t.vence_en).toISOString(),
    hecha: t.hecha,
    contacto: t.crm_contactos ? nombreVisible(t.crm_contactos) : null,
  }))
}

async function leerAgenda(ahora: Date): Promise<VistaAgenda> {
  const hoy = hoyCR(ahora)
  const { desde, hasta } = rangoUtc(hoy, sumarDias(hoy, DIAS_AGENDA - 1))
  const [rCitas, rPosts, rTareas] = await Promise.allSettled([
    // La agenda (hoy GoHighLevel, pronto Google Calendar) mantiene esta firma: agenda(ahora) → Cita[]
    conTope(
      memo(`vista-citas:${hoy}`, 2 * MIN, () => agenda(ahora)),
      12_000,
    ),
    conTope(leerEntre(desde, hasta)),
    conTope(tareasEntre(desde, hasta)),
  ])
  const citas = valor(rCitas, 'las citas')
  const posts = valor(rPosts, 'las publicaciones')
  const tareas = valor(rTareas, 'las tareas')
  const faltan = [citas ? null : 'citas', posts ? null : 'posts', tareas ? null : 'tareas'].filter((x): x is string => !!x)
  return {
    dias: diasAgenda(
      {
        citas: (citas ?? []).filter((c) => c.inicio >= desde && c.inicio < hasta).map((c) => ({ titulo: c.titulo, inicio: c.inicio })),
        posts: (posts ?? []) as PostDia[],
        tareas: tareas ?? [],
      },
      ahora,
      DIAS_AGENDA,
    ),
    faltan,
  }
}

// Conexiones ---------------------------------------------------------------------------------------------------------

async function leerConexiones(): Promise<VistaConexiones> {
  return { chequeos: await leerChequeos() }
}

// La vista que se abrió
export async function leerVistaDelCentro<V extends VistaConDatos>(nombre: V, ahora = new Date()): Promise<DatosVista[V]> {
  const lectores: { [K in VistaConDatos]: () => Promise<DatosVista[K]> } = {
    ventas: () => memo('vista-ventas', 30_000, () => leerVentas(ahora)),
    redes: () => leerRedes(ahora),
    agenda: () => leerAgenda(ahora),
    conexiones: leerConexiones,
  }
  return lectores[nombre]() as Promise<DatosVista[V]>
}
