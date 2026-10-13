// Parser del archivo del plan (plan-q4-admin.md): bloques, su Contexto en markdown y las tareas del seed.
// Cada bloque: "## B8 — Título · Acción", con "### Tareas (seed)" (tabla) y "### Contexto".
import { isValidDate } from './fechas.ts'
import { PERSONA_NAMES, type Estado, type Hito, type Persona, type ResumenData, type SeedTask, type Tipo } from './types.ts'

export interface PlanBlock {
  key: string // 'b8' o 'decisiones': va en ?tab=
  code: string | null // 'B8'; null en bloques sin clave (Decisiones)
  titulo: string
  tipo: 'lectura' | 'accion'
  contexto: string // markdown
  tareas: SeedTask[]
}

export class PlanParseError extends Error {
  readonly problems: string[]
  constructor(problems: string[]) {
    super(`El plan tiene ${problems.length} error(es):\n- ${problems.join('\n- ')}`)
    this.name = 'PlanParseError'
    this.problems = problems
  }
}

const PART_TWO = /^# Parte 2\b/
const BLOCK_HEADING = /^## (?:(B\d+) — )?(.+?) · (Lectura|Acción)\s*$/
const TABLE_SEPARATOR = /^\|[\s:|-]+\|$/
const PERSONA_BY_NAME = new Map(
  (Object.entries(PERSONA_NAMES) as [Persona, string][]).map(([slug, name]) => [name.toLowerCase(), slug]),
)
const ESTADO_BY_TEXT: Record<string, Estado> = { pendiente: 'pendiente', 'en curso': 'en_curso', hecho: 'hecho' }
const TIPO_BY_TEXT: Record<string, Tipo> = { 'única': 'unica', unica: 'unica', semanal: 'semanal' }
const MESES: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12,
}

const isEmpty = (cell: string) => cell === '—' || cell === ''

function lines(source: string): string[] {
  return source.replace(/\r\n/g, '\n').split('\n')
}

// La Parte 2 del archivo (lo que se guarda en plan_content); el archivo entero si no tiene "# Parte 2"
export function planBody(source: string): string {
  const all = lines(source)
  const partTwo = all.findIndex((line) => PART_TWO.test(line))
  return `${(partTwo >= 0 ? all.slice(partTwo + 1) : all).join('\n').trim()}\n`
}

// Celdas de una fila de tabla markdown; "\|" es una barra dentro de la celda
export function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '').split(/(?<!\\)\|/).map((cell) => cell.trim())
}

