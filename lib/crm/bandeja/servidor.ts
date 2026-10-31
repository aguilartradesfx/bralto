// SERVER-ONLY — la bandeja con sus conexiones reales: Supabase (service role), Zernio, Claude (decidir de Knox) y
// Telegram. Quien llama revisa antes el permiso (la página o la ruta de la API), salvo el webhook, que revisa la firma.
import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { decidir } from '@/lib/knox/conversar/decidir'
import type { CanalKnox, ContextoKnox, DecisionKnox, ModoKnox, TipoMensaje } from '@/lib/knox/conversar/tipos'
import { clienteDelEntorno, type ClienteZernio } from '@/lib/zernio/cliente'
import { telefonoDe, leerEvento, type Remitente } from '@/lib/crm/bandeja/zernio'
import * as almacen from '@/lib/crm/bandeja/almacen'
import { atenderMensaje, type DepsKnox } from '@/lib/crm/bandeja/knox'
import { procesarEvento } from '@/lib/crm/bandeja/procesar'
import { UUID } from '@/lib/crm/validar'
import {
  nombreConversacion,
  vistaPrevia,
  type AjustesKnox,
  type AutorBandeja,
  type ConversacionDetalle,
  type ConversacionLista,
  type DecisionLista,
  type Filtro,
  type MensajeHilo,
} from '@/lib/crm/bandeja/vista'

const db = () => createServiceClient()
const POR_HILO = 100
const OTRA_APP_DIAS = 14

export type Falla = { ok: false; error: string; status: number }

// Las cuentas propias (Instagram, la página, el WhatsApp) y las que se agreguen en ZERNIO_IDS_PROPIOS (ids, @ o
// números separados por comas): lo que escriben no lo contesta Knox. Se piden a Zernio cada 10 minutos
let propias: { en: number; ids: Set<string> } | null = null
const normal = (v: string) => v.trim().toLowerCase().replace(/^@+/, '')

async function idsPropios(z: ClienteZernio | null): Promise<Set<string>> {
  if (propias && Date.now() - propias.en < 10 * 60_000) return propias.ids
  const ids = new Set((process.env.ZERNIO_IDS_PROPIOS ?? '').split(',').map(normal).filter(Boolean))
  for (const v of [process.env.ZERNIO_IG_ACCOUNT_ID, process.env.ZERNIO_FB_ACCOUNT_ID]) if (v) ids.add(normal(v))
  if (z) {
    try {
      for (const c of await z.cuentas()) {
        for (const v of [c._id, c.platformUserId, c.username]) {
          if (!v) continue
          ids.add(normal(String(v)))
          const digitos = String(v).replace(/\D/g, '')
          if (digitos.length >= 8 && /^[+\d\s()-]+$/.test(String(v))) ids.add(digitos)
        }
      }
    } catch (err) {
      console.error('[bandeja] no se pudieron leer las cuentas de Zernio:', err instanceof Error ? err.message : err)
    }
  }
  propias = { en: Date.now(), ids }
  return ids
}

export function esDeLasPropias(r: Remitente, ids: Set<string>): boolean {
  return [r.id, r.usuario, r.telefono?.replace(/\D/g, '')].some((v) => !!v && ids.has(normal(v)))
}

export async function avisarPorTelegram(texto: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) return
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: texto, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) console.error(`[bandeja] Telegram rechazó el aviso (HTTP ${res.status})`)
  } catch (err) {
    console.error('[bandeja] no salió el aviso a Telegram:', err instanceof Error ? err.message : err)
  }
}

function zernioOpcional(): ClienteZernio | null {
  return process.env.ZERNIO_API_KEY ? clienteDelEntorno() : null
}

