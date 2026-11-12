// Las reglas de «Análisis»: de qué reel es cada video, los números de Instagram y si Higgsfield le atina.
// Sin base de datos ni red: todo con pruebas en calculos.test.ts.
import type { AnalisisFila, Real, TipoAnalisis } from './tipos.ts'

// Con menos vistas, el % que se lo salta cambia mucho por unas pocas personas
export const MIN_VISTAS = 80
// Con menos reels comparables no se puede decir si le atina
export const MIN_REELS = 6

// 2026-11-06-reel-lo-legal (y -v3 si es una versión de prueba), a partir de la dirección del video en Supabase:
// …/videos/redes/2026-11-06/reel-lo-legal/reel.mp4, …/redes/2026-11-10/reel-x/versiones/3/reel.mp4 o, en sus
// videos a cámara, …/redes/camara-2026-11-10/c001-x/versiones/2/reel.mp4
export function claveDe(videoUrl: string, version: number | null): string | null {
  const m = videoUrl.match(/\/redes\/((?:[a-z]+-)?\d{4}-\d{2}-\d{2})\/([^/]+)\//)
  if (!m) return null
  return `${m[1]}-${m[2]}${version ? `-v${version}` : ''}`
}

export function tipoDe(p: { prueba: boolean | null }, rehechoDe: string | null): TipoAnalisis {
  if (rehechoDe) return 'rehecho'
  return p.prueba ? 'prueba' : 'normal'
}

// Lo que devuelve la Graph API (nombre de la métrica → valor) pasado a lo que guarda la tabla
export function realDeInsights(v: Record<string, number | null | undefined>, leidoEn: string): Real | null {
  const vistas = v.views
  if (vistas === null || vistas === undefined) return null
  const n = (x: number | null | undefined) => (x === null || x === undefined ? null : x)
  return {
    vistas,
    alcance: n(v.reach),
    salto: n(v.reels_skip_rate),
    promedio_s: v.ig_reels_avg_watch_time === null || v.ig_reels_avg_watch_time === undefined ? null : Math.round(v.ig_reels_avg_watch_time / 100) / 10,
    guardados: n(v.saved),
    me_gusta: n(v.likes),
    compartidos: n(v.shares),
    comentarios: n(v.comments),
    leido_en: leidoEn,
    fuente: 'instagram',
  }
}

// Lo que guardó la decisión de las pruebas (redes_pruebas.resultado.metricas), para las versiones ya borradas
export function realDePrueba(m: { views: number; reach: number | null; skip: number | null; promedioMs: number | null; shares: number; saved: number; leidas_en: string }): Real {
  return {
    vistas: m.views,
    alcance: m.reach,
    salto: m.skip,
    promedio_s: m.promedioMs === null ? null : Math.round(m.promedioMs / 100) / 10,
    guardados: m.saved,
    me_gusta: null,
    compartidos: m.shares,
    comentarios: null,
    leido_en: m.leidas_en,
    fuente: 'prueba',
  }
}

// Qué parte del video vieron en promedio (0 a 100)
export function pctVisto(f: Pick<AnalisisFila, 'real' | 'duracion_s'>): number | null {
  if (!f.real?.promedio_s || !f.duracion_s) return null
  return Math.min(100, Math.round((100 * f.real.promedio_s) / f.duracion_s))
}

// Puestos de menor a mayor; los empates se reparten el puesto promedio
export function puestos(xs: number[]): number[] {
  const orden = xs.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0])
  const r = new Array<number>(xs.length)
  for (let i = 0; i < orden.length; ) {
    let j = i
    while (j + 1 < orden.length && orden[j + 1][0] === orden[i][0]) j++
    const promedio = (i + j) / 2 + 1
    for (let k = i; k <= j; k++) r[orden[k][1]] = promedio
    i = j + 1
  }
  return r
}

