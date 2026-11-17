// Las reglas de «Guiones» sin base de datos: las pestañas del panel, lo que se puede hacer en cada estado, cómo entra
// un video y cómo se dice cada estado en simple.
import type { EstadoGuion, GuionFila, VideoGuion } from './tipos.ts'

export type Filtro = 'grabar' | 'editando' | 'listos' | 'todos'
export const FILTROS: Filtro[] = ['grabar', 'editando', 'listos', 'todos']
export const FILTRO_LABEL: Record<Filtro, string> = { grabar: 'Por grabar', editando: 'Editando', listos: 'Listos', todos: 'Todos' }

// Los que fallaron van con los que se editan: ahí se ve que algo pasó y se puede reintentar
const DE_ESTADO: Record<EstadoGuion, Filtro> = {
  listo: 'grabar',
  subido: 'editando',
  editando: 'editando',
  error: 'editando',
  programado: 'listos',
  descartado: 'todos',
}

export const filtroDe = (estado: EstadoGuion): Filtro => DE_ESTADO[estado]
export const enFiltro = (estado: EstadoGuion, filtro: Filtro) => filtro === 'todos' || DE_ESTADO[estado] === filtro

export function filtrarGuiones<T extends { estado: EstadoGuion }>(guiones: T[], filtro: Filtro): T[] {
  return guiones.filter((g) => enFiltro(g.estado, filtro))
}

export function contarFiltros(guiones: { estado: EstadoGuion }[]): Record<Filtro, number> {
  return Object.fromEntries(FILTROS.map((f) => [f, filtrarGuiones(guiones, f).length])) as Record<Filtro, number>
}

export function leerFiltro(v: unknown): Filtro {
  return typeof v === 'string' && (FILTROS as string[]).includes(v) ? (v as Filtro) : 'grabar'
}

export type AccionGuion = 'descartar' | 'reabrir'

export function leerAccion(body: unknown): { ok: true; accion: AccionGuion } | { ok: false; error: string } {
  const a = body && typeof body === 'object' ? (body as { accion?: unknown }).accion : undefined
  return a === 'descartar' || a === 'reabrir' ? { ok: true, accion: a } : { ok: false, error: 'Esa acción no existe' }
}

export const puedeSubir = (estado: EstadoGuion) => estado === 'listo' || estado === 'subido'
export const puedeDescartar = (estado: EstadoGuion) => estado === 'listo' || estado === 'subido' || estado === 'error'
export const puedeReabrir = (estado: EstadoGuion) => estado === 'descartado' || estado === 'error'

export const ESTADO_CORTO: Record<EstadoGuion, string> = {
  listo: 'Por grabar',
  subido: 'Subido',
  editando: 'Editando',
  programado: 'Listo',
  error: 'Algo falló',
  descartado: 'Descartado',
}

type Falla = { status: number; error: string }

// Cuando ya no está «Por grabar» ni «Subido» (al pedir la subida o al registrarla)
export const noRecibeVideos = (estado: EstadoGuion): Falla => ({ status: 409, error: `Este guion ya no recibe videos: ahora está «${ESTADO_CORTO[estado]}»` })

// «Descartar» y «Volver a abrir». Reabrir deja el guion donde iba: con videos, el servidor lo vuelve a editar
export function cambioPorAccion(
  f: Pick<GuionFila, 'estado' | 'videos'>,
  accion: AccionGuion,
): { cambios: { estado: 'descartado' } | { estado: 'listo' | 'subido'; detalle: null } } | Falla {
  if (accion === 'descartar') {
    if (puedeDescartar(f.estado)) return { cambios: { estado: 'descartado' } }
    if (f.estado === 'editando') return { status: 409, error: 'El servidor ya lo está editando: ya no se puede descartar' }
    if (f.estado === 'programado') return { status: 409, error: 'Sus versiones ya están programadas: ya no se puede descartar' }
    return { status: 409, error: 'Este guion ya estaba descartado' }
  }
  if (!puedeReabrir(f.estado)) return { status: 409, error: 'Este guion está abierto: no hay nada que volver a abrir' }
  return { cambios: { estado: f.videos.length ? 'subido' : 'listo', detalle: null } }
}

// Un video que terminó de subir: se suma (una sola vez) y el guion queda «Subido», con la hora del último que llegó
export function sumarVideo(
  f: Pick<GuionFila, 'estado' | 'videos'>,
  video: VideoGuion,
): { cambios: { videos: VideoGuion[]; estado: 'subido'; subido_en: string } } | { repetido: true } | Falla {
  if (f.videos.some((v) => v.ruta === video.ruta)) return { repetido: true }
  if (!puedeSubir(f.estado)) return noRecibeVideos(f.estado)
  return { cambios: { videos: [...f.videos, video], estado: 'subido', subido_en: video.subido_en } }
}

// El color del puntito de cada estado (las clases de .pn-pill > i en components/internal/panel.css)
export type Tono = 'ambar' | 'azul' | 'morado' | 'verde' | 'rojo' | 'gris'

const EN_SIMPLE: Record<EstadoGuion, { texto: string; tono: Tono }> = {
  listo: { texto: 'Por grabar', tono: 'ambar' },
  subido: { texto: 'Subido: el servidor lo edita en unos minutos', tono: 'azul' },
  editando: { texto: 'Editando', tono: 'morado' },
  programado: { texto: 'Listo: sus 5 versiones ya están programadas', tono: 'verde' },
  error: { texto: 'Algo falló', tono: 'rojo' },
  descartado: { texto: 'Descartado', tono: 'gris' },
}

export function estadoEnSimple(f: Pick<GuionFila, 'estado' | 'detalle'>): { texto: string; tono: Tono } {
  const e = EN_SIMPLE[f.estado]
  if (f.estado !== 'error') return e
  return { ...e, texto: `${e.texto}: ${f.detalle?.trim() || 'el servidor no dijo qué pasó'}` }
}

const cuenta = (n: number, uno: string, muchos: string) => `${n} ${n === 1 ? uno : muchos}`

// La línea de arriba: lo que hay, sin ceros
export function resumenGuiones(guiones: { estado: EstadoGuion }[]): string {
  if (!guiones.length) return 'Cada noche te llega un guion para grabar a cámara. Aquí lo lees y subes tu video.'
  const n = (...estados: EstadoGuion[]) => guiones.filter((g) => estados.includes(g.estado)).length
  const partes = [
    [n('listo'), 'por grabar', 'por grabar'],
    [n('subido', 'editando'), 'en edición', 'en edición'],
    [n('error'), 'falló', 'fallaron'],
    [n('programado'), 'listo', 'listos'],
  ] as const
  const texto = partes.flatMap(([c, uno, muchos]) => (c ? [cuenta(c, uno, muchos)] : [])).join(' · ')
  return texto || cuenta(n('descartado'), 'descartado', 'descartados')
}
