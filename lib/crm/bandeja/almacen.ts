// SERVER-ONLY — la bandeja contra la base (tablas crm_* y knox_ajustes, con service role). Recibe el cliente de
// Supabase de afuera: lo usan el webhook, el panel y la carga inicial (scripts/crm/bandeja-inicial.ts, que corre con
// node: por eso aquí solo hay rutas relativas). Las reglas están en módulos puros con pruebas.
import type { SupabaseClient } from '@supabase/supabase-js'
import { limpiarEtiquetas } from '../validar.ts'
import { CANAL_LABEL } from '../tipos.ts'
import type { AutorMensaje, CanalKnox, ContextoKnox, DecisionKnox, MensajeParaKnox, ModoKnox, TipoMensaje } from '../../knox/conversar/tipos.ts'
import { MODOS_KNOX } from '../../knox/conversar/tipos.ts'
import type { ClienteZernio, CuerpoEnvio } from '../../zernio/cliente.ts'
import { comillas as q, condicionesIdentidad, identidadesNuevas, nombreDeContacto } from './asociar.ts'
import { errorDeEnvio, planEnvio } from './envio.ts'
import { AVISO_CADA_MS, type ConversacionKnox, type DecisionNueva, type Envio } from './knox.ts'
import { PAUSA_ALE_MS, type AlmacenBandeja, type ConversacionGuardada } from './procesar.ts'
import { mensajeDeLista, telefonoDe, type DatosConversacion, type DatosMensaje } from './zernio.ts'

type Db = SupabaseClient

const CANALES = new Set(['instagram', 'messenger', 'whatsapp'])
export const canalKnox = (canal: unknown): CanalKnox => (CANALES.has(String(canal)) ? (canal as CanalKnox) : 'instagram')

function revisar<T>(r: { data: T; error: { message: string } | null }, donde: string): T {
  if (r.error) throw new Error(`${donde}: ${r.error.message}`)
  return r.data
}

// Contactos ----------------------------------------------------------------------------------------------------------

// Quién es la persona en el CRM: WhatsApp por su número, Instagram por su id o su @, Messenger por su id
export async function buscarContacto(db: Db, d: Pick<DatosConversacion, 'canal' | 'participante'>): Promise<string | null> {
  const condiciones = condicionesIdentidad(d.canal, d.participante)
  if (condiciones.length === 0) return null
  const filas = revisar(await db.from('crm_identidades').select('contacto_id').or(condiciones.join(',')).limit(1), 'crm_identidades')
  return (filas?.[0]?.contacto_id as string | undefined) ?? null
}

// La conversación (y sus mensajes sin dueño) pasan a ser del contacto
async function asociar(db: Db, conversacionId: string, contactoId: string) {
  revisar(await db.from('crm_conversaciones').update({ contacto_id: contactoId }).eq('id', conversacionId).is('contacto_id', null), 'asociar conversación')
  revisar(
    await db.from('crm_mensajes').update({ contacto_id: contactoId }).eq('conversacion_id', conversacionId).is('contacto_id', null),
    'asociar mensajes',
  )
}

type FilaConversacion = {
  id: string
  canal: string
  contacto_id: string | null
  participante_id: string | null
  participante_nombre: string | null
  participante_usuario: string | null
}

// Un contacto nuevo con lo que se sabe de la persona (y lo que contó, si Knox lo sacó), con su identidad en ese canal.
// Si ya hay uno con ese número o esa cuenta, se usa ese
export async function crearContactoDeConversacion(db: Db, conversacionId: string, datos: DecisionKnox['datos'] | null): Promise<string | null> {
  const conv = revisar(
    await db
      .from('crm_conversaciones')
      .select('id, canal, contacto_id, participante_id, participante_nombre, participante_usuario')
      .eq('id', conversacionId)
      .maybeSingle(),
    'crm_conversaciones',
  ) as FilaConversacion | null
  if (!conv) return null
  if (conv.contacto_id) return conv.contacto_id
  const canal = canalKnox(conv.canal)
  const participante = {
    id: conv.participante_id,
    nombre: conv.participante_nombre,
    usuario: conv.participante_usuario,
    foto: null,
    telefono: telefonoDe(canal, conv.participante_id),
  }
  const existente = await buscarContacto(db, { canal, participante })
  if (existente) {
    await asociar(db, conv.id, existente)
    return existente
  }
  const nombre = nombreDeContacto(participante, datos?.nombre)
  const nuevo = revisar(
    await db
      .from('crm_contactos')
      .insert({
        nombre,
        apellido: '',
        telefono: participante.telefono,
        empresa: datos?.negocio?.trim().slice(0, 120) || null,
        fuente: CANAL_LABEL[canal],
        origen: 'zernio',
      })
      .select('id')
      .single(),
    'crear contacto',
  ) as { id: string }
  const identidades = identidadesNuevas(nuevo.id, canal, participante)
  if (identidades.length > 0) {
    const { error } = await db.from('crm_identidades').upsert(identidades, { onConflict: 'canal,valor', ignoreDuplicates: true })
    if (error) console.error(`[bandeja] identidad: ${error.message}`)
  }
  await asociar(db, conv.id, nuevo.id)
  return nuevo.id
}

