// El CRM del panel: las filas de las tablas crm_* (supabase/migrations/20261030_003_crm.sql) y sus nombres.
import { telefonoLegible } from './telefono.ts'

export type Origen = 'ghl' | 'panel' | 'zernio' | 'web'

// Por dónde llega o sale un mensaje. 'sistema' son los eventos (oportunidad movida, cita creada…)
export const CANALES = ['whatsapp', 'sms', 'correo', 'messenger', 'instagram', 'llamada', 'sistema', 'otro'] as const
export type Canal = (typeof CANALES)[number]

export const CANAL_LABEL: Record<Canal, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  correo: 'Correo',
  messenger: 'Messenger',
  instagram: 'Instagram',
  llamada: 'Llamada',
  sistema: 'Aviso',
  otro: 'Otro',
}

// Un canal que no conocemos (la fase 2 puede traer otros) se muestra como «Otro»
export const canalConocido = (canal: string | null | undefined): Canal =>
  (CANALES as readonly string[]).includes(canal ?? '') ? (canal as Canal) : 'otro'

export type TipoMensaje = 'mensaje' | 'correo' | 'llamada' | 'actividad'
export type Direccion = 'entrante' | 'saliente'

export const ESTADOS_OPORTUNIDAD = ['abierta', 'ganada', 'perdida', 'abandonada'] as const
export type EstadoOportunidad = (typeof ESTADOS_OPORTUNIDAD)[number]
export const ESTADO_OPORTUNIDAD_LABEL: Record<EstadoOportunidad, string> = {
  abierta: 'Abierta',
  ganada: 'Ganada',
  perdida: 'Perdida',
  abandonada: 'Abandonada',
}

export const ESTADOS_CITA = ['nueva', 'confirmada', 'asistio', 'no_asistio', 'cancelada'] as const
export type EstadoCita = (typeof ESTADOS_CITA)[number]
export const ESTADO_CITA_LABEL: Record<EstadoCita, string> = {
  nueva: 'Nueva',
  confirmada: 'Confirmada',
  asistio: 'Vino',
  no_asistio: 'No vino',
  cancelada: 'Cancelada',
}

export type CanalIdentidad = 'telefono' | 'correo' | 'whatsapp' | 'instagram' | 'messenger'

// Un campo personalizado: la etiqueta legible (null si GoHighLevel no la dio) y su valor
export type Campos = Record<string, { etiqueta: string | null; valor: string }>

// Lo que guarda cada mensaje de sus archivos. id: la fila de crm_adjuntos (null si no se pudo bajar)
export type AdjuntoMensaje = { id: string | null; nombre: string; tipo: string | null; perdido?: boolean }

// Filas, como se escriben ------------------------------------------------------------------------------------------

export interface ContactoFila {
  id: string
  nombre: string
  apellido: string
  telefono: string | null
  correo: string | null
  empresa: string | null
  etiquetas: string[]
  campos: Campos
  fuente: string | null
  no_molestar: boolean
  origen: Origen
  ghl_id: string | null
  creado_en: string
  actualizado_en: string
  ultima_actividad: string
}

export interface IdentidadFila {
  contacto_id: string
  canal: CanalIdentidad
  valor: string
  alias?: string | null
}

export interface NotaFila {
  id: string
  contacto_id: string
  texto: string
  autor: string | null
  fijada: boolean
  origen: Origen
  ghl_id: string | null
  creado_en: string
}

export interface TareaFila {
  id: string
  contacto_id: string
  titulo: string
  detalle: string | null
  vence_en: string | null
  hecha: boolean
  hecha_en: string | null
  origen: Origen
  ghl_id: string | null
  creado_en: string
}

export interface PipelineFila {
  id: string
  nombre: string
  orden: number
  ghl_id: string | null
}

export interface EtapaFila {
  id: string
  pipeline_id: string
  nombre: string
  orden: number
  ghl_id: string | null
}

export interface OportunidadFila {
  id: string
  contacto_id: string
  pipeline_id: string
  etapa_id: string
  nombre: string
  valor: number
  estado: EstadoOportunidad
  fuente: string | null
  origen: Origen
  ghl_id: string | null
  creado_en: string
  actualizado_en: string
  cambio_etapa_en: string | null
}

export interface ConversacionFila {
  id: string
  contacto_id: string
  canal: Canal
  origen: Origen
  externo_id: string | null
  cuenta: string | null
  ultimo_mensaje_en: string | null
  sin_leer: number
  creado_en: string
}

export interface MensajeFila {
  id: string
  conversacion_id: string | null
  contacto_id: string
  canal: Canal
  tipo: TipoMensaje
  direccion: Direccion | null
  texto: string | null
  asunto: string | null
  adjuntos: AdjuntoMensaje[]
  meta: Record<string, unknown>
  enviado_en: string
  origen: Origen
  externo_id: string | null
}

export interface CitaFila {
  id: string
  contacto_id: string
  titulo: string
  inicio: string
  fin: string | null
  estado: EstadoCita
  enlace: string | null
  notas: string | null
  origen: Origen
  ghl_id: string | null
  creado_en: string
}

export interface AdjuntoFila {
  id: string
  contacto_id: string
  mensaje_id: string | null
  nombre: string
  ruta: string
  tipo: string | null
  tamano: number | null
  origen: Origen
  externo_id: string | null
  creado_en: string
}

// El nombre que se muestra: nombre y apellido, o lo que haya
export function nombreVisible(c: { nombre: string; apellido: string; correo?: string | null; telefono?: string | null }): string {
  return `${c.nombre} ${c.apellido}`.trim() || c.correo || (c.telefono ? telefonoLegible(c.telefono) : '') || 'Sin nombre'
}

// Las iniciales del círculo de cada contacto. Si en vez de nombre hay un correo, su primera letra; si hay un
// teléfono, un #
export function iniciales(nombre: string): string {
  if (/^[+\d]/.test(nombre.trim())) return '#'
  if (nombre.includes('@')) return ([...nombre.trim()][0] ?? '·').toUpperCase()
  const partes = nombre
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (partes.length === 0) return '·'
  const primera = [...partes[0]][0] ?? ''
  const segunda = partes.length > 1 ? ([...partes[partes.length - 1]][0] ?? '') : ''
  return (primera + segunda).toUpperCase()
}

// Qué es un archivo, en una palabra: Foto, Video, Audio, PDF o Archivo
export function tipoArchivo(mime: string | null | undefined): string {
  const m = mime ?? ''
  if (m.startsWith('image/')) return 'Foto'
  if (m.startsWith('video/')) return 'Video'
  if (m.startsWith('audio/')) return 'Audio'
  if (m === 'application/pdf') return 'PDF'
  return 'Archivo'
}

// 2.4 MB, 350 KB
export function tamanoLegible(bytes: number | null | undefined): string {
  if (!bytes || bytes < 0) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
