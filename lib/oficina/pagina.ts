// Lo que la página de la Oficina de Knox dice con palabras: etiquetas de estado, horas de Costa Rica, qué hace cada Knox,
// lo próximo y la línea del día. Lógica pura (sin DOM): la usa components/oficina y se prueba con node --test.
import type { Agente, EstadoAgente, EstadoOficina, Marca, Numeros, Proximo } from './tipos.ts'
import { horaCR, siguienteCorrida } from './horario.ts'
import { FRECUENTE_MIN } from './estado.ts'

export type AgenteSnap = Agente & { estado: EstadoAgente; numeros: Numeros }

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

export function encabezadoCR(ahora: Date): string {
  return `${capital(diaSemana(ahora.getTime()))} · ${horaCR(ahora)}`
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

// Las cuentas de arriba: las cinco de siempre (aunque estén en cero), y «a medias» y «durmiendo» solo si hay.
// Los que esperan que les pidas algo y los que todavía no empiezan no cambian solos: se ven en la oficina, no aquí.
// Dormida, solo las que tienen a alguien (si no, serían cinco ceros).
export type Chip = { estado: EstadoAgente; n: number; texto: string }
const ORDEN: EstadoAgente[] = ['trabajando', 'publicando', 'listo', 'fallo', 'a-medias', 'descansando', 'durmiendo']
const SIEMPRE = new Set<EstadoAgente>(['trabajando', 'publicando', 'listo', 'fallo', 'descansando'])

function cuenta(e: EstadoAgente, n: number): string {
  const uno = n === 1
  switch (e) {
    case 'listo': return uno ? '1 te dejó algo' : `${n} te dejaron algo`
    case 'fallo': return uno ? '1 falló' : `${n} fallaron`
    case 'a-medias': return uno ? '1 se quedó a medias' : `${n} se quedaron a medias`
    default: return `${n} ${e}` // trabajando, publicando, descansando, durmiendo
  }
}

export function chipsDe(agentes: { estado: EstadoAgente }[], dormida: boolean): Chip[] {
  return ORDEN.map((estado) => ({ estado, n: agentes.filter((a) => a.estado === estado).length }))
    .filter((c) => c.n > 0 || (!dormida && SIEMPRE.has(c.estado)))
    .map((c) => ({ ...c, texto: cuenta(c.estado, c.n) }))
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

// «Lo último que hizo»: su marca más nueva (de las últimas 24 h) con la hora
export function ultimoDe(id: string, marcas: Marca[], ahora: Date): string | null {
  const m = masNueva(marcas.filter((x) => x.agente === id))
  return m ? `${m.texto} · ${momentoCR(new Date(m.creado_en), ahora)}` : null
}

// El texto chiquito debajo de cada carita del plano (cabe en 18 letras)
const corto = (s: string) => recortar(s, 18)

export function textoPlano(a: AgenteSnap, marcas: Marca[], paraTi: Marca[], ahora: Date): string {
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
export type RayaDia = { x: number; clase: ClaseRaya; titulo: string }
export type BarraDia = { x: number; w: number; estado: EstadoAgente; titulo: string; texto: string | null }
export type EtiquetaDia = { texto: string; x: number; lado: 'der' | 'izq' }
export type FilaDia = { area: string; rayas: RayaDia[]; barras: BarraDia[]; etiquetas: EtiquetaDia[]; vacio: string | null }
export type LineaDia = { ejes: { x: number; texto: string }[]; ahora: number; sueno: { x: number; w: number } | null; filas: FilaDia[] }

// Ancho aproximado de una letra de las etiquetas (Silkscreen a 10.5 px) y la separación de la raya
export const LETRA_PX = 7.5
export const SEP_PX = 6
const anchoTexto = (s: string) => s.length * LETRA_PX + 4

const CLASE: Partial<Record<Marca['tipo'], ClaseRaya>> = { termina: 'hecho', falla: 'fallo', publica: 'publicando', entrega: 'listo', pasa: 'suave' }
// Qué etiquetas se ponen primero si no caben todas (menor = antes)
const PRIORIDAD: [ClaseRaya, number][] = [['fallo', 1], ['listo', 2], ['publicando', 4], ['hecho', 4]]

type Candidata = { texto: string; x: number; x2: number; prioridad: number; orden: number; futuro: boolean; clave: string; barra?: BarraDia }

export function lineaDelDia(
  d: { agentes: AgenteSnap[]; marcas: Marca[]; proximos: Proximo[]; oficina: EstadoOficina },
  ahora: Date,
  anchoPx = 900,
): LineaDia {
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
      fila.rayas.push({ x, clase, titulo: `${horaCR(new Date(ms))} · ${a.nombre} · ${m.texto}` })
      ultima[clase] = { x, ms }
    }
    for (const [clase, prioridad] of PRIORIDAD) {
      const u = ultima[clase]
      if (u) cands[i].push({ texto: a.nombre, x: u.x, x2: u.x, prioridad, orden: u.ms, futuro: false, clave: a.id })
    }
    if (a.estado === 'trabajando' || a.estado === 'a-medias') {
      const emp = masNueva(d.marcas.filter((m) => m.agente === a.id && m.tipo === 'empieza'))
      if (emp) {
        const ms = t(emp.creado_en)
        const x0 = diaCR(ms) === hoy ? X(horasCR(ms)) : 0
        const barra: BarraDia = { x: x0, w: Math.max(0.3, xAhora - x0), estado: a.estado, titulo: `${a.nombre} · ${emp.texto} · ${desdeCR(new Date(ms), ahora)}`, texto: null }
        fila.barras.push(barra)
        // orden negativo: entre las barras va primero la que empezó antes (la que se ve de borde a borde)
        cands[i].push({ texto: a.nombre, x: x0, x2: x0 + barra.w, prioridad: 0, orden: -ms, futuro: false, clave: a.id, barra })
      }
    }
  }

  // lo que sigue hoy, punteado (dormida: en pausa). «Lo próximo» viene en orden; si la hora baja, ya es de mañana
  if (!d.oficina.dormida) {
    let previa = -Infinity
    for (const p of d.proximos) {
      const h = horaDeTexto(p.cuando)
      if (h == null) continue
      if (h < previa || h < hAhora - 0.5) break
      previa = h
      const a = d.agentes.find((x) => x.id === p.agente)
      if (!a || h < hAhora) continue
      const i = areas.indexOf(a.area), x = X(h)
      filas[i].rayas.push({ x, clase: 'sig', titulo: `${p.cuando} · ${a.nombre} · ${p.texto}` })
      cands[i].push({ texto: a.nombre, x, x2: x, prioridad: 3, orden: -h, futuro: true, clave: a.id + ':sig' })
    }
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
    const poner = (texto: string, x: number, lado: 'der' | 'izq', a: number, b: number) => {
      fila.etiquetas.push({ texto, x, lado })
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
        } else if (libre(p1 - SEP_PX - w, p1 - SEP_PX)) poner(c.texto, c.x, 'izq', p1 - SEP_PX - w, p1 - SEP_PX)
        else return
        puestas.add(c.clave)
        return
      }
      const derA = p1 + SEP_PX, derB = p1 + SEP_PX + w, izqA = p1 - SEP_PX - w, izqB = p1 - SEP_PX
      const derOk = c.futuro ? libre(derA, derB) : derB <= pxAhora - 2 && libre(derA, derB)
      const izqOk = c.futuro ? izqA >= pxAhora + 2 && libre(izqA, izqB) : libre(izqA, izqB)
      if (derOk) poner(c.texto, c.x, 'der', derA, derB)
      else if (izqOk) poner(c.texto, c.x, 'izq', izqA, izqB)
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
