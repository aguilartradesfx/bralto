// Lo que la página de la Oficina de Knox dice con palabras: etiquetas de estado, horas de Costa Rica, qué hace cada Knox,
// lo próximo y la línea del día; y cómo se queda con el foro (la firma de su copia y lo optimista).
// Lógica pura (sin DOM): la usa components/oficina y se prueba con node --test.
import type { Agente, AgenteSnap, EstadoAgente, EstadoIdea, EstadoOficina, Marca, Proximo, RespuestaOficina, Social } from './tipos.ts'
import type { LugarSala } from './sala.ts'
import { horaCR, siguienteCorrida } from './horario.ts'
import { FRECUENTE_MIN } from './estado.ts'
import { socialVencido } from './social.ts'

export type { AgenteSnap }

const MIN = 60_000
const HORA = 60 * MIN
const DIA = 24 * HORA
const CR = 6 * HORA // Costa Rica: UTC−6 todo el año
const t = (iso: string) => new Date(iso).getTime()
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const frecuente = (a: Agente) => a.cada_minutos != null && a.cada_minutos <= FRECUENTE_MIN

export const ETIQUETA: Record<EstadoAgente, string> = {
  trabajando: 'Trabajando',
  publicando: 'Publicando',
  listo: 'Te dejó algo',
  fallo: 'Falló',
  descansando: 'Descansando',
  pedido: 'Cuando lo pidas',
  pendiente: 'Pronto',
  'a-medias': 'Se quedó a medias',
  durmiendo: 'Durmiendo',
}

// El nombre del catálogo; si el id no está (una marca vieja, «todos»…), el id con mayúscula
export function nombreDe(id: string, agentes: { id: string; nombre: string }[]): string {
  return agentes.find((a) => a.id === id)?.nombre ?? capital(id)
}

