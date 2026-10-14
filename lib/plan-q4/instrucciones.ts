// Parser de las "Instrucciones de las tareas" del archivo del plan: qué es y cómo hacerlo de cada tarea.
// Va antes de "# Parte 2" y el seed lo guarda en plan_tasks.descripcion / plan_tasks.instrucciones.
//
// # Instrucciones de las tareas
// ## B8-04 · título opcional (solo para quien edita)
// ### Qué es          → una o dos frases
// ### Cómo hacerlo    → pasos en markdown
import { PlanParseError } from './parse.ts'
import type { TextosTarea } from './types.ts'

const HEADING = /^# Instrucciones de las tareas\s*$/
const TASK_HEADING = /^## (\S+)(?:\s+·.*)?$/
const ID = /^B\d+-\d{2,}$/

export function parseInstrucciones(source: string): Record<string, TextosTarea> | null {
  const all = source.replace(/\r\n/g, '\n').split('\n')
  const start = all.findIndex((line) => HEADING.test(line))
  if (start < 0) return null
  const end = all.findIndex((line, i) => i > start && line.startsWith('# '))
  const body = all.slice(start + 1, end < 0 ? undefined : end)

  const problems: string[] = []
  const entries: { id: string; lines: string[] }[] = []
  for (const line of body) {
    if (line.startsWith('## ')) {
      const id = TASK_HEADING.exec(line)?.[1] ?? ''
      if (!ID.test(id)) problems.push(`Instrucciones: "${line}" no empieza con el id de una tarea (## B8-04)`)
      entries.push({ id, lines: [] })
    } else if (entries.length > 0) entries[entries.length - 1].lines.push(line)
  }

  const out: Record<string, TextosTarea> = {}
  for (const { id, lines } of entries) {
    if (!ID.test(id)) continue
    if (out[id]) problems.push(`Instrucciones: ${id} está repetida`)
    const parts = new Map<string, string[]>()
    let current: string[] | null = null
    for (const line of lines) {
      if (line.startsWith('### ')) {
        const name = line.slice(4).trim()
        if (name !== 'Qué es' && name !== 'Cómo hacerlo') problems.push(`Instrucciones → ${id}: sección desconocida "### ${name}"`)
        current = []
        parts.set(name, current)
      } else if (current) current.push(line)
    }
    const text = (name: string) =>
      (parts.get(name) ?? [])
        .join('\n')
        .replace(/\n-{3,}\s*$/, '')
        .trim()
    const descripcion = text('Qué es')
    const instrucciones = text('Cómo hacerlo')
    if (!descripcion) problems.push(`Instrucciones → ${id}: falta "### Qué es"`)
    if (!instrucciones) problems.push(`Instrucciones → ${id}: falta "### Cómo hacerlo"`)
    out[id] = { descripcion, instrucciones }
  }

  if (problems.length > 0) throw new PlanParseError(problems)
  return out
}
