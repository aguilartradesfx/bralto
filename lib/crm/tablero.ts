// El tablero del pipeline y la lista de tareas: cómo se agrupa lo que viene de la base.
import { diaCR, hoyCR, sumarDias } from '../calendario/fechas.ts'

export interface Columna<T> {
  etapa: { id: string; nombre: string }
  tarjetas: T[]
  suma: number // la plata de la columna
}

// Una columna por etapa, en su orden, con sus oportunidades y lo que suman
export function armarTablero<T extends { etapa_id: string; valor: number }>(
  etapas: { id: string; nombre: string; orden: number }[],
  oportunidades: T[],
): Columna<T>[] {
  const columnas = [...etapas]
    .sort((a, b) => a.orden - b.orden)
    .map((e): Columna<T> => ({ etapa: { id: e.id, nombre: e.nombre }, tarjetas: [], suma: 0 }))
  const porEtapa = new Map(columnas.map((c) => [c.etapa.id, c]))
  for (const o of oportunidades) {
    const columna = porEtapa.get(o.etapa_id)
    if (!columna) continue
    columna.tarjetas.push(o)
    columna.suma += Number(o.valor) || 0
  }
  for (const c of columnas) c.suma = Math.round(c.suma * 100) / 100
  return columnas
}

// '$1,500' (sin centavos si no hay)
export function dinero(valor: number): string {
  return `$${valor.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export const GRUPOS = ['atrasadas', 'hoy', 'manana', 'semana', 'despues', 'sin_fecha'] as const
export type Grupo = (typeof GRUPOS)[number]
export const GRUPO_LABEL: Record<Grupo, string> = {
  atrasadas: 'Atrasadas',
  hoy: 'Hoy',
  manana: 'Mañana',
  semana: 'Esta semana',
  despues: 'Más adelante',
  sin_fecha: 'Sin fecha',
}

export function grupoDe(venceEn: string | null, hoy: string): Grupo {
  if (!venceEn) return 'sin_fecha'
  const dia = diaCR(venceEn)
  if (dia < hoy) return 'atrasadas'
  if (dia === hoy) return 'hoy'
  if (dia === sumarDias(hoy, 1)) return 'manana'
  if (dia <= sumarDias(hoy, 7)) return 'semana'
  return 'despues'
}

// Las tareas pendientes por fecha (las atrasadas primero), solo los grupos que tienen algo
export function agruparTareas<T extends { vence_en: string | null }>(tareas: T[], ahora: Date): [Grupo, T[]][] {
  const hoy = hoyCR(ahora)
  const grupos = new Map<Grupo, T[]>(GRUPOS.map((g) => [g, []]))
  const ordenadas = [...tareas].sort((a, b) => (a.vence_en ? Date.parse(a.vence_en) : Infinity) - (b.vence_en ? Date.parse(b.vence_en) : Infinity))
  for (const t of ordenadas) grupos.get(grupoDe(t.vence_en, hoy))!.push(t)
  return [...grupos].filter(([, lista]) => lista.length > 0)
}
