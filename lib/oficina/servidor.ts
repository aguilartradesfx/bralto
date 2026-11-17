// La Oficina de Knox con la base de datos: leer la foto, marcar, y el interruptor de dormir.
// La lógica pura está en estado.ts. Este archivo también lo cargan scripts de Node sin Next.js,
// por eso los imports son relativos con .ts y no hay `server-only`.
// La capa de la oficina nunca debe frenar el trabajo real: marcar/revisado no lanzan y el estado falla abierto.
import { createServiceClient } from '../supabase/service.ts'
import { armarSnapshot } from './estado.ts'
import type { FilaNumeros, Pub } from './estado.ts'
import { escenaPendiente } from './fotos.ts'
import { aLaHoraCR } from './horario.ts'
import { POSTS_MAX, ultimaRonda, type SocialCrudo } from './social.ts'
import type { Agente, Comentario, EstadoIdea, EstadoOficina, FilaSemana, Idea, LineaTertulia, Marca, NuevaMarca, Ronda, RinconChat, Snapshot, Turno } from './tipos.ts'
import type { DatosRonda } from './tertulia.ts'
import type { RondaLimpia } from './validar.ts'

const HORA = 3_600_000
const DIA = 24 * HORA
const CACHE_MS = 20_000
const COLUMNAS_AGENTE = 'id,nombre,oficio,area,puesto,aspecto,personalidad,frase,horario,cada_minutos,ruta,donde,estado_fijo,despierto_siempre,dura_min,ultima_revision,lugar'
const DESPIERTA: EstadoOficina = { dormida: false, desde: null, por: null }
const BUCKET = 'oficina'

const db = () => createServiceClient()

