// De lo que manda Zernio (webhooks y API) a lo que guarda el CRM: el canal, quién escribió, el adjunto dicho en
// palabras y si es la respuesta a un botón. Puro, con pruebas (zernio.test.ts).
import { normalizarTelefono } from '../telefono.ts'
import type { AutorMensaje, CanalKnox } from '../../knox/conversar/tipos.ts'
import type { AdjuntoZernio, ConversacionZernio, EnviadoPor, EventoZernio, MensajeZernio } from '../../zernio/tipos.ts'

// 'api' es lo que mandó el panel (Ale o Knox): al mandarlo ya se guardó con su autor
export type Autoria = AutorMensaje | 'api'

export interface Participante {
  id: string | null
  nombre: string | null
  usuario: string | null // sin la @
  foto: string | null
  telefono: string | null // E.164, solo WhatsApp
}

export interface DatosConversacion {
  externoId: string // el id que da GET /v1/inbox/conversations (en Instagram y Messenger, el de la persona)
  otrosIds: string[] // el id interno de Zernio, por si una conversación quedó guardada con ese
  canal: CanalKnox
  cuentaId: string | null
  cuenta: string | null
  participante: Participante
}

export interface DatosMensaje {
  externoId: string // el id de la red (mid / wamid)
  direccion: 'entrante' | 'saliente'
  autoria: Autoria
  texto: string
  adjunto: string | null // 'foto', 'audio', 'historia'… (null si es solo texto)
  enviadoEn: string // ISO
  meta: Record<string, unknown>
}

export type Remitente = { id: string | null; usuario: string | null; telefono: string | null }

export type EventoLeido =
  | { tipo: 'prueba' }
  | {
      tipo: 'mensaje'
      evento: 'message.received' | 'message.sent'
      conversacion: DatosConversacion
      mensaje: DatosMensaje
      standby: boolean // otra app (GoHighLevel) tiene el control: no se le puede contestar por la API
      interactivo: boolean // tocó un botón (el «Comenta» de Zernio): Knox no lo toca
      remitente: Remitente
    }
  | { tipo: 'estado'; estado: 'entregado' | 'leido' | 'fallo'; externoId: string; error: string | null }
  | { tipo: 'otro'; evento: string }

const objeto = (v: unknown) => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null)
const texto = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)

// instagram → instagram, facebook → messenger, whatsapp → whatsapp. Otra red: null (no entra a la bandeja)
export function canalDe(red: string | null | undefined): CanalKnox | null {
  if (red === 'instagram') return 'instagram'
  if (red === 'facebook') return 'messenger'
  if (red === 'whatsapp') return 'whatsapp'
  return null
}

// Lo que entra es de la persona. Lo que sale: 'human' o null es Ale (contestó desde la app o desde Zernio), 'api' es
// del panel y lo demás (comment_automation, workflow, sequence, broadcast, bulk-api o uno nuevo), una automatización
export function autorDe(direccion: string | null | undefined, sentVia: EnviadoPor | string | undefined): Autoria {
  if (direccion === 'incoming') return 'persona'
  if (sentVia === 'human' || sentVia === null || sentVia === undefined) return 'ale'
  if (sentVia === 'api') return 'api'
  return 'automatizacion'
}

// El adjunto en una palabra: lo que Knox lee y lo que se ve en la bandeja
export const ADJUNTOS = ['foto', 'video', 'audio', 'archivo', 'sticker', 'historia', 'publicación compartida', 'ubicación', 'contacto'] as const
export type Adjunto = (typeof ADJUNTOS)[number]

const COMPARTIDOS = new Set(['ig_reel', 'reel', 'ig_post', 'post', 'share'])
const HISTORIAS = new Set(['ig_story', 'story_mention', 'story'])

function palabraDe(a: AdjuntoZernio): Adjunto | null {
  const tipo = a.type ?? ''
  const original = a.originalType ?? ''
  if (HISTORIAS.has(original)) return 'historia'
  if (COMPARTIDOS.has(original) || tipo === 'share') return 'publicación compartida'
  if (tipo === 'image') return 'foto'
  if (tipo === 'video') return 'video'
  if (tipo === 'audio') return 'audio'
  if (tipo === 'sticker') return 'sticker'
  if (tipo === 'file') return 'archivo'
  if (tipo === 'template') return null // una tarjeta con botones sin texto: no hay nada que mostrar
  const mime = a.mimeType ?? ''
  if (mime.startsWith('image/')) return 'foto'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'archivo'
}