export async function agregarEtiquetas(db: Db, contactoId: string, etiquetas: string[]) {
  const fila = revisar(await db.from('crm_contactos').select('etiquetas').eq('id', contactoId).maybeSingle(), 'crm_contactos') as { etiquetas: string[] } | null
  if (!fila) return
  const todas = limpiarEtiquetas([...(fila.etiquetas ?? []), ...etiquetas]) ?? []
  if (todas.length === (fila.etiquetas ?? []).length) return
  revisar(await db.from('crm_contactos').update({ etiquetas: todas }).eq('id', contactoId), 'etiquetas')
}

// Conversaciones y mensajes ------------------------------------------------------------------------------------------

const FILA_CONVERSACION = 'id, canal, contacto_id, externo_id, cuenta_id, cuenta, participante_id, participante_nombre, participante_usuario, participante_foto'

type ConversacionCompleta = FilaConversacion & {
  externo_id: string
  cuenta_id: string | null
  cuenta: string | null
  participante_foto: string | null
}

// La busca por su id (o por el interno de Zernio) y, si no está, la crea. Pone al día el nombre y la foto, y la
// asocia a un contacto si todavía no tiene
export async function guardarConversacion(db: Db, d: DatosConversacion): Promise<ConversacionGuardada> {
  const ids = [d.externoId, ...d.otrosIds]
  const buscar = async () => {
    const filas = revisar(
      await db.from('crm_conversaciones').select(FILA_CONVERSACION).eq('origen', 'zernio').in('externo_id', ids),
      'crm_conversaciones',
    ) as ConversacionCompleta[]
    return filas.find((f) => f.externo_id === d.externoId) ?? filas[0] ?? null
  }
  let fila = await buscar()
  const p = d.participante
  if (!fila) {
    const contactoId = await buscarContacto(db, d)
    const { error } = await db.from('crm_conversaciones').upsert(
      {
        contacto_id: contactoId,
        canal: d.canal,
        origen: 'zernio',
        externo_id: d.externoId,
        cuenta: d.cuenta,
        cuenta_id: d.cuentaId,
        participante_id: p.id,
        participante_nombre: p.nombre,
        participante_usuario: p.usuario,
        participante_foto: p.foto,
      },
      { onConflict: 'origen,externo_id', ignoreDuplicates: true },
    )
    if (error) throw new Error(`crear conversación: ${error.message}`)
    fila = await buscar()
    if (!fila) throw new Error('crear conversación: no quedó guardada')
    return { id: fila.id, contactoId: fila.contacto_id, canal: d.canal, nueva: true }
  }

  // Lo nuevo que trae Zernio (el nombre o la foto pueden cambiar); lo vacío no borra lo que había
  const cambios: Record<string, string> = {}
  const poner = (columna: keyof ConversacionCompleta, valor: string | null) => {
    if (valor && fila && fila[columna] !== valor) cambios[columna] = valor
  }
  poner('participante_id', p.id)
  poner('participante_nombre', p.nombre)
  poner('participante_usuario', p.usuario)
  poner('participante_foto', p.foto)
  poner('cuenta_id', d.cuentaId)
  poner('cuenta', d.cuenta)
  if (Object.keys(cambios).length > 0) revisar(await db.from('crm_conversaciones').update(cambios).eq('id', fila.id), 'conversación')
  let contactoId = fila.contacto_id
  if (!contactoId) {
    contactoId = await buscarContacto(db, d)
    if (contactoId) await asociar(db, fila.id, contactoId)
  }
  return { id: fila.id, contactoId, canal: canalKnox(fila.canal) }
}

