// Tipos y catálogos del Plan Q4, compartidos por el parser, las reglas, el seed y la interfaz.

export const PERSONAS = ['ale', 'soshil', 'alina'] as const
export type Persona = (typeof PERSONAS)[number]

export const PERSONA_NAMES: Record<Persona, string> = { ale: 'Ale', soshil: 'Soshil', alina: 'Alina' }

export const ESTADOS = ['pendiente', 'en_curso', 'hecho'] as const
export type Estado = (typeof ESTADOS)[number]

export const ESTADO_LABELS: Record<Estado, string> = { pendiente: 'Pendiente', en_curso: 'En curso', hecho: 'Hecho' }

export type Tipo = 'unica' | 'semanal'
export type Origen = 'plan' | 'panel'

export interface PlanTask {
  id: string // 'B8-04'
  bloque: string // 'b8'
  titulo: string
  responsable: Persona
  apoyo: Persona | null
  fecha: string // en las semanales, desde cuándo corren
  tipo: Tipo
  estado: Estado | null // null en las semanales
  nota: string | null
  origen: Origen
  actualizado_por: Persona | null
  actualizado_en: string | null
}

// Lo que trae el archivo del plan para cada tarea
export type SeedTask = Pick<PlanTask, 'id' | 'bloque' | 'titulo' | 'responsable' | 'apoyo' | 'fecha' | 'tipo' | 'estado'>

export interface WeekCheck {
  task_id: string
  week_start: string
  done: boolean
  done_by: Persona | null
  done_at: string | null
}

export interface Hito {
  fecha: string
  titulo: string
}

// Encabezado fijo de la pestaña Resumen (sale de la Parte 1 del archivo)
export interface ResumenData {
  encabezado: { label: string; value: string }[]
  hitos: Hito[]
}

// Guía para el equipo: textos simples que muestra la página (sección "# Guía para el equipo" del archivo)
export interface GuiaData {
  queEs: string // markdown
  queVamos: string // markdown
  etapas: Record<string, string> // mes en minúscula ('octubre') → resumen en markdown
  equipo: Partial<Record<Persona, string>> // qué hace cada persona
  grupos: { titulo: string; bloques: string[] }[] // Estrategia: grupos de bloques ('b0', 'decisiones')
  areas: Record<string, string> // bloque ('b8') → nombre corto del área ('Campañas')
}

// Etapas del trimestre (del calendario del plan: "#### Octubre — preparar y encender Bralto")
export interface SemanaEtapa {
  semana: string // '12–18 oct'
  foco: string // markdown en una línea
  hito: string | null
}

export interface Etapa {
  mes: number // 1–12
  nombreMes: string // 'Octubre'
  titulo: string // 'preparar y encender Bralto'
  semanas: SemanaEtapa[]
}

export interface PuntoDecision {
  cuando: string
  pregunta: string
  accion: string
}

export function isPersona(value: unknown): value is Persona {
  return typeof value === 'string' && (PERSONAS as readonly string[]).includes(value)
}

export function isEstado(value: unknown): value is Estado {
  return typeof value === 'string' && (ESTADOS as readonly string[]).includes(value)
}
