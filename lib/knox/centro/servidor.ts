// SERVER-ONLY — el Centro de mando de Knox (/knox): junta lo de cada fuente con un tope de tiempo. Si una falla, su
// parte llega en null (la pantalla muestra «—») y lo demás sigue. Lo lento de afuera (Instagram, el clima, el dólar,
// las conexiones) se guarda unos minutos en memoria, porque la pantalla pregunta cada 60 s. Las cuentas están en
// armar.ts (puro, con pruebas). Quien llama revisa antes el permiso (la ruta de la API).
import { createServiceClient } from '@/lib/supabase/service'
import { leerEntre } from '@/lib/calendario/servidor'
import { hoyCR, rangoUtc, sumarDias } from '@/lib/calendario/fechas'
import { ajustesKnox, enviarBorrador, listarBandeja } from '@/lib/crm/bandeja/servidor'
import { canalKnox, ultimoEntrante } from '@/lib/crm/bandeja/almacen'
import { nombreVisible } from '@/lib/crm/tipos'
import { leads } from '@/lib/knox/fuentes/base'
import { tipoDeCambio } from '@/lib/knox/fuentes/cambio'
import { agenda } from '@/lib/knox/fuentes/ghl'
import { fecha as fechaIg, graph, tituloDe, tipoDe, type Medio } from '@/lib/knox/fuentes/redes'
import type { Lead } from '@/lib/knox/tipos'
import { clienteDelEntorno } from '@/lib/zernio/cliente'
import {
  CANAL_CLIENTE,
  armarEsperando,
  armarPulso,
  clientesNuevos,
  elegirMejor,
  esEtapaDePropuesta,
  marcasDelDia,
  porResponder,
  seguidoresDeLaSemana,
  serieSeguidores,
  tuDia,
  whatsappConectado,
  type CitaDia,
  type CuentaZernioMin,
  type Diario,
  type FilaBandeja,
  type Persona,
  type PostDia,
  type TareaDia,
} from '@/lib/knox/centro/armar'
import { aprobarBorradores, MAX_BORRADORES } from '@/lib/knox/centro/aprobar'
import { cuentasGoogle } from '@/lib/knox/centro/chequeos'
import { estadoCorreo } from '@/lib/knox/centro/conexiones'
import { conTope, memo, MIN, TOPE_MS, valor } from '@/lib/knox/centro/memoria'
import type { Centro, Conexion, Dia, Embudo, Esperando, Instagram, PostIg } from '@/lib/knox/centro/tipos'

const SITIO = 'https://www.bralto.io'
// San José, sin clave
const CLIMA = 'https://api.open-meteo.com/v1/forecast?latitude=9.9281&longitude=-84.0907&current=temperature_2m&timezone=America/Costa_Rica'
// Las que caben en el panel más alto (en 16:10 caben 4)
const ESPERANDO_MAX = 8

const db = () => createServiceClient()

function revisar<T>(r: { data: T; error: { message: string } | null }, donde: string): T {
  if (r.error) throw new Error(`${donde}: ${r.error.message}`)
  return r.data
}

function contar(r: { count: number | null; error: { message: string } | null }, donde: string): number {
  if (r.error) throw new Error(`${donde}: ${r.error.message}`)
  return r.count ?? 0
}

// Cabecera -----------------------------------------------------------------------------------------------------------

async function clima(): Promise<number> {
  const res = await fetch(CLIMA, { cache: 'no-store', signal: AbortSignal.timeout(TOPE_MS) })
  if (!res.ok) throw new Error(`Open-Meteo: HTTP ${res.status}`)
  const t = ((await res.json()) as { current?: { temperature_2m?: unknown } }).current?.temperature_2m
  if (typeof t !== 'number') throw new Error('Open-Meteo: vino sin temperatura')
  return t
}

// Personas nuevas ----------------------------------------------------------------------------------------------------

export const personaDeLead = (l: Lead): Persona => ({ clave: `lead|${l.origen}|${l.en}|${l.nombre}`, en: l.en, canal: 'Sitio web' })