export function filaMensaje(conv: ConversacionGuardada, m: DatosMensaje, autor: AutorMensaje) {
  return {
    conversacion_id: conv.id,
    contacto_id: conv.contactoId,
    canal: conv.canal,
    tipo: 'mensaje',
    direccion: m.direccion,
    texto: m.texto || null,
    adjuntos: [],
    meta: m.meta,
    enviado_en: m.enviadoEn,
    origen: 'zernio',
    externo_id: m.externoId,
    autor,
  }
}

// Guarda el mensaje si no estaba (unique de origen + id de la red). Devuelve su id, o null si ya estaba
export async function guardarMensaje(db: Db, conv: ConversacionGuardada, m: DatosMensaje, autor: AutorMensaje): Promise<string | null> {
  const filas = revisar(
    await db.from('crm_mensajes').upsert(filaMensaje(conv, m, autor), { onConflict: 'origen,externo_id', ignoreDuplicates: true }).select('id'),
    'crm_mensajes',
  ) as { id: string }[] | null
  return filas?.[0]?.id ?? null
}

const ORDEN_ESTADO: Record<string, number> = { enviado: 0, entregado: 1, leido: 2 }

// Entregado y leído solo avanzan; si falló, queda el error
export async function estadoMensaje(db: Db, externoId: string, estado: 'entregado' | 'leido' | 'fallo', error: string | null): Promise<boolean> {
  const fila = revisar(
    await db.from('crm_mensajes').select('id, meta').eq('origen', 'zernio').eq('externo_id', externoId).maybeSingle(),
    'crm_mensajes',
  ) as { id: string; meta: Record<string, unknown> | null } | null
  if (!fila) return false
  const meta = { ...(fila.meta ?? {}) }
  const antes = typeof meta.estado === 'string' ? meta.estado : null
  if (estado === 'fallo') {
    meta.estado = 'fallo'
    meta.error = error ?? 'No se entregó'
  } else if (antes !== 'fallo' && (ORDEN_ESTADO[estado] ?? 0) > (antes ? (ORDEN_ESTADO[antes] ?? -1) : -1)) {
    meta.estado = estado
  } else return true
  revisar(await db.from('crm_mensajes').update({ meta }).eq('id', fila.id), 'estado del mensaje')
  return true
}

export async function pausarKnox(db: Db, conversacionId: string, hasta: Date) {
  revisar(await db.rpc('crm_pausar_knox', { conversacion: conversacionId, hasta: hasta.toISOString() }), 'pausar a Knox')
}

export async function descartarPendientes(db: Db, conversacionId: string) {
  revisar(
    await db
      .from('crm_knox_decisiones')
      .update({ estado: 'descartada', resuelto_en: new Date().toISOString() })
      .eq('conversacion_id', conversacionId)
      .eq('estado', 'pendiente'),
    'descartar borradores',
  )
}

export async function marcarLeida(db: Db, conversacionId: string, en: string) {
  revisar(
    await db.from('crm_conversaciones').update({ leido_en: en }).eq('id', conversacionId).or(`leido_en.is.null,leido_en.lt.${q(en)}`),
    'marcar leída',
  )
}

// Otra app (GoHighLevel) tiene el control: se anota cuándo se vio; un mensaje normal lo borra
export async function otraApp(db: Db, conversacionId: string, en: string | null) {
  const consulta = db.from('crm_conversaciones').update({ otra_app_en: en }).eq('id', conversacionId)
  revisar(en ? await consulta : await consulta.not('otra_app_en', 'is', null), 'otra app')
}

export const HISTORIAL = 30

