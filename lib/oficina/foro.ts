// El foro y las ideas del equipo, en palabras y en listas: la hora corta, los filtros, el debate abierto, lo nuevo del
// foro, las fotos del equipo, las cuentas de las ideas y el aviso de la ronda. Puro (sin DOM): lo usa
// components/oficina y se prueba con node --test.
import type { EstadoIdea, Foto, Idea, Post, Ronda } from './tipos.ts'
import { horaCR } from './horario.ts'
import { diaCR } from './pagina.ts'
import { masNuevasPrimero } from './ficha.ts'
import { TURNOS } from './turnos.ts'

const HORA = 3_600_000
const DIA = 24 * HORA
const CR = 6 * HORA // Costa Rica: UTC−6 todo el año
const ms = (iso: string) => Date.parse(iso)

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// «Hoy, 10:31 a. m.», «Ayer, 4:10 p. m.», «Jue, 9:15 a. m.» (hasta 6 días atrás) o «12/11, 9:15 a. m.»
export function cuandoCorto(fecha: Date, ahora: Date): string {
  const t = fecha.getTime()
  const d = diaCR(t) - diaCR(ahora.getTime())
  const h = horaCR(fecha)
  if (d === 0) return `Hoy, ${h}`
  if (d === -1) return `Ayer, ${h}`
  const cr = new Date(t - CR)
  if (d < -1 && d > -7) return `${DIAS[cr.getUTCDay()]}, ${h}`
  return `${cr.getUTCDate()}/${cr.getUTCMonth() + 1}, ${h}`
}

// ---------- El foro ----------
export type FiltroForo = 'todo' | 'debate' | 'foto' | 'idea'

// El post o alguno de sus comentarios trae una idea
const conIdea = (p: Post) => p.idea_id != null || p.comentarios.some((c) => c.idea_id != null)

export function filtrarForo(posts: Post[], f: FiltroForo): Post[] {
  if (f === 'todo') return posts
  if (f === 'idea') return posts.filter(conIdea)
  return posts.filter((p) => p.tipo === f)
}

const DIAS_DEBATE = 3

// El debate que sigue abierto: el más nuevo de los últimos 3 días que ya se ve
export function debateAbierto(posts: Post[], ahora: Date): Post | null {
  const fin = ahora.getTime(), inicio = fin - DIAS_DEBATE * DIA
  let mejor: Post | null = null
  for (const p of posts) {
    const t = ms(p.mostrar_desde)
    if (p.tipo !== 'debate' || !(t >= inicio && t <= fin)) continue
    if (!mejor || t > ms(mejor.mostrar_desde)) mejor = p
  }
  return mejor
}

// Quiénes respondieron un post (comentarios y respuestas), sin repetir y en el orden en que hablaron
export function quienesComentan(p: Post): string[] {
  return [...new Set(p.comentarios.map((c) => c.de))]
}

// «Alfa», «Alfa y Beta», «Alfa, Beta y Gama»; más de max: «A, B, C, D, E y 2 más»
export function listaDeNombres(nombres: string[], max = 5): string {
  if (nombres.length > max) return `${nombres.slice(0, max).join(', ')} y ${nombres.length - max} más`
  if (nombres.length < 2) return nombres.join('')
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

// Lo nuevo del foro: los posts que salieron después de la última vez que abriste el Foro. Sin esa marca (o si no se
// entiende), los de las últimas 24 h.
export function nuevosDelForo(posts: Post[], vistoHasta: string | null, ahora: Date): number {
  const fin = ahora.getTime()
  const visto = vistoHasta == null ? NaN : ms(vistoHasta)
  const desde = Number.isFinite(visto) ? visto : fin - DIA
  return posts.filter((p) => {
    const t = ms(p.mostrar_desde)
    return t > desde && t <= fin
  }).length
}

// Hasta dónde viste el foro al tenerlo abierto: ahora o, si el reloj de la compu va atrasado, el post más nuevo
export function marcaVisto(posts: Post[], ahora: Date): string {
  let t = ahora.getTime()
  for (const p of posts) {
    const x = ms(p.mostrar_desde)
    if (x > t) t = x
  }
  return new Date(t).toISOString()
}

// Las fotos del equipo, al lado del foro: las de grupo de la más nueva a la más vieja y después los retratos, en el
// orden del catálogo (orden: los ids de los Knox), hasta max
export function fotosDelEquipo(fotos: Foto[], foro: Post[], orden: string[], max: number): Foto[] {
  const puesto = (f: Foto) => {
    const i = orden.indexOf(f.agentes[0] ?? '')
    return i < 0 ? orden.length : i
  }
  const grupo = masNuevasPrimero(fotos.filter((f) => f.tipo === 'grupo'), foro)
  const retratos = fotos.filter((f) => f.tipo === 'retrato').sort((x, y) => puesto(x) - puesto(y))
  return [...grupo, ...retratos].slice(0, max)
}

// ---------- Las ideas ----------
export type FiltroIdeas = 'todas' | EstadoIdea

export function filtrarIdeas(ideas: Idea[], f: FiltroIdeas): Idea[] {
  return f === 'todas' ? ideas : ideas.filter((i) => i.estado === f)
}

export function contarIdeas(ideas: Idea[]): Record<FiltroIdeas, number> {
  const c: Record<FiltroIdeas, number> = { todas: ideas.length, nueva: 0, sirve: 0, no_va: 0 }
  for (const i of ideas) if (i.estado in c) c[i.estado]++
  return c
}

// «Ver ideas» abre en Nuevas si hay alguna; si no, en Todas (nunca en una lista vacía)
export function filtroDeVerIdeas(ideas: Idea[]): FiltroIdeas {
  return ideas.some((i) => i.estado === 'nueva') ? 'nueva' : 'todas'
}

// «Me sirve» y «No va»: tocar el que ya está puesto lo deshace
export function accionIdea(i: Idea, boton: 'sirve' | 'no_va'): 'sirve' | 'no_va' | 'deshacer' {
  return i.estado === boton ? 'deshacer' : boton
}

// Si al decidirla la idea sale del filtro que se ve (lista), el foco no puede quedarse en su botón: va al mismo botón
// de la fila siguiente o, si no hay, al título. null: la fila se queda, y el foco también.
export function focoAlDecidir(
  lista: Idea[],
  i: Idea,
  boton: 'sirve' | 'no_va',
  filtro: FiltroIdeas,
): { id: string; boton: 'sirve' | 'no_va' } | 'titulo' | null {
  const accion = accionIdea(i, boton)
  const queda: EstadoIdea = accion === 'deshacer' ? 'nueva' : accion
  if (filtro === 'todas' || queda === filtro) return null
  const donde = lista.findIndex((x) => x.id === i.id)
  const sig = donde < 0 ? undefined : lista[donde + 1]
  return sig ? { id: sig.id, boton } : 'titulo'
}

// ---------- La ronda ----------
// El aviso al lado del foro cuando la última tertulia de hoy (hay tres) no salió o se la saltó (hoy: AAAA-MM-DD de
// Costa Rica)
export function avisoRonda(r: Ronda | null, hoy: string): string | null {
  if (!r || r.fecha !== hoy) return null
  const de = TURNOS[r.turno]?.de ?? 'de hoy'
  if (r.resultado === 'falla') return `La tertulia ${de} no salió`
  if (r.resultado === 'saltada') return `No hubo tertulia ${de}: la oficina dormía`
  return null
}