export function adjuntoDe(
  adjuntos: AdjuntoZernio[] | null | undefined,
  extra: { storyReply?: unknown; isStoryMention?: unknown; metadata?: Record<string, unknown> | null } = {},
): Adjunto | null {
  const meta = extra.metadata ?? {}
  if (extra.isStoryMention === true || meta.isStoryMention === true) return 'historia'
  for (const a of Array.isArray(adjuntos) ? adjuntos : []) {
    const p = objeto(a) ? palabraDe(a) : null
    if (p) return p
  }
  if (objeto(extra.storyReply) || objeto(meta.storyReply)) return 'historia'
  if (objeto(meta.location)) return 'ubicación'
  if (Array.isArray(meta.contacts) && meta.contacts.length > 0) return 'contacto'
  return null
}

// Respuestas a botones o menús (Instagram, Messenger, WhatsApp, Telegram): son de las automatizaciones de Zernio
const INTERACTIVOS = ['quickReplyPayload', 'postbackPayload', 'postbackTitle', 'callbackData', 'interactiveType', 'interactiveId', 'buttonPayload', 'nfmReplyName']

export function esInteractivo(metadata: Record<string, unknown> | null | undefined): boolean {
  const m = metadata ?? {}
  return INTERACTIVOS.some((k) => m[k] !== undefined && m[k] !== null && m[k] !== '')
}

const FECHA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/
const fecha = (...candidatas: unknown[]): string | null => {
  for (const c of candidatas) if (typeof c === 'string' && FECHA.test(c) && Number.isFinite(Date.parse(c))) return new Date(c).toISOString()
  return null
}

// En WhatsApp el id de la persona es su número (sin +); si no, lo que diga Zernio
export function telefonoDe(canal: CanalKnox, ...candidatos: (string | null | undefined)[]): string | null {
  if (canal !== 'whatsapp') return null
  for (const c of candidatos) {
    if (!c) continue
    const limpio = c.trim()
    const t = normalizarTelefono(limpio.startsWith('+') ? limpio : /^\d{8,15}$/.test(limpio) ? `+${limpio}` : '')
    if (t) return t
  }
  return null
}

const sinArroba = (u: string | null) => (u ? u.replace(/^@+/, '') || null : null)

function metaDe(base: { standby?: boolean; interactivo?: boolean; adjunto: Adjunto | null; historia?: 'respuesta' | 'mencion' | null; zernioId?: string | null; enviadoPor?: unknown }) {
  const meta: Record<string, unknown> = {}
  if (base.adjunto) meta.adjunto = base.adjunto
  if (base.historia) meta.historia = base.historia
  if (base.standby) meta.standby = true
  if (base.interactivo) meta.interactivo = true
  if (base.zernioId) meta.zernio_id = base.zernioId
  if (typeof base.enviadoPor === 'string') meta.enviado_por = base.enviadoPor
  return meta
}