function depsKnox(base: ReturnType<typeof db>, z: ClienteZernio | null): DepsKnox {
  return {
    ahora: () => new Date(),
    esperar: (ms) => new Promise((ok) => setTimeout(ok, ms)),
    ajustes: () => almacen.leerAjustes(base),
    esPropia: async (r) => esDeLasPropias(r, await idsPropios(z)),
    conversacion: (id) => almacen.conversacionKnox(base, id),
    ultimoEntrante: async (id) => (await almacen.ultimoEntrante(base, id))?.id ?? null,
    mensajes: (id, n) => almacen.mensajesParaKnox(base, id, n),
    contacto: (id) => almacen.contextoContacto(base, id),
    decidir,
    guardarDecision: (d) => almacen.guardarDecision(base, d),
    marcarEnviada: (id, mensajeId) => almacen.marcarEnviada(base, id, mensajeId),
    anotarError: (id, error) => almacen.anotarError(base, id, error),
    guardarTipo: (id, tipo) => almacen.guardarTipo(base, id, tipo),
    crearContacto: (id, datos) => almacen.crearContactoDeConversacion(base, id, datos),
    agregarEtiquetas: (id, etiquetas) => almacen.agregarEtiquetas(base, id, etiquetas),
    enviar: async (id, texto) =>
      z ? almacen.mandar(base, z, { conversacionId: id, texto, autor: 'knox', clave: randomUUID() }) : { ok: false, error: 'Falta la clave de Zernio' },
    reservarAviso: (id) => almacen.reservarAviso(base, id),
    avisar: avisarPorTelegram,
  }
}

// El webhook de Zernio, ya con la firma revisada: guarda y, si entró un mensaje, Knox lo atiende
export async function procesarWebhook(cuerpo: unknown): Promise<string> {
  const ev = leerEvento(cuerpo)
  if (!ev) return 'no se entiende o no es de Instagram, Messenger ni WhatsApp'
  const base = db()
  const z = zernioOpcional()
  const conKnox = ev.tipo === 'mensaje' && ev.evento === 'message.received'
  const knox = conKnox ? (e: Parameters<typeof atenderMensaje>[1]) => atenderMensaje(depsKnox(base, z), e) : null
  return procesarEvento(ev, almacen.almacenSupabase(base, z), knox)
}

// Pantallas ---------------------------------------------------------------------------------------------------------

type FilaBandeja = {
  id: string
  canal: string
  contacto_id: string | null
  contacto_nombre: string | null
  participante_nombre: string | null
  participante_usuario: string | null
  participante_foto: string | null
  tipo: TipoMensaje | null
  ultimo_mensaje_en: string | null
  leido_en: string | null
  ultimo_texto: string | null
  ultimo_autor: string | null
  ultimo_direccion: string | null
  ultimo_adjunto: string | null
  ultimo_entrante_en: string | null
  pendiente_id: string | null
  pendiente_respuesta: string | null
  pendiente_aviso: string | null
}

export async function listarBandeja(filtro: Filtro, cuantas: number): Promise<{ filas: ConversacionLista[]; hayMas: boolean }> {
  const { data, error } = await db().rpc('crm_bandeja', { filtro, limite: cuantas + 1 })
  if (error) throw new Error(`crm_bandeja: ${error.message}`)
  const filas = (data ?? []) as FilaBandeja[]
  return {
    hayMas: filas.length > cuantas,
    filas: filas.slice(0, cuantas).map((f) => ({
      id: f.id,
      canal: almacen.canalKnox(f.canal),
      nombre: nombreConversacion({ contacto: f.contacto_nombre, nombre: f.participante_nombre, usuario: f.participante_usuario }),
      foto: f.participante_foto,
      contactoId: f.contacto_id,
      tipo: f.tipo,
      ultimoEn: f.ultimo_mensaje_en,
      vistaPrevia: vistaPrevia({ texto: f.ultimo_texto, autor: f.ultimo_autor, direccion: f.ultimo_direccion, adjunto: f.ultimo_adjunto }),
      ultimoDeLaPersona: f.ultimo_direccion === 'entrante',
      sinLeer: !!f.ultimo_entrante_en && (!f.leido_en || Date.parse(f.ultimo_entrante_en) > Date.parse(f.leido_en)),
      pendiente: f.pendiente_id ? { id: f.pendiente_id, respuesta: f.pendiente_respuesta, aviso: f.pendiente_aviso } : null,
    })),
  }
}

