// Las vistas del Centro de mando: Hoy (la pantalla de siempre) y Ventas, Redes, Agenda y Conexiones, que se abren
// dentro de /knox sin recargar. Cada una pide sus datos al abrirse (/api/knox/centro/vista/<nombre>). null en una
// parte: esa fuente no respondió («—»).
import type { CanalCliente, Chequeo, Embudo, Esperando, ItemDia, TipoPost } from '../tipos.ts'

export const VISTAS = ['hoy', 'ventas', 'redes', 'agenda', 'conexiones'] as const
export type Vista = (typeof VISTAS)[number]
export type VistaConDatos = Exclude<Vista, 'hoy'>

export const esVista = (v: unknown): v is Vista => (VISTAS as readonly unknown[]).includes(v)
export const esVistaConDatos = (v: unknown): v is VistaConDatos => esVista(v) && v !== 'hoy'
export const leerVista = (v: unknown): Vista => (esVista(v) ? v : 'hoy')

// Ventas -------------------------------------------------------------------------------------------------------------

export type EtapaVentas = { nombre: string; cuantas: number; valor: number }
export type PipelineVentas = { nombre: string; abiertas: number; valor: number; etapas: EtapaVentas[] }

// Una oportunidad que cambió de etapa (o de estado)
export type Movida = { nombre: string; contacto: string; etapa: string; estado: 'abierta' | 'ganada' | 'perdida' | 'abandonada'; valor: number; en: string }

export type LeadsDelMes = {
  total: number
  porCanal: { canal: CanalCliente; total: number }[] // los 4 canales, de mayor a menor
  porDia: number[] // los 30 días, el último es hoy
  desde: string // el primer día (AAAA-MM-DD)
}

export type VistaVentas = {
  embudo: Embudo | null
  pipelines: PipelineVentas[] | null
  movidas: Movida[] | null
  leads: LeadsDelMes | null
  esperando: Esperando | null
}

// Redes --------------------------------------------------------------------------------------------------------------

export type CuentaRedes = {
  usuario: string
  seguidores: number
  semana: number | null
  serie: number[] | null
  desde: string | null
  vistas: number | null // de los últimos 30 días
  guardados: number | null
  compartidos: number | null
}

export type PostTop = {
  cuenta: string
  titulo: string
  tipo: TipoPost
  en: string
  imagen: string | null
  enlace: string | null
  vistas: number | null
  alcance: number | null
  guardados: number | null
  compartidos: number | null
}

export type ComentarioReciente = { usuario: string; texto: string; en: string; publicacion: string }

// Lo que sale en los próximos días según el calendario (redes_publicaciones)
export type Programada = { titulo: string; tipo: string; estado: string; en: string }

export type VistaRedes = {
  cuentas: (CuentaRedes | null)[] // la de META_IG_USER_ID y la de colaboración (null: no respondió)
  top: PostTop[] | null // las 5 con más vistas de 30 días
  comentarios: ComentarioReciente[] | null
  proximas: Programada[] | null
}

// Agenda -------------------------------------------------------------------------------------------------------------

export type DiaAgenda = { dia: string; items: ItemDia[] }

// dias: hoy y mañana (está lista para más días cuando la agenda nueva los traiga). faltan: lo que no se pudo leer
export type VistaAgenda = { dias: DiaAgenda[]; faltan: string[] }

// Conexiones ---------------------------------------------------------------------------------------------------------

export type VistaConexiones = { chequeos: Chequeo[] }

export type DatosVista = { ventas: VistaVentas; redes: VistaRedes; agenda: VistaAgenda; conexiones: VistaConexiones }
