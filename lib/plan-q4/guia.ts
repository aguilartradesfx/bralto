// Parser de la "Guía para el equipo" del archivo del plan: los textos simples que muestran Inicio,
// Etapas, Equipo y Estrategia. Va antes de "# Parte 2" y el seed la guarda en plan_content.guia.
//
// # Guía para el equipo
// ## Qué es esto            → markdown
// ## Qué vamos a hacer      → markdown
// ## Etapas                 → ### Octubre / ### Noviembre … con un resumen corto
// ## Equipo                 → ### Ale / ### Soshil / ### Alina con qué hace cada quien
// ## Estrategia             → - Título del grupo: B0, B1
// ## Áreas                  → - B8: Campañas
import { PlanParseError, slugify } from './parse.ts'
import { PERSONA_NAMES, type GuiaData, type Persona } from './types.ts'

const GUIA_HEADING = /^# Guía para el equipo\s*$/
export const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const PERSONA_BY_NAME = new Map(
  (Object.entries(PERSONA_NAMES) as [Persona, string][]).map(([slug, name]) => [name.toLowerCase(), slug]),
)

// 'B8' → 'b8'; 'Decisiones' → 'decisiones' (la misma clave de pestaña que usa parsePlan)
function blockKey(label: string): string {
  const trimmed = label.trim()
  return /^B\d+$/i.test(trimmed) ? trimmed.toLowerCase() : slugify(trimmed)
}

// Secciones "## Título" (o "### Título") de un trozo de markdown: título → líneas
function sections(lines: string[], marker: '## ' | '### '): Map<string, string[]> {
  const out = new Map<string, string[]>()
  let current: string[] | null = null
  for (const line of lines) {
    if (line.startsWith(marker)) {
      current = []
      out.set(line.slice(marker.length).trim(), current)
    } else if (current) current.push(line)
  }
  return out
}

const text = (lines: string[] | undefined) => (lines ?? []).join('\n').trim()

function bullets(lines: string[], where: string, problems: string[]): [string, string][] {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const m = /^- (.+?):\s*(.+)$/.exec(line)
      if (!m) {
        problems.push(`${where}: la línea "${line}" no tiene el formato "- Nombre: valor"`)
        return []
      }
      return [[m[1].trim(), m[2].trim()] as [string, string]]
    })
}

export function parseGuia(source: string): GuiaData | null {
  const all = source.replace(/\r\n/g, '\n').split('\n')
  const start = all.findIndex((line) => GUIA_HEADING.test(line))
  if (start < 0) return null
  const end = all.findIndex((line, i) => i > start && line.startsWith('# '))
  const body = all.slice(start + 1, end < 0 ? undefined : end)
  // la regla horizontal antes de la Parte 2 no es parte de la guía
  while (body.length && /^(-{3,}|\s*)$/.test(body[body.length - 1])) body.pop()

  const problems: string[] = []
  const parts = sections(body, '## ')
  const known = ['Qué es esto', 'Qué vamos a hacer', 'Etapas', 'Equipo', 'Estrategia', 'Áreas']
  for (const name of parts.keys()) if (!known.includes(name)) problems.push(`Guía: sección desconocida "## ${name}"`)

  const etapas: Record<string, string> = {}
  for (const [mes, lines] of sections(parts.get('Etapas') ?? [], '### ')) {
    const key = mes.toLowerCase()
    if (!MESES_LARGOS.includes(key)) problems.push(`Guía → Etapas: "${mes}" no es un mes`)
    else etapas[key] = text(lines)
  }

  const equipo: Partial<Record<Persona, string>> = {}
  for (const [name, lines] of sections(parts.get('Equipo') ?? [], '### ')) {
    const slug = PERSONA_BY_NAME.get(name.toLowerCase())
    if (!slug) problems.push(`Guía → Equipo: no hay nadie llamado "${name}" en el equipo del plan`)
    else equipo[slug] = text(lines)
  }

  const grupos = bullets(parts.get('Estrategia') ?? [], 'Guía → Estrategia', problems).map(([titulo, codes]) => ({
    titulo,
    bloques: codes.split(',').map(blockKey).filter(Boolean),
  }))

  const areas: Record<string, string> = {}
  for (const [code, name] of bullets(parts.get('Áreas') ?? [], 'Guía → Áreas', problems)) {
    if (!/^B\d+$/i.test(code)) problems.push(`Guía → Áreas: "${code}" no es un bloque (B0, B1…)`)
    else areas[code.toLowerCase()] = name
  }

  if (problems.length > 0) throw new PlanParseError(problems)
  return { queEs: text(parts.get('Qué es esto')), queVamos: text(parts.get('Qué vamos a hacer')), etapas, equipo, grupos, areas }
}
