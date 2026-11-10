// Las reglas de «Ideas» sin base de datos: la fila, los filtros del panel, las acciones, el rescate de lo trabado
// y el tema que se le pasa a Knox (redes_temas) con «Que lo haga Knox».
import type { Analisis } from './analisis.ts'
import type { Red } from './enlaces.ts'
import type { Metricas } from './metricas.ts'

export type EstadoIdea = 'pendiente' | 'analizando' | 'lista' | 'error'
export type Decision = 'knox' | 'yo' | 'descartada'

// Una fila de lab_ideas (supabase/migrations/20261110_013_lab_ideas.sql)
export type IdeaFila = {
  id: string
  url: string
  red: Red
  origen: 'tu' | 'explorador'
  estado: EstadoIdea
  metricas: Metricas | null
  analisis: Analisis | null
  decision: Decision | null
  decidida_en: string | null
  tema_id: string | null
  error: string | null
  intentos: number
  creada_en: string
  actualizada_en: string
  analizada_en: string | null
}

export const COLUMNAS_IDEA =
  'id, url, red, origen, estado, metricas, analisis, decision, decidida_en, tema_id, error, intentos, creada_en, actualizada_en, analizada_en'

// Al tercer intento fallido queda en error (con «Reintentar» en el panel)
export const MAX_INTENTOS = 3
// Más que el tope de una corrida (300 s): si sigue «analizando», la corrida se cortó
export const TRABADA_MS = 10 * 60_000

export type Filtro = 'nuevas' | 'knox' | 'yo' | 'descartadas'
export const FILTROS: Filtro[] = ['nuevas', 'knox', 'yo', 'descartadas']
export const FILTRO_LABEL: Record<Filtro, string> = { nuevas: 'Nuevas', knox: 'Para Knox', yo: 'Las grabo yo', descartadas: 'Descartadas' }

const DE_FILTRO: Record<Filtro, Decision | null> = { nuevas: null, knox: 'knox', yo: 'yo', descartadas: 'descartada' }

export function filtrarIdeas<T extends Pick<IdeaFila, 'decision'>>(ideas: T[], filtro: Filtro): T[] {
  return ideas.filter((i) => i.decision === DE_FILTRO[filtro])
}

export function contarFiltros(ideas: Pick<IdeaFila, 'decision'>[]): Record<Filtro, number> {
  return Object.fromEntries(FILTROS.map((f) => [f, filtrarIdeas(ideas, f).length])) as Record<Filtro, number>
}

export function leerFiltro(v: unknown): Filtro {
  return typeof v === 'string' && (FILTROS as string[]).includes(v) ? (v as Filtro) : 'nuevas'
}

export type Accion = 'knox' | 'yo' | 'descartar' | 'deshacer' | 'reintentar'
const ACCIONES: Accion[] = ['knox', 'yo', 'descartar', 'deshacer', 'reintentar']

export function leerAccion(body: unknown): { ok: true; accion: Accion } | { ok: false; error: string } {
  const a = body && typeof body === 'object' ? (body as { accion?: unknown }).accion : undefined
  if (typeof a === 'string' && (ACCIONES as string[]).includes(a)) return { ok: true, accion: a as Accion }
  return { ok: false, error: 'Esa acción no existe' }
}

// Lo que se hace con una idea que quedó «analizando» porque la corrida se cortó
export function rescatar(
  f: Pick<IdeaFila, 'estado' | 'actualizada_en' | 'intentos'>,
  ahora: Date,
): { estado: 'pendiente' } | { estado: 'error'; error: string } | null {
  if (f.estado !== 'analizando' || ahora.getTime() - new Date(f.actualizada_en).getTime() < TRABADA_MS) return null
  if (f.intentos >= MAX_INTENTOS) return { estado: 'error', error: 'El análisis se cortó varias veces. Prueba de nuevo.' }
  return { estado: 'pendiente' }
}

// Un tema de redes_temas (tipo «dato» = el reel de Knox) con prioridad alta, para que la tarea de la noche lo tome
export type TemaNuevo = {
  clave: string
  titulo: string
  tipo: 'dato'
  dato: string
  pasos: string[]
  herramientas: string[]
  items: []
  origenes: Array<{ tipo: Red; url: string; cuenta?: string; fecha: string }>
  creadores: number
  puntaje: number
  estado: 'candidato'
}

export function temaDeIdea(f: Pick<IdeaFila, 'id' | 'url' | 'red' | 'metricas' | 'analisis' | 'creada_en'>): TemaNuevo {
  const a = f.analisis
  if (!a) throw new Error('La idea todavía no tiene análisis')
  const v = a.tu_version
  return {
    clave: `idea:${f.id}`,
    titulo: v.titulo,
    tipo: 'dato',
    dato: v.idea,
    pasos: [...v.ganchos.map((g) => `Gancho: ${g}`), ...v.guion, ...(v.comenta ? [`Cierre: Comenta ${v.comenta}`] : [])],
    herramientas: a.herramientas,
    items: [],
    origenes: [
      {
        tipo: f.red,
        url: f.url,
        ...(f.metricas?.cuenta ? { cuenta: f.metricas.cuenta } : {}),
        fecha: f.metricas?.publicado_en ?? f.creada_en,
      },
    ],
    creadores: 1,
    puntaje: 10,
    estado: 'candidato',
  }
}
