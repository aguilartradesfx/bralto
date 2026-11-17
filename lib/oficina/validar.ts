// El validador de la tertulia: limpia lo que escribe Claude antes de guardar nada y le pone a cada cosa su hora.
// Lo que no pasa se bota con su motivo; solo un `crudo` que no es un objeto da error.

import type { Turno } from './tipos.ts'
import { finDeTurno } from './turnos.ts'

export type IdeaCruda = { texto: string, por_que: string, basada_en: string[] }

export type DondeCharla = 'cafe' | 'platica' | 'visita'

export type RondaCruda = {
  chat: { de: string, para: string | null, texto: string, rincon: string | null, idea: string | null }[]
  // Una plática de ida y vuelta entre 2 Knox; en una visita, visita_a es a quien visitan (y el que llega habla primero)
  charlas: { donde: DondeCharla, visita_a?: string | null, lineas: { de: string, texto: string }[] }[]
  posts: { clave: string, de: string, tipo: 'nota' | 'debate' | 'idea', titulo: string, texto: string, likes: number, basada_en: string[], idea: IdeaCruda | null }[]
  comentarios: { clave: string, post: string, de: string, texto: string, responde_a: string | null, idea: IdeaCruda | null }[]
  escena: { de: string, agentes: string[], titulo: string, donde: string, que: string, texto: string, likes: number } | null
}

export type CtxValidar = {
  hablan: Set<string>
  conFoto: Set<string>
  hechos: Set<string>
  postsViejos: Set<string>
  prohibidos: string[]
  // Ya hay una escena esperando su foto: cualquier escena nueva se bota
  escenaEsperando: boolean
  // El turno de la ronda: dice hasta cuándo salen sus cosas y si puede llevar escena (solo el mediodía)
  turno: Turno
  ahora: Date
}

// Cada línea de una charla le habla al otro (para); anfitrion: en una visita, a quien visitan
export type CharlaLimpia = {
  donde: DondeCharla
  anfitrion: string | null
  lineas: { de: string, para: string, texto: string, mostrar_desde: string }[]
}

export type RondaLimpia = {
  chat: { de: string, para: string | null, texto: string, rincon: 'cafe' | 'platica' | null, idea: string | null, mostrar_desde: string }[]
  charlas: CharlaLimpia[]
  posts: { clave: string, de: string, tipo: 'nota' | 'debate' | 'idea', titulo: string, texto: string, likes: number, mostrar_desde: string }[]
  comentarios: { clave: string, post: string, de: string, texto: string, responde_a: string | null, mostrar_desde: string }[]
  ideas: { origen: string, de: string, texto: string, por_que: string, mostrar_desde: string }[]
  escena: RondaCruda['escena']
  botadas: string[]
}

// Por ronda (hay tres al día). chat: las líneas sueltas más las de las charlas
export const TOPES = { chat: 30, charlas: 6, publicaciones: 1, comentarios: 4, ideas: 1 }
export const LARGOS = { chat: 120, titulo: 80, post: 600, comentario: 240, idea: 120, por_que: 200, escena: 140 }
export const LINEAS_CHARLA = { min: 2, max: 5 }

const TIPOS_POST = ['nota', 'debate', 'idea']
const DONDES: DondeCharla[] = ['cafe', 'platica', 'visita']
const MINUTO = 60_000

// ---------- textos ----------

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const letrasONumeros = '[\\p{L}\\p{N}]'
const palabra = (p: string) => new RegExp(`(?<!${letrasONumeros})${p}(?!${letrasONumeros})`, 'u')
const escapar = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const MODISMOS = ['pana', 'tantito', 'chevere']
// El voseo se compara con su tilde (sin ella, «mira» o «hace» son del tuteo); los que no llevan tilde, tal cual.
// «salí» no va: también es el pasado de «yo» («Hoy salí temprano»).
const VOSEO_CON_TILDE = [
  'tenés', 'podés', 'querés', 'sabés', 'hacés', 'decís', 'venís', 'pensás', 'sentís',
  'mirá', 'andá', 'vení', 'poné', 'hacé', 'esperá', 'tomá', 'decí', 'escuchá', 'contá', 'pasá', 'dejá',
]
const VOSEO_SIN_TILDE = ['vos', 'sos', 'decime', 'contame', 'fijate', 'avisame']
const RE_MODISMOS = MODISMOS.map(m => [m, palabra(`${m}s?`)] as const)
const RE_VOSEO = [...VOSEO_CON_TILDE, ...VOSEO_SIN_TILDE].map(v => [v, palabra(v)] as const)
const RE_USTED = palabra('usted')
const RE_ENLACE = new RegExp(`http|www\\.|${letrasONumeros}\\.(com|net|org|io|co|cr|app|ai)(?!${letrasONumeros})`, 'u')