export function idEstado(env: NodeJS.ProcessEnv = process.env): number {
  // Un valor explícito gana; sin él, una vista previa de Vercel o el desarrollo local nunca controla la oficina de producción
  if (env.OFICINA_ESTADO_ID === '1') return 1
  if (env.OFICINA_ESTADO_ID === '2') return 2
  return env.VERCEL_ENV === 'preview' || env.NODE_ENV === 'development' ? 2 : 1
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

// «Me sirve» / «No va» / deshacer. false si la idea no existe
export async function decidirIdea(id: string, estado: EstadoIdea): Promise<boolean> {
  const { data, error } = await db()
    .from('oficina_ideas')
    .update({ estado, decidida_en: estado === 'nueva' ? null : new Date().toISOString() })
    .eq('id', id).select('id')
  if (error) throw new Error(`oficina_ideas: ${error.message}`)
  return (data?.length ?? 0) > 0
}

// El me gusta de Alejandro en una publicación del foro. false si no existe
export async function ponerMeGusta(id: string, si: boolean): Promise<boolean> {
  const { data, error } = await db().from('oficina_posts').update({ te_gusta: si }).eq('id', id).select('id')
  if (error) throw new Error(`oficina_posts: ${error.message}`)
  return (data?.length ?? 0) > 0
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Ids de publicaciones a revisar: solo los que tienen formato uuid (una marca mal escrita no debe romper la lectura).
export function idsValidos(entregas: Pick<Marca, 'ref_tabla' | 'ref_id'>[]): string[] {
  return [...new Set(entregas.filter((m) => m.ref_tabla === 'redes_publicaciones' && m.ref_id && UUID.test(m.ref_id)).map((m) => m.ref_id as string))]
}

// Lo que se suma en la v2 (el chat y la semana) no tumba la foto: si falla, la oficina se ve sin eso
function blando<T>(tabla: string, r: { data: T[] | null, error: { message: string } | null }): T[] {
  if (!r.error) return r.data ?? []
  console.error(`[oficina] ${tabla}:`, r.error.message)
  return []
}

export async function leerOficina(ahora: Date): Promise<Snapshot> {
  try {
    const c = db()
    const hace24 = new Date(ahora.getTime() - DIA).toISOString()
    const hace7d = new Date(ahora.getTime() - 7 * DIA).toISOString()
    const hoy = aLaHoraCR(ahora, 0, 0).toISOString()
    const [ag, ma, en, nu, of, pu, ch, se] = await Promise.all([
      c.from('oficina_agentes').select(COLUMNAS_AGENTE).eq('activo', true).order('puesto', { ascending: true }),
      c.from('oficina_marcas').select('*').gte('creado_en', hace24).order('creado_en', { ascending: false }).limit(2000),
      c.from('oficina_marcas').select('*').eq('tipo', 'entrega').is('visto_en', null).gte('creado_en', hace7d).order('creado_en', { ascending: false }).limit(200),
      c.from('oficina_numeros').select('*'),
      c.from('oficina_estado').select('dormida,desde,por').eq('id', idEstado()).maybeSingle(),
      c.from('redes_publicaciones').select('id,titulo,publicar_en,prueba').eq('estado', 'programado').gte('publicar_en', ahora.toISOString()).order('publicar_en', { ascending: true }).limit(50),
      // La tertulia de hoy entera, también lo que sale más tarde: la página lo destapa a su hora (y de las visitas
      // que vienen solo sabe quién, a dónde y cuándo)
      c.from('oficina_chat').select('id,de,para,texto,rincon,donde,hilo,idea_id,mostrar_desde').gte('mostrar_desde', hoy).order('mostrar_desde', { ascending: true }).limit(200),
      c.from('oficina_semana').select('agente,dia,tareas,falla'),
    ])
    const agentes = (ok('oficina_agentes', ag) ?? []) as Agente[]
    const marcas = (ok('oficina_marcas', ma) ?? []) as Marca[]
    const entregas = (ok('oficina_marcas', en) ?? []) as Marca[]
    const numeros = (ok('oficina_numeros', nu) ?? []) as FilaNumeros[]
    const oficina = aEstado(ok('oficina_estado', of))
    const pubs = (ok('redes_publicaciones', pu) ?? []) as Pub[]
    const tertulia = blando('oficina_chat', ch) as LineaTertulia[]
    const semana = blando('oficina_semana', se) as FilaSemana[]

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
    return armarSnapshot({ agentes, marcas, entregas, numeros, oficina, pubs, resueltas, tertulia, semana }, ahora)
  } catch (e) {
    console.error('[oficina] leerOficina', e)
    return {
      ahora: ahora.toISOString(), oficina: { ...DESPIERTA }, agentes: [], marcas: [], paraTi: [], proximos: [],
      chat: [], escribiendo: null, pubs: [], visitas: [],
    }
  }
}

// ---------- el foro, las ideas y las fotos ----------

// Los posts que ya se ven y los que salen más tarde (a lo sumo los de la ronda del día y alguna foto de grupo)
const POSTS_LEIDOS = POSTS_MAX + 20
const IDEAS_LEIDAS = 300
const FOTOS_GRUPO_LEIDAS = 100
const COLUMNAS_FOTO = 'id,tipo,agentes,ruta,escena'

type FilaFoto = { id: string, tipo: 'retrato' | 'grupo', agentes: string[], ruta: string | null, escena: { titulo?: unknown } | null }

// Una foto `lista` del bucket: sin ruta no se puede mostrar; en las de grupo el pie es el título de su escena
export function fotoDeFila(f: FilaFoto): SocialCrudo['fotos'][number] | null {
  if (!f.ruta) return null
  const pie = f.tipo === 'grupo' && typeof f.escena?.titulo === 'string' ? f.escena.titulo : null
  return { id: f.id, tipo: f.tipo, agentes: f.agentes, ruta: f.ruta, pie }
}

// Lo crudo del bloque social. Trae también lo que sale en las próximas 24 h: quien lo guarda un rato (la caché de
// lib/panel/oficina.ts) igual lo destapa a su hora con armarSocial. Si algo falla, lanza.
export async function leerSocialCrudo(ahora: Date): Promise<SocialCrudo> {
  const c = db()
  const hasta = new Date(ahora.getTime() + DIA).toISOString()
  const [po, id, re, gr, ro] = await Promise.all([
    c.from('oficina_posts').select('id,de,tipo,titulo,texto,foto_id,likes,te_gusta,idea_id,mostrar_desde')
      .lte('mostrar_desde', hasta).order('mostrar_desde', { ascending: false }).limit(POSTS_LEIDOS),
    c.from('oficina_ideas').select('id,texto,por_que,de,post_id,estado,mostrar_desde,decidida_en')
      .lte('mostrar_desde', hasta).order('mostrar_desde', { ascending: false }).limit(IDEAS_LEIDAS),
    // Los retratos van todos, siempre (uno por Knox); el tope es solo para las fotos de grupo, las más nuevas
    c.from('oficina_fotos').select(COLUMNAS_FOTO).eq('tipo', 'retrato').eq('estado', 'lista').not('ruta', 'is', null),
    c.from('oficina_fotos').select(COLUMNAS_FOTO).eq('tipo', 'grupo').eq('estado', 'lista').not('ruta', 'is', null)
      .order('creada_en', { ascending: false }).limit(FOTOS_GRUPO_LEIDAS),
    // Las de los últimos días (tres por día como mucho): basta para tener todas las de hoy y quedarse con la última
    c.from('oficina_rondas').select('fecha,turno,resultado,detalle').order('fecha', { ascending: false }).limit(3),
  ])
  const posts = (ok('oficina_posts', po) ?? []) as SocialCrudo['posts']
  const comentarios = posts.length
    ? (ok('oficina_comentarios', await c.from('oficina_comentarios').select('id,post_id,de,texto,en_respuesta_a,idea_id,mostrar_desde')
      .in('post_id', posts.map((p) => p.id)).lte('mostrar_desde', hasta).order('mostrar_desde', { ascending: true }).limit(1000)) ?? []) as Comentario[]
    : []
  return {
    posts,
    comentarios,
    ideas: (ok('oficina_ideas', id) ?? []) as Idea[],
    fotos: ([...(ok('oficina_fotos', re) ?? []), ...(ok('oficina_fotos', gr) ?? [])] as FilaFoto[]).flatMap((f) => fotoDeFila(f) ?? []),
    ronda: ultimaRonda((ok('oficina_rondas', ro) ?? []) as Ronda[]),
  }
}

// Enlaces firmados de 1 h para las fotos del bucket privado, todos en una sola llamada. Una ruta que no se pudo
// firmar (el archivo no está) no viene y queda en el registro con su motivo (nunca un enlace); si falla la llamada, lanza.
export async function firmarFotos(rutas: string[]): Promise<Record<string, string>> {
  if (!rutas.length) return {}
  const { data, error } = await db().storage.from(BUCKET).createSignedUrls(rutas, 3600)
  if (error) throw new Error(`storage ${BUCKET}: ${error.message}`)
  const urls: Record<string, string> = {}
  const motivos = new Map<string, string>()
  for (const f of data) {
    if (!f.path) continue
    if (f.signedUrl && !f.error) urls[f.path] = f.signedUrl
    else motivos.set(f.path, f.error ?? 'vino sin enlace')
  }
  for (const ruta of rutas) {
    if (!urls[ruta]) console.error(`[oficina] no se pudo firmar ${ruta}: ${motivos.get(ruta) ?? 'no vino en la respuesta'}`)
  }
  return urls
}

// ---------- la tertulia ----------

const SIETE_DIAS = 7 * DIA

// Solo textos con algo escrito y sin repetir: son nombres reales de clientes, nunca se imprimen.
export function sinVacios(valores: (string | null | undefined)[]): string[] {
  return [...new Set(valores.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map(v => v.trim()))]
}

const PAGINA = 1000

// Lee una tabla entera por páginas de 1000 (el servidor corta en silencio lo que pase de su tope). Cada página
// arranca donde terminó la anterior y se para solo con una vacía: si el tope del servidor baja de 1000, no se pierde
// ni se salta ninguna fila. Si una página falla, lanza: la ronda nunca sigue con una lista incompleta.
export async function leerPaginas<T>(pagina: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null, error: { message: string } | null }>, tabla: string): Promise<T[]> {
  const todas: T[] = []
  for (;;) {
    const desde = todas.length
    const r = await pagina(desde, desde + PAGINA - 1)
    if (r.error) throw new Error(`${tabla}: ${r.error.message}`)
    const filas = r.data ?? []
    if (filas.length === 0) return todas
    todas.push(...filas)
  }
}

export async function leerDatosRonda(ahora: Date): Promise<DatosRonda> {
  const c = db()
  const ahoraIso = ahora.toISOString()
  const hace24 = new Date(ahora.getTime() - DIA).toISOString()
  const hace7d = new Date(ahora.getTime() - SIETE_DIAS).toISOString()
  const hoy = aLaHoraCR(ahora, 0, 0).toISOString()
  const [ag, ma, se, pr, an, id, po, re, es, clientes, contactos, chHoy, poHoy, coHoy] = await Promise.all([
    c.from('oficina_agentes').select(COLUMNAS_AGENTE).eq('activo', true).order('puesto', { ascending: true }),
    c.from('oficina_marcas').select('*').gte('creado_en', hace24).order('creado_en', { ascending: false }).limit(2000),
    c.from('oficina_semana').select('agente,dia,tareas,falla'),
    c.from('redes_pruebas').select('titulo,estado,actualizado_en').gte('actualizado_en', hace7d).order('actualizado_en', { ascending: false }).limit(20),
    c.from('redes_analisis').select('titulo,version,real,publicado_en').gte('publicado_en', hace7d).lte('publicado_en', ahoraIso).order('publicado_en', { ascending: false }).limit(20),
    c.from('oficina_ideas').select('texto,de').eq('estado', 'nueva').lte('mostrar_desde', ahoraIso).order('mostrar_desde', { ascending: false }).limit(20),
    c.from('oficina_posts').select('id,de,tipo,titulo').lte('mostrar_desde', ahoraIso).order('mostrar_desde', { ascending: false }).limit(10),
    c.from('oficina_fotos').select('agentes').eq('tipo', 'retrato').eq('estado', 'lista'),
    // La escena de grupo más nueva que espera su foto (las mismas que mira el generador en fotos-servidor.ts)
    c.from('oficina_fotos').select('id,creada_en').eq('tipo', 'grupo').eq('estado', 'pendiente').is('intentada_en', null)
      .not('escena', 'is', null).order('creada_en', { ascending: false }).limit(1),
    leerPaginas<{ empresa_nombre: string | null, representante_nombre: string | null }>(
      (d, h) => c.from('clients').select('empresa_nombre,representante_nombre').order('id').range(d, h), 'clients'),
    leerPaginas<{ nombre: string | null, apellido: string | null, empresa: string | null }>(
      (d, h) => c.from('crm_contactos').select('nombre,apellido,empresa').order('id').range(d, h), 'crm_contactos'),
    // Lo que ya se habló hoy en las rondas de antes (para seguir la plática sin repetir)
    c.from('oficina_chat').select('de,para,texto,rincon,donde,mostrar_desde').gte('mostrar_desde', hoy).order('mostrar_desde', { ascending: true }).limit(200),
    c.from('oficina_posts').select('de,tipo,titulo,texto,mostrar_desde').gte('mostrar_desde', hoy).order('mostrar_desde', { ascending: true }).limit(20),
    c.from('oficina_comentarios').select('de,post_id,texto,mostrar_desde').gte('mostrar_desde', hoy).order('mostrar_desde', { ascending: true }).limit(60),
  ])
  const posts = (ok('oficina_posts', po) ?? []) as { id: string, de: string, tipo: string, titulo: string }[]
  const cuentas = new Map<string, number>()
  if (posts.length) {
    const filas = ok<{ post_id: string }[]>('oficina_comentarios', await c.from('oficina_comentarios')
      .select('post_id').in('post_id', posts.map(p => p.id)).lte('mostrar_desde', ahoraIso)) ?? []
    for (const f of filas) cuentas.set(f.post_id, (cuentas.get(f.post_id) ?? 0) + 1)
  }
  const completos = contactos.map(k => (k.nombre?.trim() && k.apellido?.trim() ? `${k.nombre.trim()} ${k.apellido.trim()}` : null))
  const comentariosHoy = (ok('oficina_comentarios', coHoy) ?? []) as { de: string, post_id: string, texto: string, mostrar_desde: string }[]
  const titulos = new Map<string, string>()
  const idsPost = [...new Set(comentariosHoy.map(k => k.post_id))]
  if (idsPost.length) {
    const filas = ok<{ id: string, titulo: string }[]>('oficina_posts', await c.from('oficina_posts').select('id,titulo').in('id', idsPost)) ?? []
    for (const f of filas) titulos.set(f.id, f.titulo)
  }
  return {
    agentes: (ok('oficina_agentes', ag) ?? []) as Agente[],
    marcas: (ok('oficina_marcas', ma) ?? []) as Marca[],
    semana: (ok('oficina_semana', se) ?? []) as FilaSemana[],
    pruebas: (ok('redes_pruebas', pr) ?? []) as DatosRonda['pruebas'],
    reels: ((ok('redes_analisis', an) ?? []) as { titulo: string, version: number | null, real: { vistas?: number, guardados?: number } | null, publicado_en: string }[])
      .map(r => ({ titulo: r.titulo, version: r.version, vistas: r.real?.vistas ?? null, guardados: r.real?.guardados ?? null, publicado_en: r.publicado_en })),
    ideasNuevas: (ok('oficina_ideas', id) ?? []) as DatosRonda['ideasNuevas'],
    foroReciente: posts.map(p => ({ ...p, comentarios: cuentas.get(p.id) ?? 0 })),
    conFoto: [...new Set(((ok('oficina_fotos', re) ?? []) as { agentes: string[] }[]).flatMap(f => f.agentes))],
    prohibidos: sinVacios([
      ...clientes.flatMap(k => [k.empresa_nombre, k.representante_nombre]),
      ...completos,
      ...contactos.map(k => k.empresa),
    ]),
    // Con la misma regla del generador: espera si es de los últimos 7 días (una más vieja ya no se hará)
    escenaEsperando: escenaPendiente((ok('oficina_fotos', es) ?? []) as { id: string, creada_en: string }[], ahora).escena !== null,
    hoy: {
      chat: (ok('oficina_chat', chHoy) ?? []) as DatosRonda['hoy']['chat'],
      posts: (ok('oficina_posts', poHoy) ?? []) as DatosRonda['hoy']['posts'],
      comentarios: comentariosHoy.map(k => ({ de: k.de, post_titulo: titulos.get(k.post_id) ?? null, texto: k.texto, mostrar_desde: k.mostrar_desde })),
    },
  }
}

// ¿Ya hay líneas de la tertulia guardadas entre `desde` (entra) y `hasta` (no entra)? Para no repetir una ronda que se
// guardó pero no alcanzó a anotarse
export async function hayChatEntre(desde: Date, hasta: Date): Promise<boolean> {
  const { count, error } = await db().from('oficina_chat').select('id', { count: 'exact', head: true })
    .gte('mostrar_desde', desde.toISOString()).lt('mostrar_desde', hasta.toISOString())
  if (error) throw new Error(`oficina_chat: ${error.message}`)
  return (count ?? 0) > 0
}

// La ronda de ese turno de ese día (una por turno)
export async function rondaDe(fecha: string, turno: Turno): Promise<Ronda | null> {
  const f = ok<Ronda>('oficina_rondas', await db().from('oficina_rondas').select('fecha,turno,resultado,detalle').eq('fecha', fecha).eq('turno', turno).maybeSingle())
  return f ?? null
}

export async function anotarRonda(r: Ronda): Promise<void> {
  const { error } = await db().from('oficina_rondas')
    .upsert({ fecha: r.fecha, turno: r.turno, resultado: r.resultado, detalle: r.detalle }, { onConflict: 'fecha,turno' })
  if (error) throw new Error(`oficina_rondas: ${error.message}`)
}

export type FilaChat = {
  id: string
  de: string
  para: string | null
  texto: string
  rincon: RinconChat | null
  donde: string | null
  hilo: string | null
  idea_id: string | null
  mostrar_desde: string
}

// Las filas de oficina_chat de una ronda, por hora: las líneas sueltas y, de cada charla, sus líneas seguidas con un
// mismo hilo nuevo, cada una para el otro, con su rincón y, en una visita, el anfitrión en «donde».
// idea: el id con que se guardó la idea de esa clave (o null si no se guardó).
export function filasChat(l: Pick<RondaLimpia, 'chat' | 'charlas'>, nuevo: () => string, idea: (clave: string) => string | null): FilaChat[] {
  const sueltas: FilaChat[] = l.chat.map(m => ({
    id: nuevo(), de: m.de, para: m.para, texto: m.texto, rincon: m.rincon, donde: null, hilo: null,
    idea_id: m.idea ? idea(m.idea) : null, mostrar_desde: m.mostrar_desde,
  }))
  const deCharlas: FilaChat[] = l.charlas.flatMap(c => {
    const hilo = nuevo()
    return c.lineas.map(x => ({
      id: nuevo(), de: x.de, para: x.para, texto: x.texto, rincon: c.donde, donde: c.donde === 'visita' ? c.anfitrion : null, hilo,
      idea_id: null, mostrar_desde: x.mostrar_desde,
    }))
  })
  return [...sueltas, ...deCharlas].sort((a, b) => Date.parse(a.mostrar_desde) - Date.parse(b.mostrar_desde))
}

// Guarda la ronda ya limpia. Las «claves» de Claude solo sirven aquí para enlazar: nunca se guardan.
// Si algo falla, borra lo que ya había insertado con esos ids y lanza.
export async function guardarRonda(l: RondaLimpia, _ahora: Date): Promise<void> {
  const c = db()
  const nuevo = () => crypto.randomUUID()
  const idPost = new Map(l.posts.map(p => [p.clave, nuevo()]))
  const idIdea = new Map(l.ideas.map(i => [i.origen, nuevo()]))
  const idCom = new Map(l.comentarios.map(k => [k.clave, nuevo()]))
  const delChat = filasChat(l, nuevo, clave => idIdea.get(clave) ?? null)
  const idsChat = delChat.map(f => f.id)
  const idFoto = l.escena ? nuevo() : null
  const post_de = (post: string) => idPost.get(post) ?? post
  const insertados: string[] = []
  const insertar = async (tabla: string, filas: object[]) => {
    if (!filas.length) return
    insertados.push(tabla)
    const { error } = await c.from(tabla).insert(filas)
    if (error) throw new Error(`${tabla}: ${error.message}`)
  }
  try {
    await insertar('oficina_posts', l.posts.map(p => ({
      id: idPost.get(p.clave), de: p.de, tipo: p.tipo, titulo: p.titulo, texto: p.texto, likes: p.likes, mostrar_desde: p.mostrar_desde,
    })))
    await insertar('oficina_ideas', l.ideas.map(i => {
      const comentario = l.comentarios.find(k => k.clave === i.origen)
      return {
        id: idIdea.get(i.origen), texto: i.texto, por_que: i.por_que, de: i.de, mostrar_desde: i.mostrar_desde,
        post_id: idPost.get(i.origen) ?? (comentario ? post_de(comentario.post) : null),
      }
    }))
    for (const p of l.posts) {
      const idea = idIdea.get(p.clave)
      if (!idea) continue
      const { error } = await c.from('oficina_posts').update({ idea_id: idea }).eq('id', idPost.get(p.clave))
      if (error) throw new Error(`oficina_posts: ${error.message}`)
    }
    await insertar('oficina_comentarios', l.comentarios.map(k => ({
      id: idCom.get(k.clave), post_id: post_de(k.post), de: k.de, texto: k.texto,
      en_respuesta_a: k.responde_a ? idCom.get(k.responde_a) ?? null : null,
      idea_id: idIdea.get(k.clave) ?? null, mostrar_desde: k.mostrar_desde,
    })))
    await insertar('oficina_chat', delChat)
    if (l.escena && idFoto) {
      await insertar('oficina_fotos', [{ id: idFoto, tipo: 'grupo', estado: 'pendiente', agentes: l.escena.agentes, escena: l.escena }])
    }
  } catch (e) {
    // Hijos primero: el chat y los comentarios, luego las ideas, los posts y la foto
    const borrar: [string, string[]][] = [
      ['oficina_chat', idsChat], ['oficina_comentarios', [...idCom.values()]], ['oficina_ideas', [...idIdea.values()]],
      ['oficina_posts', [...idPost.values()]], ['oficina_fotos', idFoto ? [idFoto] : []],
    ]
    for (const [tabla, ids] of borrar) {
      if (!ids.length || !insertados.includes(tabla)) continue
      const { error } = await c.from(tabla).delete().in('id', ids)
      if (error) console.error(`[oficina] guardarRonda (deshacer ${tabla})`, error.message)
    }
    throw e
  }
}