// Texto plano a partir de markdown escapado: "\$3,500" → "$3,500", "\|" → "|"
export function unescapeMd(text: string): string {
  return text.replace(/\\([\\`*_{}[\]()#+\-.!|$])/g, '$1')
}

function slugify(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function parseTaskRow(cells: string[], block: { code: string; key: string }, where: string, problems: string[]): SeedTask | null {
  if (cells.length !== 7) {
    problems.push(`${where}: se esperaban 7 columnas (ID, Tarea, Responsable, Apoyo, Fecha, Tipo, Estado) y hay ${cells.length}`)
    return null
  }
  const [id, tituloRaw, responsableRaw, apoyoRaw, fechaRaw, tipoRaw, estadoRaw] = cells
  const before = problems.length

  if (!new RegExp(`^${block.code}-\\d{2,}$`).test(id)) problems.push(`${where}: el id "${id}" no sigue el patrón ${block.code}-NN`)
  const titulo = unescapeMd(tituloRaw)
  if (!titulo) problems.push(`${where}: falta el título`)

  const responsable = PERSONA_BY_NAME.get(responsableRaw.toLowerCase()) ?? null
  if (!responsable) problems.push(`${where}: responsable desconocido "${responsableRaw}"`)
  let apoyo: Persona | null = null
  if (!isEmpty(apoyoRaw)) {
    apoyo = PERSONA_BY_NAME.get(apoyoRaw.toLowerCase()) ?? null
    if (!apoyo) problems.push(`${where}: apoyo desconocido "${apoyoRaw}"`)
    else if (apoyo === responsable) problems.push(`${where}: el apoyo es el mismo responsable`)
  }

  const tipo = TIPO_BY_TEXT[tipoRaw.toLowerCase()] ?? null
  if (!tipo) problems.push(`${where}: tipo desconocido "${tipoRaw}" (única o semanal)`)

  const fechaMatch = /^(desde )?(\d{4}-\d{2}-\d{2})$/.exec(fechaRaw)
  const fecha = fechaMatch && isValidDate(fechaMatch[2]) ? fechaMatch[2] : null
  if (!fecha) problems.push(`${where}: fecha inválida "${fechaRaw}"`)
  else if (tipo && !!fechaMatch?.[1] !== (tipo === 'semanal')) {
    problems.push(`${where}: las semanales llevan "desde AAAA-MM-DD" y las únicas solo la fecha`)
  }

  let estado: Estado | null = null
  if (tipo === 'unica') {
    estado = ESTADO_BY_TEXT[estadoRaw.toLowerCase()] ?? null
    if (!estado) problems.push(`${where}: estado desconocido "${estadoRaw}" (pendiente, en curso o hecho)`)
  } else if (tipo === 'semanal' && !isEmpty(estadoRaw)) {
    problems.push(`${where}: las semanales no llevan estado (usar —)`)
  }

  if (problems.length > before || !responsable || !tipo || !fecha) return null
  return { id, bloque: block.key, titulo, responsable, apoyo, fecha, tipo, estado }
}

export function parsePlan(source: string): PlanBlock[] {
  const problems: string[] = []
  const raw: { heading: string; body: string[] }[] = []
  for (const line of lines(planBody(source))) {
    if (line.startsWith('## ')) raw.push({ heading: line.trim(), body: [] })
    else if (raw.length > 0) raw[raw.length - 1].body.push(line)
    else if (line.trim()) problems.push(`texto antes del primer bloque: "${line.trim().slice(0, 60)}"`)
  }
  if (raw.length === 0) problems.push('no hay ningún bloque ("## B0 — Título · Lectura")')

  const blocks: PlanBlock[] = []
  const seenKeys = new Set<string>()
  const seenIds = new Set<string>()
  for (const { heading, body } of raw) {
    const m = BLOCK_HEADING.exec(heading)
    if (!m) {
      problems.push(`encabezado inválido "${heading}" (formato: "## B8 — Título · Acción")`)
      continue
    }
    const code = m[1] ?? null
    const titulo = m[2].trim()
    const tipo = m[3] === 'Acción' ? 'accion' : 'lectura'
    const key = code ? code.toLowerCase() : slugify(titulo)
    const label = code ?? titulo
    if (seenKeys.has(key)) problems.push(`${label}: bloque repetido`)
    seenKeys.add(key)

    const sections = new Map<string, string[]>()
    let current: string[] | null = null
    for (const line of body) {
      if (line.startsWith('### ')) {
        const name = line.slice(4).trim()
        if (name !== 'Contexto' && name !== 'Tareas (seed)') problems.push(`${label}: sección desconocida "### ${name}"`)
        current = []
        sections.set(name, current)
      } else if (current) current.push(line)
      else if (line.trim()) problems.push(`${label}: texto fuera de "### Contexto"`)
    }

    const contexto = (sections.get('Contexto') ?? []).join('\n').trim()
    if (!contexto) problems.push(`${label}: falta "### Contexto" o está vacío`)

    const tareas: SeedTask[] = []
    const tableLines = sections.get('Tareas (seed)')
    if (tableLines) {
      if (tipo === 'lectura') problems.push(`${label}: un bloque de lectura no lleva tareas`)
      if (!code) problems.push(`${label}: solo los bloques con clave (B0, B1…) llevan tareas`)
      const rows = tableLines.map((l) => l.trim()).filter(Boolean)
      if (rows.some((l) => !l.startsWith('|'))) problems.push(`${label}: hay texto fuera de la tabla de tareas`)
      const tableRows = rows.filter((l) => l.startsWith('|'))
      if (tableRows.length < 2 || !TABLE_SEPARATOR.test(tableRows[1])) {
        problems.push(`${label}: la tabla de tareas necesita encabezado y separador`)
      } else if (code) {
        tableRows.slice(2).forEach((row, i) => {
          const task = parseTaskRow(splitRow(row), { code, key }, `${label} fila ${i + 1}`, problems)
          if (!task) return
          if (seenIds.has(task.id)) problems.push(`${label}: id repetido ${task.id}`)
          seenIds.add(task.id)
          tareas.push(task)
        })
      }
    }
    blocks.push({ key, code, titulo, tipo, contexto, tareas })
  }

  if (problems.length > 0) throw new PlanParseError(problems)
  return blocks
}

// "3 oct arranque · 14 nov revisión" → hitos con fecha
function parseHitos(text: string, year: number): Hito[] {
  const problems: string[] = []
  const hitos = text.split('·').map((part) => part.trim()).filter(Boolean).flatMap((part) => {
    const m = /^(\d{1,2}) (\p{L}{3})\p{L}*\.? (.+)$/u.exec(part)
    const month = m ? MESES[m[2].toLowerCase()] : undefined
    const fecha = m && month ? `${year}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}` : ''
    if (!m || !isValidDate(fecha)) {
      problems.push(`hito sin fecha legible: "${part}" (formato: "3 oct texto")`)
      return []
    }
    return [{ fecha, titulo: m[3].charAt(0).toUpperCase() + m[3].slice(1) }]
  })
  if (problems.length > 0) throw new PlanParseError(problems)
  return hitos.sort((a, b) => a.fecha.localeCompare(b.fecha))
}

// Encabezado fijo del Resumen: viñetas "- **Etiqueta:** valor" bajo "### Pestaña Resumen" (Parte 1).
// null si el archivo no trae esa sección.
export function parseResumen(source: string): ResumenData | null {
  const all = lines(source)
  const start = all.findIndex((line) => /^### Pestaña Resumen\s*$/.test(line))
  if (start < 0) return null
  const year = Number(/Q4 (\d{4})/.exec(source)?.[1] ?? new Date().getUTCFullYear())
  const resumen: ResumenData = { encabezado: [], hitos: [] }
  for (const line of all.slice(start + 1)) {
    if (/^#{1,3} /.test(line)) break
    const m = /^- \*\*(.+?):\*\*\s*(.+)$/.exec(line.trim())
    if (!m) continue
    const label = unescapeMd(m[1])
    const value = unescapeMd(m[2].trim())
    if (label.toLowerCase() === 'hitos') resumen.hitos = parseHitos(value, year)
    else resumen.encabezado.push({ label, value })
  }
  return resumen.encabezado.length > 0 || resumen.hitos.length > 0 ? resumen : null
}
