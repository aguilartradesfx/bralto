// Vistas de la página del plan (Inicio, Mis tareas, Etapas, Equipo, Estrategia): URL y agrupaciones. Lógica pura.
import { addDays, weekEnd } from './fechas.ts'
import { compareTasks, isActiveWeekly, isDueThisWeek, isOverdue, matchesPersona, resolvePersona, type PersonaFilter } from './rules.ts'
import { PERSONAS, type Persona, type PlanTask } from './types.ts'

export const VISTAS = ['inicio', 'tareas', 'etapas', 'equipo', 'estrategia'] as const
export type Vista = (typeof VISTAS)[number]

export const VISTA_LABELS: Record<Vista, string> = {
  inicio: 'Inicio',
  tareas: 'Mis tareas',
  etapas: 'Etapas',
  equipo: 'Equipo',
  estrategia: 'Estrategia',
}

// Semanas que cuentan como "próximas" después de la actual
const PROXIMAS_SEMANAS = 2

export interface PlanView {
  vista: Vista
  persona: PersonaFilter
  bloque: string | null // solo en Estrategia
  etapa: number | null // mes, solo en Etapas
}

export interface ViewParams {
  vista?: string
  tab?: string // links de la versión anterior (?tab=b8)
  bloque?: string
  etapa?: string
  persona?: string
}

export function resolveView(params: ViewParams, blockKeys: readonly string[], actor: Persona | null): PlanView {
  const persona = resolvePersona(params.persona, actor)
  const legacyBlock = params.tab && blockKeys.includes(params.tab) ? params.tab : null
  let vista: Vista = (VISTAS as readonly string[]).includes(params.vista ?? '') ? (params.vista as Vista) : 'inicio'
  if (legacyBlock && !params.vista) vista = 'estrategia'
  const bloqueParam = params.bloque ?? legacyBlock ?? undefined
  const bloque = vista === 'estrategia' && bloqueParam && blockKeys.includes(bloqueParam) ? bloqueParam : null
  const mes = Number(params.etapa)
  const etapa = vista === 'etapas' && Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : null
  return { vista, persona, bloque, etapa }
}

export function viewHref(view: { vista: Vista; bloque?: string | null; etapa?: number | null }, persona: PersonaFilter): string {
  const params = [`vista=${view.vista}`]
  if (view.bloque) params.push(`bloque=${encodeURIComponent(view.bloque)}`)
  if (view.etapa) params.push(`etapa=${view.etapa}`)
  params.push(`persona=${persona}`)
  return `/plan-q4?${params.join('&')}`
}

export interface MisTareas {
  vencidas: PlanTask[]
  semana: PlanTask[] // únicas abiertas con fecha esta semana
  semanales: PlanTask[] // semanales activas
  proximas: PlanTask[] // únicas abiertas de las 2 semanas siguientes
  despues: { mes: number; tareas: PlanTask[] }[] // el resto, por mes (incluye semanales que todavía no empiezan)
  hechas: PlanTask[] // la más reciente primero
}

const mesDe = (fecha: string) => Number(fecha.slice(5, 7))

export function misTareas(tasks: readonly PlanTask[], today: string, persona: PersonaFilter): MisTareas {
  const mine = tasks.filter((t) => matchesPersona(t, persona)).sort(compareTasks)
  const finSemana = weekEnd(today)
  const limite = addDays(finSemana, PROXIMAS_SEMANAS * 7)
  const abierta = (t: PlanTask) => t.tipo === 'unica' && t.estado !== 'hecho'
  const despues = mine.filter(
    (t) => (abierta(t) && t.fecha > limite) || (t.tipo === 'semanal' && !isActiveWeekly(t, today)),
  )
  const meses = [...new Set(despues.map((t) => mesDe(t.fecha)))].sort((a, b) => a - b)
  return {
    vencidas: mine.filter((t) => isOverdue(t, today)),
    semana: mine.filter((t) => abierta(t) && isDueThisWeek(t, today) && !isOverdue(t, today)),
    semanales: mine.filter((t) => isActiveWeekly(t, today)),
    proximas: mine.filter((t) => abierta(t) && t.fecha > finSemana && t.fecha <= limite),
    despues: meses.map((mes) => ({ mes, tareas: despues.filter((t) => mesDe(t.fecha) === mes) })),
    hechas: mine
      .filter((t) => t.tipo === 'unica' && t.estado === 'hecho')
      .sort((a, b) => (b.actualizado_en ?? b.fecha).localeCompare(a.actualizado_en ?? a.fecha)),
  }
}

export interface ResumenPersona {
  persona: Persona
  semana: number // pendientes de esta semana (únicas con fecha esta semana + semanales sin check)
  vencidas: number
  hechas: number // únicas
  total: number // únicas
}

export function resumenEquipo(tasks: readonly PlanTask[], today: string, doneThisWeek: ReadonlySet<string>): ResumenPersona[] {
  return PERSONAS.map((persona) => {
    const mine = tasks.filter((t) => t.responsable === persona)
    const unicas = mine.filter((t) => t.tipo === 'unica')
    const semana =
      unicas.filter((t) => t.estado !== 'hecho' && isDueThisWeek(t, today) && !isOverdue(t, today)).length +
      mine.filter((t) => isActiveWeekly(t, today) && !doneThisWeek.has(t.id)).length
    return {
      persona,
      semana,
      vencidas: mine.filter((t) => isOverdue(t, today)).length,
      hechas: unicas.filter((t) => t.estado === 'hecho').length,
      total: unicas.length,
    }
  })
}