// Los últimos mensajes de una conversación que no estaba guardada, desde la API de Zernio (solo lectura). Si Ale le
// escribió hace menos de 12 horas, Knox espera lo que falta, igual que en la carga inicial
export async function traerHistorial(db: Db, zernio: ClienteZernio, conv: ConversacionGuardada, d: DatosConversacion, antesDe: string): Promise<number> {
  if (!d.cuentaId) return 0
  const { mensajes } = await zernio.mensajes(d.externoId, d.cuentaId, { limite: HISTORIAL, orden: 'desc' })
  const datos = mensajes.map(mensajeDeLista).filter((m): m is DatosMensaje => m !== null && m.enviadoEn < antesDe)
  if (datos.length === 0) return 0
  const filas = datos.map((m) => filaMensaje(conv, m, m.autoria === 'api' ? 'automatizacion' : m.autoria))
  const nuevos = revisar(
    await db.from('crm_mensajes').upsert(filas, { onConflict: 'origen,externo_id', ignoreDuplicates: true }).select('id'),
    'historial',
  ) as { id: string }[] | null
  const deAle = datos.filter((m) => m.autoria === 'ale').reduce((max, m) => (m.enviadoEn > max ? m.enviadoEn : max), '')
  if (deAle && Date.parse(deAle) + PAUSA_ALE_MS > Date.now()) await pausarKnox(db, conv.id, new Date(Date.parse(deAle) + PAUSA_ALE_MS))
  return nuevos?.length ?? 0
}

// zernio: para traer el historial de las conversaciones nuevas (sin él, solo se guarda lo que llega)
export function almacenSupabase(db: Db, zernio: ClienteZernio | null = null): AlmacenBandeja {
  return {
    historial: async (conv, d, antesDe) => {
      if (!zernio) return
      try {
        await traerHistorial(db, zernio, conv, d, antesDe)
      } catch (err) {
        console.error('[bandeja] no se pudo traer el historial:', err instanceof Error ? err.message : err)
      }
    },
    conversacion: (d) => guardarConversacion(db, d),
    guardarMensaje: (conv, m, autor) => guardarMensaje(db, conv, m, autor),
    pausarKnox: (id, hasta) => pausarKnox(db, id, hasta),
    descartarPendientes: (id) => descartarPendientes(db, id),
    marcarLeida: (id, en) => marcarLeida(db, id, en),
    otraApp: (id, en) => otraApp(db, id, en),
    estadoMensaje: (externoId, estado, error) => estadoMensaje(db, externoId, estado, error),
  }
}

// Lo que Knox necesita de la base ------------------------------------------------------------------------------------

export async function leerAjustes(db: Db): Promise<{ modo: ModoKnox; ficha: string; actualizado_en: string | null }> {
  const fila = revisar(await db.from('knox_ajustes').select('modo, ficha, actualizado_en').eq('id', true).maybeSingle(), 'knox_ajustes') as {
    modo: string
    ficha: string
    actualizado_en: string
  } | null
  // Sin la fila, Knox no hace nada
  if (!fila || !(MODOS_KNOX as readonly string[]).includes(fila.modo)) return { modo: 'apagado', ficha: fila?.ficha ?? '', actualizado_en: null }
  return { modo: fila.modo as ModoKnox, ficha: fila.ficha ?? '', actualizado_en: fila.actualizado_en }
}

// El último mensaje de la persona (sin contar los toques de botón): el id y cuándo
export async function ultimoEntrante(db: Db, conversacionId: string): Promise<{ id: string; en: string } | null> {
  const filas = revisar(
    await db
      .from('crm_mensajes')
      .select('id, enviado_en')
      .eq('conversacion_id', conversacionId)
      .eq('direccion', 'entrante')
      .is('meta->>interactivo', null)
      .order('enviado_en', { ascending: false })
      .order('id', { ascending: false })
      .limit(1),
    'crm_mensajes',
  ) as { id: string; enviado_en: string }[] | null
  const f = filas?.[0]
  return f ? { id: f.id, en: f.enviado_en } : null
}

export async function conversacionKnox(db: Db, id: string): Promise<ConversacionKnox | null> {
  const fila = revisar(
    await db
      .from('crm_conversaciones')
      .select('id, canal, origen, contacto_id, participante_nombre, participante_usuario, knox_pausado_hasta')
      .eq('id', id)
      .maybeSingle(),
    'crm_conversaciones',
  ) as (Omit<FilaConversacion, 'participante_id'> & { origen: string; knox_pausado_hasta: string | null }) | null
  if (!fila || fila.origen !== 'zernio') return null
  const ultimo = await ultimoEntrante(db, id)
  return {
    id: fila.id,
    canal: canalKnox(fila.canal),
    nombre: fila.participante_nombre,
    usuario: fila.participante_usuario,
    contactoId: fila.contacto_id,
    pausadoHasta: fila.knox_pausado_hasta,
    ultimoEntranteEn: ultimo?.en ?? null,
  }
}