export async function resumenBandeja(): Promise<{ porResponder: number; sinLeer: number; pendientes: number }> {
  const { data, error } = await db().rpc('crm_bandeja_resumen')
  if (error) throw new Error(`crm_bandeja_resumen: ${error.message}`)
  const r = ((data ?? []) as { por_responder: number; sin_leer: number; pendientes: number }[])[0]
  return { porResponder: r?.por_responder ?? 0, sinLeer: r?.sin_leer ?? 0, pendientes: r?.pendientes ?? 0 }
}

const AUTORES = new Set(['persona', 'ale', 'knox', 'automatizacion', 'sistema'])

export async function leerConversacion(id: string): Promise<ConversacionDetalle | null> {
  if (!UUID.test(id)) return null
  const base = db()
  const [c, m, p] = await Promise.all([
    base
      .from('crm_conversaciones')
      .select(
        'id, canal, origen, contacto_id, participante_id, participante_nombre, participante_usuario, participante_foto, tipo, knox_pausado_hasta, otra_app_en, crm_contactos(nombre, apellido)',
      )
      .eq('id', id)
      .maybeSingle(),
    base
      .from('crm_mensajes')
      .select('id, autor, direccion, texto, meta, enviado_en', { count: 'exact' })
      .eq('conversacion_id', id)
      .neq('tipo', 'actividad')
      .order('enviado_en', { ascending: false })
      .order('id', { ascending: false })
      .limit(POR_HILO),
    base.from('crm_knox_decisiones').select('id, respuesta, decision, error, creado_en').eq('conversacion_id', id).eq('estado', 'pendiente').maybeSingle(),
  ])
  for (const r of [c, m, p]) if (r.error) throw new Error(`bandeja (conversación): ${r.error.message}`)
  const conv = c.data as
    | (Record<string, string | null> & { crm_contactos: { nombre: string; apellido: string } | null; tipo: TipoMensaje | null })
    | null
  if (!conv || conv.origen !== 'zernio') return null
  const canal: CanalKnox = almacen.canalKnox(conv.canal)
  const filas = (m.data ?? []) as { id: string; autor: string | null; direccion: string | null; texto: string | null; meta: Record<string, unknown> | null; enviado_en: string }[]
  const mensajes: MensajeHilo[] = filas.reverse().map((x) => ({
    id: x.id,
    autor: (AUTORES.has(x.autor ?? '') ? x.autor : x.direccion === 'entrante' ? 'persona' : 'ale') as AutorBandeja,
    texto: x.texto,
    adjunto: typeof x.meta?.adjunto === 'string' ? x.meta.adjunto : null,
    historia: x.meta?.historia === 'respuesta' || x.meta?.historia === 'mencion' ? x.meta.historia : null,
    enviadoEn: x.enviado_en,
    estado: typeof x.meta?.estado === 'string' ? x.meta.estado : null,
    error: typeof x.meta?.error === 'string' ? x.meta.error : null,
  }))
  const ultimoEntrante = [...mensajes].reverse().find((x) => x.autor === 'persona')?.enviadoEn ?? (await almacen.ultimoEntrante(base, id))?.en ?? null
  const pend = p.data as { id: string; respuesta: string | null; decision: DecisionKnox | null; error: string | null; creado_en: string } | null
  const contacto = conv.crm_contactos ? `${conv.crm_contactos.nombre} ${conv.crm_contactos.apellido}`.trim() : null
  const telefono = telefonoDe(canal, conv.participante_id)
  return {
    id: conv.id as string,
    canal,
    nombre: nombreConversacion({ contacto, nombre: conv.participante_nombre, usuario: conv.participante_usuario, telefono }),
    usuario: conv.participante_usuario,
    foto: conv.participante_foto,
    telefono,
    contactoId: conv.contacto_id,
    tipo: conv.tipo,
    knoxPausadoHasta: conv.knox_pausado_hasta,
    otraApp: !!conv.otra_app_en && Date.now() - Date.parse(conv.otra_app_en) < OTRA_APP_DIAS * 86_400_000,
    ultimoEntranteEn: ultimoEntrante,
    mensajes,
    hayMas: (m.count ?? 0) > POR_HILO,
    pendiente: pend
      ? { id: pend.id, respuesta: pend.respuesta, aviso: pend.decision?.aviso ?? null, motivo: pend.decision?.motivo ?? null, error: pend.error, creadoEn: pend.creado_en }
      : null,
  }
}

