// Qué hace el seed con las tareas del archivo frente a las de la base, y el equipo del plan (lógica pura).
import { isPersona, type Origen, type Persona, type SeedTask } from './types.ts'

export const PLAN_TEAM: { slug: Persona; rol: string }[] = [
  { slug: 'ale', rol: 'Fundador: decide y aprueba' },
  { slug: 'soshil', rol: 'Parte técnica: desarrollo, guiones y edición' },
  { slug: 'alina', rol: 'Closer: llamadas, leads y pipeline' },
]

export interface ExistingTask {
  id: string
  titulo: string
  origen: Origen
  nombre: string | null
  descripcion: string | null
  instrucciones: string | null
}

export interface SeedChanges {
  nuevas: SeedTask[] // se insertan completas
  actualizadas: SeedTask[] // cambia el título, el nombre corto o los textos (qué es / cómo hacerlo); nada más
  choques: string[] // el id ya lo usa una tarea creada desde el panel: no se toca
  soloEnBase: string[] // no se borran
  sinCambios: number
  sinTextos: string[] // tareas del archivo sin "Qué es" / "Cómo hacerlo"
}

export function planSeedChanges(fileTasks: readonly SeedTask[], existing: readonly ExistingTask[]): SeedChanges {
  const byId = new Map(existing.map((t) => [t.id, t]))
  const changes: SeedChanges = { nuevas: [], actualizadas: [], choques: [], soloEnBase: [], sinCambios: 0, sinTextos: [] }
  for (const t of fileTasks) {
    const current = byId.get(t.id)
    if (!current) changes.nuevas.push(t)
    else if (current.origen === 'panel') changes.choques.push(t.id)
    else if (
      current.titulo !== t.titulo ||
      (t.nombre !== undefined && current.nombre !== t.nombre) ||
      (t.descripcion !== undefined && current.descripcion !== t.descripcion) ||
      (t.instrucciones !== undefined && current.instrucciones !== t.instrucciones)
    ) changes.actualizadas.push(t)
    else changes.sinCambios += 1
  }
  const inFile = new Set(fileTasks.map((t) => t.id))
  changes.soloEnBase = existing.filter((t) => !inFile.has(t.id)).map((t) => t.id)
  changes.sinTextos = fileTasks.filter((t) => t.descripcion === undefined || t.instrucciones === undefined).map((t) => t.id)
  return changes
}

// PLAN_Q4_EMAILS="ale:correo,soshil:correo" → { ale: 'correo', soshil: 'correo' }
export function parseTeamEmails(raw: string | undefined): Partial<Record<Persona, string>> {
  const emails: Partial<Record<Persona, string>> = {}
  for (const pair of (raw ?? '').split(',')) {
    const [slug, email] = pair.split(':').map((s) => s.trim())
    if (isPersona(slug) && email?.includes('@')) emails[slug] = email.toLowerCase()
  }
  return emails
}