const AUTORES = new Set(['persona', 'ale', 'knox', 'automatizacion'])

// Los últimos mensajes, del más viejo al más nuevo
export async function mensajesParaKnox(db: Db, conversacionId: string, cuantos: number): Promise<MensajeParaKnox[]> {
  const filas = revisar(
    await db
      .from('crm_mensajes')
      .select('autor, direccion, texto, meta, enviado_en')
      .eq('conversacion_id', conversacionId)
      .neq('tipo', 'actividad')
      .order('enviado_en', { ascending: false })
      .order('id', { ascending: false })
      .limit(cuantos),
    'crm_mensajes',
  ) as { autor: string | null; direccion: string | null; texto: string | null; meta: Record<string, unknown> | null; enviado_en: string }[]
  return (filas ?? []).reverse().map((m) => ({
    autor: (AUTORES.has(m.autor ?? '') ? m.autor : m.direccion === 'entrante' ? 'persona' : 'ale') as MensajeParaKnox['autor'],
    texto: m.texto ?? '',
    adjunto: typeof m.meta?.adjunto === 'string' ? m.meta.adjunto : null,
    en: new Date(m.enviado_en).toISOString(),
  }))
}

export async function contextoContacto(db: Db, contactoId: string): Promise<ContextoKnox['contacto']> {
  const [c, notas, abiertas] = await Promise.all([
    db.from('crm_contactos').select('etiquetas').eq('id', contactoId).maybeSingle(),
    db.from('crm_notas').select('texto').eq('contacto_id', contactoId).order('fijada', { ascending: false }).order('creado_en', { ascending: false }).limit(5),
    db.from('crm_oportunidades').select('id', { count: 'exact', head: true }).eq('contacto_id', contactoId).eq('estado', 'abierta'),
  ])
  if (c.error || notas.error || abiertas.error) throw new Error(`contexto del contacto: ${(c.error ?? notas.error ?? abiertas.error)?.message}`)
  if (!c.data) return null
  return {
    etiquetas: (c.data.etiquetas as string[] | null) ?? [],
    notas: ((notas.data ?? []) as { texto: string }[]).map((n) => n.texto),
    oportunidadesAbiertas: abiertas.count ?? 0,
  }
}

// Una decisión nueva reemplaza a la que estaba pendiente en esa conversación (solo puede haber una)
export async function guardarDecision(db: Db, d: DecisionNueva): Promise<string> {
  const ahora = new Date().toISOString()
  const fila = {
    conversacion_id: d.conversacionId,
    mensaje_id: d.mensajeId,
    decision: d.decision,
    respuesta: d.respuesta,
    estado: d.estado,
    modo: d.modo,
    error: d.error,
    resuelto_en: d.estado === 'pendiente' ? null : ahora,
  }
  for (let intento = 0; ; intento++) {
    await descartarPendientes(db, d.conversacionId)
    const r = await db.from('crm_knox_decisiones').insert(fila).select('id').single()
    if (!r.error) return (r.data as { id: string }).id
    // Otra decisión de la misma conversación se coló entre medio (choca con «una pendiente»): una vez más
    if ((r.error as { code?: string }).code !== '23505' || intento > 0) throw new Error(`crm_knox_decisiones: ${r.error.message}`)
  }
}

export async function marcarEnviada(db: Db, decisionId: string, mensajeId: string | null) {
  revisar(
    await db
      .from('crm_knox_decisiones')
      .update({ estado: 'enviada', enviado_mensaje_id: mensajeId, error: null, resuelto_en: new Date().toISOString() })
      .eq('id', decisionId),
    'decisión enviada',
  )
}

export async function anotarError(db: Db, decisionId: string, error: string) {
  revisar(await db.from('crm_knox_decisiones').update({ error }).eq('id', decisionId), 'error de la decisión')
}

export async function guardarTipo(db: Db, conversacionId: string, tipo: TipoMensaje) {
  revisar(await db.from('crm_conversaciones').update({ tipo }).eq('id', conversacionId), 'tipo de conversación')
}