// Correlación de Spearman (-1 a 1): si los dos números suben y bajan juntos, sin importar cuánto
export function spearman(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 3) return null
  const a = puestos(xs)
  const b = puestos(ys)
  const ma = a.reduce((s, x) => s + x, 0) / a.length
  const mb = b.reduce((s, x) => s + x, 0) / b.length
  let num = 0
  let da = 0
  let db = 0
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb)
    da += (a[i] - ma) ** 2
    db += (b[i] - mb) ** 2
  }
  if (da === 0 || db === 0) return null
  return num / Math.sqrt(da * db)
}

export type NivelVeredicto = 'pocos' | 'atina' | 'no_se_nota' | 'no'
export type Veredicto = { n: number; rho: number | null; nivel: NivelVeredicto; titulo: string; texto: string }

// Desde cuánto una correlación de Spearman con n reels ya no parece casualidad (aprox. al 95%: 1.96 / √(n − 1)).
// Con 12 reels hace falta 0.59; con 50, 0.28
export const umbralCasualidad = (n: number) => 1.96 / Math.sqrt(n - 1)

// ¿Cuando Higgsfield le da más puntaje al gancho, la gente se lo salta menos? Solo cuenta reels con predicción,
// con el % de salto y con al menos MIN_VISTAS vistas. Las palabras siguen la regla 5/50: nada de cifras enredadas
export function veredicto(filas: Pick<AnalisisFila, 'prediccion' | 'real'>[]): Veredicto {
  const pares = filas.filter((f) => f.prediccion && f.real && f.real.salto !== null && f.real.vistas >= MIN_VISTAS)
  const n = pares.length
  if (n < MIN_REELS) {
    return {
      n,
      rho: null,
      nivel: 'pocos',
      titulo: 'Todavía no se sabe',
      texto: `Hay ${n} ${n === 1 ? 'reel' : 'reels'} con predicción y suficientes vistas. Hacen falta al menos ${MIN_REELS} para comparar.`,
    }
  }
  const rho = spearman(
    pares.map((f) => f.prediccion!.gancho),
    pares.map((f) => f.real!.salto!),
  )
  if (rho === null) return { n, rho, nivel: 'no', titulo: 'No se puede comparar', texto: 'Todos los reels tienen el mismo puntaje o el mismo salto.' }
  // El salto baja cuando el gancho sube: si le atina, la correlación es negativa y más fuerte que la casualidad
  const umbral = umbralCasualidad(n)
  if (rho <= -umbral) return { n, rho, nivel: 'atina', titulo: 'Sí le atina', texto: `En ${n} reels, cuando le da más puntaje al gancho, la gente se lo salta menos.` }
  if (rho >= umbral) return { n, rho, nivel: 'no', titulo: 'No le atina', texto: `En ${n} reels pasa al revés: a los que les da más puntaje son los que la gente más se salta.` }
  return {
    n,
    rho,
    nivel: 'no_se_nota',
    titulo: 'Todavía no se nota',
    texto: `En ${n} reels, su puntaje del gancho no dice con claridad quién se queda y quién se va: lo que se ve puede ser casualidad. Cada reel nuevo suma.`,
  }
}

export type Filtro = 'todos' | TipoAnalisis
export const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'normal', label: 'Publicados' },
  { id: 'prueba', label: 'De prueba' },
  { id: 'rehecho', label: 'Rehechos' },
]

export function leerFiltro(v: string | string[] | undefined): Filtro {
  const x = Array.isArray(v) ? v[0] : v
  return FILTROS.some((f) => f.id === x) ? (x as Filtro) : 'todos'
}

// Lo más nuevo primero; lo que no ha salido (rehechos en revisión) arriba de todo
export function ordenar<T extends Pick<AnalisisFila, 'publicado_en' | 'clave'>>(filas: T[]): T[] {
  return [...filas].sort((a, b) => {
    if (!a.publicado_en || !b.publicado_en) return a.publicado_en ? 1 : b.publicado_en ? -1 : a.clave.localeCompare(b.clave)
    return b.publicado_en.localeCompare(a.publicado_en) || a.clave.localeCompare(b.clave)
  })
}
