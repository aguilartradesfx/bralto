// Validación de lo que llega a /api/plan-q4 (lógica pura): el valor limpio o un error en español.
import { isMonday, isValidDate } from './fechas.ts'
import { isEstado, isPersona, type Persona, type Tipo } from './types.ts'
import type { TaskPatch } from './rules.ts'

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string }

export const MAX_TITULO = 300
export const MAX_NOTA = 2000

export interface NewTask {
  bloque: string
  titulo: string
  responsable: Persona
  apoyo: Persona | null
  fecha: string
  tipo: Tipo
}

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })

function asObject(body: unknown): Record<string, unknown> | null {
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null
}

export function parseTaskPatch(body: unknown): Parsed<TaskPatch> {
  const o = asObject(body)
  if (!o) return fail('Datos inválidos')
  const value: TaskPatch = {}
  if ('estado' in o) {
    if (!isEstado(o.estado)) return fail('Estado inválido')
    value.estado = o.estado
  }
  if ('responsable' in o) {
    if (!isPersona(o.responsable)) return fail('Responsable inválido')
    value.responsable = o.responsable
  }
  if ('apoyo' in o) {
    const apoyo = o.apoyo
    if (apoyo === null) value.apoyo = null
    else if (isPersona(apoyo)) value.apoyo = apoyo
    else return fail('Apoyo inválido')
  }
  if ('fecha' in o) {
    if (typeof o.fecha !== 'string' || !isValidDate(o.fecha)) return fail('Fecha inválida')
    value.fecha = o.fecha
  }
  if ('nota' in o) {
    if (o.nota !== null && typeof o.nota !== 'string') return fail('Nota inválida')
    const nota = typeof o.nota === 'string' ? o.nota.trim() : ''
    if (nota.length > MAX_NOTA) return fail(`La nota pasa de ${MAX_NOTA} caracteres`)
    value.nota = nota || null
  }
  if (Object.keys(value).length === 0) return fail('No hay cambios')
  return { ok: true, value }
}

export function parseNewTask(body: unknown, bloques: readonly string[]): Parsed<NewTask> {
  const o = asObject(body)
  if (!o) return fail('Datos inválidos')
  const { bloque, responsable, fecha, tipo } = o
  if (typeof bloque !== 'string' || !bloques.includes(bloque)) return fail('Bloque inválido')
  const titulo = typeof o.titulo === 'string' ? o.titulo.trim() : ''
  if (!titulo) return fail('Escribí el título de la tarea')
  if (titulo.length > MAX_TITULO) return fail(`El título pasa de ${MAX_TITULO} caracteres`)
  if (!isPersona(responsable)) return fail('Responsable inválido')
  let apoyo: Persona | null = null
  if (o.apoyo !== undefined && o.apoyo !== null && o.apoyo !== '') {
    if (!isPersona(o.apoyo)) return fail('Apoyo inválido')
    apoyo = o.apoyo === responsable ? null : o.apoyo
  }
  if (typeof fecha !== 'string' || !isValidDate(fecha)) return fail('Fecha inválida')
  if (tipo !== 'unica' && tipo !== 'semanal') return fail('Tipo inválido')
  return { ok: true, value: { bloque, titulo, responsable, apoyo, fecha, tipo } }
}

export function parseWeekToggle(body: unknown): Parsed<{ week_start: string; done: boolean }> {
  const o = asObject(body)
  if (!o) return fail('Datos inválidos')
  if (typeof o.week_start !== 'string' || !isMonday(o.week_start)) return fail('La semana tiene que empezar en lunes')
  if (typeof o.done !== 'boolean') return fail('Falta indicar si quedó hecha')
  return { ok: true, value: { week_start: o.week_start, done: o.done } }
}