// Regex (sobre texto sin tildes y en minúsculas) de un nombre prohibido; null si es vacío o de menos de 4 letras.
function reNombre(nombre: unknown): RegExp | null {
  if (typeof nombre !== 'string') return null
  const frase = sinTildes(nombre).trim().replace(/\s+/g, ' ')
  if (frase.replace(/[^\p{L}]/gu, '').length < 4) return null
  return new RegExp(`(?<!${letrasONumeros})${frase.split(' ').map(escapar).join('\\s+')}(?!${letrasONumeros})`, 'gu')
}

// Cambia cada nombre prohibido por «un cliente», con el mismo criterio que el validador.
export function taparClientes(t: string, prohibidos: string[]): string {
  const res = prohibidos.map(reNombre).filter((r): r is RegExp => r !== null)
  if (res.length === 0) return t
  const chars = [...t]
  let plano = ''
  const origen: number[] = [] // índice del plano -> índice del carácter original
  chars.forEach((c, i) => { const p = sinTildes(c); for (let k = 0; k < p.length; k++) origen.push(i); plano += p })
  const rangos: [number, number][] = []
  for (const re of res) for (const m of plano.matchAll(re)) {
    if (m[0].length) rangos.push([origen[m.index!], origen[m.index! + m[0].length - 1]])
  }
  if (rangos.length === 0) return t
  rangos.sort((a, b) => a[0] - b[0])
  let salida = ''
  let pos = 0
  for (const [a, b] of rangos) {
    if (a < pos) { pos = Math.max(pos, b + 1); continue }
    salida += chars.slice(pos, a).join('') + 'un cliente'
    pos = b + 1
  }
  return salida + chars.slice(pos).join('')
}

// «diay» se escribe «deay»: se cambia la palabra entera, sin importar mayúsculas ni tildes (DIAY, Díay, diáy…), con el
// mismo estilo de mayúsculas que traía (DEAY, Deay o deay). Nunca toca otras palabras («mediaya», «prediay»).
const RE_PALABRA = /(?<![\p{L}\p{M}\p{N}])[\p{L}\p{M}]+(?![\p{L}\p{M}\p{N}])/gu
export const aDeay = (t: string): string => t.replace(RE_PALABRA, (p) => {
  if (sinTildes(p) !== 'diay') return p
  if (p === p.toUpperCase()) return 'DEAY'
  return p[0] === p[0].toLowerCase() ? 'deay' : 'Deay'
})

// El rincón como lo guarda la base, sin importar mayúsculas ni tildes: «Café» → cafe, «plática» → platica, y «sala»
// (la plática es la de la sala) → platica. null si no es ninguno.
export function normalizarDonde(x: unknown): DondeCharla | null {
  if (typeof x !== 'string') return null
  const t = sinTildes(x).trim()
  const d = t === 'sala' ? 'platica' : t
  return DONDES.find(o => o === d) ?? null
}

// Devuelve el motivo si el texto no puede salir, o null si está bien.
export function problemaDeTexto(t: string, prohibidos: string[]): string | null {
  const plano = sinTildes(t)
  for (const [m, re] of RE_MODISMOS) if (re.test(plano)) return `dice «${m === 'chevere' ? 'chévere' : m}»`
  if (RE_ENLACE.test(plano)) return 'trae un enlace'
  for (const nombre of prohibidos) {
    const re = reNombre(nombre)
    if (re && re.test(plano)) return 'nombra a un cliente'
  }
  const bajo = t.normalize('NFC').toLowerCase()
  for (const [v, re] of RE_VOSEO) if (re.test(bajo)) return `dice «${v}» (voseo)`
  if (RE_USTED.test(plano)) return 'dice «usted»'
  return null
}

