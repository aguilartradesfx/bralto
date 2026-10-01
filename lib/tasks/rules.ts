// Reglas de la sección Tareas: estados, quién los mueve, quién ve qué y a quién se avisa.

export const TASK_STATUSES = ['pendiente', 'en_progreso', 'bloqueada', 'en_revision', 'hecha'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]
export const TASK_PRIORITIES = ['baja', 'normal', 'alta', 'urgente'] as const
// Máximo de criterios por tarea (formulario, validación y guardado)
export const MAX_CHECKLIST = 30
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  bloqueada: 'Bloqueada',
  en_revision: 'En revisión',
  hecha: 'Hecha',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  baja: 'Baja',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

export interface Actor { id: string; isAdmin: boolean }
export interface TaskRef { assignee_id: string | null; created_by: string | null; status: TaskStatus }

// El responsable avanza su tarea hasta revisión; aprobar o devolver es de un admin
const ASSIGNEE_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pendiente: ['en_progreso', 'bloqueada'],
  en_progreso: ['en_revision', 'bloqueada'],
  bloqueada: ['en_progreso'],
  en_revision: [],
  hecha: [],
}

export function canViewTask(actor: Actor, task: Pick<TaskRef, 'assignee_id'>): boolean {
  return actor.isAdmin || (task.assignee_id !== null && task.assignee_id === actor.id)
}

export function allowedTransitions(actor: Actor, task: TaskRef): TaskStatus[] {
  if (actor.isAdmin) return TASK_STATUSES.filter((s) => s !== task.status)
  if (task.assignee_id !== actor.id) return []
  return ASSIGNEE_TRANSITIONS[task.status]
}

export type UpdateKind = 'avance' | 'estado' | 'devolucion' | 'bloqueo'

// Qué entrada deja un cambio de estado en el historial y si exige nota
export function transitionKind(from: TaskStatus, to: TaskStatus): { kind: UpdateKind; noteRequired: boolean } {
  if (to === 'bloqueada') return { kind: 'bloqueo', noteRequired: true }
  if (from === 'en_revision' && to !== 'hecha') return { kind: 'devolucion', noteRequired: true }
  return { kind: 'estado', noteRequired: false }
}

export type TaskEmail = 'asignada' | 'en_revision' | 'devuelta' | 'bloqueada'
export interface Notice { to: string; email: TaskEmail }

export function noticesForAssignment(actorId: string, assigneeId: string | null, previousAssigneeId: string | null): Notice[] {
  if (!assigneeId || assigneeId === previousAssigneeId || assigneeId === actorId) return []
  return [{ to: assigneeId, email: 'asignada' }]
}

export function noticesForTransition(actorId: string, task: TaskRef, to: TaskStatus): Notice[] {
  const { kind } = transitionKind(task.status, to)
  const notices: Notice[] = []
  if (to === 'en_revision' && task.created_by) notices.push({ to: task.created_by, email: 'en_revision' })
  if (kind === 'bloqueo' && task.created_by) notices.push({ to: task.created_by, email: 'bloqueada' })
  if (kind === 'devolucion' && task.assignee_id) notices.push({ to: task.assignee_id, email: 'devuelta' })
  return notices.filter((n) => n.to !== actorId)
}

// Costa Rica es UTC−6 todo el año
const CR_OFFSET_MS = 6 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export function costaRicaDayRange(now: Date): { start: string; end: string } {
  const local = new Date(now.getTime() - CR_OFFSET_MS)
  const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) + CR_OFFSET_MS
  return { start: new Date(start).toISOString(), end: new Date(start + DAY_MS).toISOString() }
}

// Fecha calendario (YYYY-MM-DD) de Costa Rica
export function costaRicaDate(now: Date): string {
  return new Date(now.getTime() - CR_OFFSET_MS).toISOString().slice(0, 10)
}

const PRIORITY_RANK: Record<TaskPriority, number> = { urgente: 0, alta: 1, normal: 2, baja: 3 }

// Orden dentro de una columna: prioridad, fecha límite más cercana (sin fecha al final), actividad reciente
export function compareTasks(
  a: { priority: TaskPriority; due_date: string | null; updated_at: string },
  b: { priority: TaskPriority; due_date: string | null; updated_at: string },
): number {
  const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  if (byPriority !== 0) return byPriority
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date < b.due_date ? -1 : 1
  }
  return b.updated_at.localeCompare(a.updated_at)
}
