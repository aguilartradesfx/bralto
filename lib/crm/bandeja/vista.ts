// Lo que viaja del servidor a las pantallas de la bandeja y cómo se dice cada cosa. Puro, con pruebas (vista.test.ts).
import { diaCR, horaCR, hoyCR, sumarDias } from '../../calendario/fechas.ts'
import { diaLargo } from '../fechas.ts'
import { telefonoLegible } from '../telefono.ts'
import type { AccionKnox, CanalKnox, ModoKnox, TipoMensaje } from '../../knox/conversar/tipos.ts'

export type AutorBandeja = 'persona' | 'ale' | 'knox' | 'automatizacion' | 'sistema'

export const FILTROS = ['por_responder', 'trabajo', 'personales', 'todas'] as const
export type Filtro = (typeof FILTROS)[number]
export const FILTRO_LABEL: Record<Filtro, string> = { por_responder: 'Por responder', trabajo: 'Trabajo', personales: 'Personales', todas: 'Todas' }

export const leerFiltro = (v: unknown): Filtro => ((FILTROS as readonly unknown[]).includes(v) ? (v as Filtro) : 'por_responder')

export const POR_PAGINA = 50
export const MAX_PAGINA = 500
export const leerCuantas = (v: unknown): number => {
  const n = typeof v === 'string' ? Number.parseInt(v, 10) : NaN
  return Number.isFinite(n) && n > 0 ? Math.min(Math.ceil(n / POR_PAGINA) * POR_PAGINA, MAX_PAGINA) : POR_PAGINA
}

export interface Pendiente {
  id: string
  respuesta: string | null // null: Knox no contesta y te la pasa (aviso)
  aviso: string | null
}

export interface ConversacionLista {
  id: string
  canal: CanalKnox
  nombre: string
  foto: string | null
  contactoId: string | null
  tipo: TipoMensaje | null
  ultimoEn: string | null
  vistaPrevia: string
  ultimoDeLaPersona: boolean
  sinLeer: boolean
  pendiente: Pendiente | null
}

export interface MensajeHilo {
  id: string
  autor: AutorBandeja
  texto: string | null
  adjunto: string | null
  historia: 'respuesta' | 'mencion' | null
  enviadoEn: string
  estado: string | null // enviado, entregado, leido, fallo
  error: string | null
}

export interface PendienteDetalle extends Pendiente {
  motivo: string | null
  error: string | null
  creadoEn: string
}

export interface ConversacionDetalle {
  id: string
  canal: CanalKnox
  nombre: string
  usuario: string | null
  foto: string | null
  telefono: string | null
  contactoId: string | null
  tipo: TipoMensaje | null
  knoxPausadoHasta: string | null
  otraApp: boolean
  ultimoEntranteEn: string | null
  mensajes: MensajeHilo[] // del más viejo al más nuevo
  hayMas: boolean
  pendiente: PendienteDetalle | null
}

export interface DecisionLista {
  id: string
  conversacionId: string
  nombre: string
  canal: CanalKnox
  estado: 'pendiente' | 'enviada' | 'descartada' | 'silencio' | 'error'
  modo: 'ensayo' | 'automatico'
  tipo: TipoMensaje | null
  accion: AccionKnox | null
  respuesta: string | null
  aviso: string | null
  motivo: string | null
  error: string | null
  creadoEn: string
}

export interface AjustesKnox {
  modo: ModoKnox
  ficha: string
  actualizadoEn: string | null
}

// El nombre de la conversación: el del contacto, el de la red, el @ o el número
export function nombreConversacion(o: { contacto?: string | null; nombre?: string | null; usuario?: string | null; telefono?: string | null }): string {
  return (
    o.contacto?.trim() ||
    o.nombre?.trim() ||
    (o.usuario ? `@${o.usuario}` : '') ||
    (o.telefono ? telefonoLegible(o.telefono) : '') ||
    'Sin nombre'
  )
}