export async function marcarConversacionLeida(id: string) {
  if (!UUID.test(id)) return
  try {
    await almacen.marcarLeida(db(), id, new Date().toISOString())
  } catch (err) {
    console.error('[bandeja] no se pudo marcar como leída:', err instanceof Error ? err.message : err)
  }
}

export async function ajustesKnox(): Promise<AjustesKnox> {
  const a = await almacen.leerAjustes(db())
  return { modo: a.modo, ficha: a.ficha, actualizadoEn: a.actualizado_en }
}

type FilaDecision = {
  id: string
  conversacion_id: string
  estado: DecisionLista['estado']
  modo: DecisionLista['modo']
  respuesta: string | null
  decision: DecisionKnox | null
  error: string | null
  creado_en: string
  crm_conversaciones: {
    canal: string
    participante_nombre: string | null
    participante_usuario: string | null
    crm_contactos: { nombre: string; apellido: string } | null
  } | null
}

export async function ultimasDecisiones(cuantas = 20): Promise<DecisionLista[]> {
  const { data, error } = await db()
    .from('crm_knox_decisiones')
    .select('id, conversacion_id, estado, modo, respuesta, decision, error, creado_en, crm_conversaciones(canal, participante_nombre, participante_usuario, crm_contactos(nombre, apellido))')
    .order('creado_en', { ascending: false })
    .limit(cuantas)
  if (error) throw new Error(`crm_knox_decisiones: ${error.message}`)
  return ((data ?? []) as unknown as FilaDecision[]).map((d) => {
    const c = d.crm_conversaciones
    const contacto = c?.crm_contactos ? `${c.crm_contactos.nombre} ${c.crm_contactos.apellido}`.trim() : null
    return {
      id: d.id,
      conversacionId: d.conversacion_id,
      nombre: nombreConversacion({ contacto, nombre: c?.participante_nombre, usuario: c?.participante_usuario }),
      canal: almacen.canalKnox(c?.canal),
      estado: d.estado,
      modo: d.modo,
      tipo: d.decision?.tipo ?? null,
      accion: d.decision?.accion ?? null,
      respuesta: d.respuesta,
      aviso: d.decision?.aviso ?? null,
      motivo: d.decision?.motivo ?? null,
      error: d.error,
      creadoEn: d.creado_en,
    }
  })
}

// Conversaciones en las que otra app (GoHighLevel, si sigue conectado a la página) tiene el control
export async function conversacionesConOtraApp(): Promise<{ total: number; messenger: number }> {
  const desde = new Date(Date.now() - OTRA_APP_DIAS * 86_400_000).toISOString()
  const { data, error } = await db().from('crm_conversaciones').select('canal').eq('origen', 'zernio').gte('otra_app_en', desde)
  if (error) throw new Error(`crm_conversaciones: ${error.message}`)
  const filas = (data ?? []) as { canal: string }[]
  return { total: filas.length, messenger: filas.filter((f) => f.canal === 'messenger').length }
}

// Acciones ----------------------------------------------------------------------------------------------------------

export async function enviarComoAle(conversacionId: string, texto: string, clave: string): Promise<{ ok: true } | Falla> {
  if (!UUID.test(conversacionId)) return { ok: false, error: 'Esa conversación no existe', status: 404 }
  const z = zernioOpcional()
  if (!z) return { ok: false, error: 'Falta la clave de Zernio en el panel', status: 500 }
  const r = await almacen.mandar(db(), z, { conversacionId, texto, autor: 'ale', clave })
  return r.ok ? { ok: true } : { ok: false, error: r.error, status: r.status ?? 502 }
}

async function decisionPendiente(id: string) {
  if (!UUID.test(id)) return null
  const { data, error } = await db().from('crm_knox_decisiones').select('id, conversacion_id, estado, respuesta').eq('id', id).maybeSingle()
  if (error) throw new Error(`crm_knox_decisiones: ${error.message}`)
  return data as { id: string; conversacion_id: string; estado: string; respuesta: string | null } | null
}

