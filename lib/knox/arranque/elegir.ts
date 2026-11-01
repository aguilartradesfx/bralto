// Qué arranque toca al abrir Knox: el primero sin usar de hoy. Si ya se usaron todos, uno sin usar del día más
// reciente de antes (no dicen la hora ni la fecha, así que sirven igual). Los que se prepararon para mañana esperan.
export type FilaArranque = {
  id: string
  fecha: string // día de Costa Rica en que se usa (AAAA-MM-DD)
  orden: number
  secciones: string[]
  inicios: number[]
  usado_en: string | null
}

export function elegirArranque(filas: FilaArranque[], hoy: string): FilaArranque | null {
  const libres = filas.filter((f) => !f.usado_en && f.fecha <= hoy)
  const deHoy = libres.filter((f) => f.fecha === hoy)
  const candidatos = deHoy.length ? deHoy : libres
  return [...candidatos].sort((a, b) => (a.fecha === b.fecha ? a.orden - b.orden : a.fecha < b.fecha ? 1 : -1))[0] ?? null
}