// Toma el turno del aviso por Telegram: false si ya hubo uno en los últimos 30 minutos
export async function reservarAviso(db: Db, conversacionId: string, ahora = new Date()): Promise<boolean> {
  const limite = new Date(ahora.getTime() - AVISO_CADA_MS).toISOString()
  const filas = revisar(
    await db
      .from('crm_conversaciones')
      .update({ avisado_en: ahora.toISOString() })
      .eq('id', conversacionId)
      .or(`avisado_en.is.null,avisado_en.lt.${q(limite)}`)
      .select('id'),
    'aviso',
  ) as { id: string }[] | null
  return (filas?.length ?? 0) > 0
}

// Mandar por Zernio -------------------------------------------------------------------------------------------------

// Manda el texto como Ale (desde la caja del panel) o como Knox, y lo guarda con su autor. La clave de idempotencia
// evita que un doble toque o un reintento lo mande dos veces. Si lo manda Ale, Knox se aparta 12 horas
export async function mandar(
  db: Db,
  zernio: ClienteZernio,
  o: { conversacionId: string; texto: string; autor: 'ale' | 'knox'; clave: string; ahora?: Date },
): Promise<Envio & { status?: number }> {
  const ahora = o.ahora ?? new Date()
  const conv = revisar(
    await db.from('crm_conversaciones').select('id, canal, origen, externo_id, cuenta_id, contacto_id').eq('id', o.conversacionId).maybeSingle(),
    'crm_conversaciones',
  ) as { id: string; canal: string; origen: string; externo_id: string | null; cuenta_id: string | null; contacto_id: string | null } | null
  if (!conv || conv.origen !== 'zernio' || !conv.externo_id) return { ok: false, error: 'Esa conversación no existe', status: 404 }
  if (!conv.cuenta_id) return { ok: false, error: 'No se sabe desde qué cuenta contestar. Contéstale desde la app.', status: 409 }
  const canal = canalKnox(conv.canal)
  const ultimo = await ultimoEntrante(db, conv.id)
  const plan = planEnvio(canal, o.autor, ultimo?.en ?? null, ahora)
  if (!plan.ok) return { ok: false, error: plan.error, status: 409 }

  const cuerpo: CuerpoEnvio = {
    accountId: conv.cuenta_id,
    message: o.texto,
    ...(plan.etiquetaHumana ? { messageTag: 'HUMAN_AGENT' as const, messagingType: 'MESSAGE_TAG' as const } : {}),
  }
  const r = await zernio.enviar(conv.externo_id, cuerpo, o.clave)
  if (!r.ok) {
    console.error(`[bandeja] Zernio no mandó el mensaje: HTTP ${r.status} ${r.codigo ?? ''} ${r.codigoRed ?? ''}/${r.subcodigoRed ?? ''} ${r.detalle}`)
    return { ok: false, error: errorDeEnvio(r), status: 502 }
  }

  // Si el webhook del envío llegó antes y lo guardó como automático, aquí queda con su autor de verdad
  const enviadoEn = ahora.toISOString()
  const { data, error } = await db
    .from('crm_mensajes')
    .upsert(
      {
        conversacion_id: conv.id,
        contacto_id: conv.contacto_id,
        canal,
        tipo: 'mensaje',
        direccion: 'saliente',
        texto: o.texto,
        adjuntos: [],
        meta: { estado: 'enviado', clave: o.clave, ...(plan.etiquetaHumana ? { etiqueta: 'HUMAN_AGENT' } : {}) },
        enviado_en: enviadoEn,
        origen: 'zernio',
        externo_id: r.mensajeId ?? `panel:${o.clave}`,
        autor: o.autor,
      },
      { onConflict: 'origen,externo_id' },
    )
    .select('id')
    .single()
  // Ya salió: si no se pudo guardar, igual cuenta como mandado (el webhook lo trae después)
  if (error) console.error(`[bandeja] el mensaje salió pero no se guardó: ${error.message}`)
  if (o.autor === 'ale') {
    await pausarKnox(db, conv.id, new Date(ahora.getTime() + PAUSA_ALE_MS))
    await descartarPendientes(db, conv.id)
  }
  await marcarLeida(db, conv.id, enviadoEn)
  return { ok: true, mensajeId: (data as { id: string } | null)?.id ?? null }
}
