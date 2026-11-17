// Lo que viaja del servidor a las pantallas de la bandeja y cómo se dice cada cosa. Puro, con pruebas (vista.test.ts).
import { diaCR, horaCR, hoyCR, sumarDias } from '../../calendario/fechas.ts'
import { diaLargo } from '../fechas.ts'
import { telefonoLegible } from '../telefono.ts'
import type { AccionKnox, CanalKnox, ModoKnox, TipoMensaje } from '../../knox/conversar/tipos.ts'
import { planEnvio } from './envio.ts'

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

// Las redes de la bandeja, en el orden de los botones
export const REDES = ['instagram', 'messenger', 'whatsapp'] as const satisfies readonly CanalKnox[]
export const leerRed = (v: unknown): CanalKnox | null => ((REDES as readonly unknown[]).includes(v) ? (v as CanalKnox) : null)

// Lo que se busca: sin espacios de más y corto (es un nombre, un @ o un número)
export const MAX_BUSQUEDA = 80
export const leerBusqueda = (v: unknown): string => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, MAX_BUSQUEDA) : '')

// Lo que se ve en la lista: filtro, red y búsqueda (de la URL). Lo de siempre: por responder, todas las redes, sin buscar
export interface VistaLista {
  filtro: Filtro
  red: CanalKnox | null
  q: string
}

export const VISTA_INICIAL: VistaLista = { filtro: 'por_responder', red: null, q: '' }

export function leerVista(p: { get(k: string): string | null }): VistaLista {
  return { filtro: leerFiltro(p.get('filtro')), red: leerRed(p.get('red')), q: leerBusqueda(p.get('q')) }
}

export const esVistaInicial = (v: VistaLista): boolean => v.filtro === 'por_responder' && !v.red && !v.q

// La parte «?filtro=…&red=…&q=…» de la URL (vacía si es lo de siempre), para no perderla al abrir un chat
export function busquedaDeVista(v: VistaLista): string {
  const p = new URLSearchParams()
  if (v.filtro !== 'por_responder') p.set('filtro', v.filtro)
  if (v.red) p.set('red', v.red)
  if (v.q) p.set('q', v.q)
  const s = p.toString()
  return s ? `?${s}` : ''
}

export interface ResumenBandeja {
  porResponder: number
  sinLeer: number
  pendientes: number
}

export interface ListaBandeja {
  filas: ConversacionLista[]
  hayMas: boolean
  resumen: ResumenBandeja
}

// Si no encuentra nada: qué decir según lo que se está viendo
export function textoVacio(v: VistaLista): string {
  if (v.q) return `Nada coincide con «${v.q}».`
  const por = v.red ? ` por ${RED_LABEL[v.red]}` : ''
  if (v.filtro === 'por_responder') return `No hay nada por responder${por}. ¡Todo al día!`
  if (v.filtro === 'trabajo') return `Todavía no hay conversaciones de trabajo${por}. Knox las marca cuando lee los mensajes.`
  if (v.filtro === 'personales') return `Todavía no hay conversaciones personales${por}. Knox las marca cuando lee los mensajes.`
  return v.red ? `Todavía no hay conversaciones${por}.` : 'Todavía no hay mensajes. Llegan solos cuando alguien te escribe por Instagram, Messenger o WhatsApp.'
}

export const RED_LABEL: Record<CanalKnox, string> = { instagram: 'Instagram', messenger: 'Messenger', whatsapp: 'WhatsApp' }

// Debajo de la caja para contestar: si todavía se le puede escribir (la ventana de Meta) y lo que hay que saber
export function avisoVentana(canal: CanalKnox, ultimoEntranteEn: string | null, ahora: Date): { bloqueado: boolean; texto: string } {
  const plan = planEnvio(canal, 'ale', ultimoEntranteEn, ahora)
  if (!plan.ok) return { bloqueado: true, texto: plan.error }
  if (plan.etiquetaHumana) return { bloqueado: false, texto: 'Pasaron más de 24 horas desde su último mensaje: Meta deja contestarle hasta 7 días, solo si escribes tú.' }
  return { bloqueado: false, texto: `Sale por ${RED_LABEL[canal]}. Si le escribes tú, Knox se aparta 12 horas.` }
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

// Lo del CRM al lado del chat (si ya es contacto): para contestar sin ir a la ficha
export interface ContactoResumen {
  id: string
  nombre: string
  telefono: string | null
  correo: string | null
  empresa: string | null
  etiquetas: string[]
  oportunidades: { id: string; nombre: string; etapa: string | null; valor: number }[]
  tareas: number
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
  contacto: ContactoResumen | null
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