// Corta en el último espacio y agrega «…», sin pasar de `max`.
export function cortar(t: string, max: number): string {
  if (t.length <= max) return t
  const base = t.slice(0, max - 1)
  const i = base.lastIndexOf(' ')
  return (i > 0 ? base.slice(0, i) : base).trimEnd() + '…'
}

const unaLinea = (t: string) => t.replace(/\s+/g, ' ').trim()
const variasLineas = (t: string) =>
  t.replace(/[ \t]+/g, ' ').split('\n').map(l => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim()

// ---------- horas ----------

// Hasta cuándo salen las cosas de la ronda: las 12:30 (mañana), las 4:00 p. m. (mediodía) o las 6:30 p. m. (tarde)
export function finDeRonda(ahora: Date, turno: Turno): Date {
  return finDeTurno(ahora, turno)
}

// La i-ésima va en desde + (i + 0.5) × (hasta − desde) / n; si no hay tramo, todo en `desde`.
// Con `alInicio`, la i-ésima va en desde + i × (hasta − desde) / n: la primera sale justo en `desde`.
export function repartir(n: number, desde: Date, hasta: Date, alInicio = false): Date[] {
  const tramo = Math.max(0, hasta.getTime() - desde.getTime())
  return Array.from({ length: n }, (_, i) => new Date(desde.getTime() + ((i + (alInicio ? 0 : 0.5)) * tramo) / n))
}

// Entre una línea de una charla y la siguiente, de 1 a 2 minutos: más tarda la respuesta más larga
export function pausaAntes(texto: string): number {
  return MINUTO + Math.round(MINUTO * Math.min(1, texto.length / LARGOS.chat))
}

// Las charlas y las líneas sueltas, intercaladas parejo en el orden en que vienen (a igual lugar, la charla primero)
export function intercalar(charlas: number, sueltas: number): { tipo: 'charla' | 'suelta', i: number }[] {
  const todas = [
    ...Array.from({ length: charlas }, (_, i) => ({ tipo: 'charla' as const, i, lugar: (i + 0.5) / charlas })),
    ...Array.from({ length: sueltas }, (_, i) => ({ tipo: 'suelta' as const, i, lugar: (i + 0.5) / sueltas })),
  ]
  return todas
    .sort((a, b) => a.lugar - b.lugar || (a.tipo === b.tipo ? a.i - b.i : a.tipo === 'charla' ? -1 : 1))
    .map(({ tipo, i }) => ({ tipo, i }))
}

// Cuándo empieza cada unidad del chat (una charla dura de su primera a su última línea; una línea suelta, nada): en
// orden, sin encimarse y con el mismo aire entre una y otra (medio aire al principio y al final del tramo). Si no
// caben en el tramo, van seguidas desde `inicio`, a un minuto una de otra.
// `desde`: lo más temprano que puede salir (la línea que cita una idea no sale antes que su idea). Si le tocaba antes,
// va al primer hueco desde esa hora, sin pegarse a las demás.
export function horasDelChat(unidades: { dura: number, desde?: number }[], inicio: number, fin: number): number[] {
  const n = unidades.length
  if (!n) return []
  const libre = fin - inicio - unidades.reduce((s, u) => s + u.dura, 0)
  const aire = libre > 0 ? libre / n : MINUTO
  const horas: number[] = []
  let t = inicio + (libre > 0 ? aire / 2 : 0)
  for (const u of unidades) {
    horas.push(t)
    t += u.dura + aire
  }
  const sep = Math.min(MINUTO, aire / 2)
  const tarde = (i: number) => (unidades[i].desde ?? -Infinity) > horas[i]
  const puestas: [number, number][] = horas.flatMap((h, i) => (tarde(i) ? [] : [[h, h + unidades[i].dura] as [number, number]]))
  const mover = unidades.map((_, i) => i).filter(tarde).sort((a, b) => unidades[a].desde! - unidades[b].desde!)
  for (const i of mover) {
    const { dura, desde } = unidades[i] as { dura: number, desde: number }
    const cabe = (h: number) => puestas.every(([a, b]) => h + dura <= a - sep || h >= b + sep)
    // siempre hay uno: después de la última
    const h = [desde, ...puestas.map(([, b]) => b + sep)].filter((x) => x >= desde).sort((x, y) => x - y).find(cabe)!
    horas[i] = h
    puestas.push([h, h + dura])
  }
  return horas
}

// ---------- ayudas ----------

type Obj = Record<string, unknown>
const esObjeto = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x)
const lista = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])
// Todo texto que se queda pasa por aquí: «diay» sale siempre como «deay».
const texto = (x: unknown): string | null => (typeof x === 'string' && x.trim() ? aDeay(x) : null)
const textos = (x: unknown): string[] => lista(x).filter((s): s is string => typeof s === 'string')

