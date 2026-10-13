// Reglas del Plan Q4: vencidas, semana actual, semanales, pendientes, orden, resumen, ids nuevos y cambios.
import { daysBetween, weekEnd, weekStart } from './fechas.ts'
import { PERSONAS, isPersona, type Estado, type Hito, type Persona, type PlanTask } from './types.ts'

export type PersonaFilter = Persona | 'todos'
export const RESUMEN_TAB = 'resumen'

type Fechada = Pick<PlanTask, 'tipo' | 'estado' | 'fecha'>

export function isOverdue(task: Fechada, today: string): boolean {
  return task.tipo === 'unica' && task.estado !== 'hecho' && task.fecha < today
}

export function isDueThisWeek(task: Fechada, today: string): boolean {
  return task.tipo === 'unica' && task.fecha >= weekStart(today) && task.fecha <= weekEnd(today)
}

// Una semanal aparece todas las semanas desde la de su fecha de inicio
export function isActiveWeekly(task: Fechada, today: string): boolean {
  return task.tipo === 'semanal' && task.fecha <= weekEnd(today)
}

// doneThisWeek: ids de las semanales con check en la semana actual
export function isPending(task: Fechada & Pick<PlanTask, 'id'>, today: string, doneThisWeek: ReadonlySet<string>): boolean {
  if (task.tipo === 'unica') return task.estado !== 'hecho'
  return isActiveWeekly(task, today) && !doneThisWeek.has(task.id)
}

export function matchesPersona(task: Pick<PlanTask, 'responsable'>, persona: PersonaFilter): boolean {
  return persona === 'todos' || task.responsable === persona
}

// Únicas abiertas por fecha (las vencidas quedan primero), después las semanales y al final las hechas
export function compareTasks(a: PlanTask, b: PlanTask): number {
  const rank = (t: PlanTask) => (t.tipo === 'semanal' ? 1 : t.estado === 'hecho' ? 2 : 0)
  return rank(a) - rank(b) || a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id, 'en', { numeric: true })
}

export function pendingByBlock(
  tasks: readonly PlanTask[],
  today: string,
  doneThisWeek: ReadonlySet<string>,
  persona: PersonaFilter,
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const t of tasks) {
    if (matchesPersona(t, persona) && isPending(t, today, doneThisWeek)) counts.set(t.bloque, (counts.get(t.bloque) ?? 0) + 1)
  }
  return counts
}

export interface PersonWeek {
  persona: Persona
  vencidas: PlanTask[]
  semana: PlanTask[]
  semanales: PlanTask[]
}

// "Esta semana" del Resumen, por responsable. Una vencida no se repite en la semana.
export function weekSummary(tasks: readonly PlanTask[], today: string, persona: PersonaFilter): PersonWeek[] {
  return PERSONAS.filter((p) => persona === 'todos' || p === persona).map((p) => {
    const mine = tasks.filter((t) => t.responsable === p).sort(compareTasks)
    return {
      persona: p,
      vencidas: mine.filter((t) => isOverdue(t, today)),
      semana: mine.filter((t) => isDueThisWeek(t, today) && !isOverdue(t, today)),
      semanales: mine.filter((t) => isActiveWeekly(t, today)),
    }
  })
}

// Avance de las únicas por bloque
export function blockProgress(tasks: readonly PlanTask[], persona: PersonaFilter): Map<string, { hechas: number; total: number }> {
  const progress = new Map<string, { hechas: number; total: number }>()
  for (const t of tasks) {
    if (t.tipo !== 'unica' || !matchesPersona(t, persona)) continue
    const p = progress.get(t.bloque) ?? { hechas: 0, total: 0 }
    p.total += 1
    if (t.estado === 'hecho') p.hechas += 1
    progress.set(t.bloque, p)
  }
  return progress
}

export function nextMilestone(hitos: readonly Hito[], today: string): { hito: Hito; dias: number } | null {
  const hito = [...hitos].sort((a, b) => a.fecha.localeCompare(b.fecha)).find((h) => h.fecha >= today)
  return hito ? { hito, dias: daysBetween(today, hito.fecha) } : null
}

export function nextTaskId(code: string, existingIds: readonly string[]): string {
  const prefix = `${code}-`
  const max = existingIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter(Number.isInteger)
    .reduce((m, n) => Math.max(m, n), 0)
  return `${prefix}${String(max + 1).padStart(2, '0')}`
}

// Pestaña y persona de la URL; lo inválido cae en Resumen y en la persona del usuario
export function resolveTab(raw: string | undefined, keys: readonly string[]): string {
  return raw && keys.includes(raw) ? raw : RESUMEN_TAB
}

export function resolvePersona(raw: string | undefined, actor: Persona | null): PersonaFilter {
  if (raw === 'todos') return 'todos'
  if (isPersona(raw)) return raw
  return actor ?? 'todos'
}

export function planHref(tab: string, persona: PersonaFilter): string {
  return `/plan-q4?tab=${encodeURIComponent(tab)}&persona=${persona}`
}

export interface TaskPatch {
  estado?: Estado
  responsable?: Persona
  apoyo?: Persona | null
  fecha?: string
  nota?: string | null
}

export interface TaskForm {
  estado: Estado
  responsable: Persona
  apoyo: Persona | null
  fecha: string
  nota: string
}

// Solo lo que cambió en el formulario de edición. Delegar a quien era el apoyo deja la tarea sin apoyo.
export function diffTask(task: PlanTask, form: TaskForm): TaskPatch {
  const patch: TaskPatch = {}
  if (task.tipo === 'unica' && form.estado !== task.estado) patch.estado = form.estado
  if (form.responsable !== task.responsable) patch.responsable = form.responsable
  const apoyo = form.apoyo === form.responsable ? null : form.apoyo
  if (apoyo !== task.apoyo) patch.apoyo = apoyo
  if (form.fecha !== task.fecha) patch.fecha = form.fecha
  const nota = form.nota.trim() || null
  if (nota !== task.nota) patch.nota = nota
  return patch
}

// Cambios a guardar en la base, firmados por quien los hizo
export function buildUpdate(
  current: Pick<PlanTask, 'tipo' | 'responsable' | 'apoyo'>,
  patch: TaskPatch,
  actor: Persona,
  now: string,
): { ok: true; update: Record<string, unknown> } | { ok: false; error: string } {
  if (patch.estado !== undefined && current.tipo === 'semanal') {
    return { ok: false, error: 'Las semanales no tienen estado: se marcan por semana' }
  }
  const update: Record<string, unknown> = { ...patch, actualizado_por: actor, actualizado_en: now }
  const responsable = patch.responsable ?? current.responsable
  const apoyo = patch.apoyo !== undefined ? patch.apoyo : current.apoyo
  if (apoyo !== null && apoyo === responsable) update.apoyo = null
  return { ok: true, update }
}

// Un check semanal solo vale para semanales y desde la semana en que arrancan
export function weekToggleError(task: Pick<PlanTask, 'tipo' | 'fecha'>, week: string): string | null {
  if (task.tipo !== 'semanal') return 'Solo las semanales se marcan por semana'
  if (week < weekStart(task.fecha)) return 'Esa semana es anterior al inicio de la tarea'
  return null
}
