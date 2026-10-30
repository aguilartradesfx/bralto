// Lo que viaja del servidor a las pantallas del CRM: solo lo que se muestra.
import type { AdjuntoMensaje, Campos, Canal, Direccion, EstadoCita, EstadoOportunidad, Origen, TipoMensaje } from './tipos.ts'

export interface ContactoLista {
  id: string
  nombre: string // el que se muestra
  telefono: string | null
  correo: string | null
  empresa: string | null
  etiquetas: string[]
  ultima_actividad: string
  canal: Canal | null // por el que más se habla
  abiertas: number // oportunidades abiertas
}

export interface ContactoVista {
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
  creado_en: string
  ultima_actividad: string
}

export interface NotaVista {
  id: string
  texto: string
  autor: string | null
  fijada: boolean
  creado_en: string
}

export interface TareaVista {
  id: string
  titulo: string
  detalle: string | null
  vence_en: string | null
  hecha: boolean
  hecha_en: string | null
  contacto?: { id: string; nombre: string }
}

export interface PipelineVista {
  id: string
  nombre: string
  etapas: { id: string; nombre: string; orden: number }[]
}

export interface OportunidadVista {
  id: string
  nombre: string
  valor: number
  estado: EstadoOportunidad
  pipeline_id: string
  etapa_id: string
  cambio_etapa_en: string | null
}

export interface TarjetaVista extends OportunidadVista {
  contacto: { id: string; nombre: string }
}

export interface CitaVista {
  id: string
  titulo: string
  inicio: string
  fin: string | null
  estado: EstadoCita
  enlace: string | null
  notas: string | null
}

export interface AdjuntoVista {
  id: string
  nombre: string
  tipo: string | null
  tamano: number | null
  creado_en: string
}

export interface MensajeVista {
  id: string
  canal: Canal
  tipo: TipoMensaje
  direccion: Direccion | null
  texto: string | null
  asunto: string | null
  adjuntos: AdjuntoMensaje[]
  estado: string | null // entregado, leido, enviado, pendiente, fallo
  llamada: { estado?: string; segundos?: number } | null
  enviado_en: string
}

export type Cursor = { en: string; id: string }

export interface Historial {
  mensajes: MensajeVista[]
  siguiente: Cursor | null // null: no hay más
}

export interface Ficha {
  contacto: ContactoVista
  notas: NotaVista[]
  tareas: TareaVista[]
  oportunidades: OportunidadVista[]
  pipelines: PipelineVista[]
  citas: CitaVista[]
  adjuntos: AdjuntoVista[]
  historial: Historial
}