type IdeaLimpia = { texto: string, por_que: string }
type PostV = { clave: string, de: string, tipo: 'nota' | 'debate' | 'idea', titulo: string, texto: string, likes: number, idea: IdeaLimpia | null }
type ComV = { clave: string, post: string, de: string, texto: string, responde_a: string | null, idea: IdeaLimpia | null }

export function validarRonda(crudo: unknown, ctx: CtxValidar): RondaLimpia | { error: string } {
  if (!esObjeto(crudo)) return { error: 'La respuesta no tiene la forma esperada' }
  const botadas: string[] = []
  const botar = (que: string, motivo: string) => botadas.push(`${que}: ${motivo}`)
  const problema = (t: string) => problemaDeTexto(t, ctx.prohibidos)
  const maxLikes = Math.max(0, ctx.hablan.size - 1)
  const likes = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(maxLikes, Math.max(0, Math.floor(x))) : 0)
  const hayHecho = (x: unknown) => textos(x).some(h => ctx.hechos.has(h))

  // Idea de un post o comentario: devuelve la idea limpia, o null si no hay o se bota (con su motivo).
  const limpiarIdea = (que: string, x: unknown): IdeaLimpia | null => {
    if (x === null || x === undefined) return null
    if (!esObjeto(x)) { botar(que, 'la idea no tiene la forma esperada'); return null }
    const t = texto(x.texto)
    const porQue = texto(x.por_que)
    if (!t || !porQue) { botar(que, 'la idea no trae texto o por qué'); return null }
    if (!hayHecho(x.basada_en)) { botar(que, 'la idea no se basa en un hecho'); return null }
    const mal = problema(t) ?? problema(porQue)
    if (mal) { botar(que, `la idea ${mal}`); return null }
    return { texto: cortar(unaLinea(t), LARGOS.idea), por_que: cortar(unaLinea(porQue), LARGOS.por_que) }
  }

  // --- posts ---
  let posts: PostV[] = []
  const clavesUsadas = new Set<string>()
  lista(crudo.posts).forEach((x, i) => {
    const que = `post ${i + 1}`
    if (!esObjeto(x)) return botar(que, 'no tiene la forma esperada')
    const clave = texto(x.clave)
    if (!clave || clavesUsadas.has(clave)) return botar(que, 'clave vacía o repetida')
    if (typeof x.de !== 'string' || !ctx.hablan.has(x.de)) return botar(que, 'habla alguien que no está en la oficina')
    if (typeof x.tipo !== 'string' || !TIPOS_POST.includes(x.tipo)) return botar(que, 'tipo raro')
    const titulo = texto(x.titulo)
    const cuerpo = texto(x.texto)
    if (!titulo || !cuerpo) return botar(que, 'sin título o sin texto')
    const mal = problema(titulo) ?? problema(cuerpo)
    if (mal) return botar(que, mal)
    if (!hayHecho(x.basada_en)) return botar(que, 'no se basa en un hecho')
    clavesUsadas.add(clave)
    posts.push({
      clave, de: x.de, tipo: x.tipo as PostV['tipo'],
      titulo: cortar(unaLinea(titulo), LARGOS.titulo), texto: cortar(variasLineas(cuerpo), LARGOS.post),
      likes: likes(x.likes), idea: limpiarIdea(que, x.idea),
    })
  })

  // --- comentarios ---
  let comentarios: ComV[] = []
  const vistos = new Map<string, ComV>()
  lista(crudo.comentarios).forEach((x, i) => {
    const que = `comentario ${i + 1}`
    if (!esObjeto(x)) return botar(que, 'no tiene la forma esperada')
    const clave = texto(x.clave)
    if (!clave || clavesUsadas.has(clave)) return botar(que, 'clave vacía o repetida')
    if (typeof x.de !== 'string' || !ctx.hablan.has(x.de)) return botar(que, 'habla alguien que no está en la oficina')
    const cuerpo = texto(x.texto)
    if (!cuerpo) return botar(que, 'sin texto')
    const mal = problema(cuerpo)
    if (mal) return botar(que, mal)
    const post = typeof x.post === 'string' ? x.post : ''
    if (!posts.some(p => p.clave === post) && !ctx.postsViejos.has(post)) return botar(que, 'es de un post que no existe')
    let responde: string | null = null
    if (x.responde_a !== null && x.responde_a !== undefined) {
      const madre = typeof x.responde_a === 'string' ? vistos.get(x.responde_a) : undefined
      if (!madre || madre.post !== post) return botar(que, 'responde a un comentario que no existe')
      responde = madre.responde_a ?? madre.clave // un solo nivel
    }
    clavesUsadas.add(clave)
    const c: ComV = { clave, post, de: x.de, texto: cortar(unaLinea(cuerpo), LARGOS.comentario), responde_a: responde, idea: limpiarIdea(que, x.idea) }
    vistos.set(clave, c)
    comentarios.push(c)
  })

  // --- escena ---
  let escena: RondaCruda['escena'] = null
  if (crudo.escena !== null && crudo.escena !== undefined) {
    const e = crudo.escena
    const que = 'escena'
    do {
      if (ctx.turno !== 'mediodia') { botar(que, 'solo va en la ronda del mediodía'); break }
      if (ctx.escenaEsperando) { botar(que, 'ya hay una esperando su foto'); break }
      if (!esObjeto(e)) { botar(que, 'no tiene la forma esperada'); break }
      if (typeof e.de !== 'string' || !ctx.hablan.has(e.de)) { botar(que, 'habla alguien que no está en la oficina'); break }
      const agentes = textos(e.agentes)
      if (agentes.length < 1 || agentes.length > 4 || new Set(agentes).size !== agentes.length || !agentes.every(a => ctx.conFoto.has(a))) {
        botar(que, 'los Knox de la foto no sirven'); break
      }
      const campos = [texto(e.titulo), texto(e.donde), texto(e.que), texto(e.texto)]
      if (campos.some(c => c === null)) { botar(que, 'le falta texto'); break }
      const mal = campos.map(c => problema(c as string)).find(Boolean)
      if (mal) { botar(que, mal); break }
      const [titulo, donde, queHacen, cuerpo] = campos as string[]
      escena = {
        de: e.de, agentes,
        titulo: cortar(unaLinea(titulo), LARGOS.titulo), donde: cortar(unaLinea(donde), LARGOS.escena),
        que: cortar(unaLinea(queHacen), LARGOS.escena), texto: cortar(unaLinea(cuerpo), LARGOS.escena), likes: likes(e.likes),
      }
    } while (false)
  }

  // --- chat (las líneas sueltas) ---
  type Suelta = { que: string, de: string, para: string | null, texto: string, rincon: 'cafe' | 'platica' | null, idea: string | null }
  let chat: Suelta[] = []
  lista(crudo.chat).forEach((x, i) => {
    const que = `chat ${i + 1}`
    if (!esObjeto(x)) return botar(que, 'no tiene la forma esperada')
    if (typeof x.de !== 'string' || !ctx.hablan.has(x.de)) return botar(que, 'habla alguien que no está en la oficina')
    let para: string | null = null
    if (x.para !== null && x.para !== undefined) {
      if (typeof x.para !== 'string' || x.para === x.de || (x.para !== 'ale' && !ctx.hablan.has(x.para))) return botar(que, 'le habla a quien no está')
      para = x.para
    }
    const cuerpo = texto(x.texto)
    if (!cuerpo) return botar(que, 'sin texto')
    const mal = problema(cuerpo)
    if (mal) return botar(que, mal)
    const rincon = normalizarDonde(x.rincon) // una suelta no es de visita: solo el café o la plática
    chat.push({
      que, de: x.de, para, texto: cortar(unaLinea(cuerpo), LARGOS.chat),
      rincon: rincon === 'cafe' || rincon === 'platica' ? rincon : null,
      idea: typeof x.idea === 'string' ? x.idea : null,
    })
  })

  // --- charlas: 2 Knox que se turnan, de 2 a 5 líneas; la que tiene algo mal se bota entera ---
  type Charla = { que: string, donde: DondeCharla, anfitrion: string | null, lineas: { de: string, para: string, texto: string }[] }
  let charlas: Charla[] = []
  lista(crudo.charlas).forEach((x, i) => {
    const que = `charla ${i + 1}`
    if (!esObjeto(x)) return botar(que, 'no tiene la forma esperada')
    const donde = normalizarDonde(x.donde)
    if (!donde) return botar(que, 'no dice si es en el café, en la sala o de visita')
    const crudas = lista(x.lineas)
    if (crudas.length < LINEAS_CHARLA.min || crudas.length > LINEAS_CHARLA.max) {
      return botar(que, `tiene ${crudas.length} ${crudas.length === 1 ? 'línea' : 'líneas'} (van de ${LINEAS_CHARLA.min} a ${LINEAS_CHARLA.max})`)
    }
    if (!crudas.every(esObjeto)) return botar(que, 'una línea no tiene la forma esperada')
    const lineas = crudas as Obj[]
    if (!lineas.every(l => typeof l.de === 'string' && ctx.hablan.has(l.de))) return botar(que, 'habla alguien que no está en la oficina')
    const quienes = [...new Set(lineas.map(l => l.de as string))]
    if (quienes.length !== 2) return botar(que, 'no es entre 2 Knox')
    if (lineas.some((l, j) => j > 0 && l.de === lineas[j - 1].de)) return botar(que, 'no se turnan')
    let anfitrion: string | null = null
    if (donde === 'visita') {
      if (typeof x.visita_a !== 'string' || !quienes.includes(x.visita_a)) return botar(que, 'visita a alguien que no está en la charla')
      if (lineas[0].de === x.visita_a) return botar(que, 'el que llega no habla primero')
      anfitrion = x.visita_a
    }
    const limpias: Charla['lineas'] = []
    for (const l of lineas) {
      const cuerpo = texto(l.texto)
      if (!cuerpo) return botar(que, 'una línea no trae texto')
      const t = unaLinea(cuerpo)
      if (t.length > LARGOS.chat) return botar(que, `una línea pasa de ${LARGOS.chat} letras`)
      const mal = problema(t)
      if (mal) return botar(que, `una línea ${mal}`)
      const de = l.de as string
      limpias.push({ de, para: quienes.find(q => q !== de)!, texto: t })
    }
    charlas.push({ que, donde, anfitrion, lineas: limpias })
  })

  // --- topes, en el orden en que vienen ---
  // El chat: primero las charlas (hasta 6, enteras) y con lo que quede de las 30 líneas, las sueltas
  let enCharlas = 0
  charlas = charlas.filter((c, i) => {
    if (i >= TOPES.charlas || enCharlas + c.lineas.length > TOPES.chat) { botar(c.que, 'pasa del tope'); return false }
    enCharlas += c.lineas.length
    return true
  })
  const sueltas = TOPES.chat - enCharlas
  chat.slice(sueltas).forEach(l => botar(l.que, 'pasa del tope'))
  chat = chat.slice(0, sueltas)

  // Las publicaciones, los comentarios de las que quedan y después las ideas de lo que quedó. La escena (solo en la
  // ronda del mediodía) va aparte: no ocupa el lugar de la publicación; su tope es el de las fotos por semana.
  posts.slice(TOPES.publicaciones).forEach(p => botar(`post ${p.clave}`, 'pasa del tope'))
  posts = posts.slice(0, TOPES.publicaciones)
  comentarios = comentarios.filter(c => ctx.postsViejos.has(c.post) || posts.some(p => p.clave === c.post))
  comentarios.slice(TOPES.comentarios).forEach(c => botar(`comentario ${c.clave}`, 'pasa del tope'))
  comentarios = comentarios.slice(0, TOPES.comentarios)

  let ideasVistas = 0
  const dentroDelTope = (dueno: { idea: IdeaLimpia | null }, que: string, alQuitar?: () => void) => {
    if (!dueno.idea) return
    if (++ideasVistas <= TOPES.ideas) return
    dueno.idea = null
    alQuitar?.()
    botar(que, 'la idea pasa del tope')
  }
  for (const p of posts) dentroDelTope(p, `post ${p.clave}`, () => { if (p.tipo === 'idea') p.tipo = 'nota' })
  for (const c of comentarios) dentroDelTope(c, `comentario ${c.clave}`)

  // Un post idea sin idea queda como nota.
  for (const p of posts) if (p.tipo === 'idea' && !p.idea) p.tipo = 'nota'

  // --- horas: todo sale entre ahora y el fin de su turno ---
  const inicio = ctx.ahora
  let fin = finDeRonda(ctx.ahora, ctx.turno)
  if (fin.getTime() <= inicio.getTime()) fin = inicio
  const iso = (d: Date) => d.toISOString()

  // Los posts: el primero sale apenas se guarda la ronda y los demás se reparten en el tramo
  const horasPost = repartir(posts.length, inicio, fin, true)
  const horaPost = new Map(posts.map((p, i) => [p.clave, horasPost[i]]))
  const horaOrigen = new Map<string, Date>()
  const limpiaPosts = posts.map(p => {
    const h = horaPost.get(p.clave)!
    if (p.idea) horaOrigen.set(p.clave, h)
    return { clave: p.clave, de: p.de, tipo: p.tipo, titulo: p.titulo, texto: p.texto, likes: p.likes, mostrar_desde: iso(h) }
  })

  const porPost = new Map<string, ComV[]>()
  for (const c of comentarios) porPost.set(c.post, [...(porPost.get(c.post) ?? []), c])
  const horaCom = new Map<string, Date>()
  for (const [post, grupo] of porPost) {
    const horas = repartir(grupo.length, horaPost.get(post) ?? inicio, fin)
    grupo.forEach((c, i) => horaCom.set(c.clave, horas[i]))
  }
  const limpiaComentarios = comentarios.map(c => {
    const h = horaCom.get(c.clave)!
    if (c.idea) horaOrigen.set(c.clave, h)
    return { clave: c.clave, post: c.post, de: c.de, texto: c.texto, responde_a: c.responde_a, mostrar_desde: iso(h) }
  })

  const ideas = [
    ...posts.filter(p => p.idea).map(p => ({ origen: p.clave, de: p.de, ...p.idea! })),
    ...comentarios.filter(c => c.idea).map(c => ({ origen: c.clave, de: c.de, ...c.idea! })),
  ].map(i => ({ ...i, mostrar_desde: iso(horaOrigen.get(i.origen)!) }))

  // El chat: las charlas y las sueltas, intercaladas en el tramo y sin encimarse. Las líneas de una charla van seguidas,
  // de 1 a 2 minutos una de otra; una suelta que cita una idea no sale antes que su idea.
  const pausas = charlas.map(c => c.lineas.map((l, j) => (j === 0 ? 0 : pausaAntes(l.texto))))
  const desdeIdea = chat.map(l => (l.idea && horaOrigen.has(l.idea) ? horaOrigen.get(l.idea)!.getTime() : undefined))
  const orden = intercalar(charlas.length, chat.length)
  const horas = horasDelChat(orden.map(u => (u.tipo === 'charla'
    ? { dura: pausas[u.i].reduce((s, p) => s + p, 0) }
    : { dura: 0, desde: desdeIdea[u.i] })), inicio.getTime(), fin.getTime())
  const horaDe = new Map(orden.map((u, k) => [`${u.tipo}:${u.i}`, horas[k]]))

  const limpiaChat = chat
    .map((l, i) => ({ de: l.de, para: l.para, texto: l.texto, rincon: l.rincon, idea: desdeIdea[i] === undefined ? null : l.idea, t: horaDe.get(`suelta:${i}`)! }))
    .sort((a, b) => a.t - b.t) // estable: a igual hora, el orden en que vinieron
    .map(({ t, ...l }) => ({ ...l, mostrar_desde: iso(new Date(t)) }))
  const limpiaCharlas: CharlaLimpia[] = orden.filter(u => u.tipo === 'charla').map(({ i }) => {
    let t = horaDe.get(`charla:${i}`)!
    return {
      donde: charlas[i].donde,
      anfitrion: charlas[i].anfitrion,
      lineas: charlas[i].lineas.map((l, j) => ({ ...l, mostrar_desde: iso(new Date((t += pausas[i][j]))) })),
    }
  })

  return { chat: limpiaChat, charlas: limpiaCharlas, posts: limpiaPosts, comentarios: limpiaComentarios, ideas, escena, botadas }
}