export const AUTOR_LABEL: Record<AutorBandeja, string> = {
  persona: 'Persona',
  ale: 'Ale',
  knox: 'Knox',
  automatizacion: 'Automático',
  sistema: 'Aviso',
}

const ADJUNTO_LABEL: Record<string, string> = {
  foto: 'Foto',
  video: 'Video',
  audio: 'Audio',
  archivo: 'Archivo',
  sticker: 'Sticker',
  historia: 'Historia',
  'publicación compartida': 'Publicación compartida',
  ubicación: 'Ubicación',
  contacto: 'Contacto',
}

export const adjuntoLabel = (a: string | null | undefined): string | null => (a ? (ADJUNTO_LABEL[a] ?? 'Archivo') : null)

// «Te respondió una historia», «Te mencionó en su historia»
export function textoHistoria(h: MensajeHilo['historia']): string | null {
  if (h === 'respuesta') return 'Respondió a tu historia'
  if (h === 'mencion') return 'Te mencionó en su historia'
  return null
}

// El último mensaje en una línea: «Knox: Hola…», «Foto», «Ale: Gracias»
export function vistaPrevia(m: { texto: string | null; autor: string | null; direccion: string | null; adjunto: string | null }): string {
  const cuerpo = m.texto?.replace(/\s+/g, ' ').trim() || adjuntoLabel(m.adjunto) || 'Mensaje'
  if (m.direccion !== 'saliente') return cuerpo
  const quien = m.autor === 'knox' ? 'Knox' : m.autor === 'automatizacion' ? 'Automático' : 'Ale'
  return `${quien}: ${cuerpo}`
}

// Knox en la conversación: prendido, en pausa hasta una hora (porque contestó Ale) o apagado ahí
export function estadoKnox(hasta: string | null, ahora: Date): { activo: boolean; siempre: boolean; hasta: string | null } {
  if (!hasta) return { activo: true, siempre: false, hasta: null }
  if (hasta === 'infinity') return { activo: false, siempre: true, hasta: null }
  const t = Date.parse(hasta)
  if (!Number.isFinite(t) || t <= ahora.getTime()) return { activo: true, siempre: false, hasta: null }
  return { activo: false, siempre: false, hasta }
}

// Cuándo vuelve Knox después de la pausa: 'hoy a las 22:15', 'mañana a las 09:30', 'el lunes 2 de noviembre a las 10:00'
export function cuandoVuelve(hasta: string, ahora: Date): string {
  const hoy = hoyCR(ahora)
  const dia = diaCR(hasta)
  const hora = horaCR(hasta)
  if (dia === hoy) return `hoy a las ${hora}`
  if (dia === sumarDias(hoy, 1)) return `mañana a las ${hora}`
  return `el ${diaLargo(dia, hoy)} a las ${hora}`
}

export const MODO_LABEL: Record<ModoKnox, string> = { apagado: 'Apagado', ensayo: 'Ensayo', automatico: 'Automático' }
export const MODO_AYUDA: Record<ModoKnox, string> = {
  apagado: 'Knox no lee ni contesta nada.',
  ensayo: 'Knox lee cada mensaje y te deja la respuesta lista. Tú decides si la mandas.',
  automatico: 'Knox contesta solo los mensajes de trabajo. Lo personal no lo toca y lo delicado te lo pasa.',
}

export const TIPO_LABEL: Record<TipoMensaje, string> = { trabajo: 'Trabajo', personal: 'Personal', spam: 'Spam' }
export const ACCION_LABEL: Record<AccionKnox, string> = { responder: 'Contestar', pasar_a_ale: 'Te lo pasa', silencio: 'No contestar' }
export const ESTADO_DECISION_LABEL: Record<DecisionLista['estado'], string> = {
  pendiente: 'Esperándote',
  enviada: 'Enviada',
  descartada: 'Descartada',
  silencio: 'Sin respuesta',
  error: 'Falló',
}
