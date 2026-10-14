// Etapas del trimestre, leídas del calendario del plan (un bloque con "#### Octubre — preparar…",
// su tabla Semana | Foco | Hito y la tabla de "#### Puntos de decisión"). Lógica pura.
import { MESES_LARGOS } from './guia.ts'
import { splitRow } from './parse.ts'
import type { Etapa, PlanTask, PuntoDecision } from './types.ts'
import type { PlanBlock } from './parse.ts'

const ETAPA_HEADING = /^#### (\p{L}+) — (.+)$/u
const DECISIONES_HEADING = /^#### Puntos de decisión\s*$/
const SEPARATOR = /^\|[\s:|-]+\|$/
const isEmpty = (cell: string) => cell === '—' || cell === ''
// En una celda "\|" es una barra; el resto de los escapes quedan para el markdown
const cell = (raw: string) => raw.replace(/\\\|/g, '|')

// Filas de la primera tabla que aparece en las líneas (sin encabezado ni separador)
function tableRows(lines: string[]): string[][] {
  const rows: string[][] = []
  let started = false
  for (const raw of lines) {
    const line = raw.trim()
    if (line.startsWith('|')) {
      started = true
      if (!SEPARATOR.test(line)) rows.push(splitRow(line).map(cell))
    } else if (started && line) break
  }
  return rows.slice(1)
}

export function parseEtapas(blocks: readonly PlanBlock[]): { etapas: Etapa[]; decisiones: PuntoDecision[] } {
  const etapas: Etapa[] = []
  const decisiones: PuntoDecision[] = []
  for (const block of blocks) {
    const lines = block.contexto.split('\n')
    lines.forEach((line, i) => {
      const next = lines.slice(i + 1)
      const until = next.findIndex((l) => l.startsWith('#### ') || l.startsWith('### '))
      const section = until < 0 ? next : next.slice(0, until)
      const m = ETAPA_HEADING.exec(line)
      if (m && MESES_LARGOS.includes(m[1].toLowerCase())) {
        etapas.push({
          mes: MESES_LARGOS.indexOf(m[1].toLowerCase()) + 1,
          nombreMes: m[1],
          titulo: m[2].trim(),
          semanas: tableRows(section)
            .filter((r) => r.length >= 2)
            .map(([semana, foco, hito = '']) => ({ semana, foco, hito: isEmpty(hito) ? null : hito })),
        })
      } else if (DECISIONES_HEADING.test(line)) {
        for (const [cuando, pregunta, accion = ''] of tableRows(section)) decisiones.push({ cuando, pregunta, accion })
      }
    })
  }
  return { etapas: etapas.sort((a, b) => a.mes - b.mes), decisiones }
}

const mesDe = (fecha: string) => Number(fecha.slice(5, 7))

// La etapa del mes de hoy; antes del plan, la primera; después, la última
export function etapaActual(etapas: readonly Etapa[], today: string): Etapa | null {
  if (etapas.length === 0) return null
  const mes = mesDe(today)
  return etapas.find((e) => e.mes === mes) ?? (mes < etapas[0].mes ? etapas[0] : etapas[etapas.length - 1])
}

// Avance de las únicas con fecha en el mes de la etapa
export function progresoEtapa(tasks: readonly PlanTask[], mes: number): { hechas: number; total: number } {
  const delMes = tasks.filter((t) => t.tipo === 'unica' && mesDe(t.fecha) === mes)
  return { hechas: delMes.filter((t) => t.estado === 'hecho').length, total: delMes.length }
}
