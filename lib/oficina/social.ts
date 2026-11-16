// El foro, las ideas, las fotos y la ronda que ve la página, y su firma. Puro: recibe lo leído de la base.
// El bloque social viaja solo cuando cambia su firma (o cuando la copia de la página tiene 30 min, por los enlaces
// firmados de las fotos, que vencen a la hora). Por eso la firma no lleva enlaces ni la hora.
import type { Comentario, EstadoIdea, EstadoOficina, Foto, Idea, Post, Ronda, Social } from './tipos.ts'
import { fechaCR } from './horario.ts'
import { corteDormida } from './estado.ts'

export type SocialCrudo = {
  posts: Omit<Post, 'comentarios'>[]
  comentarios: Comentario[]
  ideas: Idea[]
  // Solo las `lista`; en las de grupo, `pie` es el título de su escena
  fotos: { id: string, tipo: Foto['tipo'], agentes: string[], ruta: string, pie: string | null }[]
  ronda: Ronda | null
}

export type SocialArmado = Omit<Social, 'fotos'> & { fotos: SocialCrudo['fotos'] }

export const POSTS_MAX = 40
const MIN = 60_000
const VENCE_MS = 30 * MIN

const ms = (iso: string) => new Date(iso).getTime()
// Ya salió y, con la oficina dormida, es de antes de que se durmiera
const yaSale = (ahoraMs: number, corte: number) => (x: { mostrar_desde: string }) => {
  const t = ms(x.mostrar_desde)
  return t <= ahoraMs && t < corte
}
const porId = (x: { id: string }, y: { id: string }) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0)
const porHora = (x: { id: string, mostrar_desde: string }, y: { id: string, mostrar_desde: string }) =>
  ms(x.mostrar_desde) - ms(y.mostrar_desde) || porId(x, y)

// Los comentarios de un post en orden, y cada respuesta (un solo nivel) justo detrás de su comentario
function enHilo(comentarios: Comentario[]): Comentario[] {
  const orden = [...comentarios].sort(porHora)
  return orden
    .filter((c) => c.en_respuesta_a == null)
    .flatMap((c) => [c, ...orden.filter((r) => r.en_respuesta_a === c.id)])
}

// Lo que ya se ve. Mientras la oficina duerme, el mismo corte del chat: nada de lo programado desde que se durmió.
// Como la firma sale de lo que se ve, despertar la cambia (si destapa algo) y el bloque vuelve a viajar.
export function armarSocial(c: SocialCrudo, ahora: Date, oficina: EstadoOficina): SocialArmado {
  const visible = yaSale(ahora.getTime(), corteDormida(oficina))
  const comentarios = c.comentarios.filter(visible)
  const foro = c.posts
    .filter(visible)
    .sort((x, y) => porHora(y, x))
    .slice(0, POSTS_MAX)
    .map((p) => ({ ...p, comentarios: enHilo(comentarios.filter((k) => k.post_id === p.id)) }))
  // El primer post que aún no se ve, si sale hoy (hora de Costa Rica); dormida, nada
  const hoy = fechaCR(ahora)
  const futuros = oficina.dormida
    ? []
    : c.posts.filter((p) => ms(p.mostrar_desde) > ahora.getTime() && fechaCR(new Date(p.mostrar_desde)) === hoy)
  const proxima = futuros.length ? futuros.map((p) => p.mostrar_desde).reduce((a, b) => (ms(b) < ms(a) ? b : a)) : null
  return {
    foro,
    proxima,
    ideas: c.ideas.filter(visible).sort((x, y) => porHora(y, x)),
    // Por id: la firma no depende del orden en que vinieron de la base
    fotos: [...c.fotos].sort(porId),
    ronda: c.ronda && c.ronda.fecha === fechaCR(ahora) ? c.ronda : null,
  }
}

// FNV-1a de 32 bits sobre los bytes UTF-8, en 8 letras hexadecimales
export function fnv1a(s: string): string {
  let h = 0x811c9dc5
  for (const b of new TextEncoder().encode(s)) {
    h ^= b
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

// Cambia solo si cambia lo que se ve: posts (me gusta y cuántos comentarios), ideas (su estado), fotos y la ronda
export function firmaSocial(s: SocialArmado): string {
  return fnv1a([
    s.foro.map((p) => `${p.id}:${p.likes}:${p.te_gusta ? 1 : 0}:${p.comentarios.length}`).join(','),
    s.ideas.map((i) => `${i.id}:${i.estado}`).join(','),
    s.fotos.map((f) => `${f.id}:${f.ruta}`).join(','),
    s.ronda ? `${s.ronda.fecha}:${s.ronda.resultado}` : '',
  ].join('|'))
}

// La copia de la página se pide entera cuando no hay o ya tiene 30 min: un enlace firmado vive 1 h
export function socialVencido(recibidoMs: number | null, ahoraMs: number): boolean {
  return recibidoMs == null || ahoraMs - recibidoMs >= VENCE_MS
}

const ACCIONES_IDEA: Record<string, EstadoIdea> = { sirve: 'sirve', no_va: 'no_va', deshacer: 'nueva' }

// «Me sirve», «No va» o deshacer: lo que pide el cuerpo de POST /api/oficina/ideas/[id]
export function leerAccionIdea(body: unknown): { ok: true, estado: EstadoIdea } | { ok: false, error: string } {
  const accion = (body as { accion?: unknown } | null)?.accion
  if (typeof accion === 'string' && Object.hasOwn(ACCIONES_IDEA, accion)) return { ok: true, estado: ACCIONES_IDEA[accion] }
  return { ok: false, error: 'Esa acción no existe' }
}

// El me gusta: lo que pide el cuerpo de POST /api/oficina/foro/[id]/me-gusta
export function leerMeGusta(body: unknown): { ok: true, si: boolean } | { ok: false, error: string } {
  const si = (body as { si?: unknown } | null)?.si
  if (typeof si === 'boolean') return { ok: true, si }
  return { ok: false, error: 'Falta decir si te gusta' }
}