// Un webhook de Zernio, revisado. null si no se entiende o no es de Instagram, Messenger ni WhatsApp
export function leerEvento(cuerpo: unknown): EventoLeido | null {
  const ev = objeto(cuerpo) as EventoZernio | null
  if (!ev || typeof ev.event !== 'string') return null
  if (ev.event === 'webhook.test') return { tipo: 'prueba' }

  const m = objeto(ev.message)
  if (ev.event === 'message.delivered' || ev.event === 'message.read' || ev.event === 'message.failed') {
    const externoId = texto(m?.platformMessageId)
    if (!externoId) return null
    const e = objeto(ev.error)
    const error = ev.event === 'message.failed' ? (texto(e?.explanation) ?? texto(e?.message) ?? texto(e?.title) ?? 'No se entregó') : null
    const estado = ev.event === 'message.delivered' ? 'entregado' : ev.event === 'message.read' ? 'leido' : 'fallo'
    return { tipo: 'estado', estado, externoId, error }
  }
  if (ev.event !== 'message.received' && ev.event !== 'message.sent') return { tipo: 'otro', evento: ev.event }

  const c = objeto(ev.conversation)
  const canal = canalDe(texto(m?.platform) ?? texto(objeto(ev.account)?.platform))
  const externoMensaje = texto(m?.platformMessageId)
  const externoConversacion = texto(c?.platformConversationId) ?? texto(c?.id) ?? texto(m?.conversationId)
  if (!m || !canal || !externoMensaje || !externoConversacion) return null

  const entra = ev.event === 'message.received'
  const sender = objeto(m.sender) ?? {}
  const metadata = objeto(ev.metadata) ?? {}
  const cuenta = objeto(ev.account) ?? {}
  // En lo que sale, el remitente es la cuenta del negocio: la persona es siempre conversation.participant*
  const participante: Participante = {
    id: texto(c?.participantId) ?? (entra ? texto(sender.id) : null),
    nombre: texto(c?.participantName) ?? (entra ? texto(sender.name) : null),
    usuario: sinArroba(texto(c?.participantUsername) ?? (entra ? texto(sender.username) : null)),
    foto: texto(c?.participantPicture) ?? (entra ? texto(sender.picture) : null),
    telefono: null,
  }
  participante.telefono = telefonoDe(canal, entra ? texto(sender.phoneNumber) : null, participante.id, entra ? texto(sender.id) : null)

  const standby = metadata.standby === true
  const interactivo = entra && esInteractivo(metadata)
  const adjunto = adjuntoDe(m.attachments as AdjuntoZernio[] | undefined, { metadata })
  const historia = metadata.isStoryMention === true ? 'mencion' : objeto(metadata.storyReply) ? 'respuesta' : null
  const enviadoPor = entra ? null : ((m.sentVia ?? null) as EnviadoPor)
  const otrosIds = [texto(c?.id), texto(m.conversationId)].filter((x): x is string => !!x && x !== externoConversacion)

  return {
    tipo: 'mensaje',
    evento: ev.event,
    standby,
    interactivo,
    remitente: { id: texto(sender.id), usuario: sinArroba(texto(sender.username)), telefono: canal === 'whatsapp' ? telefonoDe(canal, texto(sender.phoneNumber), texto(sender.id)) : null },
    conversacion: {
      externoId: externoConversacion,
      otrosIds: [...new Set(otrosIds)],
      canal,
      cuentaId: texto(cuenta.accountId) ?? texto(cuenta.id),
      cuenta: texto(cuenta.username),
      participante,
    },
    mensaje: {
      externoId: externoMensaje,
      direccion: entra ? 'entrante' : 'saliente',
      autoria: entra ? 'persona' : autorDe('outgoing', enviadoPor),
      texto: typeof m.text === 'string' ? m.text.trim() : '',
      adjunto,
      enviadoEn: fecha(m.sentAt, ev.timestamp) ?? new Date().toISOString(),
      meta: metaDe({ standby, interactivo, adjunto, historia, zernioId: texto(m.id), enviadoPor: entra ? undefined : (m.sentVia ?? 'null') }),
    },
  }
}

// La carga inicial: una conversación de GET /v1/inbox/conversations
export function conversacionDeLista(c: ConversacionZernio): DatosConversacion | null {
  const canal = canalDe(c.platform)
  const externoId = texto(c.id)
  if (!canal || !externoId) return null
  const id = texto(c.participantId)
  return {
    externoId,
    otrosIds: [],
    canal,
    cuentaId: texto(c.accountId),
    cuenta: texto(c.accountUsername),
    participante: {
      id,
      nombre: texto(c.participantName),
      usuario: sinArroba(texto(c.participantUsername)),
      foto: texto(c.participantPicture),
      telefono: telefonoDe(canal, id),
    },
  }
}

// La carga inicial: un mensaje de GET /v1/inbox/conversations/{id}/messages
export function mensajeDeLista(m: MensajeZernio): DatosMensaje | null {
  const externoId = texto(m.id)
  const enviadoEn = fecha(m.sentAt, m.createdAt)
  if (!externoId || !enviadoEn || (m.direction !== 'incoming' && m.direction !== 'outgoing')) return null
  const metadata = objeto(m.metadata) ?? {}
  const adjunto = adjuntoDe(m.attachments, { storyReply: m.storyReply, isStoryMention: m.isStoryMention, metadata })
  const entra = m.direction === 'incoming'
  const historia = m.isStoryMention === true ? 'mencion' : objeto(m.storyReply) ? 'respuesta' : null
  const estado = m.deliveryStatus === 'read' ? 'leido' : m.deliveryStatus === 'delivered' ? 'entregado' : m.deliveryStatus === 'failed' ? 'fallo' : null
  const meta = metaDe({ adjunto, historia, interactivo: entra && esInteractivo(metadata), enviadoPor: entra ? undefined : (m.sentVia ?? 'null') })
  if (!entra && estado) meta.estado = estado
  return {
    externoId,
    direccion: entra ? 'entrante' : 'saliente',
    autoria: entra ? 'persona' : autorDe('outgoing', m.sentVia ?? null),
    texto: typeof m.message === 'string' ? m.message.trim() : '',
    adjunto,
    enviadoEn,
    meta,
  }
}