// «Enviar» en la tarjeta de Knox: sale como Knox (lo escribió él y Ale lo aprobó). La clave es la del borrador: un
// doble toque no lo manda dos veces
export async function enviarBorrador(decisionId: string): Promise<{ ok: true } | Falla> {
  const d = await decisionPendiente(decisionId)
  if (!d) return { ok: false, error: 'Ese borrador no existe', status: 404 }
  if (d.estado !== 'pendiente' || !d.respuesta) return { ok: false, error: 'Ese borrador ya no está. Recarga la página.', status: 409 }
  const z = zernioOpcional()
  if (!z) return { ok: false, error: 'Falta la clave de Zernio en el panel', status: 500 }
  const base = db()
  const r = await almacen.mandar(base, z, { conversacionId: d.conversacion_id, texto: d.respuesta, autor: 'knox', clave: `borrador-${d.id}` })
  if (!r.ok) {
    await almacen.anotarError(base, d.id, r.error)
    return { ok: false, error: r.error, status: r.status ?? 502 }
  }
  await almacen.marcarEnviada(base, d.id, r.mensajeId)
  return { ok: true }
}

export async function descartarDecision(decisionId: string): Promise<{ ok: true } | Falla> {
  if (!UUID.test(decisionId)) return { ok: false, error: 'Ese borrador no existe', status: 404 }
  const { data, error } = await db()
    .from('crm_knox_decisiones')
    .update({ estado: 'descartada', resuelto_en: new Date().toISOString() })
    .eq('id', decisionId)
    .eq('estado', 'pendiente')
    .select('id')
  if (error) throw new Error(`crm_knox_decisiones: ${error.message}`)
  return data?.length ? { ok: true } : { ok: false, error: 'Ese borrador ya no está. Recarga la página.', status: 409 }
}

// El interruptor «Knox en esta conversación»: prendido borra la pausa; apagado, para siempre ahí
export async function cambiarKnox(conversacionId: string, activo: boolean): Promise<{ ok: true } | Falla> {
  if (!UUID.test(conversacionId)) return { ok: false, error: 'Esa conversación no existe', status: 404 }
  const { data, error } = await db()
    .from('crm_conversaciones')
    .update({ knox_pausado_hasta: activo ? null : 'infinity' })
    .eq('id', conversacionId)
    .eq('origen', 'zernio')
    .select('id')
  if (error) throw new Error(`crm_conversaciones: ${error.message}`)
  return data?.length ? { ok: true } : { ok: false, error: 'Esa conversación no existe', status: 404 }
}

export async function guardarComoContacto(conversacionId: string): Promise<{ ok: true; id: string } | Falla> {
  if (!UUID.test(conversacionId)) return { ok: false, error: 'Esa conversación no existe', status: 404 }
  const id = await almacen.crearContactoDeConversacion(db(), conversacionId, null)
  return id ? { ok: true, id } : { ok: false, error: 'Esa conversación no existe', status: 404 }
}

export async function guardarAjustes(cambio: { modo?: ModoKnox; ficha?: string }): Promise<{ ok: true }> {
  const { error } = await db()
    .from('knox_ajustes')
    .upsert({ id: true, ...cambio, actualizado_en: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw new Error(`knox_ajustes: ${error.message}`)
  return { ok: true }
}

// «Probar a Knox»: decide con un chat inventado. No guarda ni manda nada. Sin ficha, usa la guardada
export async function probarKnox(ctx: ContextoKnox, ficha: string | null): Promise<{ ok: true; decision: DecisionKnox } | Falla> {
  const texto = ficha ?? (await almacen.leerAjustes(db())).ficha
  try {
    return { ok: true, decision: await decidir(ctx, texto) }
  } catch (err) {
    console.error('[knox] la prueba falló:', err instanceof Error ? err.message : err)
    return { ok: false, error: 'Knox no pudo contestar esta vez. Prueba de nuevo en un rato.', status: 502 }
  }
}