// El día de Costa Rica (días desde 1970) y la hora de ese día en horas con decimales (7:24 p. m. = 19.4)
export const diaCR = (ms: number): number => Math.floor((ms - CR) / DIA)
export const horasCR = (ms: number): number => ((((ms - CR) % DIA) + DIA) % DIA) / HORA

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const diaSemana = (ms: number) => DIAS[new Date(ms - CR).getUTCDay()]
function fechaCorta(ms: number): string {
  const d = new Date(ms - CR)
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`
}

// 'las 7:30 p. m.' o 'la 1:05 p. m.' (la una va en singular)
export function lasCR(fecha: Date): string {
  const h = horaCR(fecha)
  return (h.startsWith('1:') ? 'la ' : 'las ') + h
}

// Cuándo, contado desde hoy: 'a las 7:30 p. m.', 'mañana a las 6:00 a. m.', 'ayer a las…', 'el miércoles a las…', 'el 22/11 a las…'
export function cuandoCR(fecha: Date, ahora: Date, op: { hoy?: boolean } = {}): string {
  const d = diaCR(fecha.getTime()) - diaCR(ahora.getTime())
  const a = 'a ' + lasCR(fecha)
  if (d === 0) return op.hoy ? 'hoy ' + a : a
  if (d === 1) return 'mañana ' + a
  if (d === -1) return 'ayer ' + a
  if (Math.abs(d) < 7) return `el ${diaSemana(fecha.getTime())} ${a}`
  return `el ${fechaCorta(fecha.getTime())} ${a}`
}

// La hora corta de las listas: '7:10 p. m.', 'ayer 9:15 p. m.', 'miércoles 9:15 p. m.' o '12/11 9:15 p. m.'
export function momentoCR(fecha: Date, ahora: Date): string {
  const d = diaCR(fecha.getTime()) - diaCR(ahora.getTime())
  const h = horaCR(fecha)
  if (d === 0) return h
  if (d === -1) return 'ayer ' + h
  if (d === 1) return 'mañana ' + h
  if (Math.abs(d) < 7) return `${diaSemana(fecha.getTime())} ${h}`
  return `${fechaCorta(fecha.getTime())} ${h}`
}

// 'desde las 7:00 p. m.', 'desde la 1:05 p. m.' o 'desde ayer a las 11:50 p. m.'
export function desdeCR(fecha: Date, ahora: Date): string {
  return 'desde ' + (diaCR(fecha.getTime()) === diaCR(ahora.getTime()) ? lasCR(fecha) : cuandoCR(fecha, ahora))
}

// «La oficina duerme desde las 9:14 p. m.» (el punto de «p. m.» cierra la oración: no lleva otro)
export function avisoDormida(oficina: EstadoOficina, ahora: Date): string {
  const desde = oficina.desde ? new Date(oficina.desde) : null
  if (!desde || Number.isNaN(desde.getTime())) return 'La oficina está dormida.'
  return `La oficina duerme ${desdeCR(desde, ahora)}`
}

// Corta un texto a n letras como mucho, con «…» al final si no cabía
export function recortar(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s
}

// Solo se abren enlaces con una forma conocida: una ruta del sitio («/calendario/…») o «http(s)://» y su sitio. Una marca
// mal escrita no puede meter un «javascript:» ni un «//otro.sitio», y en ninguna parte van barras invertidas ni
// caracteres de control: el navegador los quita o los lee como «/», y «/\otro.sitio» o «/<tab>/otro.sitio» se irían a
// otro sitio.
const FORMA_SEGURA = /^(\/[a-z0-9]|https?:\/\/[a-z0-9])/i
const RARO = /[\\\u0000-\u001f\u007f]/
export const enlaceSeguro = (e: string | null): e is string => !!e && FORMA_SEGURA.test(e) && !RARO.test(e)

// Las cuentas de arriba. Despierta: las cuatro de siempre (aunque estén en cero) y «a medias» solo si hay; los que
// descansan, los que esperan que les pidas algo y los que todavía no empiezan se ven en la oficina, no aquí.
// Dormida: los que duermen y los que se quedan de guardia (los despierto_siempre), sin ceros. Se cuentan por quién
// se queda despierto, no por el estado: así sale bien también en el ratito antes de que el servidor lo cambie.
export type Chip = { clave: EstadoAgente | 'guardia'; n: number; texto: string }
const ORDEN: EstadoAgente[] = ['trabajando', 'publicando', 'listo', 'fallo', 'a-medias']
const SIEMPRE = new Set<Chip['clave']>(['trabajando', 'publicando', 'listo', 'fallo'])

function cuenta(clave: Chip['clave'], n: number): string {
  const uno = n === 1
  switch (clave) {
    case 'listo': return uno ? '1 te dejó algo' : `${n} te dejaron algo`
    case 'fallo': return uno ? '1 falló' : `${n} fallaron`
    case 'a-medias': return uno ? '1 se quedó a medias' : `${n} se quedaron a medias`
    case 'guardia': return `${n} de guardia`
    default: return `${n} ${clave}` // trabajando, publicando, durmiendo
  }
}

export function chipsDe(agentes: { estado: EstadoAgente; despierto_siempre: boolean }[], dormida: boolean): Chip[] {
  const chip = (clave: Chip['clave'], n: number): Chip => ({ clave, n, texto: cuenta(clave, n) })
  if (dormida) {
    const guardia = agentes.filter((a) => a.despierto_siempre).length
    return [chip('durmiendo', agentes.length - guardia), chip('guardia', guardia)].filter((c) => c.n > 0)
  }
  return ORDEN.map((clave) => chip(clave, agentes.filter((a) => a.estado === clave).length)).filter((c) => c.n > 0 || SIEMPRE.has(c.clave))
}

export const trabajandoAhora = (agentes: { estado: EstadoAgente }[]): number =>
  agentes.filter((a) => a.estado === 'trabajando' || a.estado === 'publicando').length

function masNueva(ms: Marca[]): Marca | null {
  let m: Marca | null = null
  for (const x of ms) if (!m || t(x.creado_en) > t(m.creado_en)) m = x
  return m
}

// La marca que explica lo que hace ahora: la corrida abierta, lo que publica, la falla o lo que te dejó
export function marcaDeAhora(a: AgenteSnap, marcas: Marca[], paraTi: Marca[]): Marca | null {
  const de = (tipo: Marca['tipo']) => masNueva(marcas.filter((m) => m.agente === a.id && m.tipo === tipo))
  switch (a.estado) {
    case 'trabajando':
    case 'a-medias':
      return de('empieza')
    case 'publicando':
      return de('publica')
    case 'fallo':
      return de('falla')
    case 'listo':
      return masNueva(paraTi.filter((m) => m.agente === a.id))
    default:
      return null
  }
}

// Lo que hace ahora, en una línea (el panel «Ahora» y la ficha); null si no está en nada
export function lineaAhora(a: AgenteSnap, marcas: Marca[], paraTi: Marca[], ahora: Date): string | null {
  const m = marcaDeAhora(a, marcas, paraTi)
  if (!m) return null
  const f = new Date(m.creado_en)
  switch (a.estado) {
    case 'trabajando': return `${m.texto} · ${desdeCR(f, ahora)}`
    case 'a-medias': return `Se quedó a medias: ${m.texto} · empezó ${cuandoCR(f, ahora)}`
    case 'publicando': return `${m.texto} · ${momentoCR(f, ahora)}`
    case 'fallo': return m.texto
    case 'listo': return `Te dejó: ${m.texto}`
    default: return null
  }
}

// Cuándo falló y cuándo se reintenta: 'Falló a las 7:10 p. m. · se reintenta a las 7:30 p. m.'
export function lineaFalla(a: AgenteSnap, marcas: Marca[], ahora: Date): string | null {
  const m = masNueva(marcas.filter((x) => x.agente === a.id && x.tipo === 'falla'))
  const sin = m?.extra?.sin_reintento === true
  const partes = [m ? 'falló ' + cuandoCR(new Date(m.creado_en), ahora) : null, reintento(a, ahora, sin)].filter((p): p is string => !!p)
  return partes.length ? capital(partes.join(' · ')) : null
}

// Cuándo vuelve a intentar lo que falló (null si no tiene hora fija)
export function reintento(a: Agente, ahora: Date, sinReintento = false): string | null {
  if (sinReintento) return 'No se vuelve a intentar sola: revísala en el Calendario.'
  if (a.estado_fijo === 'pedido') return 'se reintenta cuando lo pidas'
  const sig = a.horario ? siguienteCorrida(a.horario, ahora) : null
  if (sig) return 'se reintenta ' + cuandoCR(sig, ahora)
  return frecuente(a) ? 'se reintenta en unos minutos' : null
}

// «Lo próximo» de la ficha
export function proximoDe(a: Agente, ahora: Date, dormida: boolean): string {
  if (dormida && !a.despierto_siempre) return 'En pausa mientras la oficina duerme'
  if (a.estado_fijo === 'pendiente') return 'Todavía no empieza'
  if (a.estado_fijo === 'pedido') return 'Cuando lo pidas'
  if (frecuente(a)) {
    const base = a.cada_minutos === 60 ? 'Revisa cada hora' : `Revisa cada ${a.cada_minutos} min`
    const ult = a.ultima_revision ? new Date(a.ultima_revision) : null
    return ult && !Number.isNaN(ult.getTime()) ? `${base} · última vez: ${momentoCR(ult, ahora)}` : base
  }
  if (!a.horario) return 'Cuando le llegue trabajo'
  const sig = siguienteCorrida(a.horario, ahora)
  return sig ? capital(cuandoCR(sig, ahora, { hoy: true })) : 'Sin hora fija'
}

// El texto chiquito debajo de cada carita del plano (cabe en 18 letras). Quien está de visita en otra oficina: «de visita»;
// en la sala: «en la sala» o «de siesta».
const corto = (s: string) => recortar(s, 18)

export function textoPlano(a: AgenteSnap, marcas: Marca[], paraTi: Marca[], ahora: Date, lugar?: LugarSala, visita?: { anfitrion: string }): string {
  if (visita) return 'de visita'
  if (lugar) return lugar.rincon === 'siesta' ? 'de siesta' : 'en la sala'
  switch (a.estado) {
    case 'trabajando':
    case 'publicando':
    case 'fallo': {
      const m = marcaDeAhora(a, marcas, paraTi)
      return m ? corto(m.texto) : a.estado === 'fallo' ? 'falló' : a.estado
    }
    case 'a-medias': return 'se quedó a medias'
    case 'listo': return 'te dejó algo'
    case 'pedido': return 'cuando lo pidas'
    case 'pendiente': return 'pronto'
    case 'durmiendo': return 'durmiendo'
    case 'descansando': {
      if (frecuente(a)) return `revisa cada ${a.cada_minutos} min`
      const sig = a.horario ? siguienteCorrida(a.horario, ahora) : null
      return sig ? 'próx. ' + horaCR(sig) : 'descansando'
    }
  }
}

// Las marcas que todavía no se habían visto, de la más vieja a la más nueva
export function marcasNuevas(vistas: ReadonlySet<string>, marcas: Marca[]): Marca[] {
  return marcas.filter((m) => !vistas.has(m.id)).sort((p, q) => t(p.creado_en) - t(q.creado_en))
}

// '7:30 p. m.' → 19.5 (la hora de «Lo próximo» viene escrita así desde el servidor)
export function horaDeTexto(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2}) ([ap])\. m\.$/.exec(s.trim())
  if (!m) return null
  return (Number(m[1]) % 12) + (m[3] === 'p' ? 12 : 0) + Number(m[2]) / 60
}

// ---------- La línea del día ----------
// Una fila por área (en el orden de los puestos). Rayas: lo que ya pasó hoy (gris = terminó, azul = publicó,
// naranja = te dejó algo, rojo = falló, tenue = le pasó trabajo a otro) y punteadas para lo que sigue hoy.
// Barras: las corridas abiertas, de su inicio a ahora. Las posiciones van en % del ancho de la pista.
export type ClaseRaya = 'hecho' | 'suave' | 'sig' | 'publicando' | 'listo' | 'fallo'
// agente, texto y enlace: de quién es, su frase y a dónde lleva (en grande, cada raya es un botón con su frase y «Abrir»)
export type RayaDia = { x: number; clase: ClaseRaya; titulo: string; agente: string; texto: string; enlace: string | null }
// agente: de quién es (en la página, la barra y el nombre abren su ficha)
export type BarraDia = { x: number; w: number; estado: EstadoAgente; titulo: string; texto: string | null; agente: string }
export type EtiquetaDia = { texto: string; x: number; lado: 'der' | 'izq'; agente: string }
export type FilaDia = { area: string; rayas: RayaDia[]; barras: BarraDia[]; etiquetas: EtiquetaDia[]; vacio: string | null }
export type LineaDia = { ejes: { x: number; texto: string }[]; ahora: number; sueno: { x: number; w: number } | null; filas: FilaDia[] }

// Ancho aproximado de una letra de las etiquetas (Silkscreen a 10.5 px) y la separación de la raya
export const LETRA_PX = 7.5
export const SEP_PX = 6
const anchoTexto = (s: string) => s.length * LETRA_PX + 4

const CLASE: Partial<Record<Marca['tipo'], ClaseRaya>> = { termina: 'hecho', falla: 'fallo', publica: 'publicando', entrega: 'listo', pasa: 'suave' }
// Qué etiquetas se ponen primero si no caben todas (menor = antes)
const PRIORIDAD: [ClaseRaya, number][] = [['fallo', 1], ['listo', 2], ['publicando', 4], ['hecho', 4]]

type Candidata = { texto: string; agente: string; x: number; x2: number; prioridad: number; orden: number; futuro: boolean; clave: string; barra?: BarraDia }
type DatosDia = { agentes: AgenteSnap[]; marcas: Marca[]; proximos: Proximo[]; oficina: EstadoOficina }

// Lo que sigue hoy, de «Lo próximo» (dormida: nada, está en pausa). Viene en orden; si la hora baja, ya es de mañana.
function siguenHoy(d: DatosDia, hAhora: number): { p: Proximo; a: AgenteSnap; h: number }[] {
  const siguen: { p: Proximo; a: AgenteSnap; h: number }[] = []
  if (d.oficina.dormida) return siguen
  let previa = -Infinity
  for (const p of d.proximos) {
    const h = horaDeTexto(p.cuando)
    if (h == null) continue
    if (h < previa || h < hAhora - 0.5) break
    previa = h
    const a = d.agentes.find((x) => x.id === p.agente)
    if (a && h >= hAhora) siguen.push({ p, a, h })
  }
  return siguen
}

export function lineaDelDia(d: DatosDia, ahora: Date, anchoPx = 900): LineaDia {
  const ahoraMs = ahora.getTime(), hoy = diaCR(ahoraMs), hAhora = horasCR(ahoraMs)
  const deHoy = d.marcas.filter((m) => diaCR(t(m.creado_en)) === hoy)
  const desde = d.oficina.dormida && d.oficina.desde ? t(d.oficina.desde) : NaN

  // arranca a las 6 a. m., o antes (de 3 en 3 horas) si hubo algo de madrugada
  let primera = Math.min(6, hAhora)
  for (const m of deHoy) primera = Math.min(primera, horasCR(t(m.creado_en)))
  if (Number.isFinite(desde) && diaCR(desde) === hoy) primera = Math.min(primera, horasCR(desde))
  const inicio = Math.floor(primera / 3) * 3, fin = 24
  const X = (h: number) => Math.max(0, Math.min(100, ((h - inicio) / (fin - inicio)) * 100))
  const px = (x: number) => (x / 100) * anchoPx
  const xAhora = X(hAhora), pxAhora = px(xAhora)

  const ejes: { x: number; texto: string }[] = []
  let am = false, pm = false
  for (let h = inicio; h <= fin; h += 3) {
    let texto = h === 0 || h === 24 ? '12' : h === 12 ? '12 m.' : String(h > 12 ? h - 12 : h)
    if (h < 12 && !am) { texto += ' a. m.'; am = true } else if (h > 12 && h < 24 && !pm) { texto += ' p. m.'; pm = true }
    ejes.push({ x: X(h), texto })
  }

  const orden = d.agentes.slice().sort((p, q) => p.puesto - q.puesto)
  const areas: string[] = []
  for (const a of orden) if (!areas.includes(a.area)) areas.push(a.area)
  const filas: FilaDia[] = areas.map((area) => ({ area, rayas: [], barras: [], etiquetas: [], vacio: null }))
  const cands: Candidata[][] = areas.map(() => [])

  for (const a of orden) {
    const i = areas.indexOf(a.area), fila = filas[i]
    const ultima: Partial<Record<ClaseRaya, { x: number; ms: number }>> = {}
    const mias = deHoy.filter((m) => m.agente === a.id).sort((p, q) => t(p.creado_en) - t(q.creado_en))
    for (const m of mias) {
      const clase = CLASE[m.tipo]
      if (!clase) continue
      const ms = t(m.creado_en), x = X(horasCR(ms))
      fila.rayas.push({ x, clase, titulo: `${horaCR(new Date(ms))} · ${a.nombre} · ${m.texto}`, agente: a.id, texto: m.texto, enlace: m.enlace })
      ultima[clase] = { x, ms }
    }
    for (const [clase, prioridad] of PRIORIDAD) {
      const u = ultima[clase]
      if (u) cands[i].push({ texto: a.nombre, agente: a.id, x: u.x, x2: u.x, prioridad, orden: u.ms, futuro: false, clave: a.id })
    }
    if (a.estado === 'trabajando' || a.estado === 'a-medias') {
      const emp = masNueva(d.marcas.filter((m) => m.agente === a.id && m.tipo === 'empieza'))
      if (emp) {
        const ms = t(emp.creado_en)
        const x0 = diaCR(ms) === hoy ? X(horasCR(ms)) : 0
        const barra: BarraDia = { x: x0, w: Math.max(0.3, xAhora - x0), estado: a.estado, titulo: `${a.nombre} · ${emp.texto} · ${desdeCR(new Date(ms), ahora)}`, texto: null, agente: a.id }
        fila.barras.push(barra)
        // orden negativo: entre las barras va primero la que empezó antes (la que se ve de borde a borde)
        cands[i].push({ texto: a.nombre, agente: a.id, x: x0, x2: x0 + barra.w, prioridad: 0, orden: -ms, futuro: false, clave: a.id, barra })
      }
    }
  }

  // lo que sigue hoy, punteado
  for (const { p, a, h } of siguenHoy(d, hAhora)) {
    const i = areas.indexOf(a.area), x = X(h)
    filas[i].rayas.push({ x, clase: 'sig', titulo: `${p.cuando} · ${a.nombre} · ${p.texto}`, agente: a.id, texto: p.texto, enlace: null })
    cands[i].push({ texto: a.nombre, agente: a.id, x, x2: x, prioridad: 3, orden: -h, futuro: true, clave: a.id + ':sig' })
  }

  // etiquetas: las más importantes primero, sin encimarse, sin tapar una barra ni pasar la línea de ahora
  filas.forEach((fila, i) => {
    fila.barras.sort((p, q) => p.x - q.x) // la que empezó antes queda debajo de las demás
    const ocupado: [number, number][] = []
    const barras = fila.barras.map((b) => [px(b.x), px(b.x + b.w)] as [number, number])
    const libre = (a: number, b: number, propia?: BarraDia) =>
      a >= 0 && b <= anchoPx &&
      ocupado.every(([p, q]) => b + SEP_PX <= p || a >= q + SEP_PX) &&
      barras.every(([p, q], j) => fila.barras[j] === propia || b + 2 <= p || a >= q + 2)
    const poner = (c: Candidata, lado: 'der' | 'izq', a: number, b: number) => {
      fila.etiquetas.push({ texto: c.texto, x: c.x, lado, agente: c.agente })
      ocupado.push([a, b])
    }
    if (!fila.rayas.some((r) => r.clase !== 'sig') && !fila.barras.length) {
      const ags = orden.filter((a) => a.area === fila.area)
      fila.vacio = ags.every((a) => a.estado_fijo === 'pedido') ? 'Nada pedido hoy'
        : ags.every((a) => a.estado_fijo === 'pendiente') ? 'Todavía no empiezan' : 'Nada todavía hoy'
      ocupado.push([0, SEP_PX + anchoTexto(fila.vacio)])
    }
    const puestas = new Set<string>()
    cands[i].sort((p, q) => p.prioridad - q.prioridad || q.orden - p.orden).forEach((c) => {
      if (puestas.has(c.clave)) return
      const w = anchoTexto(c.texto), p1 = px(c.x), p2 = px(c.x2)
      if (c.barra) {
        // adentro si cabe, si no a la izquierda; nunca a la derecha (ahí empieza lo que sigue)
        if (p2 - p1 >= w + 10 && libre(p1, p1 + w + 10, c.barra)) {
          c.barra.texto = c.texto
          ocupado.push([p1, p1 + w + 10])
        } else if (libre(p1 - SEP_PX - w, p1 - SEP_PX)) poner(c, 'izq', p1 - SEP_PX - w, p1 - SEP_PX)
        else return
        puestas.add(c.clave)
        return
      }
      const derA = p1 + SEP_PX, derB = p1 + SEP_PX + w, izqA = p1 - SEP_PX - w, izqB = p1 - SEP_PX
      const derOk = c.futuro ? libre(derA, derB) : derB <= pxAhora - 2 && libre(derA, derB)
      const izqOk = c.futuro ? izqA >= pxAhora + 2 && libre(izqA, izqB) : libre(izqA, izqB)
      if (derOk) poner(c, 'der', derA, derB)
      else if (izqOk) poner(c, 'izq', izqA, izqB)
      else return
      puestas.add(c.clave)
    })
  })

  let sueno: LineaDia['sueno'] = null
  if (Number.isFinite(desde)) {
    const x0 = diaCR(desde) === hoy ? X(horasCR(desde)) : 0
    sueno = { x: x0, w: Math.max(0, xAhora - x0) }
  }
  return { ejes, ahora: xAhora, sueno, filas }
}

// La línea del día como lista (al lado, donde a lo ancho no cabe): las mismas rayas de lineaDelDia, de arriba abajo
// por hora. Lo hecho hoy va primero y lo que sigue hoy después (futuro), aunque una marca llegue con la hora adelantada:
// entre las dos va la raya de «Ahora».
export type EntradaDia = { cuando: string; agente: string; texto: string; clase: ClaseRaya; enlace: string | null; futuro: boolean }

export function listaDelDia(d: DatosDia, ahora: Date): EntradaDia[] {
  const ahoraMs = ahora.getTime(), hoy = diaCR(ahoraMs)
  const ids = new Set(d.agentes.map((a) => a.id))
  const hechas: { ms: number; e: EntradaDia }[] = []
  for (const m of d.marcas) {
    const clase = CLASE[m.tipo], ms = t(m.creado_en)
    if (!clase || !ids.has(m.agente) || diaCR(ms) !== hoy) continue
    hechas.push({ ms, e: { cuando: horaCR(new Date(ms)), agente: m.agente, texto: m.texto, clase, enlace: m.enlace, futuro: false } })
  }
  hechas.sort((p, q) => p.ms - q.ms)
  const siguen = siguenHoy(d, horasCR(ahoraMs)).map(({ p }): EntradaDia => ({
    cuando: p.cuando, agente: p.agente, texto: p.texto, clase: 'sig', enlace: null, futuro: true,
  }))
  return [...hechas.map((h) => h.e), ...siguen]
}

// ---------- La copia del foro y lo optimista (usarOficina) ----------
// El foro, las ideas y las fotos viajan solo cuando cambian: la página manda la firma de la copia que tiene y cuándo
// le llegó. '' es lo que contesta el servidor cuando no pudo armar el bloque: eso no es una copia.
export type CopiaSocial = { firma: string | null; recibido: number | null }

export function copiaSocial(r: Pick<RespuestaOficina, 'social' | 'firmaSocial'> | null, recibidoMs: number): CopiaSocial {
  return r?.social && r.firmaSocial ? { firma: r.firmaSocial, recibido: recibidoMs } : { firma: null, recibido: null }
}

// A dónde se pide la foto: con la firma de la copia, salvo que no haya copia o tenga 30 min (los enlaces de las fotos
// vencen a la hora: así llegan nuevos)
export function urlOficina(c: CopiaSocial | null, ahoraMs: number): string {
  return c?.firma && !socialVencido(c.recibido, ahoraMs) ? `/api/oficina?social=${encodeURIComponent(c.firma)}` : '/api/oficina'
}

// «Me sirve», «No va» y el me gusta se ven al tiro. Cada instancia del servidor guarda el foro 1 min en memoria, así que
// una consulta puede traer todavía lo de antes: lo optimista se queda al menos 70 s y hasta que el servidor lo confirme
// (o 3 min, por si lo cambió otro).
export type Optimista<T> = { valor: T; desde: number }
export const OPTIMISTA_MIN_MS = 70_000
export const OPTIMISTA_MAX_MS = 3 * 60_000

// Suelta lo optimista que ya se puede soltar; dice si soltó algo
export function soltarOptimistas<T>(m: Map<string, Optimista<T>>, real: (id: string) => T | undefined, ahoraMs: number): boolean {
  let solto = false
  for (const [id, o] of m) {
    const edad = ahoraMs - o.desde
    if (edad >= OPTIMISTA_MAX_MS || (edad >= OPTIMISTA_MIN_MS && real(id) === o.valor)) {
      m.delete(id)
      solto = true
    }
  }
  return solto
}

// Una escritura optimista falló. Sale de las que siguen en pie (las mandadas, todavía en camino o ya guardadas, en el
// orden en que se mandaron) y, si era la que se veía, se ve la última que queda: es lo que va a tener el servidor. Sin
// ninguna, null: se ve lo del servidor. Así, si dos toques seguidos fallan, nunca se queda pegado lo optimista.
// visible: lo que se ve ahora (undefined si ya se soltó).
export function alFallar<T>(
  vivas: readonly Optimista<T>[],
  visible: Optimista<T> | undefined,
  fallida: Optimista<T>,
): { vivas: Optimista<T>[]; visible: Optimista<T> | null } {
  const quedan = vivas.filter((o) => o !== fallida)
  if (visible !== fallida) return { vivas: quedan, visible: visible ?? null }
  return { vivas: quedan, visible: quedan[quedan.length - 1] ?? null }
}

// Lo que se ve: la copia del servidor con lo optimista encima (sin tocar la copia)
export function conOptimistas(s: Social, ideas: ReadonlyMap<string, Optimista<EstadoIdea>>, likes: ReadonlyMap<string, Optimista<boolean>>): Social {
  if (!ideas.size && !likes.size) return s
  return {
    ...s,
    ideas: s.ideas.map((i) => {
      const o = ideas.get(i.id)
      return o ? { ...i, estado: o.valor } : i
    }),
    foro: s.foro.map((p) => {
      const o = likes.get(p.id)
      return o ? { ...p, te_gusta: o.valor } : p
    }),
  }
}