// Los contactos que Knox sacó de la bandeja (una conversación de trabajo) desde `desde`
export async function contactosDeLaBandeja(desde: string): Promise<Persona[]> {
  const base = db()
  const contactos = revisar(
    await base.from('crm_contactos').select('id, creado_en').eq('origen', 'zernio').gte('creado_en', desde).limit(1000),
    'crm_contactos',
  ) as { id: string; creado_en: string }[]
  if (contactos.length === 0) return []
  const conversaciones = revisar(
    await base
      .from('crm_conversaciones')
      .select('contacto_id, canal')
      .in(
        'contacto_id',
        contactos.map((c) => c.id),
      )
      .eq('tipo', 'trabajo'),
    'crm_conversaciones',
  ) as { contacto_id: string; canal: string }[]
  const canal = new Map(conversaciones.map((c) => [c.contacto_id, CANAL_CLIENTE[canalKnox(c.canal)]]))
  return contactos.filter((c) => canal.has(c.id)).map((c) => ({ clave: c.id, en: c.creado_en, canal: canal.get(c.id)! }))
}

// Te están esperando ---------------------------------------------------------------------------------------------------

// cuantas: las que se mandan a la pantalla (Hoy muestra las que caben; Ventas, más)
export async function esperando(cuantas = ESPERANDO_MAX): Promise<Esperando> {
  const { filas } = await listarBandeja('por_responder', 200)
  const lista: FilaBandeja[] = filas.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    canal: f.canal,
    tipo: f.tipo,
    ultimoEn: f.ultimoEn,
    vistaPrevia: f.vistaPrevia,
    ultimoDeLaPersona: f.ultimoDeLaPersona,
    contactoId: f.contactoId,
    pendiente: f.pendiente ? { id: f.pendiente.id, respuesta: f.pendiente.respuesta } : null,
  }))
  const base = db()
  const contactos = porResponder(lista)
    .slice(0, cuantas)
    .map((f) => f.contactoId)
    .filter((id): id is string => !!id)
  const [etiquetas, borradores] = await Promise.all([
    contactos.length
      ? base.from('crm_contactos').select('id, etiquetas').in('id', contactos)
      : Promise.resolve({ data: [] as { id: string; etiquetas: string[] }[], error: null }),
    base
      .from('crm_knox_decisiones')
      .select('id')
      .eq('estado', 'pendiente')
      .not('respuesta', 'is', null)
      .order('creado_en', { ascending: false })
      .limit(MAX_BORRADORES),
  ])
  const porContacto = new Map(((revisar(etiquetas, 'crm_contactos') ?? []) as { id: string; etiquetas: string[] | null }[]).map((c) => [c.id, c.etiquetas ?? []]))
  const ids = ((revisar(borradores, 'crm_knox_decisiones') ?? []) as { id: string }[]).map((b) => b.id)
  return armarEsperando(lista, porContacto, ids, cuantas)
}

// Camino a la venta (este mes) ---------------------------------------------------------------------------------------

export async function embudo(hoy: string): Promise<Embudo> {
  const base = db()
  const mes = rangoUtc(`${hoy.slice(0, 7)}-01`, hoy).desde
  const [llegaron, conversando, etapas, ganados] = await Promise.all([
    base.from('crm_contactos').select('id', { count: 'exact', head: true }).gte('creado_en', mes),
    base.from('crm_conversaciones').select('id', { count: 'exact', head: true }).eq('tipo', 'trabajo').gte('ultimo_mensaje_en', mes),
    base.from('crm_etapas').select('id, nombre'),
    base.from('crm_oportunidades').select('id', { count: 'exact', head: true }).eq('estado', 'ganada').gte('actualizado_en', mes),
  ])
  const dePropuesta = ((revisar(etapas, 'crm_etapas') ?? []) as { id: string; nombre: string }[]).filter((e) => esEtapaDePropuesta(e.nombre)).map((e) => e.id)
  const propuesta = dePropuesta.length
    ? contar(
        await base.from('crm_oportunidades').select('id', { count: 'exact', head: true }).eq('estado', 'abierta').in('etapa_id', dePropuesta),
        'crm_oportunidades',
      )
    : 0
  return {
    llegaron: contar(llegaron, 'crm_contactos'),
    conversando: contar(conversando, 'crm_conversaciones'),
    propuesta,
    ganados: contar(ganados, 'crm_oportunidades'),
  }
}

