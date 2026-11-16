// Dónde está la Oficina, escrito en el # de la dirección: la pestaña y, si hay, la sección que se ve al lado o en
// grande; en el foro y en las ideas, lo que hay que mostrar (foco). Así «atrás» cierra lo que se abrió y un enlace
// guardado lo abre directo. Puro: lo usa components/oficina y se prueba con node --test.

export type Pestana = 'oficina' | 'plano' | 'foro' | 'ideas'
export type Seccion = 'parati' | 'chat' | 'ahora' | 'dia' | 'maqueta' | 'plano'
export type Direccion = { pestana: Pestana; modo: 'grande' | 'lado' | null; seccion: Seccion | null; foco: string | null }

// Las que se pueden ver al lado (y las del selector de arriba del panel), en ese orden
export const DE_LADO: Seccion[] = ['parati', 'chat', 'ahora', 'dia']

const PESTANAS: Pestana[] = ['oficina', 'plano', 'foro', 'ideas']
// Las secciones de cada pestaña: la columna y el día, en las dos; cada dibujo, en la suya. El foro y las ideas no
// tienen secciones: llevan foco.
const SECCIONES: Record<Pestana, Seccion[]> = { oficina: [...DE_LADO, 'maqueta'], plano: [...DE_LADO, 'plano'], foro: [], ideas: [] }
const CON_FOCO: Pestana[] = ['foro', 'ideas']
// el foco es el id de un post o de una idea (uuid)
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const esPestana = (s: string): s is Pestana => (PESTANAS as string[]).includes(s)
const sola = (pestana: Pestana): Direccion => ({ pestana, modo: null, seccion: null, foco: null })
// la sección es de esa pestaña y, al lado, de las que se pueden ver al lado
const cabe = (p: Pestana, modo: 'grande' | 'lado', s: string): s is Seccion =>
  (SECCIONES[p] as string[]).includes(s) && (modo === 'grande' || (DE_LADO as string[]).includes(s))

// '#oficina/chat' es el chat en grande y '#oficina/lado/chat', al lado (igual con '#plano/…'); '#oficina/maqueta' y
// '#plano/plano' abren en grande; '#foro/<id>' e '#ideas/<id>' llevan foco. Lo que no cuadra se ignora (queda la
// pestaña) y lo que no se entiende es '#oficina'.
export function leerDireccion(hash: string): Direccion {
  const [p = '', ...resto] = hash.replace(/^#/, '').split('/').filter(Boolean)
  if (!esPestana(p)) return sola('oficina')
  const d = sola(p)
  if (CON_FOCO.includes(p)) return resto.length === 1 && ID.test(resto[0]) ? { ...d, foco: resto[0] } : d
  if (resto.length === 1 && cabe(p, 'grande', resto[0])) return { ...d, modo: 'grande', seccion: resto[0] }
  if (resto.length === 2 && resto[0] === 'lado' && cabe(p, 'lado', resto[1])) return { ...d, modo: 'lado', seccion: resto[1] }
  return d
}

// El history.state que se escribe con cada # nuevo: lo que la entrada ya tenía (las llaves de Next.js: sin __NA, Next
// recarga la página al volver a esa entrada) y la marca de la Oficina (llave = valor; null la quita)
export function estadoConMarca(actual: unknown, llave: string, valor: string | null): Record<string, unknown> {
  const base = actual && typeof actual === 'object' && !Array.isArray(actual) ? (actual as Record<string, unknown>) : {}
  return { ...base, [llave]: valor }
}

// Lo de leerDireccion al revés; lo que no cuadra no se escribe
export function escribirDireccion(d: Direccion): string {
  const p = esPestana(d.pestana) ? d.pestana : 'oficina'
  if (CON_FOCO.includes(p)) return d.foco && ID.test(d.foco) ? `#${p}/${d.foco}` : `#${p}`
  if (!d.modo || !d.seccion || !cabe(p, d.modo, d.seccion)) return `#${p}`
  return d.modo === 'lado' ? `#${p}/lado/${d.seccion}` : `#${p}/${d.seccion}`
}