// Instagram ----------------------------------------------------------------------------------------------------------

type MedioIg = Medio & { thumbnail_url?: string; media_url?: string }
type Insights = { data: { name: string; values?: { value: number; end_time?: string }[]; total_value?: { value: number } }[] }

const DIA_S = 86_400

// La cuenta de META_IG_USER_ID: seguidores, su línea de 30 días, lo de los últimos 30 días y los posts con sus números
async function instagram(ahora: Date): Promise<{ cuenta: Instagram; posts: PostIg[] }> {
  const token = process.env.META_ACCESS_TOKEN
  const id = process.env.META_IG_USER_ID
  if (!token || !id) throw new Error('faltan META_ACCESS_TOKEN o META_IG_USER_ID')
  const hasta = Math.floor(ahora.getTime() / 1000)
  const desde = hasta - 30 * DIA_S
  const [perfil, diarios, totales, medios] = await Promise.allSettled([
    graph<{ username: string; followers_count: number }>(`${id}?fields=username,followers_count`, token),
    graph<Insights>(`${id}/insights?metric=follower_count&period=day&since=${desde}&until=${hasta}`, token),
    graph<Insights>(`${id}/insights?metric=views,saves,shares&period=day&metric_type=total_value&since=${desde}&until=${hasta}`, token),
    graph<{ data: MedioIg[] }>(`${id}/media?fields=id,caption,media_type,media_product_type,timestamp,permalink,thumbnail_url,media_url&limit=25`, token),
  ])
  // Sin el perfil no hay panel: también es la prueba de que el token responde
  if (perfil.status === 'rejected') throw perfil.reason

  const valores = diarios.status === 'fulfilled' ? (diarios.value.data[0]?.values ?? []) : null
  const ds: Diario[] | null = valores
    ? valores
        .filter((v) => typeof v.value === 'number' && !!v.end_time && Number.isFinite(fechaIg(v.end_time).getTime()))
        .map((v) => ({ valor: v.value, fin: fechaIg(v.end_time!).toISOString() }))
    : null
  const total = (nombre: string) =>
    totales.status === 'fulfilled' ? (totales.value.data.find((d) => d.name === nombre)?.total_value?.value ?? null) : null
  const seguidores = perfil.value.followers_count
  const cuenta: Instagram = {
    usuario: perfil.value.username,
    seguidores,
    semana: ds && ds.length ? seguidoresDeLaSemana(ds) : null,
    serie: ds && ds.length >= 2 ? serieSeguidores(seguidores, ds) : null,
    desde: ds && ds.length >= 2 ? sumarDias(hoyCR(ahora), -ds.length) : null,
    vistas: total('views'),
    guardados: total('saves'),
    compartidos: total('shares'),
  }

  // Los números de cada post: solo los de la semana (o, si no hubo, los del mes), que son los que se comparan
  const lista = (medios.status === 'fulfilled' ? medios.value.data : []).filter((m) => Number.isFinite(fechaIg(m.timestamp ?? '').getTime()))
  const dentro = (dias: number) => lista.filter((m) => ahora.getTime() - fechaIg(m.timestamp).getTime() <= dias * DIA_S * 1000)
  const ventana = (dentro(7).length ? dentro(7) : dentro(30)).slice(0, 25)
  const posts = await Promise.all(
    ventana.map(async (m): Promise<PostIg> => {
      let vistas: number | null = null
      let alcance: number | null = null
      try {
        const ins = await graph<Insights>(`${m.id}/insights?metric=views,reach`, token)
        const v = (n: string) => ins.data.find((d) => d.name === n)?.values?.[0]?.value ?? null
        vistas = v('views')
        alcance = v('reach')
      } catch {
        // sin números ese post no entra a la comparación
      }
      return {
        titulo: tituloDe(m.caption),
        tipo: tipoDe(m),
        en: fechaIg(m.timestamp).toISOString(),
        imagen: m.thumbnail_url ?? m.media_url ?? null,
        enlace: m.permalink ?? null,
        vistas,
        alcance,
      }
    }),
  )
  return { cuenta, posts }
}

// Tu día -------------------------------------------------------------------------------------------------------------

async function citasDeHoy(ahora: Date): Promise<CitaDia[]> {
  const hoy = hoyCR(ahora)
  const { desde, hasta } = rangoUtc(hoy, hoy)
  return (await agenda(ahora)).filter((c) => c.inicio >= desde && c.inicio < hasta).map((c) => ({ titulo: c.titulo, inicio: c.inicio }))
}

async function postsDeHoy(hoy: string): Promise<PostDia[]> {
  const { desde, hasta } = rangoUtc(hoy, hoy)
  return (await leerEntre(desde, hasta)).map((p) => ({ titulo: p.titulo, tipo: p.tipo, estado: p.estado, publicar_en: p.publicar_en }))
}

async function tareasDeHoy(hoy: string): Promise<TareaDia[]> {
  const { desde, hasta } = rangoUtc(hoy, hoy)
  const filas = revisar(
    await db()
      .from('crm_tareas')
      .select('titulo, vence_en, hecha, crm_contactos(nombre, apellido, correo, telefono)')
      .gte('vence_en', desde)
      .lt('vence_en', hasta)
      .order('vence_en')
      .limit(50),
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

// Pulso del día: cuándo entró cada mensaje de la bandeja desde `desde`
async function mensajesDesde(desde: string): Promise<string[]> {
  const filas = revisar(
    await db()
      .from('crm_mensajes')
      .select('enviado_en')
      .eq('origen', 'zernio')
      .eq('direccion', 'entrante')
      .neq('tipo', 'actividad')
      .gte('enviado_en', desde)
      .order('enviado_en')
      .limit(5000),
    'crm_mensajes',
  ) as { enviado_en: string }[]
  return filas.map((f) => new Date(f.enviado_en).toISOString())
}

// Conexiones -----------------------------------------------------------------------------------------------------------

async function cuentasZernio(): Promise<CuentaZernioMin[]> {
  return (await clienteDelEntorno().cuentas()) as CuentaZernioMin[]
}

async function sitioEnLinea(): Promise<boolean> {
  const res = await fetch(SITIO, { redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(TOPE_MS) })
  await res.body?.cancel().catch(() => undefined)
  return res.status === 200
}

// Todo junto -----------------------------------------------------------------------------------------------------------

export async function leerCentro(ahora = new Date()): Promise<Centro> {
  const hoy = hoyCR(ahora)
  // Desde las 00:00 de hace 7 días: para comparar con ayer y para el día de siempre del pulso
  const semana = rangoUtc(sumarDias(hoy, -7), hoy).desde
  const [rClima, rDolar, rLeads, rContactos, rEsperando, rEmbudo, rIg, rCitas, rPosts, rTareas, rMensajes, rZernio, rSitio, rModo, rGoogle] =
    await Promise.allSettled([
      conTope(memo('clima', 10 * MIN, clima)),
      conTope(memo('dolar', 30 * MIN, tipoDeCambio)),
      conTope(leads(new Date(semana))),
      conTope(contactosDeLaBandeja(semana)),
      conTope(esperando()),
      conTope(embudo(hoy)),
      conTope(
        memo('instagram', 10 * MIN, () => instagram(ahora)),
        20_000,
      ),
      conTope(memo(`citas:${hoy}`, 5 * MIN, () => citasDeHoy(ahora))),
      conTope(postsDeHoy(hoy)),
      conTope(tareasDeHoy(hoy)),
      conTope(mensajesDesde(semana)),
      conTope(memo('zernio', 5 * MIN, cuentasZernio)),
      conTope(memo('sitio', 2 * MIN, sitioEnLinea)),
      conTope(ajustesKnox()),
      conTope(cuentasGoogle(), 12_000),
    ])

  const listaLeads = valor(rLeads, 'leads')
  const contactos = valor(rContactos, 'contactos de la bandeja')
  const personas = listaLeads && contactos ? [...listaLeads.map(personaDeLead), ...contactos] : null

  const citas = valor(rCitas, 'citas')
  const posts = valor(rPosts, 'publicaciones')
  const tareas = valor(rTareas, 'tareas')
  const faltan = [citas ? null : 'citas', posts ? null : 'posts', tareas ? null : 'tareas'].filter((x): x is string => !!x)
  const dia: Dia | null =
    faltan.length < 3 ? { items: tuDia({ citas: citas ?? [], posts: posts ?? [], tareas: tareas ?? [] }, ahora), faltan } : null

  const mensajes = valor(rMensajes, 'mensajes de la bandeja')
  const propuestas = (listaLeads ?? []).filter((l) => /propuesta/i.test(l.origen)).map((l) => l.en)
  const pulso = mensajes
    ? armarPulso({ mensajes, personas: personas ?? [], marcas: marcasDelDia({ posts: posts ?? [], citas: citas ?? [], propuestas }, ahora) }, ahora)
    : null

  const ig = valor(rIg, 'Instagram')
  const zernio = valor(rZernio, 'cuentas de Zernio')
  const sitio = valor(rSitio, 'el sitio')
  const google = valor(rGoogle, 'las cuentas de Google')
  const correo = google ? estadoCorreo(google) : null
  const conexion = (ok: boolean | null, sinCuenta: Conexion = 'caido'): Conexion => (ok === null ? 'caido' : ok ? 'conectado' : sinCuenta)

  return {
    generadoEn: ahora.toISOString(),
    temperatura: valor(rClima, 'el clima'),
    dolar: valor(rDolar, 'el dólar')?.venta ?? null,
    clientes: personas ? clientesNuevos(personas, ahora) : null,
    esperando: valor(rEsperando, 'la bandeja'),
    embudo: valor(rEmbudo, 'el embudo'),
    instagram: ig?.cuenta ?? null,
    mejor: ig ? elegirMejor(ig.posts, ahora) : null,
    dia,
    pulso,
    conexiones: {
      instagram: conexion(ig ? true : null),
      whatsapp: conexion(zernio ? whatsappConectado(zernio) : null, 'por-conectar'),
      sitio: conexion(sitio),
      // «Conectado (2)» si responden las dos cuentas de Google
      correo: correo?.estado ?? 'caido',
      correoCuentas: correo ? { conectadas: correo.conectadas, total: correo.total } : null,
    },
    modo: valor(rModo, 'el modo de Knox')?.modo ?? null,
  }
}

// «Sí, escríbeles» -----------------------------------------------------------------------------------------------------

// Manda las respuestas de Knox que Ale aprobó (ids), con el mismo «Enviar» del borrador en la bandeja
export async function aprobarDesdeElCentro(ids: string[]): Promise<{ enviadas: number; fallidas: number }> {
  const base = db()
  return aprobarBorradores(
    {
      ahora: () => new Date(),
      pendientes: async (lista) => {
        const filas = revisar(
          await base
            .from('crm_knox_decisiones')
            .select('id, conversacion_id, crm_conversaciones(canal)')
            .in('id', lista)
            .eq('estado', 'pendiente')
            .not('respuesta', 'is', null),
          'crm_knox_decisiones',
        ) as unknown as { id: string; conversacion_id: string; crm_conversaciones: { canal: string } | null }[]
        return filas.map((f) => ({ id: f.id, conversacionId: f.conversacion_id, canal: canalKnox(f.crm_conversaciones?.canal) }))
      },
      ultimoEntrante: async (conversacionId) => (await ultimoEntrante(base, conversacionId))?.en ?? null,
      enviar: async (decisionId) => {
        const r = await enviarBorrador(decisionId)
        if (!r.ok) console.error(`[knox-centro] no salió la respuesta ${decisionId}: ${r.error}`)
        return { ok: r.ok }
      },
    },
    ids,
  )
}
